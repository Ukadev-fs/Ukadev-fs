// Ciel de Séoul : une bande animée qui suit l'heure de Séoul (nuit, aube, jour, couchant, soirée).
// Redessinée chaque heure par .github/workflows/sky.yml, publiée sur la branche `sky`.
//
// Usage : node tools/sky.mjs <dossier>   → <dossier>/sky-en.svg et sky-ko.svg pour l'heure actuelle

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { font } from './art.mjs';

const W = 830;
const H = 170;

export const seoulHour = (date = new Date()) =>
  Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', hour: 'numeric', hourCycle: 'h23' }).format(date));

const phaseOf = (h) => (h < 5 ? 'late' : h < 8 ? 'dawn' : h < 17 ? 'day' : h < 20 ? 'dusk' : 'evening');

const SKY = {
  late: { top: '#1e1533', bottom: '#46305f', ink: '#ffe4f1', dark: true },
  dawn: { top: '#ffc8dd', bottom: '#ffdcc2', ink: '#6d3b5e' },
  day: { top: '#bde0fe', bottom: '#ffd6e7', ink: '#6d3b5e' },
  dusk: { top: '#b48ccf', bottom: '#ffafcc', ink: '#fff6fa' },
  evening: { top: '#2a1d47', bottom: '#6b4c8a', ink: '#ffe4f1', dark: true },
};

const TEXT = {
  en: (h) => {
    const clock = `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;
    return {
      late: `☾ ${clock} in seouw ~ the city is asweep, zzz`,
      dawn: `☀︎ ${clock} in seouw ~ good mowning uwu`,
      day: `☀︎ ${clock} in seouw ~ sunny vibes >w<`,
      dusk: `♪ ${clock} in seouw ~ woxy's music houw`,
      evening: `☾ ${clock} in seouw ~ nyight owl houws ✧`,
    };
  },
  ko: (h) => {
    const clock = `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}시`;
    return {
      late: `☾ 서울은 ${clock} ~ 도시가 잠들었다냥 zzz`,
      dawn: `☀︎ 서울은 ${clock} ~ 좋은 아침이다냥 uwu`,
      day: `☀︎ 서울은 ${clock} ~ 햇살 가득하다냥 >w<`,
      dusk: `♪ 서울은 ${clock} ~ roxy의 음악 시간이다냥`,
      evening: `☾ 서울은 ${clock} ~ 올빼미 시간이다냥 ✧`,
    };
  },
};

/** Hasard reproductible : le même ciel d'une heure à l'autre, seuls l'astre et les couleurs bougent. */
function random(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const r1 = (n) => Math.round(n * 10) / 10;

/** Position de l'astre sur son arc : le soleil de 5 h à 20 h, la lune de 20 h à 5 h. */
function orbit(h) {
  const sun = h >= 5 && h < 20;
  const p = sun ? (h - 5 + 0.5) / 15 : (((h - 20 + 24) % 24) + 0.5) / 9;
  return { sun, x: r1(90 + p * (W - 180)), y: r1(126 - Math.sin(p * Math.PI) * 42) };
}

function stars(rand) {
  const out = [];
  for (let i = 0; i < 46; i++) {
    const x = r1(20 + rand() * (W - 40));
    const y = r1(14 + rand() * 92);
    const r = r1(0.6 + rand() * 1.4);
    out.push(`<circle class="tw" cx="${x}" cy="${y}" r="${r}" style="animation-delay:${r1(rand() * 4)}s;animation-duration:${r1(2.4 + rand() * 2.4)}s"/>`);
  }
  return `<g fill="#fff">${out.join('')}</g>`;
}

const cloud = (x, y, s) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="0" r="14"/><circle cx="16" cy="-8" r="18"/><circle cx="36" cy="-2" r="15"/><circle cx="50" cy="4" r="11"/><rect x="-6" y="0" width="62" height="14" rx="7"/></g>`;

function skyline(rand, dark) {
  const base = H - 6;
  const parts = [];
  // Namsan et la N Seoul Tower, à droite
  parts.push(`<path d="M520 ${base} Q600 ${base - 46} 690 ${base}Z"/>`);
  parts.push(`<rect x="602.5" y="${base - 98}" width="5" height="56" rx="2"/>`);
  parts.push(`<rect x="596" y="${base - 86}" width="18" height="10" rx="4"/>`);
  parts.push(`<rect x="598" y="${base - 74}" width="14" height="5" rx="2"/>`);
  parts.push(`<rect x="604.5" y="${base - 116}" width="1.6" height="20"/>`);
  // immeubles, en laissant la colline dégagée
  const windows = [];
  let x = 12;
  while (x < W - 12) {
    const w = Math.round(16 + rand() * 20);
    if (x + w > 515 && x < 695) {
      x = 696;
      continue;
    }
    const h = Math.round(16 + rand() * 46);
    parts.push(`<rect x="${x}" y="${base - h}" width="${w}" height="${h + 6}" rx="2"/>`);
    if (dark) {
      for (let wy = base - h + 5; wy < base - 4; wy += 7) {
        for (let wx = x + 3; wx < x + w - 3; wx += 6) {
          if (rand() < 0.28)
            windows.push(`<rect class="win" x="${wx}" y="${wy}" width="2.6" height="3" style="animation-delay:${r1(rand() * 9)}s"/>`);
        }
      }
    }
    x += w + Math.round(rand() * 4);
  }
  const fill = dark ? '#160e27' : '#6d3b5e';
  const opacity = dark ? 1 : 0.22;
  const beacon = dark ? `<circle class="beacon" cx="605.3" cy="${base - 117}" r="2.4" fill="#ff7aa8"/>` : '';
  return `<g fill="${fill}" opacity="${opacity}">${parts.join('')}</g><g fill="#ffd6e8">${windows.join('')}</g>${beacon}`;
}

export async function sky({ hour, lang }) {
  const phase = phaseOf(hour);
  const c = SKY[phase];
  const text = TEXT[lang](hour)[phase];
  const textFont = lang === 'ko' ? await font('Jua', 400, text) : await font('Fredoka', 600, text);
  const rand = random(20250501);
  const { sun, x, y } = orbit(hour);
  const warm = phase === 'dawn' || phase === 'dusk';

  const body = sun
    ? `<g class="spin" style="transform-origin:${x}px ${y}px">${Array.from({ length: 8 }, (_, i) => `<rect x="${x - 1.6}" y="${y - 40}" width="3.2" height="10" rx="1.6" transform="rotate(${i * 45} ${x} ${y})"/>`).join('')}</g>
<circle cx="${x}" cy="${y}" r="34" opacity=".28"/><circle cx="${x}" cy="${y}" r="22"/>`
    : `<circle cx="${x}" cy="${y}" r="30" opacity=".16"/><circle cx="${x}" cy="${y}" r="18" mask="url(#crescent)"/>`;
  const bodyFill = sun ? (warm ? '#ffd6a5' : '#fff1a8') : '#fff6d6';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(text)}">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.top}"/><stop offset="1" stop-color="${c.bottom}"/></linearGradient>
<clipPath id="win"><rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="44"/></clipPath>
<mask id="crescent"><rect width="${W}" height="${H}" fill="#fff"/><circle cx="${x + 8}" cy="${y - 5}" r="16" fill="#000"/></mask>
<style>
@font-face{font-family:T;src:url(${textFont}) format('woff2')}
.say{font:${lang === 'ko' ? 400 : 600} 22px T,'Segoe UI',sans-serif;fill:${c.ink}}
.tw{animation:tw 3s ease-in-out infinite}
@keyframes tw{0%,100%{opacity:.25}50%{opacity:1}}
.spin{animation:spin 40s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.drift{animation:drift 70s linear infinite}
@keyframes drift{from{transform:translateX(-160px)}to{transform:translateX(${W + 40}px)}}
.shoot{opacity:0;animation:shoot 9s ease-out infinite 2s}
@keyframes shoot{0%{opacity:0;transform:translate(0,0)}3%{opacity:1}10%,100%{opacity:0;transform:translate(170px,60px)}}
.win{animation:win 9s steps(1,end) infinite}
@keyframes win{0%,100%{opacity:1}37%{opacity:.25}41%{opacity:1}}
.beacon{animation:tw 1.6s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.shoot{opacity:0}}
</style>
</defs>
<g clip-path="url(#win)">
<rect width="${W}" height="${H}" fill="url(#sky)"/>
${c.dark ? stars(random(7)) : ''}
${c.dark ? `<g class="shoot"><path d="M150 26 l-46 -17" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"/></g>` : ''}
<g fill="${bodyFill}">${body}</g>
${c.dark ? '' : `<g fill="#fff" opacity="${warm ? 0.6 : 0.85}">${[[0, 98, 1], [-22, 86, 0.75], [-11, 72, 0.6]].map(([d, cy, s], i) => `<g class="drift" style="animation-delay:${d * (i + 1)}s">${cloud(0, cy, s)}</g>`).join('')}</g>`}
${skyline(rand, c.dark)}
</g>
${x < W / 2 ? `<text class="say" x="${W - 44}" y="46" text-anchor="end">${esc(text)}</text>` : `<text class="say" x="44" y="46">${esc(text)}</text>`}
</svg>
`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const dir = process.argv[2] ?? 'dist';
  mkdirSync(dir, { recursive: true });
  const hour = seoulHour();
  for (const lang of ['en', 'ko']) writeFileSync(join(dir, `sky-${lang}.svg`), await sky({ hour, lang }));
  console.log(`ciel de Séoul : ${hour} h`);
}
