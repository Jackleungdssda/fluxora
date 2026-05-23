/**
 * Fluxora — Cloudflare Worker
 * License verification & HMAC token signing
 *
 * Deploy: npx wrangler deploy workers/worker.js
 */

// Secret key for HMAC signing (set via wrangler secret put HMAC_SECRET)
const HMAC_SECRET = globalThis.HMAC_SECRET || 'dev-secret-change-in-production';

// Product variant ID → license_plan mapping
const PRODUCT_MAP = {
  'variant_image': 'image',
  'variant_image_pdf': 'image_pdf',
  'variant_audio': 'audio',
  'variant_all': 'all'
};

/** Generate a unique license key */
function generateLicenseKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [];
  for (let i = 0; i < 4; i++) {
    let seg = '';
    for (let j = 0; j < 4; j++) {
      seg += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(seg);
  }
  return segments.join('-');
}

/** Simple device fingerprint hash */
async function hashDeviceFingerprint(fp) {
  const encoder = new TextEncoder();
  const data = encoder.encode(fp);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Create an HMAC-SHA256 signature */
async function sign(payload, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

/** Verify an HMAC-SHA256 signature */
async function verify(payload, signature, secret) {
  const expected = await sign(payload, secret);
  return signature === expected;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const secret = env.HMAC_SECRET || HMAC_SECRET;

    // CORS headers
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // POST /api/verify-license — verify an activation code
    if (url.pathname === '/api/verify-license' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { code, deviceFingerprint } = body;

        if (!code) {
          return new Response(JSON.stringify({ success: false, message: 'License code required' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
        }

        // Check KV for license code
        const licenseData = await env.LICENSES.get(code.toUpperCase(), 'json');
        if (!licenseData) {
          return new Response(JSON.stringify({ success: false, message: 'Invalid license code' }), { headers: { ...cors, 'Content-Type': 'application/json' } });
        }

        // Check device binding (max 2 devices)
        const deviceHash = deviceFingerprint ? await hashDeviceFingerprint(deviceFingerprint) : 'unknown';
        let devices = licenseData.devices || [];

        if (!devices.includes(deviceHash)) {
          if (devices.length >= 2) {
            return new Response(JSON.stringify({ success: false, message: 'License activated on maximum devices (2)' }), { headers: { ...cors, 'Content-Type': 'application/json' } });
          }
          devices.push(deviceHash);
          licenseData.devices = devices;
          await env.LICENSES.put(code.toUpperCase(), JSON.stringify(licenseData));
        }

        // Create signed token (valid 30 days)
        const payload = JSON.stringify({
          plan: licenseData.plan,
          deviceHash: deviceHash,
          issuedAt: Date.now(),
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
        });
        const token = await sign(payload, secret);
        const fullToken = btoa(payload) + '.' + token;

        return new Response(JSON.stringify({ success: true, plan: licenseData.plan, token: fullToken }), { headers: { ...cors, 'Content-Type': 'application/json' } });

      } catch (err) {
        return new Response(JSON.stringify({ success: false, message: 'Server error' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
      }
    }

    // POST /api/validate-token — validate a signed token
    if (url.pathname === '/api/validate-token' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
          return new Response(JSON.stringify({ valid: false }), { headers: { ...cors, 'Content-Type': 'application/json' } });
        }

        const parts = token.split('.');
        if (parts.length !== 2) {
          return new Response(JSON.stringify({ valid: false }), { headers: { ...cors, 'Content-Type': 'application/json' } });
        }

        const payload = atob(parts[0]);
        const signature = parts[1];
        const isValid = await verify(payload, signature, secret);

        if (!isValid) {
          return new Response(JSON.stringify({ valid: false }), { headers: { ...cors, 'Content-Type': 'application/json' } });
        }

        const data = JSON.parse(payload);
        const expired = data.expiresAt < Date.now();

        return new Response(JSON.stringify({ valid: !expired, plan: data.plan, expired: expired }), { headers: { ...cors, 'Content-Type': 'application/json' } });

      } catch (err) {
        return new Response(JSON.stringify({ valid: false }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
      }
    }

    // POST /api/webhook — receive order events from Lemon Squeezy / Paddle
    if (url.pathname === '/api/webhook' && request.method === 'POST') {
      try {
        const body = await request.json();
        const event = body.meta?.event_name || body.event_type;

        if (event === 'order_created' || event === 'order.completed') {
          const variantId = body.data?.attributes?.variant_id || body.data?.product_id;
          const plan = PRODUCT_MAP[variantId] || 'all';

          // Generate license key
          const licenseKey = generateLicenseKey();
          const customerEmail = body.data?.attributes?.user_email || body.data?.customer_email || '';

          // Store in KV
          await env.LICENSES.put(licenseKey, JSON.stringify({
            plan: plan,
            email: customerEmail,
            createdAt: Date.now(),
            devices: []
          }));

          // Return license key (email integration with SendGrid/Resend can be added)
          return new Response(JSON.stringify({ success: true, licenseKey: licenseKey, plan: plan }), { headers: { ...cors, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ success: true, message: 'Event received' }), { headers: { ...cors, 'Content-Type': 'application/json' } });

      } catch (err) {
        return new Response(JSON.stringify({ success: false, message: 'Server error' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
      }
    }

    return new Response('Fluxora Worker — Not Found', { status: 404 });
  }
};
