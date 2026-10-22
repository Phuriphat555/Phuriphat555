// Dreamy pixel header: a pastel night sky with twinkling pixel stars, drifting clouds,
// a crescent moon and a pixel pixie flying loops with a sparkle trail.
// Writes assets/header.svg. Run: node .github/header/generate.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const W = 900, H = 230;
const NAME = 'Phuriphat Chantiuaong';
const ROLE = 'Software Engineering Student';

// deterministic random so the file only changes when the code does
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

function sprite(rows, colors, px, ox, oy) {
  let out = '';
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (colors[ch]) out += `<rect x="${ox + x * px}" y="${oy + y * px}" width="${px}" height="${px}" fill="${colors[ch]}"/>`;
  }));
  return out;
}

// ---------- pixie ----------
const PX = 4;
const BODY = [
  '....HHHH....',
  '...HHHHHH...',
  '...HSSSSH...',
  '...SESSES...',
  '....SSSS....',
  '.....DD....Y',
  '....DDDDSSY.',
  '...DDDDDD...',
  '..DDDDDDDD..',
  '....S..S....',
];
const WINGS = [
  '............',
  'WW........WW',
  'WWW......WWW',
  'WWWW....WWWW',
  '.WWW....WWW.',
  '..WW....WW..',
];
const pixieColors = { H: '#7b4fd6', S: '#ffd7b8', E: '#2c2547', D: '#ff8fbf', Y: '#ffe27a' };
const ox = -6 * PX, oy = -5 * PX;
const pixie = `<g class="wings">${sprite(WINGS, { W: '#e6f6ff' }, PX, ox, oy)}</g>${sprite(BODY, pixieColors, PX, ox, oy)}`;

// flight path: loops around the title, flipping to face the direction of travel
const PATH = [
  [70, 150, 1], [150, 62, 1], [330, 34, 1], [560, 30, 1], [780, 62, 1], [835, 140, 1],
  [835, 140, -1], [700, 178, -1], [450, 182, -1], [220, 176, -1], [70, 150, -1], [70, 150, 1],
];
const LOOP = 16;
const flight = PATH.map(([x, y, s], i) => `${((i / (PATH.length - 1)) * 100).toFixed(2)}%{transform:translate(${x}px,${y}px) scaleX(${s})}`).join('');

// ---------- sky ----------
const stars = [];
for (let i = 0; i < 46; i++) {
  const x = Math.round(rand() * (W - 20) + 10), y = Math.round(rand() * 175 + 8);
  if (x > 170 && x < 730 && y > 70 && y < 160) { i--; continue; } // keep the title clear
  const big = rand() > 0.75;
  const d = (rand() * 4).toFixed(2), dur = (2 + rand() * 3).toFixed(2);
  stars.push(big
    ? `<g class="tw" style="animation-duration:${dur}s;animation-delay:-${d}s"><rect x="${x}" y="${y - 3}" width="2" height="8" fill="#fff"/><rect x="${x - 3}" y="${y}" width="8" height="2" fill="#fff"/></g>`
    : `<rect class="tw" style="animation-duration:${dur}s;animation-delay:-${d}s" x="${x}" y="${y}" width="2" height="2" fill="#fff"/>`);
}

const CLOUD = [
  '....XXXX........',
  '..XXXXXXXX.XXX..',
  '.XXXXXXXXXXXXXX.',
  'XXXXXXXXXXXXXXXX',
  '.XXXXXXXXXXXXXX.',
];
const clouds = [[40, 4, 70, 0], [70, 3, 95, -40], [130, 5, 120, -75]].map(([y, px, dur, delay]) =>
  `<g class="cloud" style="animation-duration:${dur}s;animation-delay:${delay}s">${sprite(CLOUD, { X: '#ffffff' }, px, 0, y)}</g>`).join('');

const MOON = [
  '..MMM...',
  '.MMM....',
  'MMM.....',
  'MMM.....',
  'MMM.....',
  '.MMM...M',
  '..MMMMM.',
];
const moon = sprite(MOON, { M: '#fff4c2' }, 4, 34, 24);

// sparkle trail: copies that follow the pixie a little behind
const trail = [1, 2, 3, 4, 5].map((i) =>
  `<g class="fly" style="animation-delay:-${(LOOP - i * 0.12).toFixed(2)}s"><g class="trail" style="opacity:${(0.9 - i * 0.15).toFixed(2)}"><rect x="-1" y="${4 + i}" width="${i % 2 ? 3 : 2}" height="${i % 2 ? 3 : 2}" fill="${i % 2 ? '#ffe27a' : '#ffffff'}"/></g></g>`).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" font-family="'Segoe UI',Helvetica,Arial,sans-serif">
<title>${NAME}</title>
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="1" y2="0.4">
    <stop offset="0" stop-color="#8a74d6"/><stop offset=".5" stop-color="#d79cc4"/><stop offset="1" stop-color="#86b4e0"/>
  </linearGradient>
  <clipPath id="wave"><path d="M0 0H${W}V188C780 214 650 176 520 196S260 222 140 196 30 186 0 198Z"/></clipPath>
  <filter id="glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<style>
  .tw{animation:tw 3s ease-in-out infinite alternate}
  @keyframes tw{from{opacity:.15}to{opacity:.95}}
  .cloud{opacity:.22;animation:drift 90s linear infinite}
  @keyframes drift{from{transform:translateX(-80px)}to{transform:translateX(${W + 20}px)}}
  .fly{animation:fly ${LOOP}s ease-in-out infinite}
  @keyframes fly{${flight}}
  .wings{transform-box:fill-box;transform-origin:center;animation:flap .22s ease-in-out infinite alternate}
  @keyframes flap{to{transform:scaleY(.55)}}
  .bob{animation:bob .9s ease-in-out infinite alternate}
  @keyframes bob{to{transform:translateY(-4px)}}
  .trail{animation:tw .5s ease-in-out infinite alternate}
</style>
<g clip-path="url(#wave)">
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${clouds}
  ${stars.join('\n  ')}
  ${moon}
  <path d="M0 200C150 170 300 214 470 192S760 168 ${W} 196V${H}H0Z" fill="#ffffff" opacity=".12"/>
</g>
<text x="${W / 2}" y="112" text-anchor="middle" font-size="46" font-weight="700" fill="#5b3aa8" opacity=".55" filter="url(#glow)">${NAME}</text>
<text x="${W / 2}" y="112" text-anchor="middle" font-size="46" font-weight="700" fill="#ffffff">${NAME}</text>
<text x="${W / 2}" y="148" text-anchor="middle" font-size="18" font-weight="600" fill="#ffffff" opacity=".92" letter-spacing="1">${ROLE}</text>
${trail}
<g class="fly"><g class="bob">${pixie}</g></g>
</svg>`;

mkdirSync('assets', { recursive: true });
writeFileSync('assets/header.svg', svg);
console.log(`assets/header.svg written (${svg.length} bytes)`);
