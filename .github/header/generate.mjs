// Dreamy pixel artwork for the profile README. Run: node .github/header/generate.mjs
//   assets/header.svg     pastel night sky, twinkling stars, drifting clouds, moon and a flying pixie
//   assets/footer.svg     the same sky upside down, with the Contribution Quest knight waving from a cloud
//   assets/character.svg  an RPG character sheet: class, attributes and equipment
import { mkdirSync, writeFileSync } from 'node:fs';

const W = 900;
const NAME = 'Phuriphat Chantiuaong';
const ROLE = 'Software Engineering Student';
const FONT = `'Segoe UI',Helvetica,Arial,sans-serif`;
const MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';

// deterministic random so the files only change when the code does
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

function sprite(rows, colors, px, ox, oy) {
  let out = '';
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (colors[ch]) out += `<rect x="${ox + x * px}" y="${oy + y * px}" width="${px}" height="${px}" fill="${colors[ch]}"/>`;
  }));
  return out;
}

// ---------- shared sprites ----------

const PIXIE_BODY = [
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
const PIXIE_WINGS = [
  '............',
  'WW........WW',
  'WWW......WWW',
  'WWWW....WWWW',
  '.WWW....WWW.',
  '..WW....WW..',
];
const PIXIE_COLORS = { H: '#7b4fd6', S: '#ffd7b8', E: '#2c2547', D: '#ff8fbf', Y: '#ffe27a' };

// same knight as the Contribution Quest, with a waving arm drawn separately
const KNIGHT = [
  '...hh...',
  '..hhhh..',
  '..sese..',
  '..ssss..',
  '.aaaaa.w',
  'a.aaaa.w',
  '..aaaa.w',
  '..b..b..',
  '..b..b..',
];
const KNIGHT_COLORS = { h: '#8a5cf6', s: '#ffd7b8', e: '#2c2547', a: '#e2679a', w: '#bfe3ff', b: '#2c2547' };

const CLOUD = [
  '....XXXX........',
  '..XXXXXXXX.XXX..',
  '.XXXXXXXXXXXXXX.',
  'XXXXXXXXXXXXXXXX',
  '.XXXXXXXXXXXXXX.',
];
const MOON = [
  '..MMM...',
  '.MMM....',
  'MMM.....',
  'MMM.....',
  'MMM.....',
  '.MMM...M',
  '..MMMMM.',
];

function starField(count, h, keepClear) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const x = Math.round(rand() * (W - 20) + 10), y = Math.round(rand() * (h - 20) + 8);
    if (keepClear(x, y)) { i--; continue; }
    const big = rand() > 0.75;
    const d = (rand() * 4).toFixed(2), dur = (2 + rand() * 3).toFixed(2);
    stars.push(big
      ? `<g class="tw" style="animation-duration:${dur}s;animation-delay:-${d}s"><rect x="${x}" y="${y - 3}" width="2" height="8" fill="#fff"/><rect x="${x - 3}" y="${y}" width="8" height="2" fill="#fff"/></g>`
      : `<rect class="tw" style="animation-duration:${dur}s;animation-delay:-${d}s" x="${x}" y="${y}" width="2" height="2" fill="#fff"/>`);
  }
  return stars.join('\n  ');
}

const clouds = (rows) => rows.map(([y, px, dur, delay]) =>
  `<g class="cloud" style="animation-duration:${dur}s;animation-delay:${delay}s">${sprite(CLOUD, { X: '#ffffff' }, px, 0, y)}</g>`).join('');

const SKY_STYLE = `
  .tw{animation:tw 3s ease-in-out infinite alternate}
  @keyframes tw{from{opacity:.15}to{opacity:.95}}
  .cloud{opacity:.22;animation:drift 90s linear infinite}
  @keyframes drift{from{transform:translateX(-80px)}to{transform:translateX(${W + 20}px)}}
  .bob{animation:bob .9s ease-in-out infinite alternate}
  @keyframes bob{to{transform:translateY(-4px)}}`;

const skyGradient = (id, flip) => `<linearGradient id="${id}" x1="${flip ? 1 : 0}" y1="0" x2="${flip ? 0 : 1}" y2="0.4">
    <stop offset="0" stop-color="#8a74d6"/><stop offset=".5" stop-color="#d79cc4"/><stop offset="1" stop-color="#86b4e0"/>
  </linearGradient>`;

// ---------- header ----------

function header() {
  const H = 230, PX = 4, LOOP = 16;
  const ox = -6 * PX, oy = -5 * PX;
  const pixie = `<g class="wings">${sprite(PIXIE_WINGS, { W: '#e6f6ff' }, PX, ox, oy)}</g>${sprite(PIXIE_BODY, PIXIE_COLORS, PX, ox, oy)}`;
  // flight path loops around the title, flipping to face the direction of travel
  const PATH = [
    [70, 150, 1], [150, 62, 1], [330, 34, 1], [560, 30, 1], [780, 62, 1], [835, 140, 1],
    [835, 140, -1], [700, 178, -1], [450, 182, -1], [220, 176, -1], [70, 150, -1], [70, 150, 1],
  ];
  const flight = PATH.map(([x, y, s], i) => `${((i / (PATH.length - 1)) * 100).toFixed(2)}%{transform:translate(${x}px,${y}px) scaleX(${s})}`).join('');
  const trail = [1, 2, 3, 4, 5].map((i) =>
    `<g class="fly" style="animation-delay:-${(LOOP - i * 0.12).toFixed(2)}s"><g class="trail" style="opacity:${(0.9 - i * 0.15).toFixed(2)}"><rect x="-1" y="${4 + i}" width="${i % 2 ? 3 : 2}" height="${i % 2 ? 3 : 2}" fill="${i % 2 ? '#ffe27a' : '#ffffff'}"/></g></g>`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" font-family="${FONT}">
<title>${NAME}</title>
<defs>
  ${skyGradient('sky', false)}
  <clipPath id="wave"><path d="M0 0H${W}V188C780 214 650 176 520 196S260 222 140 196 30 186 0 198Z"/></clipPath>
  <filter id="glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<style>${SKY_STYLE}
  .fly{animation:fly ${LOOP}s ease-in-out infinite}
  @keyframes fly{${flight}}
  .wings{transform-box:fill-box;transform-origin:center;animation:flap .22s ease-in-out infinite alternate}
  @keyframes flap{to{transform:scaleY(.55)}}
  .trail{animation:tw .5s ease-in-out infinite alternate}
</style>
<g clip-path="url(#wave)">
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${clouds([[40, 4, 70, 0], [70, 3, 95, -40], [130, 5, 120, -75]])}
  ${starField(46, 183, (x, y) => x > 170 && x < 730 && y > 70 && y < 160)}
  ${sprite(MOON, { M: '#fff4c2' }, 4, 34, 24)}
  <path d="M0 200C150 170 300 214 470 192S760 168 ${W} 196V${H}H0Z" fill="#ffffff" opacity=".12"/>
</g>
<text x="${W / 2}" y="112" text-anchor="middle" font-size="46" font-weight="700" fill="#5b3aa8" opacity=".55" filter="url(#glow)">${NAME}</text>
<text x="${W / 2}" y="112" text-anchor="middle" font-size="46" font-weight="700" fill="#ffffff">${NAME}</text>
<text x="${W / 2}" y="148" text-anchor="middle" font-size="18" font-weight="600" fill="#ffffff" opacity=".92" letter-spacing="1">${ROLE}</text>
${trail}
<g class="fly"><g class="bob">${pixie}</g></g>
</svg>`;
}

// ---------- footer ----------

function footer() {
  const H = 190, PX = 5;
  const cloudX = 300, cloudY = 118;
  const knight = sprite(KNIGHT.map((r, y) => (y === 5 ? r.replace(/^a/, '.') : r)), KNIGHT_COLORS, PX, cloudX + 22, cloudY - 9 * PX + 6);
  // left arm raised and waving
  const arm = `<g class="wave"><rect x="${cloudX + 22}" y="${cloudY - 9 * PX + 6 + 3 * PX}" width="${PX}" height="${PX * 2}" fill="${KNIGHT_COLORS.a}"/><rect x="${cloudX + 22}" y="${cloudY - 9 * PX + 6 + 2 * PX}" width="${PX}" height="${PX}" fill="${KNIGHT_COLORS.s}"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" font-family="${FONT}">
<title>Thanks for visiting</title>
<defs>
  ${skyGradient('sky2', true)}
  <clipPath id="wave2"><path d="M0 ${H}H${W}V34C780 8 650 46 520 26S260 0 140 26 30 36 0 24Z"/></clipPath>
</defs>
<style>${SKY_STYLE}
  .wave{transform-box:fill-box;transform-origin:50% 100%;animation:wave .6s ease-in-out infinite alternate}
  @keyframes wave{from{transform:rotate(-25deg)}to{transform:rotate(25deg)}}
</style>
<g clip-path="url(#wave2)">
  <rect width="${W}" height="${H}" fill="url(#sky2)"/>
  <path d="M0 22C150 52 300 8 470 30S760 54 ${W} 26V0H0Z" fill="#ffffff" opacity=".12"/>
  ${clouds([[60, 3, 110, -20], [140, 4, 80, -55]])}
  ${starField(34, H, (x, y) => y < 40 || (x > 280 && x < 820 && y > 70 && y < 160))}
  <g class="bob">
    ${sprite(CLOUD, { X: '#ffffff' }, 6, cloudX - 8, cloudY)}
    ${knight}${arm}
  </g>
</g>
<text x="420" y="110" font-size="26" font-weight="700" fill="#ffffff">Thanks for visiting!</text>
<text x="420" y="138" font-size="15" font-weight="600" fill="#ffffff" opacity=".9">May your builds be green and your bugs be few.</text>
</svg>`;
}

// ---------- character sheet ----------

const STATS = [
  ['Mobile', 'React Native, Flutter', 80],
  ['Frontend', 'React, Figma', 70],
  ['Backend', 'Node.js, NestJS', 65],
  ['Languages', 'JS/TS, Java, C#, C++, Python', 70],
  ['Game Dev', 'Unity', 45],
  ['Security', 'OWASP Top 10 labs', 55],
];
const EQUIPMENT = [
  ['Weapon', 'VS Code'],
  ['Shield', 'Git &amp; GitHub'],
  ['Spellbook', 'Postman'],
  ['Mount', 'Docker'],
];
const TRAITS = ['Self-Motivated', 'Continuous Learner', 'Web Developer'];

function character() {
  const H = 345, PX = 10;
  const panelW = 250;
  const barX = panelW + 190, barW = W - barX - 40;
  const rows = STATS.map(([name, detail, v], i) => {
    const y = 66 + i * 36;
    return `<text x="${panelW + 36}" y="${y + 5}" font-size="14" font-weight="700" fill="#f1ecff">${name}</text>
  <text x="${panelW + 36}" y="${y + 20}" font-size="10" fill="#9a92c0">${detail}</text>
  <rect x="${barX}" y="${y - 6}" width="${barW}" height="12" rx="6" fill="#2a2345"/>
  <rect class="grow" style="animation-delay:${(i * 0.12).toFixed(2)}s" x="${barX}" y="${y - 6}" width="${(barW * v) / 100}" height="12" rx="6" fill="url(#bar)"/>`;
  }).join('\n  ');
  const equip = EQUIPMENT.map(([slot, item], i) =>
    `<text x="${panelW + 36 + i * 150}" y="${H - 38}" font-size="10" fill="#9a92c0" letter-spacing="1">${slot.toUpperCase()}</text><text x="${panelW + 36 + i * 150}" y="${H - 22}" font-size="13" font-weight="700" fill="#ffd66b">${item}</text>`).join('');
  const traits = TRAITS.map((t, i) => `<text x="${panelW / 2}" y="${236 + i * 16}" text-anchor="middle" font-size="11" fill="#fdf4ff">✦ ${t}</text>`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" font-family="${FONT}">
<title>Character sheet</title>
<defs>
  ${skyGradient('panel', false)}
  <linearGradient id="bar" x1="0" x2="1"><stop offset="0" stop-color="#c4a8ff"/><stop offset="1" stop-color="#ff9cc5"/></linearGradient>
  <clipPath id="card"><rect width="${W}" height="${H}" rx="18"/></clipPath>
</defs>
<style>${SKY_STYLE}
  .grow{transform-box:fill-box;transform-origin:left;animation:grow 1.2s cubic-bezier(.2,.8,.2,1) both}
  @keyframes grow{from{transform:scaleX(0)}}
</style>
<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="#1d1638"/>
  <rect width="${panelW}" height="${H}" fill="url(#panel)"/>
  ${starField(14, H, (x, y) => x > panelW - 6 || (x > 60 && x < 190 && y > 40 && y < 260))}
  <g class="bob">${sprite(KNIGHT, KNIGHT_COLORS, PX, panelW / 2 - 4 * PX, 60)}</g>
  <text x="${panelW / 2}" y="40" text-anchor="middle" font-size="12" font-weight="700" fill="#ffffff" letter-spacing="2">CHARACTER</text>
  <text x="${panelW / 2}" y="190" text-anchor="middle" font-size="18" font-weight="700" fill="#ffffff">Phuriphat555</text>
  <text x="${panelW / 2}" y="210" text-anchor="middle" font-size="12" fill="#fdf4ff">Class: Software Engineer</text>
  ${traits}
  <text x="${panelW + 36}" y="38" font-size="12" font-weight="700" fill="#c4a8ff" letter-spacing="2" font-family="${MONO}">ATTRIBUTES</text>
  ${rows}
  <rect x="${panelW + 36}" y="${H - 62}" width="${W - panelW - 76}" height="1" fill="#3a3160"/>
  ${equip}
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="#c4a8ff" stroke-opacity=".35"/>
</svg>`;
}

mkdirSync('assets', { recursive: true });
for (const [file, svg] of [['header', header()], ['footer', footer()], ['character', character()]]) {
  writeFileSync(`assets/${file}.svg`, svg);
  console.log(`assets/${file}.svg written (${svg.length} bytes)`);
}
