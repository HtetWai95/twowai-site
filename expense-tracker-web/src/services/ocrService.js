import { VISION_API_KEY } from '../firebase/config';

export async function scanReceipt(file) {
  if (!VISION_API_KEY || VISION_API_KEY === 'YOUR_GOOGLE_VISION_API_KEY') {
    throw new Error('Google Vision API key not configured. See src/firebase/config.js.');
  }

  const base64 = await fileToBase64(file);

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{ image: { content: base64 }, features: [{ type: 'TEXT_DETECTION', maxResults: 1 }] }],
      }),
    }
  );

  if (!res.ok) throw new Error(`Vision API error: ${await res.text()}`);

  const data = await res.json();
  const rawText = data.responses?.[0]?.fullTextAnnotation?.text || '';
  return parseReceiptText(rawText);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function parseReceiptText(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const items = [];
  let total = null;
  const priceRx = /\$?\s*(\d{1,4}[.,]\d{2})\s*$/;
  const totalKw = /\b(total|subtotal|grand\s+total|amount\s+due|balance)\b/i;
  const skipKw = /\b(tax|tip|gratuity|discount|coupon|change|cash|card|visa|master|amex|payment|thank|welcome|receipt|date|time|server|table|order)\b/i;

  for (const line of lines) {
    const m = line.match(priceRx);
    if (!m) continue;
    const price = parseFloat(m[1].replace(',', '.'));
    if (isNaN(price) || price <= 0 || price > 9999) continue;
    const name = line.replace(m[0], '').replace(/[*\-_]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    if (totalKw.test(line)) { total = price; continue; }
    if (skipKw.test(line) || name.length < 2) continue;
    items.push({ id: uid(), name: capitalize(name), price, participants: [] });
  }

  if (total === null && items.length > 0)
    total = Math.round(items.reduce((s, i) => s + i.price, 0) * 100) / 100;

  return { items, total, rawText: text };
}

const uid = () => Math.random().toString(36).slice(2, 10);
const capitalize = (s) => s.toLowerCase().replace(/(?:^|\s)\w/g, (c) => c.toUpperCase()).slice(0, 60);
