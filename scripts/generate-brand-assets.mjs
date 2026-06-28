#!/usr/bin/env node
/**
 * Regenerate launcher + splash PNGs from assets/icon.png.
 * Adaptive icons mask to a circle — foreground must fill ~80% of the canvas.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const iconPath = path.join(root, 'assets/icon.png');
const adaptivePath = path.join(root, 'assets/adaptive-icon.png');
const splashPath = path.join(root, 'assets/splash.png');

const SIZE = 1024;
const ADAPTIVE_SCALE = 1.32; // compensate for Android adaptive-icon safe zone
const SPLASH_W = 1284;
const SPLASH_H = 2778;
const SPLASH_LOGO = 520;

async function writeAdaptiveIcon() {
  const scaled = Math.round(SIZE * ADAPTIVE_SCALE);
  const offset = Math.floor((scaled - SIZE) / 2);
  await sharp(iconPath)
    .resize(scaled, scaled, { fit: 'cover' })
    .extract({ left: offset, top: offset, width: SIZE, height: SIZE })
    .png()
    .toFile(adaptivePath);
  console.log('wrote', adaptivePath);
}

function starDots(width, height, count = 48) {
  const dots = [];
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < count; i++) {
    const cx = Math.round(rand() * width);
    const cy = Math.round(rand() * height);
    const r = rand() > 0.7 ? 2.5 : 1.5;
    const color = rand() > 0.55 ? '#E8A85F' : '#F5D6D3';
    const opacity = 0.25 + rand() * 0.45;
    dots.push(
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${opacity.toFixed(2)}"/>`,
    );
  }
  return dots.join('\n');
}

async function writeSplash() {
  const logo = await sharp(iconPath)
    .resize(SPLASH_LOGO, SPLASH_LOGO, { fit: 'contain' })
    .png()
    .toBuffer();

  const logoLeft = Math.round((SPLASH_W - SPLASH_LOGO) / 2);
  const logoTop = Math.round(SPLASH_H * 0.34 - SPLASH_LOGO / 2);

  const starsSvg = Buffer.from(
    `<svg width="${SPLASH_W}" height="${SPLASH_H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1A0E12"/>
      ${starDots(SPLASH_W, SPLASH_H)}
    </svg>`,
  );

  const stars = await sharp(starsSvg).png().toBuffer();

  const dividerSvg = Buffer.from(
    `<svg width="28" height="2" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="1" y="0.5" fill="#E8A85F"/>
    </svg>`,
  );
  const divider = await sharp(dividerSvg).png().toBuffer();

  const arabicSvg = Buffer.from(
    `<svg width="400" height="80" xmlns="http://www.w3.org/2000/svg">
      <text x="200" y="58" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="54" font-weight="200" fill="#F5D6D3" letter-spacing="8">&#x0641;&#x062C;&#x0631;</text>
    </svg>`,
  );
  const arabic = await sharp(arabicSvg).png().toBuffer();

  const titleSvg = Buffer.from(
    `<svg width="600" height="40" xmlns="http://www.w3.org/2000/svg">
      <text x="300" y="28" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="12" font-weight="300" fill="#E8BEC8" letter-spacing="6">FAJR COMPANION</text>
    </svg>`,
  );
  const title = await sharp(titleSvg).png().toBuffer();

  const taglineSvg = Buffer.from(
    `<svg width="700" height="60" xmlns="http://www.w3.org/2000/svg">
      <text x="350" y="22" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="12" fill="#9E7080">Wake up. Pray. Begin your day with purpose.</text>
    </svg>`,
  );
  const tagline = await sharp(taglineSvg).png().toBuffer();

  const dividerTop = logoTop + SPLASH_LOGO + 18;
  const arabicTop = dividerTop + 16;
  const titleTop = arabicTop + 72;
  const taglineTop = titleTop + 28;

  await sharp(stars)
    .composite([
      { input: logo, left: logoLeft, top: logoTop },
      { input: divider, left: Math.round((SPLASH_W - 28) / 2), top: dividerTop },
      { input: arabic, left: Math.round((SPLASH_W - 400) / 2), top: arabicTop },
      { input: title, left: Math.round((SPLASH_W - 600) / 2), top: titleTop },
      { input: tagline, left: Math.round((SPLASH_W - 700) / 2), top: taglineTop },
    ])
    .png()
    .toFile(splashPath);

  console.log('wrote', splashPath);
}

await writeAdaptiveIcon();
await writeSplash();
