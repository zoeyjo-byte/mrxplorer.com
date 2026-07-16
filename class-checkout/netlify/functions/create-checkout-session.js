const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getStore } = require('@netlify/blobs');

const INDIVIDUAL_CAP = 12;
const COHORT_CAP = 9;

function makeKey(name, date) {
    const safe = name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60);
    return `${safe}::${date || 'no-date'}`;
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        const { items } = JSON.parse(event.body);

        // ── Capacity check ──────────────────────────────────────
        const store = getStore('capacity');
        const cap = items[0]?.type === 'cohort' ? COHORT_CAP : INDIVIDUAL_CAP;

        for (const item of items) {
            if (!item.date) continue;
            const key = makeKey(item.name, item.date);
            const entry = await store.get(key);
            const current = entry ? JSON.parse(entry).count : 0;
            if (current >= cap) {
                return {
                    statusCode: 409,
                    body: JSON.stringify({
                        error: 'class_full',
                        message: `"${item.name}" is sold out for the selected date. Please choose another date or class.`,
                    }),
                };
            }
        }

        // ── Create Stripe session ───────────────────────────────
        const lineItems = items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                    metadata: {
                        class_date: item.date || '',
                    },
                },
                unit_amount: item.price * 100,
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: lineItems,
            success_url: `https://${event.headers.host}/success.html`,
            cancel_url: `https://${event.headers.host}/`,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ url: session.url }),
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    }
};
