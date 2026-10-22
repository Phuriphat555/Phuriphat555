// MMORPG contribution graph: a pixel knight walks your contribution calendar,
// slays one slime per active day, earns EXP equal to that day's contributions and levels up.
// Writes dist/mmorpg-contribution.svg (light) and dist/mmorpg-contribution-dark.svg (dark).
import { mkdirSync, writeFileSync } from 'node:fs';

const USER = process.env.GITHUB_USER || process.argv[2] || 'Phuriphat555';
const TOKEN = process.env.GITHUB_TOKEN;
const OUT = process.env.OUT_DIR || 'dist';

// ---------- data ----------

async function fromGraphQL() {
  const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{weeks{contributionDays{contributionCount weekday date}}}}}}`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'mmorpg-contribution' },
    body: JSON.stringify({ query, variables: { login: USER } }),
  });
  const json = await res.json();
  const weeks = json?.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
  if (!weeks) throw new Error('GraphQL: ' + JSON.stringify(json.errors || json).slice(0, 300));
  return weeks.flatMap((w, x) => w.contributionDays.map((d) => ({ x, y: d.weekday, count: d.contributionCount, date: d.date })));
}

async function fromPublicPage() {
  const res = await fetch(`https://github.com/users/${USER}/contributions`, { headers: { 'User-Agent': 'mmorpg-contribution' } });
  const html = await res.text();
  const counts = {};
  for (const m of html.matchAll(/for="contribution-day-component-(\d+)-(\d+)"[^>]*>([^<]+)/g)) {
    const n = /^([\d,]+) contribution/.exec(m[3].trim());
    counts[`${m[1]}-${m[2]}`] = n ? Number(n[1].replace(/,/g, '')) : 0;
  }
  const days = [];
  for (const m of html.matchAll(/data-date="([^"]+)"[^>]*id="contribution-day-component-(\d+)-(\d+)"/g)) {
    days.push({ x: Number(m[3]), y: Number(m[2]), count: counts[`${m[2]}-${m[3]}`] ?? 0, date: m[1] });
  }
  if (!days.length) throw new Error('Could not read the public contribution calendar');
  return days;
}

async function loadDays() {
  if (TOKEN) {
    try { return await fromGraphQL(); } catch (e) { console.warn(e.message, '- falling back to the public page'); }
  }
  return fromPublicPage();
}

// ---------- layout & timeline ----------

const PITCH = 15, CELL = 12, LEFT = 20, TOP = 50;
const ATTACK = 0.5;
const expNeed = (lv) => 5 + 3 * (lv - 1);

function buildTimeline(days) {
  const weeks = Math.max(...days.map((d) => d.x)) + 1;
  const W = LEFT * 2 + weeks * PITCH - 3;
  const gridH = 7 * PITCH - 3;
  const H = TOP + gridH + 46;
  const center = (d) => [LEFT + d.x * PITCH + CELL / 2, TOP + d.y * PITCH + CELL / 2];

  const max = Math.max(1, ...days.map((d) => d.count));
  const monsters = days
    .filter((d) => d.count > 0)
    .sort((a, b) => a.x - b.x || (a.x % 2 ? b.y - a.y : a.y - b.y))
    .map((d) => ({ ...d, tier: Math.min(4, Math.ceil((d.count / max) * 4)) }));

  const start = [LEFT - 16, TOP + 3 * PITCH + CELL / 2];
  const path = [{ t: 0, p: start }];
  let t = 0, pos = start, lv = 1, exp = 0;
  const expStops = [{ t: 0, v: 0 }];
  const levelUps = [];

  for (const m of monsters) {
    const p = center(m);
    const dist = Math.hypot(p[0] - pos[0], p[1] - pos[1]);
    t += Math.min(1.4, 0.2 + dist / 180);
    m.t = t;
    path.push({ t, p }, { t: t + ATTACK, p });
    const hit = t + 0.4;
    const prev = exp / expNeed(lv);
    exp += m.count;
    let leveled = false;
    while (exp >= expNeed(lv)) { exp -= expNeed(lv); lv++; leveled = true; levelUps.push({ t: hit, lv, p }); }
    expStops.push({ t: hit - 0.02, v: prev });
    if (leveled) expStops.push({ t: hit + 0.05, v: 1 }, { t: hit + 0.07, v: 0 });
    expStops.push({ t: hit + 0.2, v: exp / expNeed(lv) });
    t += ATTACK;
    pos = p;
  }
  const end = [W + 16, pos[1]];
  t += monsters.length ? Math.min(2.5, 0.3 + (end[0] - pos[0]) / 180) : 8;
  path.push({ t, p: end });
  const T = t + 1.5;
  path.push({ t: T, p: end });
  expStops.push({ t: T, v: exp / expNeed(lv) });

  const total = monsters.reduce((s, m) => s + m.count, 0);
  return { W, H, gridH, days, monsters, path, expStops, levelUps, finalLv: lv, total, T, center };
}

// ---------- drawing ----------

const PALETTES = {
  light: {
    tile: '#ece6f8', ink: '#2c2547', soft: '#7a7299', exp: '#e9b949', expTrack: '#e4dcf3',
    slime: ['#d9c6ff', '#c4a8ff', '#a77bf3', '#8a5cf6'], eye: '#2c2547', slash: '#5aa7ff', dmg: '#e2679a', lvup: '#d99a0b',
    helm: '#8a5cf6', skin: '#ffd7b8', armor: '#e2679a', sword: '#9fd3ff', boot: '#2c2547',
  },
  dark: {
    tile: '#1f1a33', ink: '#f1ecff', soft: '#9a92c0', exp: '#ffd66b', expTrack: '#2a2345',
    slime: ['#4b3a80', '#6d4fc0', '#9a77f0', '#c4a8ff'], eye: '#15122b', slash: '#bfe3ff', dmg: '#ff9cc5', lvup: '#ffd66b',
    helm: '#c4a8ff', skin: '#ffd7b8', armor: '#ff9cc5', sword: '#bfe3ff', boot: '#0d0b1a',
  },
};

// 8x9 knight, 2px per pixel: h helmet, s skin, e eye, a armor, w sword, b boots
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

function knightSprite(c) {
  const colors = { h: c.helm, s: c.skin, e: c.eye, a: c.armor, w: c.sword, b: c.boot };
  let out = '';
  KNIGHT.forEach((row, y) => [...row].forEach((ch, x) => {
    if (colors[ch]) out += `<rect x="${x * 2 - 8}" y="${y * 2 - 18}" width="2" height="2" fill="${colors[ch]}"/>`;
  }));
  return out;
}

const pct = (t, T) => Math.max(0, Math.min(100, (t / T) * 100)).toFixed(3) + '%';

function keyframes(name, stops, T) {
  const seen = new Set();
  const body = stops
    .map(([t, css]) => [pct(t, T), css])
    .filter(([p]) => (seen.has(p) ? false : seen.add(p)))
    .map(([p, css]) => `${p}{${css}}`)
    .join('');
  return `@keyframes ${name}{${body}}`;
}

function render(tl, c) {
  const { W, H, gridH, T } = tl;
  const css = [];
  const els = [];
  const anim = (cls) => `.${cls}{animation:${cls} ${T.toFixed(2)}s linear infinite}`;

  // grass tiles
  for (const d of tl.days) {
    els.push(`<rect x="${LEFT + d.x * PITCH}" y="${TOP + d.y * PITCH}" width="${CELL}" height="${CELL}" rx="3" fill="${c.tile}"/>`);
  }

  // slimes, slashes and EXP popups
  tl.monsters.forEach((m, i) => {
    const [cx, cy] = tl.center(m);
    const a = m.t;
    const col = c.slime[m.tier - 1];
    css.push(keyframes(`m${i}`, [
      [0, 'opacity:1;transform:scale(1)'], [a + 0.15, 'opacity:1;transform:scale(1)'],
      [a + 0.22, 'opacity:1;transform:scale(1.3)'], [a + 0.42, 'opacity:0;transform:scale(.2)'], [T, 'opacity:0;transform:scale(.2)'],
    ], T), anim(`m${i}`));
    els.push(`<g class="m${i} pop"><path d="M${cx - 5.5} ${cy + 5}Q${cx - 6} ${cy - 5} ${cx} ${cy - 5.5}Q${cx + 6} ${cy - 5} ${cx + 5.5} ${cy + 5}Z" fill="${col}"/><rect x="${cx - 3}" y="${cy - 1}" width="1.6" height="2" fill="${c.eye}"/><rect x="${cx + 1.4}" y="${cy - 1}" width="1.6" height="2" fill="${c.eye}"/></g>`);

    css.push(keyframes(`s${i}`, [
      [0, 'opacity:0'], [a + 0.08, 'opacity:0'], [a + 0.12, 'opacity:1'], [a + 0.32, 'opacity:0'], [T, 'opacity:0'],
    ], T), anim(`s${i}`));
    els.push(`<path class="s${i}" d="M${cx - 7} ${cy - 6}Q${cx + 2} ${cy - 3} ${cx + 6} ${cy + 7}" stroke="${c.slash}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`);

    css.push(keyframes(`d${i}`, [
      [0, 'opacity:0;transform:translateY(0)'], [a + 0.18, 'opacity:0;transform:translateY(0)'],
      [a + 0.24, 'opacity:1;transform:translateY(-2px)'], [a + 1.0, 'opacity:0;transform:translateY(-14px)'], [T, 'opacity:0;transform:translateY(-14px)'],
    ], T), anim(`d${i}`));
    els.push(`<text class="d${i}" x="${cx}" y="${cy - 9}" text-anchor="middle" font-size="9" font-weight="700" fill="${c.dmg}">+${m.count} EXP</text>`);
  });

  // LEVEL UP popups
  tl.levelUps.forEach((u, i) => {
    css.push(keyframes(`u${i}`, [
      [0, 'opacity:0;transform:translateY(0)'], [u.t, 'opacity:0;transform:translateY(0)'],
      [u.t + 0.08, 'opacity:1;transform:translateY(-4px)'], [u.t + 1.3, 'opacity:0;transform:translateY(-20px)'], [T, 'opacity:0;transform:translateY(-20px)'],
    ], T), anim(`u${i}`));
    els.push(`<text class="u${i}" x="${u.p[0]}" y="${u.p[1] - 24}" text-anchor="middle" font-size="10" font-weight="800" fill="${c.lvup}" stroke="${c.tile}" stroke-width="2.5" paint-order="stroke">LEVEL UP!</text>`);
  });

  // hero
  css.push(keyframes('hero', tl.path.map(({ t, p }) => [t, `transform:translate(${p[0].toFixed(1)}px,${p[1].toFixed(1)}px)`]), T), anim('hero'));
  css.push('@keyframes bob{to{transform:translateY(-1.5px)}}.bob{animation:bob .3s ease-in-out infinite alternate}');
  els.push(`<g class="hero"><g class="bob"><ellipse cx="0" cy="1" rx="6" ry="1.6" fill="${c.ink}" opacity=".18"/>${knightSprite(c)}</g></g>`);

  // HUD: name, animated level, totals
  const lvStarts = [0, ...tl.levelUps.map((u) => u.t)];
  const hud = [];
  lvStarts.forEach((s, k) => {
    const e = lvStarts[k + 1];
    const stops = k === 0 ? [[0, 'opacity:1']] : [[0, 'opacity:0'], [s - 0.01, 'opacity:0'], [s, 'opacity:1']];
    if (e !== undefined) stops.push([e - 0.01, 'opacity:1'], [e, 'opacity:0'], [T, 'opacity:0']);
    else stops.push([T, 'opacity:1']);
    css.push(keyframes(`l${k}`, stops, T), anim(`l${k}`));
    hud.push(`<text class="l${k}" x="${LEFT + 8 * USER.length + 14}" y="24" font-size="13" font-weight="700" fill="${c.lvup}">Lv. ${k + 1}</text>`);
  });

  // EXP bar
  const barX = LEFT + 30, barY = TOP + gridH + 20, barW = W - LEFT - barX;
  css.push(keyframes('xp', tl.expStops.map(({ t, v }) => [t, `transform:scaleX(${v.toFixed(3)})`]), T), anim('xp'));

  const font = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${font}">
<title>${USER} contribution MMORPG</title>
<style>.pop{transform-box:fill-box;transform-origin:center}.xpfill{transform-box:fill-box;transform-origin:left}${css.join('')}</style>
<text x="${LEFT}" y="24" font-size="13" font-weight="700" fill="${c.ink}">${USER}</text>
${hud.join('\n')}
<text x="${W - LEFT}" y="24" text-anchor="end" font-size="11" fill="${c.soft}">${tl.total} EXP · ${tl.monsters.length} slimes in the last year</text>
${els.join('\n')}
<text x="${LEFT}" y="${barY + 7}" font-size="9" font-weight="700" fill="${c.soft}">EXP</text>
<rect x="${barX}" y="${barY}" width="${barW}" height="8" rx="4" fill="${c.expTrack}"/>
<rect class="xp xpfill" x="${barX}" y="${barY}" width="${barW}" height="8" rx="4" fill="${c.exp}"/>
</svg>`;
}

// ---------- weekly activity chart ----------

function renderActivity(days, c) {
  const W = 860, H = 240, L = 44, R = 20, T = 46, B = 40;
  const weeks = [];
  for (const d of days) {
    weeks[d.x] ??= { total: 0, date: d.date };
    weeks[d.x].total += d.count;
  }
  const max = Math.max(4, ...weeks.map((w) => w.total));
  const step = Math.ceil(max / 4);
  const top = step * 4;
  const x = (i) => L + (i * (W - L - R)) / (weeks.length - 1);
  const y = (v) => T + (H - T - B) * (1 - v / top);
  const pts = weeks.map((w, i) => [x(i), y(w.total)]);
  const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join('');
  const area = `${line}L${x(weeks.length - 1).toFixed(1)} ${y(0)}L${L} ${y(0)}Z`;

  const grid = [0, 1, 2, 3, 4].map((k) => {
    const v = k * step, gy = y(v).toFixed(1);
    return `<line x1="${L}" x2="${W - R}" y1="${gy}" y2="${gy}" stroke="${c.soft}" stroke-opacity="${k ? 0.18 : 0.4}"/><text x="${L - 8}" y="${Number(gy) + 4}" text-anchor="end" font-size="10" fill="${c.soft}">${v}</text>`;
  }).join('');
  const months = [];
  let last = '';
  weeks.forEach((w, i) => {
    const m = new Date(w.date + 'T00:00:00Z').toLocaleString('en', { month: 'short', timeZone: 'UTC' });
    if (m !== last && i > 0 && i < weeks.length - 2) months.push(`<text x="${x(i).toFixed(1)}" y="${H - B + 18}" text-anchor="middle" font-size="10" fill="${c.soft}">${m}</text>`);
    last = m;
  });
  const peak = weeks.reduce((b, w, i) => (w.total > weeks[b].total ? i : b), 0);
  const total = weeks.reduce((s, w) => s + w.total, 0);
  const dots = pts.map(([px, py], i) => (weeks[i].total ? `<rect x="${(px - 2).toFixed(1)}" y="${(py - 2).toFixed(1)}" width="4" height="4" fill="${c.exp}"/>` : '')).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace">
<title>${USER} weekly contributions</title>
<defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.slime[2]}" stop-opacity=".55"/><stop offset="1" stop-color="${c.slime[2]}" stop-opacity="0"/></linearGradient></defs>
<style>.draw{stroke-dasharray:4000;stroke-dashoffset:4000;animation:draw 2.4s ease-out forwards}@keyframes draw{to{stroke-dashoffset:0}}.fade{opacity:0;animation:fade .8s ease-out 1.4s forwards}@keyframes fade{to{opacity:1}}</style>
<text x="${L}" y="22" font-size="13" font-weight="700" fill="${c.ink}">Weekly contributions</text>
<text x="${W - R}" y="22" text-anchor="end" font-size="11" fill="${c.soft}">${total} in the last year · best week ${weeks[peak].total}</text>
${grid}
${months.join('')}
<path class="fade" d="${area}" fill="url(#fill)"/>
<path class="draw" d="${line}" fill="none" stroke="${c.dmg}" stroke-width="2" stroke-linejoin="round"/>
<g class="fade">${dots}</g>
</svg>`;
}

// ---------- main ----------

const days = await loadDays();
const tl = buildTimeline(days);
mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/mmorpg-contribution.svg`, render(tl, PALETTES.light));
writeFileSync(`${OUT}/mmorpg-contribution-dark.svg`, render(tl, PALETTES.dark));
writeFileSync(`${OUT}/activity.svg`, renderActivity(days, PALETTES.light));
writeFileSync(`${OUT}/activity-dark.svg`, renderActivity(days, PALETTES.dark));
console.log(`${USER}: ${tl.monsters.length} slimes, ${tl.total} EXP, reached Lv. ${tl.finalLv}, loop ${tl.T.toFixed(1)}s`);
