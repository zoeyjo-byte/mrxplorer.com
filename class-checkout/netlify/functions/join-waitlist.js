import { getStore } from '@netlify/blobs';

const ALLOWED_ORIGIN = 'https://www.mrxplorer.com';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
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

    if (!name || !email || !className) {
      return new Response(JSON.stringify({ error: 'name, email, and className are required' }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    const store = getStore('waitlist');
    const safe = className.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60);
    const key = `${safe}::${sessionDate || 'any'}`;

    const existing = await store.get(key, { type: 'json' });
    const entries = existing || [];
    entries.push({ name, email, createdAt: new Date().toISOString() });
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
