import Stripe from 'stripe';
import { getStore } from '@netlify/blobs';
import { Resend } from 'resend';
import { Buffer } from 'node:buffer';

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'updates@mrxplorer.com';
const ADMIN_EMAIL = 'zjohnson@mrxplorer.com';

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[character]));
}

function productDates(metadata) {
    if (metadata.class_dates) {
        try {
            const dates = JSON.parse(metadata.class_dates);
            if (Array.isArray(dates) && dates.length > 0) return dates;
        } catch (err) {
            console.error('Invalid class_dates metadata:', err.message);
        }
    }
    return metadata.class_date ? [metadata.class_date] : [];
}

function escapeIcsText(value) {
    return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
}

function safeFilename(value) {
    return String(value).replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
}

function makeKey(name, date) {
    const safe = name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60);
    if (!date) return `${safe}::no-date`;
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date(date));
    const calendarDate = [
        parts.find(part => part.type === 'year')?.value,
        parts.find(part => part.type === 'month')?.value,
        parts.find(part => part.type === 'day')?.value,
    ].join('-');
    return `${safe}::${calendarDate}`;
}

function generateICS(eventName, dateStr, durationMinutes) {
    const dt = new Date(dateStr);
    const end = new Date(dt.getTime() + durationMinutes * 60000);

    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `${fmt(dt)}-${eventName.replace(/\s+/g, '-')}@mrxplorer.com`;

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//MRXplorer//AI Classes//EN',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART:${fmt(dt)}`,
        `DTEND:${fmt(end)}`,
        `SUMMARY:${escapeIcsText(eventName)}`,
        'DESCRIPTION:MRXplorer AI Class - Live Virtual Session',
        'LOCATION:Online (link will be provided before class)',
        'END:VEVENT',
        'END:VCALENDAR',
    ].join('\r\n');
}

async function handleCompleted(session) {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
    });
    const store = getStore('capacity');
    const icsFiles = [];
    const purchases = [];

    for (const item of lineItems.data) {
        const product = item.price?.product;
        const metadata = product?.metadata || {};
        const name = product?.name || item.description;
        const dates = productDates(metadata);

        if (dates.length > 0) {
            for (const date of dates) {
                const key = makeKey(name, date);
                const entry = await store.get(key, { type: 'json' });
                const current = Number(entry?.count || 0);
                await store.set(key, JSON.stringify({ count: current + (item.quantity || 1) }));
                purchases.push({ name, date });
                const ics = generateICS(name, date, 90);
                icsFiles.push({ name: `${safeFilename(name)}-${date.slice(0, 10)}.ics`, content: ics });
            }
        } else {
            purchases.push({ name, date: null });
        }
    }

    const customerEmail = session.customer_details?.email || session.customer_email;
    const itemsHtml = purchases.map(p =>
        `<li>${escapeHtml(p.name)}${p.date ? ` — <strong>${escapeHtml(new Date(p.date).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }))}</strong>` : ''}</li>`
    ).join('');

    if (customerEmail) {
        const icsAttachments = icsFiles.map(f => ({
            filename: f.name,
            content: Buffer.from(f.content).toString('base64'),
        }));

        try {
            await resend.emails.send({
                from: FROM_EMAIL,
                to: customerEmail,
                subject: 'Your MRXplorer Class Registration Confirmation',
                html: `
                    <h1>You're registered!</h1>
                    <p>Thanks for registering for MRXplorer AI classes. Here's what you purchased:</p>
                    <ul>${itemsHtml}</ul>
                    <p>You'll receive another email with the meeting link 24 hours before each class.</p>
                    <p>If you have any questions, reply to this email or contact <a href="mailto:zjohnson@mrxplorer.com">zjohnson@mrxplorer.com</a>.</p>
                    <p>— Z Johnson, MRXplorer</p>
                `,
                attachments: icsAttachments,
            });
        } catch (emailErr) {
            console.error('Failed to send confirmation email:', emailErr.message);
        }
    }

    const customerName = session.customer_details?.name;
    const amountTotal = session.amount_total != null
        ? `$${(session.amount_total / 100).toFixed(2)} ${String(session.currency || 'usd').toUpperCase()}`
        : 'unknown';
    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: ADMIN_EMAIL,
            subject: `New class signup — ${customerName || customerEmail || 'unknown customer'}`,
            html: `
                <h1>New class registration</h1>
                <p><strong>Name:</strong> ${escapeHtml(customerName || 'not provided')}</p>
                <p><strong>Email:</strong> ${escapeHtml(customerEmail || 'not provided')}</p>
                <p><strong>Total paid:</strong> ${escapeHtml(amountTotal)}</p>
                <ul>${itemsHtml}</ul>
                <p>Stripe session: ${escapeHtml(session.id)}</p>
            `,
        });
    } catch (emailErr) {
        console.error('Failed to send admin signup notification:', emailErr.message);
    }

    if (session.metadata?.waitlist_promotion === 'true') {
        const waitlistStore = getStore('waitlist');
        const waitlistKey = session.metadata.waitlist_key;
        const waitlistIndex = Number(session.metadata.waitlist_index);
        const entries = waitlistKey ? await waitlistStore.get(waitlistKey, { type: 'json' }) : null;
        const entry = entries?.[waitlistIndex];
        if (entry?.promotionSessionId === session.id) {
            entry.status = 'paid';
            await waitlistStore.set(waitlistKey, JSON.stringify(entries));
        }
    }

    return new Response(JSON.stringify({ received: true, purchases }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

async function promoteWaitlist({ key, name, date, unitAmount, reason }) {
    const waitlistStore = getStore('waitlist');
    const entries = await waitlistStore.get(key, { type: 'json' });
    if (!entries) return false;
    const index = entries.findIndex(entry => !entry.status || entry.status === 'waiting');
    if (index < 0) return false;

    const nextPerson = entries[index];
    const promoSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name,
                    tax_code: 'txcd_20060045',
                    metadata: {
                        class_date: date,
                        class_dates: JSON.stringify([date]),
                        item_type: 'individual',
                        waitlist_promotion: 'true',
                    },
                },
                unit_amount: unitAmount,
                tax_behavior: 'exclusive',
            },
            quantity: 1,
        }],
        metadata: {
            waitlist_promotion: 'true',
            waitlist_key: key,
            waitlist_index: String(index),
        },
        expires_at: Math.floor(Date.now() / 1000) + 86400,
        success_url: 'https://class-checkout.netlify.app/success.html',
        cancel_url: 'https://class-checkout.netlify.app/',
    });

    await resend.emails.send({
        from: FROM_EMAIL,
        to: nextPerson.email,
        subject: 'A seat opened up — claim it within 24 hours',
        html: `
            <h1>A seat just opened for ${escapeHtml(name)}</h1>
            <p>Hi ${escapeHtml(nextPerson.name)},</p>
            <p>A seat opened for ${escapeHtml(name)}${reason ? ` because ${escapeHtml(reason)}` : ''} and you're next on the waitlist.</p>
            <p><a href="${promoSession.url}">Claim this seat →</a></p>
            <p>This link expires in 24 hours. If it expires, the next person on the waitlist gets the offer.</p>
            <p>— Z Johnson, MRXplorer</p>
        `,
    });

    entries[index] = { ...nextPerson, status: 'promoted', promotionSessionId: promoSession.id, promotedAt: new Date().toISOString() };
    await waitlistStore.set(key, JSON.stringify(entries));
    return true;
}

async function handlePromotionExpired(session) {
    if (session.metadata?.waitlist_promotion !== 'true') {
        return new Response('Ignored event type', { status: 200 });
    }

    const key = session.metadata.waitlist_key;
    const index = Number(session.metadata.waitlist_index);
    const waitlistStore = getStore('waitlist');
    const entries = await waitlistStore.get(key, { type: 'json' });
    const entry = entries?.[index];
    if (!entry || entry.status !== 'promoted' || entry.promotionSessionId !== session.id) {
        return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    entry.status = 'expired';
    await waitlistStore.set(key, JSON.stringify(entries));

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { expand: ['data.price.product'] });
    const item = lineItems.data[0];
    const product = item?.price?.product;
    const date = product?.metadata?.class_date;
    if (item && product?.name && date) {
        await promoteWaitlist({
            key,
            name: product.name,
            date,
            unitAmount: item.price?.unit_amount || 0,
            reason: 'the previous 24-hour claim window expired',
        });
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

async function handleRefunded(charge) {
    const paymentIntentId = charge.payment_intent;
    if (!paymentIntentId) {
        return new Response(JSON.stringify({ error: 'No payment intent on charge' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const sessions = await stripe.checkout.sessions.list({
        payment_intent: paymentIntentId,
        limit: 1,
    });

    if (!sessions.data.length) {
        return new Response(JSON.stringify({ error: 'No session found' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const session = sessions.data[0];
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
    });
    const refundTime = new Date(charge.created * 1000);
    const capStore = getStore('capacity');

    for (const item of lineItems.data) {
        const product = item.price?.product;
        const metadata = product?.metadata || {};
        const name = product?.name || item.description;
        const dates = productDates(metadata);
        if (dates.length === 0) continue;

        for (const date of dates) {
            const key = makeKey(name, date);
            const entry = await capStore.get(key, { type: 'json' });
            const current = Number(entry?.count || 0);
            const newCount = Math.max(0, current - (item.quantity || 1));
            await capStore.set(key, JSON.stringify({ count: newCount }));
        }

        const date = dates[0];
        const key = makeKey(name, date);
        const sessionDate = new Date(date);
        const hoursUntil = (sessionDate - refundTime) / (1000 * 60 * 60);

        if (hoursUntil > 72) {
            try {
                await promoteWaitlist({
                    key,
                    name,
                    date,
                    unitAmount: item.price?.unit_amount || 0,
                    reason: 'a registrant refunded their seat',
                });
            } catch (err) {
                console.error('Failed to promote waitlist entry:', err.message);
            }
        } else {
            const wlEntry = await getStore('waitlist').get(key, { type: 'json' });
            const wlCount = wlEntry ? wlEntry.filter(e => !e.status || e.status === 'waiting').length : 0;
            try {
                await resend.emails.send({
                    from: FROM_EMAIL,
                    to: ADMIN_EMAIL,
                        subject: `Refund inside 72h window — ${String(name).replace(/[\r\n]/g, ' ')} (${date})`,
                    html: `
                        <h1>Refund inside 72-hour window</h1>
                            <p>A refund was issued for <strong>${escapeHtml(name)}</strong> on <strong>${escapeHtml(date)}</strong>.</p>
                        <p>This is inside the 72-hour window so no automatic waitlist promotion occurred.</p>
                        <p>Waitlist size for this session: ${wlCount}</p>
                        <p>Manual decision needed: offer the seat to the next waitlist entry or let it go?</p>
                    `,
                });
            } catch (emailErr) {
                console.error('Failed to notify Z about refund:', emailErr.message);
            }
        }
    }

    return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

export default async (req, context) => {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const sig = req.headers.get('stripe-signature');
    const body = await req.text();
    let stripeEvent;
    try {
        stripeEvent = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Signature verification failed:', err.message);
        return new Response(`Signature verification failed: ${err.message}`, { status: 400 });
    }

    const eventStore = getStore('stripe-events');
    const alreadyProcessed = await eventStore.get(stripeEvent.id, { type: 'json' });
    if (alreadyProcessed) {
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        let response;
        switch (stripeEvent.type) {
            case 'checkout.session.completed':
                response = await handleCompleted(stripeEvent.data.object);
                break;
            case 'charge.refunded':
                response = await handleRefunded(stripeEvent.data.object);
                break;
            case 'checkout.session.expired':
                response = await handlePromotionExpired(stripeEvent.data.object);
                break;
            default:
                response = new Response('Ignored event type', { status: 200 });
                break;
        }

        if (response.status >= 200 && response.status < 300) {
            await eventStore.set(stripeEvent.id, JSON.stringify({
                type: stripeEvent.type,
                processedAt: new Date().toISOString(),
            }));
        }
        return response;
    } catch (err) {
        console.error('Webhook handler error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
