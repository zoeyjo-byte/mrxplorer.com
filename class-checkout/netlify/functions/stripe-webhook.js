const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getStore } = require('@netlify/blobs');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'updates@mrxplorer.com';

const INDIVIDUAL_CAP = 12;
const COHORT_CAP = 9;

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

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    const sig = event.headers['stripe-signature'];
    let stripeEvent;
    try {
        stripeEvent = stripe.webhooks.constructEvent(
            event.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Signature verification failed:', err.message);
        return { statusCode: 400, body: `Signature verification failed: ${err.message}` };
    }

    if (stripeEvent.type !== 'checkout.session.completed') {
        return { statusCode: 200, body: 'Ignored event type' };
    }

    const session = stripeEvent.data.object;

    try {
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
                const entry = await store.get(key);
                const current = entry ? JSON.parse(entry).count : 0;
                await store.set(key, JSON.stringify({ count: current + 1 }));

                purchases.push({ name, date });

                const ics = generateICS(name, date, 90);
                icsFiles.push({ name: `${name.replace(/\s+/g, '-')}.ics`, content: ics });
            } else {
                purchases.push({ name, date: null });
            }
        }

        // Send confirmation email
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

        return {
            statusCode: 200,
            body: JSON.stringify({ received: true, purchases }),
        };
    } catch (err) {
        console.error('Webhook handler error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    }
};
