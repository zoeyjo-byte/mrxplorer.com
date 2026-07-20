import { getStore } from '@netlify/blobs';
import { CATALOG, isScheduledDate } from './catalog.js';

const ALLOWED_ORIGIN = 'https://www.mrxplorer.com';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

function calendarDate(date) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(parsed);
  return [
    parts.find(part => part.type === 'year')?.value,
    parts.find(part => part.type === 'month')?.value,
    parts.find(part => part.type === 'day')?.value,
  ].join('-');
}

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders(),
    });
  }

  try {
    const { name, email, className, sessionDate } = await req.json();

    const normalizedDate = typeof sessionDate === 'string' ? calendarDate(sessionDate) : null;
    const validEmail = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 200 ||
        !validEmail || email.length > 320 || typeof className !== 'string' ||
        !normalizedDate || !CATALOG[className] || !isScheduledDate(className, sessionDate)) {
      return new Response(JSON.stringify({ error: 'name, email, className, and sessionDate are required' }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    const store = getStore('waitlist');
    const safe = className.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60);
    const key = `${safe}::${normalizedDate}`;

    const existing = await store.get(key, { type: 'json' });
    const entries = existing || [];
    entries.push({ name: name.trim(), email: email.trim().toLowerCase(), status: 'waiting', createdAt: new Date().toISOString() });
    await store.set(key, JSON.stringify(entries));

    return new Response(JSON.stringify({ received: true, position: entries.length }), {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (err) {
    console.error('join-waitlist error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
};
