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
  const traits = TRAITS.map((t, i) => `<text x="${panelW / 2}" y="${254 + i * 16}" text-anchor="middle" font-size="11" fill="#fdf4ff">✦ ${t}</text>`).join('');

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
  <text x="${panelW / 2}" y="226" text-anchor="middle" font-size="12" font-weight="700" fill="#fff4c2">Guild: MFU · Year 4</text>
  ${traits}
  <text x="${panelW + 36}" y="38" font-size="12" font-weight="700" fill="#c4a8ff" letter-spacing="2" font-family="${MONO}">ATTRIBUTES</text>
  ${rows}
  <rect x="${panelW + 36}" y="${H - 62}" width="${W - panelW - 76}" height="1" fill="#3a3160"/>
  ${equip}
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="#c4a8ff" stroke-opacity=".35"/>
</svg>`;
}

// ---------- pixie at a laptop (sits beside the About Me text) ----------

function pixieLaptop() {
  const S = 260, PX = 7;
  const ox = -6 * PX, oy = -5 * PX;
  const pixie = `<g class="wings">${sprite(PIXIE_WINGS, { W: '#e6f6ff' }, PX, ox, oy)}</g>${sprite(PIXIE_BODY, PIXIE_COLORS, PX, ox, oy)}`;
  // laptop: lid, screen, code lines that type in and out, keyboard base
  const lx = 62, ly = 150, lw = 136, lh = 78;
  const code = [[0, 48, '#ff9cc5'], [1, 80, '#c4a8ff'], [2, 64, '#bfe3ff'], [3, 92, '#ffe27a'], [4, 40, '#c4a8ff'], [5, 72, '#ff9cc5']]
    .map(([i, w, col]) => `<rect class="line" style="animation-delay:${(i * 0.35).toFixed(2)}s" x="${lx + 12 + (i % 3 === 1 ? 10 : 0)}" y="${ly + 12 + i * 9}" width="${w}" height="5" fill="${col}"/>`).join('');
  const sparkles = [[34, 52], [222, 70], [210, 160], [40, 150], [128, 22], [236, 120]]
    .map(([x, y], i) => `<g class="tw" style="animation-duration:${(1.4 + i * 0.3).toFixed(1)}s;animation-delay:-${(i * 0.5).toFixed(1)}s"><rect x="${x}" y="${y - 4}" width="3" height="11" fill="#fff4c2"/><rect x="${x - 4}" y="${y}" width="11" height="3" fill="#fff4c2"/></g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
<title>A pixel pixie coding on a laptop</title>
<defs>
  <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#d79cc4" stop-opacity=".55"/><stop offset=".6" stop-color="#8a74d6" stop-opacity=".25"/><stop offset="1" stop-color="#8a74d6" stop-opacity="0"/></radialGradient>
</defs>
<style>${SKY_STYLE}
  .wings{transform-box:fill-box;transform-origin:center;animation:flap .22s ease-in-out infinite alternate}
  @keyframes flap{to{transform:scaleY(.55)}}
  .line{transform-box:fill-box;transform-origin:left;animation:type 2.1s steps(6) infinite}
  @keyframes type{0%{transform:scaleX(0)}60%,100%{transform:scaleX(1)}}
</style>
<circle cx="${S / 2}" cy="${S / 2}" r="${S / 2}" fill="url(#glow)"/>
${sparkles}
<rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" fill="#c4a8ff"/>
<rect x="${lx + 6}" y="${ly + 6}" width="${lw - 12}" height="${lh - 12}" fill="#1d1638"/>
${code}
<rect x="${lx - 18}" y="${ly + lh}" width="${lw + 36}" height="10" fill="#a98bf0"/>
<rect x="${lx - 18}" y="${ly + lh + 10}" width="${lw + 36}" height="5" fill="#7b5fd0"/>
<rect x="${lx + lw / 2 - 16}" y="${ly + lh + 2}" width="32" height="4" fill="#c4a8ff"/>
<g transform="translate(${S / 2} 92)"><g class="bob">${pixie}</g></g>
</svg>`;
}

// ---------- terminal that types out an introduction ----------

const TERMINAL = [
  ['whoami', ['Phuriphat Chantiuaong', '4th-year Software Engineering student @ Mae Fah Luang University']],
  ['cat location.txt', ['Chiang Rai, Thailand']],
  ['ls ~/skills', ['web/  mobile/  backend/  game-dev/  security/  design/']],
  ['./now.sh', ['> finishing my final year', '> building APIs with NestJS', '> making my first Unity game']],
];

function terminal() {
  const LH = 21, PAD = 22, TOP = 54;
  const lines = TERMINAL.reduce((n, [, out]) => n + 1 + out.length, 1);
  const H = TOP + lines * LH + 14;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const prompt = `<tspan fill="#ff9cc5">phuriphat@mfu</tspan><tspan fill="#9a92c0">:</tspan><tspan fill="#c4a8ff">~</tspan><tspan fill="#9a92c0">$ </tspan>`;
  let t = 0.6, row = 0;
  const out = [];
  const at = (d) => `style="animation-delay:${d.toFixed(2)}s"`;
  for (const [cmd, result] of TERMINAL) {
    const y = TOP + row * LH;
    const chars = [...cmd].map((ch, i) => `<tspan class="k" ${at(t + 0.35 + i * 0.07)}>${esc(ch)}</tspan>`).join('');
    out.push(`<text class="c" ${at(t)} x="${PAD}" y="${y}">${prompt}<tspan fill="#ffffff">${chars}</tspan></text>`);
    t += 0.35 + cmd.length * 0.07 + 0.35;
    row++;
    result.forEach((r, i) => {
      const color = i === 0 && cmd === 'whoami' ? '#ffd66b' : '#c2b9e3';
      out.push(`<text class="c" ${at(t + i * 0.12)} x="${PAD}" y="${TOP + row * LH}" fill="${color}"${i === 0 && cmd === 'whoami' ? ' font-weight="700"' : ''}>${esc(r)}</text>`);
      row++;
    });
    t += result.length * 0.12 + 0.6;
  }
  const lastY = TOP + row * LH;
  out.push(`<text class="c" ${at(t)} x="${PAD}" y="${lastY}">${prompt}<tspan class="cursor" fill="#ffffff">█</tspan></text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" font-family="${MONO}" font-size="14">
<title>whoami: Phuriphat Chantiuaong, 4th-year Software Engineering student at Mae Fah Luang University</title>
<defs>${skyGradient('bar', false)}<clipPath id="win"><rect width="${W}" height="${H}" rx="14"/></clipPath></defs>
<style>
  .c{opacity:0;animation:show .01s linear forwards}
  @keyframes show{to{opacity:1}}
  .k{fill-opacity:0;animation:key .01s linear forwards}
  @keyframes key{to{fill-opacity:1}}
  .cursor{animation:blink 1s steps(1) infinite}
  @keyframes blink{50%{opacity:0}}
</style>
<g clip-path="url(#win)">
  <rect width="${W}" height="${H}" fill="#1d1638"/>
  <rect width="${W}" height="30" fill="url(#bar)"/>
  <circle cx="20" cy="15" r="6" fill="#ff9cc5"/><circle cx="40" cy="15" r="6" fill="#ffe27a"/><circle cx="60" cy="15" r="6" fill="#bfe3ff"/>
  <text x="${W / 2}" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="#ffffff">phuriphat@mfu: ~</text>
  ${out.join('\n  ')}
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="#c4a8ff" stroke-opacity=".35"/>
</svg>`;
}

// ---------- quest board ----------

const QUESTS = {
  main: ['Graduate in Software Engineering', 'Mae Fah Luang University', 4, 4],
  active: [
    ['Build a full REST API with NestJS, from auth to deployment', 'Backend'],
    ['Finish my first playable game in Unity', 'Game Dev'],
    ['Ship a full-stack web app with React and Node.js', 'Web'],
    ['Make my first open-source contribution', 'Community'],
  ],
  done: [
    ['Ship a React Native app: Monster Hunter Info', 'Mobile'],
    ['Build a Flutter app as a team: Bento Goal App', 'Teamwork'],
    ['Take on hands-on OWASP security labs', 'Security'],
    ['Design my GitHub profile', 'Design'],
  ],
};

function questBoard() {
  const RH = 34, L = 36;
  let y = 0;
  const parts = [];
  const sectionTitle = (text, color) => {
    y += 34;
    parts.push(`<text x="${L}" y="${y}" font-size="12" font-weight="700" fill="${color}" letter-spacing="2.5" font-family="${MONO}">${text}</text>`);
    y += 8;
  };
  const tag = (x, yy, text, fg, bg) =>
    `<rect x="${x - text.length * 7 - 16}" y="${yy - 13}" width="${text.length * 7 + 16}" height="19" rx="9.5" fill="${bg}"/><text x="${x - 8}" y="${yy + 1}" text-anchor="end" font-size="10.5" font-weight="700" fill="${fg}" font-family="${MONO}">${text}</text>`;

  // main quest with a year progress bar
  const [title, where, year, of] = QUESTS.main;
  sectionTitle('★ MAIN QUEST', '#ffd66b');
  y += 10;
  parts.push(`<rect x="${L - 12}" y="${y - 4}" width="${W - 2 * L + 24}" height="66" rx="12" fill="#2a2148" stroke="#ffd66b" stroke-opacity=".45"/>`);
  parts.push(sprite(['Y.Y.Y', 'YYYYY', 'YYYYY'], { Y: '#ffd66b' }, 4, L, y + 12));
  parts.push(`<text x="${L + 32}" y="${y + 20}" font-size="17" font-weight="700" fill="#ffffff">${title}</text>`);
  parts.push(`<text x="${L + 32}" y="${y + 40}" font-size="12" fill="#c2b9e3">${where} · Year ${year} of ${of}</text>`);
  const segW = 60;
  for (let i = 0; i < of; i++) {
    const sx = W - L - of * (segW + 6) + i * (segW + 6);
    parts.push(`<rect x="${sx}" y="${y + 26}" width="${segW}" height="12" rx="3" fill="${i < year - 1 ? '#ffd66b' : '#3a3160'}"/>`);
    if (i === year - 1) parts.push(`<rect class="shine" x="${sx}" y="${y + 26}" width="${segW}" height="12" rx="3" fill="#ffd66b"/>`);
  }
  parts.push(`<text x="${W - L}" y="${y + 16}" text-anchor="end" font-size="10.5" font-weight="700" fill="#ffd66b" font-family="${MONO}">FINAL YEAR</text>`);
  y += 66;

  sectionTitle('◆ ACTIVE QUESTS', '#ff9cc5');
  QUESTS.active.forEach(([q, kind], i) => {
    y += RH;
    parts.push(`<g class="pulse" style="animation-delay:-${(i * 0.4).toFixed(1)}s"><rect x="${L + 4}" y="${y - 13}" width="12" height="12" transform="rotate(45 ${L + 10} ${y - 7})" fill="none" stroke="#ff9cc5" stroke-width="2"/></g>`);
    parts.push(`<text x="${L + 32}" y="${y - 2}" font-size="14.5" fill="#f1ecff">${q}</text>`);
    parts.push(tag(W - L - 120, y - 2, kind.toUpperCase(), '#c4a8ff', '#2a2345'));
    parts.push(tag(W - L, y - 2, 'IN PROGRESS', '#1d1638', '#ff9cc5'));
  });

  sectionTitle('✓ COMPLETED', '#9fe3c4');
  QUESTS.done.forEach(([q, kind]) => {
    y += RH;
    parts.push(sprite(['.....G', '....GG', 'G..GG.', 'GGGG..', '.GG...'], { G: '#9fe3c4' }, 3, L + 1, y - 15));
    parts.push(`<text x="${L + 32}" y="${y - 2}" font-size="14.5" fill="#c2b9e3">${q}</text>`);
    parts.push(tag(W - L - 120, y - 2, kind.toUpperCase(), '#c4a8ff', '#2a2345'));
    parts.push(tag(W - L, y - 2, 'CLEAR', '#1d1638', '#9fe3c4'));
  });
  const H = y + 26;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" font-family="${FONT}">
<title>Quest log</title>
<defs><clipPath id="qb"><rect width="${W}" height="${H}" rx="18"/></clipPath>
  <linearGradient id="qbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#211a3d"/><stop offset="1" stop-color="#1a1530"/></linearGradient></defs>
<style>
  .pulse{animation:pulse 1.6s ease-in-out infinite alternate}
  @keyframes pulse{from{opacity:.35}to{opacity:1}}
  .shine{animation:shine 1.4s ease-in-out infinite alternate}
  @keyframes shine{from{opacity:.25}to{opacity:1}}
</style>
<g clip-path="url(#qb)"><rect width="${W}" height="${H}" fill="url(#qbg)"/>${starField(10, H, (x, y) => x > 40 && x < W - 40)}</g>
${parts.join('\n')}
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="#c4a8ff" stroke-opacity=".35"/>
</svg>`;
}

// ---------- inventory (tech stack) ----------

const INVENTORY = [
  [['Languages', 'LEGENDARY', '#ffd66b', [['js', 'JavaScript'], ['ts', 'TypeScript'], ['py', 'Python'], ['java', 'Java'], ['cs', 'C#'], ['cpp', 'C++'], ['dart', 'Dart']]]],
  [
    ['Web, Mobile &amp; Design', 'EPIC', '#c4a8ff', [['react', 'React'], ['flutter', 'Flutter'], ['figma', 'Figma']]],
    ['Backend', 'RARE', '#8fc7ff', [['nodejs', 'Node.js'], ['nestjs', 'NestJS']]],
    ['Game Dev', 'MYTHIC', '#ff9cc5', [['unity', 'Unity']]],
  ],
  [['Tools', 'TRUSTY', '#9fe3c4', [['git', 'Git'], ['github', 'GitHub'], ['gitlab', 'GitLab'], ['vscode', 'VS Code'], ['postman', 'Postman'], ['docker', 'Docker']]]],
];
const PASSIVES = ['Web Development', 'Self-Motivated', 'Continuous Learner'];

async function inventory() {
  const icons = {};
  for (const id of INVENTORY.flat().flatMap((b) => b[3].map((s) => s[0]))) {
    const svg = await (await fetch(`https://skillicons.dev/icons?i=${id}`)).text();
    icons[id] = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
  const SLOT = 64, PITCH = 82, GAP = 44, ROWH = 142;
  const parts = [];
  let y = 26;
  INVENTORY.forEach((row, r) => {
    const widths = row.map((b) => Math.max(150, b[3].length * PITCH - (PITCH - SLOT)));
    let x = (W - (widths.reduce((a, b) => a + b, 0) + GAP * (row.length - 1))) / 2;
    row.forEach(([name, rarity, color, items], b) => {
      parts.push(`<text x="${x}" y="${y + 14}" font-size="13" font-weight="700" fill="#f1ecff">${name}</text>`);
      parts.push(`<text x="${x + widths[b]}" y="${y + 14}" text-anchor="end" font-size="9.5" font-weight="700" fill="${color}" letter-spacing="1.5" font-family="${MONO}">${rarity}</text>`);
      items.forEach(([id, label], i) => {
        const sx = x + (widths[b] - (items.length * PITCH - (PITCH - SLOT))) / 2 + i * PITCH, sy = y + 26;
        parts.push(`<g class="slot" style="animation-delay:-${((r * 7 + b * 3 + i) * 0.37).toFixed(2)}s">
  <rect x="${sx}" y="${sy}" width="${SLOT}" height="${SLOT}" rx="10" fill="#2a2345" stroke="${color}" stroke-opacity=".7" stroke-width="1.5"/>
  <rect x="${sx + 4}" y="${sy + 4}" width="${SLOT - 8}" height="${SLOT - 8}" rx="7" fill="${color}" fill-opacity=".08"/>
  <image href="${icons[id]}" x="${sx + 10}" y="${sy + 10}" width="${SLOT - 20}" height="${SLOT - 20}"/>
</g>`);
        parts.push(`<text x="${sx + SLOT / 2}" y="${sy + SLOT + 18}" text-anchor="middle" font-size="11" fill="#c2b9e3">${label}</text>`);
      });
      x += widths[b] + GAP;
    });
    y += ROWH;
  });
  // passive skills
  y += 6;
  parts.push(`<text x="${W / 2}" y="${y}" text-anchor="middle" font-size="12" font-weight="700" fill="#ffd66b" letter-spacing="2.5" font-family="${MONO}">PASSIVE SKILLS</text>`);
  const chipW = PASSIVES.map((p) => p.length * 7.4 + 40);
  let cx = (W - chipW.reduce((a, b) => a + b, 0) - 14 * (PASSIVES.length - 1)) / 2;
  const chipColors = ['#c4a8ff', '#ff9cc5', '#8fc7ff'];
  PASSIVES.forEach((p, i) => {
    parts.push(`<rect x="${cx}" y="${y + 14}" width="${chipW[i]}" height="28" rx="14" fill="${chipColors[i]}" fill-opacity=".16" stroke="${chipColors[i]}" stroke-opacity=".6"/>`);
    parts.push(`<text x="${cx + chipW[i] / 2}" y="${y + 32}" text-anchor="middle" font-size="12.5" font-weight="700" fill="${chipColors[i]}">✦ ${p}</text>`);
    cx += chipW[i] + 14;
  });
  const H = y + 62;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="100%" font-family="${FONT}">
<title>Inventory: languages, frameworks, tools and passive skills</title>
<defs><clipPath id="inv"><rect width="${W}" height="${H}" rx="18"/></clipPath>
  <linearGradient id="ibg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#211a3d"/><stop offset="1" stop-color="#1a1530"/></linearGradient></defs>
<style>
  .slot{animation:float 2.6s ease-in-out infinite alternate}
  @keyframes float{from{transform:translateY(0)}to{transform:translateY(-3px)}}
</style>
<g clip-path="url(#inv)"><rect width="${W}" height="${H}" fill="url(#ibg)"/></g>
${parts.join('\n')}
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="#c4a8ff" stroke-opacity=".35"/>
</svg>`;
}

// ---------- divider ----------

function divider() {
  const H = 28, cy = H / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%">
<defs><linearGradient id="dl" x1="0" x2="1"><stop offset="0" stop-color="#c4a8ff" stop-opacity="0"/><stop offset=".3" stop-color="#c4a8ff"/><stop offset=".5" stop-color="#ff9cc5"/><stop offset=".7" stop-color="#8fc7ff"/><stop offset="1" stop-color="#8fc7ff" stop-opacity="0"/></linearGradient></defs>
<style>.tw{animation:tw 1.6s ease-in-out infinite alternate}@keyframes tw{from{opacity:.3}to{opacity:1}}</style>
<rect x="0" y="${cy - 1}" width="${W / 2 - 34}" height="2" fill="url(#dl)"/>
<rect x="${W / 2 + 34}" y="${cy - 1}" width="${W / 2 - 34}" height="2" fill="url(#dl)"/>
<rect x="${W / 2 - 26}" y="${cy - 2}" width="4" height="4" fill="#c4a8ff"/>
<rect x="${W / 2 + 22}" y="${cy - 2}" width="4" height="4" fill="#8fc7ff"/>
<g class="tw">${sprite(['..Y..', '..Y..', 'YYYYY', '..Y..', '..Y..'], { Y: '#ffd66b' }, 3, W / 2 - 7.5, cy - 7.5)}</g>
</svg>`;
}

// ---------- project cards ----------

const PROJECTS = [
  {
    file: 'project-monster-hunter', title: 'Monster Hunter Info', tag: 'SOLO · FINAL PROJECT', color: '#c4a8ff',
    lines: ['A companion app that keeps Monster', 'Hunter game info one tap away.'],
    chips: ['React Native', 'Expo', 'TypeScript'],
    icon: ['.PPPPP.', '.PSSSP.', '.PSSSP.', '.PSSSP.', '.PSSSP.', '.PPPPP.', '.PPYPP.'],
  },
  {
    file: 'project-bento', title: 'Bento Goal App', tag: 'TEAM PROJECT', color: '#ff9cc5',
    lines: ['Take on goals together with friends', 'and grow your avatar along the way.'],
    chips: ['Flutter', 'Riverpod', 'Dio'],
    icon: ['YYYYYYY', 'YYYYYYY', '.YYYYY.', '..YYY..', '...Y...', '..YYY..', '.PPPPP.'],
  },
  {
    file: 'project-security', title: 'Software Security Labs', tag: 'COURSEWORK', color: '#8fc7ff',
    lines: ['Break-and-defend labs on the', 'OWASP Top 10, all run in Docker.'],
    chips: ['OWASP', 'Docker', 'Python'],
    icon: ['PPPPPPP', 'PSSSSSP', 'PSSYSSP', 'PSYYYSP', '.PSSSP.', '..PSP..', '...P...'],
  },
];

function projectCard(p) {
  const CW = 300, CH = 200;
  const chipsX = [];
  let cx = 18;
  for (const c of p.chips) { chipsX.push(cx); cx += c.length * 6.6 + 22; }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CW} ${CH}" width="${CW}" height="${CH}" font-family="${FONT}">
<title>${p.title}</title>
<defs>${skyGradient('pg', false)}<clipPath id="pc"><rect width="${CW}" height="${CH}" rx="16"/></clipPath></defs>
<style>${SKY_STYLE}</style>
<g clip-path="url(#pc)">
  <rect width="${CW}" height="${CH}" fill="#1d1638"/>
  <rect width="${CW}" height="58" fill="url(#pg)"/>
  ${starField(5, 50, (x) => (x / W) * CW < 64 || (x / W) * CW > 150).replace(/x="(\d+)"/g, (m, x) => `x="${Math.round((x / W) * CW)}"`)}
  <g class="bob">${sprite(p.icon, { P: '#ffffff', S: '#1d1638', Y: '#ffd66b' }, 5, 18, 12)}</g>
  <text x="${CW - 16}" y="24" text-anchor="end" font-size="9.5" font-weight="700" fill="#ffffff" letter-spacing="1.5" font-family="${MONO}">${p.tag}</text>
</g>
<text x="18" y="86" font-size="17" font-weight="700" fill="#ffffff">${p.title}</text>
<text x="18" y="110" font-size="12.5" fill="#c2b9e3">${p.lines[0]}</text>
<text x="18" y="127" font-size="12.5" fill="#c2b9e3">${p.lines[1]}</text>
${p.chips.map((c, i) => `<rect x="${chipsX[i]}" y="142" width="${c.length * 6.6 + 14}" height="20" rx="10" fill="${p.color}" fill-opacity=".16" stroke="${p.color}" stroke-opacity=".55"/><text x="${chipsX[i] + 7}" y="156" font-size="11" font-weight="600" fill="${p.color}">${c}</text>`).join('')}
<text x="${CW - 16}" y="186" text-anchor="end" font-size="11" font-weight="700" fill="#ffd66b" font-family="${MONO}">VIEW REPO →</text>
<rect x=".5" y=".5" width="${CW - 1}" height="${CH - 1}" rx="16" fill="none" stroke="${p.color}" stroke-opacity=".5"/>
</svg>`;
}

mkdirSync('assets', { recursive: true });
for (const [file, svg] of [['header', header()], ['footer', footer()], ['character', character()], ['pixie-laptop', pixieLaptop()], ['terminal', terminal()], ['quest-log', questBoard()], ['inventory', await inventory()], ['divider', divider()]]) {
  writeFileSync(`assets/${file}.svg`, svg);
  console.log(`assets/${file}.svg written (${svg.length} bytes)`);
}
for (const p of PROJECTS) {
  writeFileSync(`assets/${p.file}.svg`, projectCard(p));
  console.log(`assets/${p.file}.svg written`);
}
