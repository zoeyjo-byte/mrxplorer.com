import { getStore } from '@netlify/blobs';

const ALLOWED_ORIGIN = 'https://www.mrxplorer.com';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders(),
    });
  }

  try {
    const store = getStore('capacity');
    const allKeys = [];
    for await (const key of store.list()) {
      allKeys.push(key);
    }

    const result = {};
    for (const key of allKeys) {
      const entry = await store.get(key, { type: 'json' });
      result[key] = entry ? entry.count : 0;
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (err) {
    console.error('capacity error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
};
