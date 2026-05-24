export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    // ── /claim — buyer clicks this link after purchase to get a unique key ──
    if (url.pathname === '/claim' && request.method === 'GET') {
      const plan = url.searchParams.get('plan');
      const planNames = { image: 'image', image_pdf: 'image_pdf', audio: 'audio', all: 'all' };
      if (!plan || !planNames[plan]) {
        return new Response(JSON.stringify({ error: 'Invalid plan' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });
      }

      // Rate limit: 1 claim per IP per plan per 24h
      const ip = request.headers.get('cf-connecting-ip') || 'unknown';
      const rateKey = 'rate:' + ip + ':' + plan;
      const recentClaim = await env.LICENSE_KV.get(rateKey);
      if (recentClaim) {
        return new Response(JSON.stringify({
          error: 'A key has already been claimed for this plan. If you lost your key, contact lesleyturner470@gmail.com'
        }), { status: 429, headers: { ...headers, 'Content-Type': 'application/json' } });
      }

      // Generate unique key
      const random = crypto.randomUUID().split('-')[0].toUpperCase();
      const key = 'FLUX-' + plan.toUpperCase().replace('_','-') + '-' + random;

      // Store in KV as unused
      await env.LICENSE_KV.put('gen:' + key, JSON.stringify({
        plan: planNames[plan],
        status: 'unused',
        createdAt: new Date().toISOString()
      }));
      await env.LICENSE_KV.put(rateKey, '1', { expirationTtl: 86400 });

      const html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your License Key — Fluxora</title><style>body{font-family:-apple-system,sans-serif;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{background:rgba(28,28,30,0.8);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:40px;text-align:center;max-width:480px;width:90%}h1{color:#0A84FF;font-size:1.5rem;margin-bottom:8px}.key{background:rgba(10,132,255,0.15);border:1px solid rgba(10,132,255,0.3);border-radius:12px;padding:16px 24px;font-size:1.4rem;font-family:monospace;letter-spacing:2px;color:#fff;margin:24px 0;user-select:all}.steps{text-align:left;color:rgba(255,255,255,0.7);font-size:0.9rem;line-height:1.8}.steps span{color:#0A84FF;font-weight:600}</style></head><body><div class="card"><h1>Your License Key</h1><div class="key">' + key + '</div><p style="color:rgba(255,255,255,0.5);font-size:0.8rem">Select the key above and copy it</p><div class="steps"><span>1.</span> Go to <strong>https://fluxora.site</strong><br><span>2.</span> Click <strong>"My License"</strong> in the top bar<br><span>3.</span> Paste your key and click <strong>Verify</strong><br><span>4.</span> Your tools unlock instantly!</div><p style="color:rgba(255,255,255,0.3);font-size:0.75rem;margin-top:24px">This key can only be used once. Do not share it.<br>Questions? lesleyturner470@gmail.com</p></div></body></html>';

      return new Response(html, { status: 200, headers: { ...headers, 'Content-Type': 'text/html;charset=utf-8' } });
    }

    // ── /verify — validate and activate a license key ──
    if (url.pathname === '/verify' && request.method === 'POST') {
      try {
        const body = await request.json();
        const code = (body.code || '').trim().toUpperCase();

        if (!code) {
          return new Response(JSON.stringify({ success: false, message: 'Please enter a license key' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });
        }

        // Check pre-generated keys
        if (VALID_KEYS[code]) {
          const used = await env.LICENSE_KV.get(code);
          if (used) {
            return new Response(JSON.stringify({ success: false, message: 'This key has already been activated. Each key can only be used once.' }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
          }
          await env.LICENSE_KV.put(code, JSON.stringify({ plan: VALID_KEYS[code], usedAt: new Date().toISOString(), fingerprint: body.fingerprint || 'unknown' }));
          return new Response(JSON.stringify({ success: true, plan: VALID_KEYS[code], token: 'paid-' + code }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
        }

        // Check dynamically generated keys
        const genData = await env.LICENSE_KV.get('gen:' + code);
        if (genData) {
          const gen = JSON.parse(genData);
          if (gen.status === 'used') {
            return new Response(JSON.stringify({ success: false, message: 'This key has already been activated. Each key can only be used once.' }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
          }
          // Mark as used
          await env.LICENSE_KV.put('gen:' + code, JSON.stringify({ ...gen, status: 'used', usedAt: new Date().toISOString(), fingerprint: body.fingerprint || 'unknown' }));
          return new Response(JSON.stringify({ success: true, plan: gen.plan, token: 'paid-' + code }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ success: false, message: 'Invalid license key. Please check and try again.' }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });

      } catch (err) {
        return new Response(JSON.stringify({ success: false, message: 'Server error. Please try again.' }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify({ success: false, message: 'Not found' }), { status: 404, headers: { ...headers, 'Content-Type': 'application/json' } });
  }
};

const VALID_KEYS = {
  'FLUX-IMG-8U7EPG': 'image', 'FLUX-IMG-2OBGPJ': 'image', 'FLUX-IMG-MQA70M': 'image',
  'FLUX-IMG-JK9GOP': 'image', 'FLUX-IMG-DNH3V1': 'image', 'FLUX-IMG-7SEHG0': 'image',
  'FLUX-IMG-XSNJQW': 'image', 'FLUX-IMG-WQ1VFG': 'image', 'FLUX-IMG-BQTOPO': 'image',
  'FLUX-IMG-403ECV': 'image', 'FLUX-IMG-QQ4ZDG': 'image', 'FLUX-IMG-DSPO7K': 'image',
  'FLUX-IMG-QRNQA9': 'image', 'FLUX-IMG-PR1YSA': 'image', 'FLUX-IMG-73NXCX': 'image',
  'FLUX-IMG-JK34SM': 'image', 'FLUX-IMG-Q01BFK': 'image', 'FLUX-IMG-0QYEN7': 'image',
  'FLUX-IMG-B5YEXU': 'image', 'FLUX-IMG-CXDYA8': 'image', 'FLUX-IMG-9GDPM2': 'image',
  'FLUX-IMG-Q4GY1E': 'image', 'FLUX-IMG-1E5COZ': 'image', 'FLUX-IMG-XKXESR': 'image',
  'FLUX-IMG-RFMYHI': 'image', 'FLUX-IMG-5RA36W': 'image', 'FLUX-IMG-O6FJ6N': 'image',
  'FLUX-IMG-5DRXZ6': 'image', 'FLUX-IMG-X7KXOW': 'image', 'FLUX-IMG-02I5M9': 'image',
  'FLUX-IMG-N0CT3D': 'image', 'FLUX-IMG-D6V8IX': 'image', 'FLUX-IMG-1ET526': 'image',
  'FLUX-IMG-BY7I90': 'image', 'FLUX-IMG-MATOV1': 'image', 'FLUX-IMG-QK3B8M': 'image',
  'FLUX-IMG-3NZVL5': 'image', 'FLUX-IMG-782C27': 'image', 'FLUX-IMG-EPKXR7': 'image',
  'FLUX-IMG-XDITFX': 'image', 'FLUX-IMG-WNKJUN': 'image', 'FLUX-IMG-0AW1Q2': 'image',
  'FLUX-IMG-Z0RAP8': 'image', 'FLUX-IMG-2A07UR': 'image', 'FLUX-IMG-9CR6DM': 'image',
  'FLUX-IMG-1H2V99': 'image', 'FLUX-IMG-67OZUX': 'image', 'FLUX-IMG-SNPHNU': 'image',
  'FLUX-IMG-UIPV9Z': 'image', 'FLUX-IMG-WA2XU9': 'image',
  'FLUX-PRO-KYG1IZ': 'image_pdf', 'FLUX-PRO-SFCI79': 'image_pdf', 'FLUX-PRO-UFBFD1': 'image_pdf',
  'FLUX-PRO-1O16RS': 'image_pdf', 'FLUX-PRO-93QG69': 'image_pdf', 'FLUX-PRO-839ZNP': 'image_pdf',
  'FLUX-PRO-CX4PIS': 'image_pdf', 'FLUX-PRO-AHJ3A1': 'image_pdf', 'FLUX-PRO-FWSO5B': 'image_pdf',
  'FLUX-PRO-C4HIB5': 'image_pdf', 'FLUX-PRO-5K0BYJ': 'image_pdf', 'FLUX-PRO-EPZLIO': 'image_pdf',
  'FLUX-PRO-JZ3UW1': 'image_pdf', 'FLUX-PRO-LF5RXC': 'image_pdf', 'FLUX-PRO-MXFSBN': 'image_pdf',
  'FLUX-PRO-R5DF5R': 'image_pdf', 'FLUX-PRO-DEYP7K': 'image_pdf', 'FLUX-PRO-5ZPXGR': 'image_pdf',
  'FLUX-PRO-7YRX8Y': 'image_pdf', 'FLUX-PRO-83QIVG': 'image_pdf', 'FLUX-PRO-OI4HD2': 'image_pdf',
  'FLUX-PRO-EHVHTS': 'image_pdf', 'FLUX-PRO-9X1JT8': 'image_pdf', 'FLUX-PRO-DM5AB9': 'image_pdf',
  'FLUX-PRO-BXPJ7H': 'image_pdf', 'FLUX-PRO-T6URNS': 'image_pdf', 'FLUX-PRO-2IRIZC': 'image_pdf',
  'FLUX-PRO-ET88Z9': 'image_pdf', 'FLUX-PRO-713604': 'image_pdf', 'FLUX-PRO-8WWAJM': 'image_pdf',
  'FLUX-PRO-IQUAY0': 'image_pdf', 'FLUX-PRO-VOXBLE': 'image_pdf', 'FLUX-PRO-Z2H4IP': 'image_pdf',
  'FLUX-PRO-WLSDCX': 'image_pdf', 'FLUX-PRO-DTD7IG': 'image_pdf', 'FLUX-PRO-NK4ORG': 'image_pdf',
  'FLUX-PRO-TAURQ7': 'image_pdf', 'FLUX-PRO-TYFRWS': 'image_pdf', 'FLUX-PRO-V3XEZZ': 'image_pdf',
  'FLUX-PRO-4SFIA2': 'image_pdf', 'FLUX-PRO-7G922I': 'image_pdf', 'FLUX-PRO-ML5OCW': 'image_pdf',
  'FLUX-PRO-GATU5Y': 'image_pdf', 'FLUX-PRO-NHWKZ2': 'image_pdf', 'FLUX-PRO-CCJT44': 'image_pdf',
  'FLUX-PRO-K3L86U': 'image_pdf', 'FLUX-PRO-BZ2F7N': 'image_pdf', 'FLUX-PRO-CPD48R': 'image_pdf',
  'FLUX-PRO-K5V6IO': 'image_pdf', 'FLUX-PRO-B91SDK': 'image_pdf',
  'FLUX-AUD-9T58Q2': 'audio', 'FLUX-AUD-AHYRRA': 'audio', 'FLUX-AUD-TMWRB0': 'audio',
  'FLUX-AUD-WXN167': 'audio', 'FLUX-AUD-XBN1BA': 'audio', 'FLUX-AUD-AVEN6T': 'audio',
  'FLUX-AUD-COD7HB': 'audio', 'FLUX-AUD-K1JO0W': 'audio', 'FLUX-AUD-VLJETA': 'audio',
  'FLUX-AUD-E4FX7N': 'audio', 'FLUX-AUD-FIBAAA': 'audio', 'FLUX-AUD-AWHM62': 'audio',
  'FLUX-AUD-OJE56V': 'audio', 'FLUX-AUD-H5MXXR': 'audio', 'FLUX-AUD-H1AQLZ': 'audio',
  'FLUX-AUD-23JCMJ': 'audio', 'FLUX-AUD-OBS44I': 'audio', 'FLUX-AUD-FKXCHC': 'audio',
  'FLUX-AUD-6OVHVN': 'audio', 'FLUX-AUD-ZE40CM': 'audio', 'FLUX-AUD-IJDV05': 'audio',
  'FLUX-AUD-N8170Y': 'audio', 'FLUX-AUD-PTGJJ4': 'audio', 'FLUX-AUD-0GQOVV': 'audio',
  'FLUX-AUD-ADIJ6A': 'audio', 'FLUX-AUD-ZTJ8HM': 'audio', 'FLUX-AUD-EEFKKJ': 'audio',
  'FLUX-AUD-Q8DZV7': 'audio', 'FLUX-AUD-PC65MH': 'audio', 'FLUX-AUD-ULFAYK': 'audio',
  'FLUX-AUD-KH71RZ': 'audio', 'FLUX-AUD-GX8X6X': 'audio', 'FLUX-AUD-YIQI5Y': 'audio',
  'FLUX-AUD-UZVS6I': 'audio', 'FLUX-AUD-MDYX1U': 'audio', 'FLUX-AUD-EHPM88': 'audio',
  'FLUX-AUD-78SMRR': 'audio', 'FLUX-AUD-QVF5AG': 'audio', 'FLUX-AUD-C6XTKW': 'audio',
  'FLUX-AUD-OZ73NF': 'audio', 'FLUX-AUD-L7QDUX': 'audio', 'FLUX-AUD-XJZGAX': 'audio',
  'FLUX-AUD-PHT7Y9': 'audio', 'FLUX-AUD-WY93BF': 'audio', 'FLUX-AUD-X50UTF': 'audio',
  'FLUX-AUD-SLRFZO': 'audio', 'FLUX-AUD-NGJ56I': 'audio', 'FLUX-AUD-OL4GRH': 'audio',
  'FLUX-AUD-RDT5QT': 'audio', 'FLUX-AUD-UVH4F3': 'audio',
  'FLUX-ALL-509OCL': 'all', 'FLUX-ALL-W8SPSK': 'all', 'FLUX-ALL-PLQT10': 'all',
  'FLUX-ALL-TFN2LX': 'all', 'FLUX-ALL-G36CM5': 'all', 'FLUX-ALL-X9BGEZ': 'all',
  'FLUX-ALL-475Z2D': 'all', 'FLUX-ALL-AFJCA2': 'all', 'FLUX-ALL-P3CP8H': 'all',
  'FLUX-ALL-2CL5MJ': 'all', 'FLUX-ALL-PVXMUT': 'all', 'FLUX-ALL-C8ZMLU': 'all',
  'FLUX-ALL-XI1VPZ': 'all', 'FLUX-ALL-CZAYNG': 'all', 'FLUX-ALL-QWRCO9': 'all',
  'FLUX-ALL-B8Y4GI': 'all', 'FLUX-ALL-BQL4MV': 'all', 'FLUX-ALL-T27M8O': 'all',
  'FLUX-ALL-UZFQPT': 'all', 'FLUX-ALL-FUHWSE': 'all', 'FLUX-ALL-C6PH9M': 'all',
  'FLUX-ALL-S35DLO': 'all', 'FLUX-ALL-04DQ49': 'all', 'FLUX-ALL-WKS7BE': 'all',
  'FLUX-ALL-V4Y662': 'all', 'FLUX-ALL-IF1GXG': 'all', 'FLUX-ALL-WQZPWR': 'all',
  'FLUX-ALL-JW0UM2': 'all', 'FLUX-ALL-OL38PX': 'all', 'FLUX-ALL-WBTXK6': 'all',
  'FLUX-ALL-4I6JY7': 'all', 'FLUX-ALL-H4LW9D': 'all', 'FLUX-ALL-6MJGDG': 'all',
  'FLUX-ALL-PXXXCU': 'all', 'FLUX-ALL-2JTBPM': 'all', 'FLUX-ALL-3KQ1HY': 'all',
  'FLUX-ALL-JFZD31': 'all', 'FLUX-ALL-5EVWM1': 'all', 'FLUX-ALL-ZB2X1K': 'all',
  'FLUX-ALL-PFN5I5': 'all', 'FLUX-ALL-I77MWJ': 'all', 'FLUX-ALL-X0PTYG': 'all',
  'FLUX-ALL-X3B2D7': 'all', 'FLUX-ALL-OIQAI6': 'all', 'FLUX-ALL-W2GY8Y': 'all',
  'FLUX-ALL-FB4PMT': 'all', 'FLUX-ALL-DGLL4D': 'all', 'FLUX-ALL-PDXITP': 'all',
  'FLUX-ALL-L0Z973': 'all', 'FLUX-ALL-LM0LZR': 'all'
};
