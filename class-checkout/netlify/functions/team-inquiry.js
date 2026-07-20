import { Resend } from 'resend';

const ALLOWED_ORIGIN = 'https://www.mrxplorer.com';
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'updates@mrxplorer.com';
const Z_EMAIL = 'zjohnson@mrxplorer.com';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

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
    const { name, email, company, teamSize, track } = await req.json();

    const validEmail = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 200 ||
        !validEmail || email.length > 320 || typeof company !== 'string' || company.trim().length === 0 ||
        company.length > 200 || !teamSize || !track) {
      return new Response(JSON.stringify({ error: 'name, email, company, teamSize, and track are required' }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: Z_EMAIL,
        subject: `New team training inquiry from ${name} at ${company}`,
        html: `
          <h1>Team Training Inquiry</h1>
          <table style="border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: 600;">Name:</td><td style="padding: 8px;">${escapeHtml(name)}</td></tr>
            <tr><td style="padding: 8px; font-weight: 600;">Email:</td><td style="padding: 8px;">${escapeHtml(email)}</td></tr>
            <tr><td style="padding: 8px; font-weight: 600;">Company:</td><td style="padding: 8px;">${escapeHtml(company)}</td></tr>
            <tr><td style="padding: 8px; font-weight: 600;">Team Size:</td><td style="padding: 8px;">${escapeHtml(teamSize)}</td></tr>
            <tr><td style="padding: 8px; font-weight: 600;">Track:</td><td style="padding: 8px;">${escapeHtml(track)}</td></tr>
          </table>
          <p>This inquiry came from the team training form on the MRXplorer website.</p>
        `,
      });
    } catch (emailErr) {
      console.error('Failed to send team inquiry email:', emailErr.message);
      return new Response(JSON.stringify({ error: 'Failed to send notification' }), {
        status: 500,
        headers: corsHeaders(),
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (err) {
    console.error('team-inquiry error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
};
