import Stripe from 'stripe';
import { getStore } from '@netlify/blobs';
import { Resend } from 'resend';
import { Buffer } from 'node:buffer';

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'updates@mrxplorer.com';

function makeKey(name, date) {
    const safe = name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60);
    return `${safe}::${date || 'no-date'}`;
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
        `SUMMARY:${eventName}`,
        'DESCRIPTION:MRXplorer AI Class - Live Virtual Session',
        'LOCATION:Online (link will be provided before class)',
        'END:VEVENT',
        'END:VCALENDAR',
    ].join('\r\n');
}

async function handleCompleted(session) {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const store = getStore('capacity');
    const icsFiles = [];
    const purchases = [];

    for (const item of lineItems.data) {
        const name = item.description;
        const date = item.price?.product_data?.metadata?.class_date;
        const type = item.price?.product_data?.metadata?.type || 'individual';

        if (date) {
            const key = makeKey(name, date);
            const entry = await store.get(key, { type: 'json' });
            const current = entry ? entry.count : 0;
            await store.set(key, JSON.stringify({ count: current + 1 }));
            purchases.push({ name, date });
            const ics = generateICS(name, date, 90);
            icsFiles.push({ name: `${name.replace(/\s+/g, '-')}.ics`, content: ics });
        } else {
            purchases.push({ name, date: null });
        }
    }

    const customerEmail = session.customer_details?.email || session.customer_email;
    if (customerEmail) {
        const itemsHtml = purchases.map(p =>
            `<li>${p.name}${p.date ? ` — <strong>${new Date(p.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}</strong>` : ''}</li>`
        ).join('');

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

    return new Response(JSON.stringify({ received: true, purchases }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
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
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const refundTime = new Date(charge.created * 1000);
    const Z_EMAIL = 'zjohnson@mrxplorer.com';
    const capStore = getStore('capacity');
    const wlStore = getStore('waitlist');
    const updatedSessions = [];

    for (const item of lineItems.data) {
        const name = item.description;
        const date = item.price?.product_data?.metadata?.class_date;
        if (!date) continue;

        const key = makeKey(name, date);
        const entry = await capStore.get(key, { type: 'json' });
        const current = entry ? entry.count : 0;
        const newCount = Math.max(0, current - 1);
        await capStore.set(key, JSON.stringify({ count: newCount }));

        const sessionDate = new Date(date);
        const hoursUntil = (sessionDate - refundTime) / (1000 * 60 * 60);

        if (hoursUntil > 72) {
            const wlEntry = await wlStore.get(key, { type: 'json' });
            if (wlEntry && wlEntry.length > 0) {
                const nextPerson = wlEntry[0];
                try {
                    const promoSession = await stripe.checkout.sessions.create({
                        mode: 'payment',
                        line_items: [{
                            price_data: {
                                currency: 'usd',
                                product_data: {
                                    name: name,
                                    metadata: { class_date: date, waitlist_promotion: 'true' },
                                },
                                unit_amount: item.price?.unit_amount || 0,
                            },
                            quantity: 1,
                        }],
                        expires_at: Math.floor(Date.now() / 1000) + 86400,
                        success_url: 'https://class-checkout.netlify.app/success.html',
                        cancel_url: 'https://class-checkout.netlify.app/',
                    });

                    await resend.emails.send({
                        from: FROM_EMAIL,
                        to: nextPerson.email,
                        subject: 'A seat opened up — claim it within 24 hours',
                        html: `
                            <h1>A seat just opened for ${name}</h1>
                            <p>Hi ${nextPerson.name},</p>
                            <p>A registrant refunded their seat for ${name} and you're next on the waitlist.</p>
                            <p><a href="${promoSession.url}">Claim this seat →</a></p>
                            <p>This link expires in 24 hours. If it expires, the next person on the waitlist gets the offer.</p>
                            <p>— Z Johnson, MRXplorer</p>
                        `,
                    });

                    wlEntry[0].status = 'promoted';
                    await wlStore.set(key, JSON.stringify(wlEntry));
                } catch (err) {
                    console.error('Failed to promote waitlist entry:', err.message);
                }
            }
        } else {
            const wlEntry = await wlStore.get(key, { type: 'json' });
            const wlCount = wlEntry ? wlEntry.filter(e => e.status !== 'promoted').length : 0;
            try {
                await resend.emails.send({
                    from: FROM_EMAIL,
                    to: Z_EMAIL,
                    subject: `Refund inside 72h window — ${name} (${date})`,
                    html: `
                        <h1>Refund inside 72-hour window</h1>
                        <p>A refund was issued for <strong>${name}</strong> on <strong>${date}</strong>.</p>
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

    try {
        switch (stripeEvent.type) {
            case 'checkout.session.completed':
                return await handleCompleted(stripeEvent.data.object);
            case 'charge.refunded':
                return await handleRefunded(stripeEvent.data.object);
            default:
                return new Response('Ignored event type', { status: 200 });
        }
    } catch (err) {
        console.error('Webhook handler error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
