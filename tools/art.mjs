// Dessins animés du profil, en SVG autonome (polices intégrées, aucune ressource externe) :
// la bannière à oreilles de chat et le chat pixel qui traverse le bas du profil.

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';

/** Police Google réduite aux seuls caractères utilisés, en data URI (woff2). */
export async function font(family, weight, text) {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url, { headers: { 'user-agent': UA } })).text();
  const src = css.match(/url\((https:[^)]+)\)/)?.[1];
  if (!src) throw new Error(`police introuvable : ${family} ${weight}`);
  const data = Buffer.from(await (await fetch(src)).arrayBuffer()).toString('base64');
  return `data:font/woff2;base64,${data}`;
}

const PINK = '#ffafcc';
const BLUSH = '#ffc8dd';
const LILAC = '#cdb4db';
const PLUM = '#6d3b5e';
const HOT = '#f472b6';

const heartPath = (x, y, s) =>
  `M${x} ${y + s * 0.3}c0-${s * 0.35} ${-s * 0.5}-${s * 0.45} ${-s * 0.5}-${s * 0.05}c0 ${s * 0.3} ${s * 0.25} ${s * 0.5} ${s * 0.5} ${s * 0.7}c${s * 0.25}-${s * 0.2} ${s * 0.5}-${s * 0.4} ${s * 0.5}-${s * 0.7}c0-${s * 0.4}-${s * 0.5}-${s * 0.3}-${s * 0.5} ${s * 0.05}z`;
const sparklePath = (x, y, r) =>
  `M${x} ${y - r}Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y}Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r}Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y}Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}z`;

/** Oreille : base posée sur la pastille, pointe arrondie vers le haut. */
const ear = (cx, tilt) => {
  const outer = `M${cx - 46} 74 Q${cx - 30 + tilt} 6 ${cx + tilt} 4 Q${cx + 30 + tilt} 6 ${cx + 46} 74 Z`;
  const inner = `M${cx - 26} 66 Q${cx - 14 + tilt} 24 ${cx + tilt} 22 Q${cx + 14 + tilt} 24 ${cx + 26} 66 Z`;
  return { outer, inner };
};

export async function banner({ title, desc, descFont }) {
  const W = 830;
  const H = 222;
  const titleFont = await font('Fredoka', 600, title);
  const subFont = await font(descFont, descFont === 'Fredoka' ? 500 : 400, desc);
  const left = ear(300, -4);
  const right = ear(530, 4);

  const sparkles = [
    [70, 92, 9, 0], [150, 176, 7, 1.1], [232, 104, 6, 2.3], [610, 108, 6, 0.6],
    [690, 178, 8, 1.7], [764, 96, 10, 2.9], [118, 132, 5, 3.4], [722, 138, 5, 0.3],
  ]
    .map(([x, y, r, d]) => `<path class="tw" style="animation-delay:${d}s" d="${sparklePath(x, y, r)}"/>`)
    .join('');
  const hearts = [
    [120, 0, 7.5, '#fff'], [215, 2.4, 6.8, HOT], [330, 4.6, 8.2, '#fff'],
    [505, 1.2, 7.2, HOT], [620, 3.5, 6.5, '#fff'], [725, 5.6, 7.8, HOT],
  ]
    .map(([x, d, t, c]) => `<path class="up" fill="${c}" style="animation-delay:${d}s;animation-duration:${t}s" d="${heartPath(x, 206, 16)}"/>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${title}">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="${W}" y2="0" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="${PINK}"/><stop offset=".5" stop-color="${BLUSH}"/><stop offset="1" stop-color="${LILAC}"/>
</linearGradient>
<clipPath id="pill"><rect x="6" y="40" width="${W - 12}" height="${H - 46}" rx="64"/></clipPath>
<style>
@font-face{font-family:T;src:url(${titleFont}) format('woff2')}
@font-face{font-family:D;src:url(${subFont}) format('woff2')}
.title{font:600 76px T,'Segoe UI',sans-serif;fill:${PLUM};letter-spacing:1px}
.desc{font:${descFont === 'Fredoka' ? 500 : 400} 20px D,'Segoe UI',sans-serif;fill:#8a4f7d}
.tw{fill:#fff;transform-box:fill-box;transform-origin:center;animation:tw 2.6s ease-in-out infinite}
@keyframes tw{0%,100%{opacity:.15;transform:scale(.4) rotate(0)}50%{opacity:1;transform:scale(1) rotate(45deg)}}
.up{opacity:0;transform-box:fill-box;transform-origin:center;animation:up 7s linear infinite}
@keyframes up{0%{opacity:0;transform:translateY(0) scale(.5)}12%{opacity:.85}100%{opacity:0;transform:translateY(-150px) scale(1.1)}}
.earL,.earR{transform-box:fill-box;transform-origin:50% 100%}
.earL{animation:twitch 6s ease-in-out infinite}
.earR{animation:twitch 6s ease-in-out infinite 3.1s}
@keyframes twitch{0%,86%,100%{transform:rotate(0)}89%{transform:rotate(-9deg)}93%{transform:rotate(5deg)}96%{transform:rotate(-2deg)}}
.beat{transform-box:fill-box;transform-origin:center;animation:beat 1.6s ease-in-out infinite}
@keyframes beat{0%,40%,100%{transform:scale(1)}15%{transform:scale(1.18)}28%{transform:scale(.96)}}
.in{opacity:0;animation:in 1.2s ease-out forwards}
@keyframes in{to{opacity:1}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.up{opacity:0}.in{opacity:1}}
</style>
</defs>
<g class="in">
<g class="earL"><path d="${left.outer}" fill="url(#g)"/><path d="${left.inner}" fill="#f7a1c4"/></g>
<g class="earR"><path d="${right.outer}" fill="url(#g)"/><path d="${right.inner}" fill="#f7a1c4"/></g>
<rect x="6" y="40" width="${W - 12}" height="${H - 46}" rx="64" fill="url(#g)"/>
<g clip-path="url(#pill)">${hearts}</g>
${sparkles}
<path class="beat" fill="${HOT}" d="${heartPath(415, 52, 26)}"/>
<text class="title" x="${W / 2}" y="${H / 2 + 26}" text-anchor="middle">${title}</text>
<text class="desc" x="${W / 2}" y="${H / 2 + 68}" text-anchor="middle">${desc}</text>
</g>
</svg>
`;
}

// ── Chat pixel ──
// o contour prune · w pelage · p rose · l lilas (bout de la queue) · e yeux

const PX = { o: PLUM, w: '#fff6fa', p: '#f9a8d4', l: LILAC, e: PLUM };

const HEAD = [
  '..........o...o.',
  '.........opo.opo',
  '.........owwwwwo',
  '.........owewewo',
  '.........opwowpo',
];
const BODY = [
  '....ooooowwwwwwo',
  '...owwwwwwwwwwo.',
  '...owwwwwwwwwwo.',
  '...owwwwwwwwwwo.',
  '....oooooooooo..',
];
const LEGS_A = ['....o.o....o.o..', '...o...o..o...o.'];
const LEGS_B = ['.....oo.....oo..', '.....oo.....oo..'];
const LEGS_SIT = ['.....oo.....oo..', '................'];
const TAIL = ['ll.', 'o..', 'o..', '.o.', '..o'];
const HEART = ['.p.p.', 'ppppp', '.ppp.', '..p..'];

const rects = (rows, x0, y0, s) =>
  rows
    .flatMap((row, y) => {
      const out = [];
      for (let x = 0; x < row.length; ) {
        const c = row[x];
        let n = 1;
        while (c !== '.' && row[x + n] === c) n++;
        if (c !== '.' && PX[c]) out.push(`<rect x="${x0 + x * s}" y="${y0 + y * s}" width="${n * s}" height="${s}" fill="${PX[c]}"/>`);
        x += n;
      }
      return out;
    })
    .join('');

export function cat() {
  const W = 830;
  const H = 84;
  const s = 5;
  const top = H - 12 * s - 4;
  const x0 = 2 * s; // la queue dépasse à gauche du corps
  const sprite = (legs) => rects([...HEAD, ...BODY, ...legs], x0, top, s);
  const tail = rects(TAIL, 2 * s, top + 2 * s, s);
  // Yeux fermés : on recouvre chaque œil de pelage, puis un trait prune en bas.
  const lids = [11, 13]
    .map((c) => `<rect x="${x0 + c * s}" y="${top + 3 * s}" width="${s}" height="${s}" fill="${PX.w}"/><rect x="${x0 + c * s}" y="${top + 3.6 * s}" width="${s}" height="${s * 0.4}" fill="${PLUM}"/>`)
    .join("");
  const heart = rects(HEART, x0 + 10 * s, top - 5 * s, 4);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="A pixel cat walking by" shape-rendering="crispEdges">
<style>
.walk{animation:walk 22s linear infinite}
@keyframes walk{0%{transform:translateX(-100px)}40%,75%{transform:translateX(370px)}100%{transform:translateX(${W + 20}px)}}
.moving{animation:moving 22s steps(1,end) infinite}
@keyframes moving{0%{opacity:1}40%{opacity:0}75%{opacity:1}}
.sitting{opacity:0;animation:sitting 22s steps(1,end) infinite}
@keyframes sitting{0%{opacity:0}40%{opacity:1}75%{opacity:0}}
.a{animation:fa .5s steps(1,end) infinite}.b{animation:fb .5s steps(1,end) infinite}
@keyframes fa{0%{opacity:1}50%{opacity:0}}@keyframes fb{0%{opacity:0}50%{opacity:1}}
.tail{transform-box:fill-box;transform-origin:100% 100%;animation:wag 1.1s ease-in-out infinite alternate}
@keyframes wag{from{transform:rotate(-12deg)}to{transform:rotate(10deg)}}
.lids{opacity:0;animation:blink 22s steps(1,end) infinite}
@keyframes blink{0%{opacity:0}50%{opacity:1}51.2%{opacity:0}63%{opacity:1}64.2%{opacity:0}}
.pop{opacity:0;animation:pop 22s ease-out infinite}
@keyframes pop{0%,54%{opacity:0;transform:translateY(6px)}57%{opacity:1;transform:translateY(0)}68%{opacity:1;transform:translateY(-4px)}72%,100%{opacity:0;transform:translateY(-10px)}}
@media (prefers-reduced-motion:reduce){.walk{animation:none;transform:translateX(370px)}.moving,.lids,.pop{display:none}.sitting{opacity:1;animation:none}.tail,.a,.b{animation:none}}
</style>
<g class="walk">
<g class="tail">${tail}</g>
<g class="moving"><g class="a">${sprite(LEGS_A)}</g><g class="b">${sprite(LEGS_B)}</g></g>
<g class="sitting">${sprite(LEGS_SIT)}<g class="lids">${lids}</g><g class="pop">${heart}</g></g>
</g>
</svg>
`;
}
