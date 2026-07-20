import Stripe from 'stripe';
import { getStore } from '@netlify/blobs';
import { CATALOG, isScheduledDate } from './catalog.js';
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const INDIVIDUAL_CAP = 12;
const COHORT_CAP = 9;

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

export default async (req, context) => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const { items, companyName } = await req.json();

        if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
            return new Response(JSON.stringify({ error: 'At least one valid item is required.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const company = typeof companyName === 'string' ? companyName.trim() : '';
        if (!company || company.length > 200) {
            return new Response(JSON.stringify({ error: 'A valid company name is required.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const validatedItems = items.map((item) => {
            const catalogItem = CATALOG[item?.name];
            const quantity = Number(item?.quantity);
            if (!catalogItem || item?.price !== catalogItem.price || quantity !== 1) {
                throw Object.assign(new Error('Invalid class selection. Please reload the checkout page and try again.'), { status: 400 });
            }
            const dates = Array.isArray(item.dates) ? item.dates : [item.date];
            if (dates.length === 0 || dates.length > 2 || new Set(dates).size !== dates.length ||
                dates.some(date => typeof date !== 'string' || !date || Number.isNaN(new Date(date).getTime()))) {
                throw Object.assign(new Error(`Valid session dates are required for "${item.name}".`), { status: 400 });
            }
            if (dates.some(date => !isScheduledDate(item.name, date))) {
                throw Object.assign(new Error(`One or more selected dates are not scheduled for "${item.name}".`), { status: 400 });
            }
            return { ...item, date: dates[0], dates, type: catalogItem.type, company };
        });
        if (new Set(validatedItems.map(item => item.type)).size > 1) {
            throw Object.assign(new Error('Individual classes and cohort registrations must be purchased separately.'), { status: 400 });
        }

        const store = getStore('capacity');

        for (const item of validatedItems) {
            const cap = item.type === 'cohort' ? COHORT_CAP : INDIVIDUAL_CAP;
            for (const date of item.dates) {
                const key = makeKey(item.name, date);
                const entry = await store.get(key, { type: 'json' });
                const current = Number(entry?.count || 0);
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
        }

        const lineItems = validatedItems.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                    tax_code: 'txcd_20060045',
                    metadata: {
                        class_date: item.date || '',
                        class_dates: JSON.stringify(item.dates),
                        company_name: company,
                        item_type: item.type,
                    },
                },
                unit_amount: item.price * 100,
                tax_behavior: 'exclusive',
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: lineItems,
            automatic_tax: { enabled: true },
            allow_promotion_codes: true,
            metadata: { company_name: company },
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
            status: err.status || 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
