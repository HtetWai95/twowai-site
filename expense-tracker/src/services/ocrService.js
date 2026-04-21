import * as FileSystem from 'expo-file-system';
import { VISION_API_KEY } from '../firebase/config';

/**
 * Sends an image to Google Vision API and returns structured receipt items.
 * @param {string} imageUri - Local file URI from expo-image-picker or expo-camera
 * @returns {{ items: [{name, price}], total: number|null, rawText: string }}
 */
export async function scanReceipt(imageUri) {
  if (!VISION_API_KEY || VISION_API_KEY === 'YOUR_GOOGLE_VISION_API_KEY') {
    throw new Error('Google Vision API key not configured. See src/firebase/config.js.');
  }

  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Vision API error: ${err}`);
  }

  const data = await response.json();
  const rawText = data.responses?.[0]?.fullTextAnnotation?.text || '';

  return parseReceiptText(rawText);
}

/**
 * Parses raw OCR text into structured items and total.
 * Handles common receipt formats.
 */
function parseReceiptText(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const items = [];
  let total = null;

  // Regex for a price anywhere in the line: $X.XX or X.XX
  const priceRegex = /\$?\s*(\d{1,4}[.,]\d{2})\s*$/;
  // Total line keywords
  const totalKeywords = /\b(total|subtotal|grand\s+total|amount\s+due|balance)\b/i;
  // Skip keywords
  const skipKeywords = /\b(tax|tip|gratuity|discount|coupon|change|cash|card|visa|master|amex|payment|thank|welcome|receipt|date|time|server|table|order)\b/i;

  for (const line of lines) {
    const priceMatch = line.match(priceRegex);
    if (!priceMatch) continue;

    const price = parseFloat(priceMatch[1].replace(',', '.'));
    if (isNaN(price) || price <= 0 || price > 9999) continue;

    // Extract name by removing the price portion
    const name = line
      .replace(priceMatch[0], '')
      .replace(/[*\-_]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (totalKeywords.test(line)) {
      total = price;
      continue;
    }

    if (skipKeywords.test(line)) continue;
    if (name.length < 2) continue;

    items.push({
      id: generateId(),
      name: capitalizeName(name),
      price,
      participants: [],
    });
  }

  // If no total found, sum items
  if (total === null && items.length > 0) {
    total = Math.round(items.reduce((s, i) => s + i.price, 0) * 100) / 100;
  }

  return { items, total, rawText: text };
}

function capitalizeName(str) {
  return str
    .toLowerCase()
    .replace(/(?:^|\s)\w/g, (ch) => ch.toUpperCase())
    .slice(0, 60);
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}
