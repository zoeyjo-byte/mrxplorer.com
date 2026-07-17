import Stripe from 'stripe';
import { getStore } from '@netlify/blobs';
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const INDIVIDUAL_CAP = 12;
const COHORT_CAP = 9;

function makeKey(name, date) {
    const safe = name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60);
    return `${safe}::${date || 'no-date'}`;
}

export default async (req, context) => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const { items } = await req.json();

        const store = getStore('capacity');
        const cap = items[0]?.type === 'cohort' ? COHORT_CAP : INDIVIDUAL_CAP;

        for (const item of items) {
            if (!item.date) continue;
            const key = makeKey(item.name, item.date);
            const entry = await store.get(key, { type: 'json' });
            const current = entry ? entry.count : 0;
            if (current >= cap) {
                return new Response(JSON.stringify({
                    error: 'class_full',
                    message: `"${item.name}" is sold out for the selected date. Please choose another date or class.`,
                }), {
                    status: 409,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        const lineItems = items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                    tax_code: 'txcd_20060045',
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
            automatic_tax: { enabled: true },
            allow_promotion_codes: true,
            success_url: `https://${req.headers.get('host')}/success.html`,
            cancel_url: `https://${req.headers.get('host')}/`,
        });

        return new Response(JSON.stringify({ url: session.url }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
