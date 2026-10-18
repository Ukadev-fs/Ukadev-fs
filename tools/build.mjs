// Génère README.md et README.ko.md.
//
// Les blocs de texte sont rendus par GitHub (API markdown), puis photographiés en PNG
// transparents, en thème sombre et clair : le texte du profil ne se sélectionne pas.
// Seuls les widgets animés (bannière, texte tapé, streak, serpent) restent en direct.
//
// Usage : cd tools && npm install && npm run build   (il faut `gh` connecté et Chrome)
// Pour publier, passer par publish.mjs : il épingle les images à leur commit (voir ce fichier).

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { banner, cat } from './art.mjs';
import { posterHtml } from './poster.mjs';

const ROOT = join(import.meta.dirname, '..');
const RAW = 'https://raw.githubusercontent.com/Ukadev-fs/Ukadev-fs/main';
const WIDTH = 830; // largeur du README d'un profil GitHub sur ordinateur
const THEMES = ['dark', 'light'];

const enc = encodeURIComponent;
const plus = (s) => enc(s).replace(/%20/g, '+');
const plain = (s) => s.replace(/<[^>]+>/g, ' ').replace(/[*#<>"]/g, '').replace(/\s+/g, ' ').trim();

const FOOT = 'color=0:cdb4db,50:ffc8dd,100:ffafcc';

const footer = (text) =>
  `https://capsule-render.vercel.app/api?type=rounded&${FOOT}&height=90&section=footer&text=${enc(text)}&fontSize=26&fontColor=6d3b5e&fontAlignY=55`;
const typing = (font, lines) =>
  `https://readme-typing-svg.demolab.com?font=${font}&weight=600&size=22&duration=3000&pause=1000&color=F472B6&center=true&vCenter=true&width=640&lines=${lines.map(plus).join(';')}`;
const streak = (locale) => {
  const base = `https://streak-stats.demolab.com?user=Ukadev-fs${locale ? `&locale=${locale}` : ''}&hide_border=true&border_radius=18`;
  return {
    dark: `${base}&background=0D1117&stroke=4C2341&ring=F472B6&fire=F9A8D4&currStreakLabel=F9A8D4&currStreakNum=FCE7F3&sideNums=FCE7F3&sideLabels=F5C2E7&dates=B48AA8`,
    light: `${base}&background=FFF5FA&stroke=FBCFE8&ring=F472B6&fire=F472B6&currStreakLabel=DB2777&currStreakNum=6D3B5E&sideNums=6D3B5E&sideLabels=6D3B5E&dates=9D6B8E`,
  };
};
const SNAKE = 'https://raw.githubusercontent.com/Ukadev-fs/Ukadev-fs/output';
// Redessiné chaque heure par .github/workflows/sky.yml (tools/sky.mjs), sur sa propre branche.
const SKY = 'https://raw.githubusercontent.com/Ukadev-fs/Ukadev-fs/sky';
const SKILLS = 'https://skillicons.dev/icons?i=nodejs,ts,js,discordjs,sqlite,express,nextjs,docker,git,github&perline=10';

const img = (src, alt) => `<img src="${src}" alt="${alt}" />`;
// GitHub entoure chaque image d'un lien vers sa copie camo (nouvel onglet), sauf dans un <picture>.
const still = (src, alt, extra = '') => `<picture><img src="${src}"${extra} alt="${alt}" /></picture>`;
const themed = (dark, light, alt, extra = '') =>
  `<picture><source media="(prefers-color-scheme: dark)" srcset="${dark}" /><img src="${light}"${extra} alt="${alt}" /></picture>`;

// Blocs de texte figés en image. `fit` : image à la taille du texte, centrée.
const sections = (t) => [
  { id: 'lang', fit: true, md: `<p align="center">⋆ ˚｡⋆୨♡୧⋆ ˚｡⋆<br />${t.switcher}</p>` },
  {
    id: 'about',
    md: `## ${t.h.about}

<p align="center">ᯠ˶ ᯄ<br />૮₍ ˃ ⤙ ˂ ₎ა<br />${t.hello}</p>

${t.about.map((l) => `- ♡ ${l}`).join('\n')}`,
  },
  {
    id: 'bots',
    md: `## ${t.h.bots}`,
  },
  { id: 'tools', md: `## ${t.h.tools}\n\n<p align="center">${img(SKILLS, 'tools')}</p>` },
  { id: 'now', md: `## ${t.h.now}\n\n${t.now.map((l) => `- ${l}`).join('\n')}` },
  { id: 'activity', md: `## ${t.h.activity}` },
  { id: 'bye', fit: true, md: `<p align="center">⋆ ˚｡⋆୨♡୧⋆ ˚｡⋆<br />${t.bye}</p>` },
];

const en = {
  lang: 'en',
  file: 'README.md',
  banner: { title: 'ukadev', desc: '⋆ discowd bot dev ⋆ nyobiwitus ⋆', descFont: 'Fredoka' },
  other: 'https://github.com/Ukadev-fs/Ukadev-fs/blob/main/README.ko.md',
  switcher: '<b>engwish</b> ⋆ <a href="#">한국어</a>',
  font: 'Comfortaa',
  typing: ["h-hii, i'm ukadev nya~ ♡", 'i make discowd bots uwu', 'woxy ~ music fow cozy nyights ♪', 'ewis ~ coming soon to make you twain >:3'],
  h: {
    about: '˚₊‧꒰ა about me ໒꒱ ‧₊˚ nya~',
    bots: '˚₊‧꒰ა my wittwe bots ໒꒱ ‧₊˚ owo',
    tools: '˚₊‧꒰ა toows i wuv ໒꒱ ‧₊˚',
    now: '˚₊‧꒰ა wight nyow ໒꒱ ‧₊˚',
    activity: '˚₊‧꒰ა activity ໒꒱ ‧₊˚ >w<',
  },
  hello: '/づ♡ hewwo !!',
  about: [
    "h-hii~ i'm **ukadev** nya~ i make discowd bots with my team, **nyobiwitus** (˶ᵔ ᵕ ᵔ˶)",
    'i code things fow fun, and i have quite a wot of imaginyation (,,>﹏<,,)',
    'i awways want to weawn mowe, and i wuv using my bwain ✧',
    'games? way too many to pick just a few >w<',
    "music in my eaws 24/7 ♪ that's why woxy exists uwu",
    'my dweam: make woxy & ewis feew twuwy awive ♡',
  ],
  roxy: {
    name: 'roxy ♪',
    tag: 'the cawm of the evenying ☾ · pwivate',
    chips: ['🎧 youw spotify, owiginyaw sound', '💬 she tawks, with hew moods', '🌙 mood pwaywists', '🎤 wywics & fiwtews', '🎮 bwind tests'],
  },
  eris: {
    name: '⚔ eris',
    tag: 'the enyewgy of the day ☀︎ · coming soon',
    chips: ['duews & touwnyaments ⚔️', '7 swowd wanks 🗡️', 'goaws & stweaks 🏋️', 'a guiwd 🛡️', '“go eat.” 🍙'],
  },
  posterAlt: 'roxy, my private music bot, for the night, and eris, coming soon, for the day',
  now: [
    '🌷 finyishing woxy, my music bot ♪',
    '⚔️ dweaming up ewis, she comes nyext >:3',
    '🫧 buiwding the nyobiwitus website ✧',
  ],
  locale: '',
  streakAlt: 'GitHub streak',
  catAlt: 'a pixel cat walking by',
  skyAlt: 'the sky over seoul, right now',
  snakeAlt: 'A snake eating my contribution graph',
  bye: '≽^•⩊•^≼ <i>*waves pawsies*</i> ᓚ₍⑅^..^₎♡',
  footer: 'thx fow stopping by nya~ ♡',
};

const ko = {
  lang: 'ko',
  file: 'README.ko.md',
  banner: { title: 'ukadev', desc: '⋆ 디스코드 봇 개발자다냥 ⋆ nobilitus ⋆', descFont: 'Jua' },
  other: 'https://github.com/Ukadev-fs',
  switcher: '<a href="#">engwish</a> ⋆ <b>한국어</b>',
  font: 'Jua',
  typing: ['아, 안녕~ ukadev다냥 ♡', '디스코드 봇 만든다냥 uwu', 'roxy ~ 포근한 밤을 위한 음악이다냥 ♪', 'eris ~ 곧 와서 훈련시켜 줄 거다냥 >:3'],
  h: {
    about: '˚₊‧꒰ა 소개다냥 ໒꒱ ‧₊˚',
    bots: '˚₊‧꒰ა 내 쪼끄만 봇들 ໒꒱ ‧₊˚ owo',
    tools: '˚₊‧꒰ა 좋아하는 도구 ໒꒱ ‧₊˚',
    now: '˚₊‧꒰ა 요즘 하는 일 ໒꒱ ‧₊˚',
    activity: '˚₊‧꒰ა 활동 ໒꒱ ‧₊˚ >w<',
  },
  hello: '/づ♡ 안녕냥 !!',
  about: [
    '아, 안녕하세용~ **ukadev**다냥! 팀 **nobilitus**랑 디스코드 봇을 만들어용 (˶ᵔ ᵕ ᵔ˶)',
    '재미로 이것저것 코딩하구, 상상력이 엄청 풍부하다냥 (,,>﹏<,,)',
    '새로운 걸 배우는 게 늘 좋구, 머리 쓰는 걸 좋아한다냥 ✧',
    '게임? 너무 많아서 몇 개만 고를 수가 없다냥 >w<',
    '귀에는 24시간 음악이 흐른다냥 ♪ 그래서 roxy가 있는 거야 uwu',
    '꿈: roxy랑 eris가 진짜 살아 있는 것처럼 느껴지게 만들기 ♡',
  ],
  roxy: {
    name: 'roxy ♪',
    tag: '포근한 저녁의 음악 ☾ · 비공개',
    chips: ['🎧 원본 음질의 스포티파이', '💬 기분 따라 대화해준다냥', '🌙 기분 플레이리스트', '🎤 가사랑 필터', '🎮 블라인드 테스트'],
  },
  eris: {
    name: '⚔ eris',
    tag: '낮의 에너지 ☀︎ · 곧 온다냥',
    chips: ['결투랑 토너먼트 ⚔️', '검술 7단계 🗡️', '목표랑 연속 기록 🏋️', '길드 🛡️', '「가서 먹어.」 🍙'],
  },
  posterAlt: '밤을 위한 비공개 음악 봇 roxy, 낮을 위한 곧 올 eris',
  now: [
    '🌷 음악 봇 roxy 마무리하는 중이다냥 ♪',
    '⚔️ 다음은 eris, 구상하는 중이다냥 >:3',
    '🫧 nobilitus 웹사이트 만드는 중이다냥 ✧',
  ],
  locale: 'ko',
  streakAlt: 'GitHub 연속 기여',
  catAlt: '지나가는 픽셀 고양이',
  skyAlt: '지금 서울의 하늘',
  snakeAlt: '기여 그래프를 먹는 뱀',
  bye: '≽^•⩊•^≼ <i>*꾹꾹이*</i> ᓚ₍⑅^..^₎♡',
  footer: '들러줘서 고마워용 냥~ ♡',
};

const renderMarkdown = (text) =>
  execFileSync('gh', ['api', 'markdown', '-f', 'mode=gfm', '-f', 'context=Ukadev-fs/Ukadev-fs', '-f', `text=${text}`], {
    encoding: 'utf8',
  });

const pageHtml = (theme, blocks) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown-${theme}.css">
<style>
  html, body { margin: 0; background: transparent; }
  .markdown-body { background: transparent !important; box-sizing: border-box; width: ${WIDTH}px; padding: 8px 0 2px; }
  .markdown-body.fit { width: max-content; padding: 2px 12px; }
  .markdown-body .anchor { display: none; }
  .markdown-body table tr, .markdown-body table td { background: transparent !important; }
</style></head><body>
${blocks.map((b) => `<article class="markdown-body${b.fit ? ' fit' : ''}" id="s-${b.id}">${b.html}</article>`).join('\n')}
</body></html>`;

const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ deviceScaleFactor: 2, viewport: { width: WIDTH + 40, height: 1200 } });
const page = await context.newPage();

/** Écrit un dessin dans assets/ et renvoie son adresse, avec le hash pour le cache de GitHub. */
const asset = (path, content) => {
  mkdirSync(join(ROOT, 'assets', path, '..'), { recursive: true });
  writeFileSync(join(ROOT, 'assets', path), content);
  return `${RAW}/assets/${path}?v=${createHash('sha1').update(content).digest('hex').slice(0, 8)}`;
};
const catUrl = asset('cat.svg', cat());

for (const t of [en, ko]) {
  const bannerUrl = asset(`${t.lang}/banner.svg`, await banner(t.banner));
  const blocks = sections(t).map((s) => ({ ...s, html: renderMarkdown(s.md), alt: plain(s.md) }));
  const shots = {};
  mkdirSync(join(ROOT, 'assets', t.lang), { recursive: true });

  for (const theme of THEMES) {
    await page.emulateMedia({ colorScheme: theme });
    await page.setContent(pageHtml(theme, blocks), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const broken = await page.$$eval('img', (els) => els.filter((i) => !(i.complete && i.naturalWidth)).map((i) => i.src));
    if (broken.length) throw new Error(`images non chargées : ${broken.join(', ')}`);

    for (const b of blocks) {
      const name = `${b.id}-${theme}`;
      const file = join(ROOT, 'assets', t.lang, `${name}.png`);
      const el = page.locator(`#s-${b.id}`);
      await el.screenshot({ path: file, omitBackground: true });
      const box = await el.boundingBox();
      const hash = createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 8);
      shots[name] = { url: `${RAW}/assets/${t.lang}/${name}.png?v=${hash}`, width: Math.round(box.width) };
    }
  }

  // L'affiche a son propre fond : une seule image pour les deux thèmes.
  await page.setContent(posterHtml(t), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const posterFile = join(ROOT, 'assets', t.lang, 'poster.png');
  await page.locator('#poster').screenshot({ path: posterFile, omitBackground: true });
  const posterUrl = `${RAW}/assets/${t.lang}/poster.png?v=${createHash('sha1').update(readFileSync(posterFile)).digest('hex').slice(0, 8)}`;

  const shot = (id) => {
    const b = blocks.find((x) => x.id === id);
    const dark = shots[`${id}-dark`];
    const light = shots[`${id}-light`];
    return themed(dark.url, light.url, b.alt, ` width="${light.width}"`);
  };
  const s = streak(t.locale);

  const readme = `${still(bannerUrl, 'ukadev ♡', ' width="100%"')}

<p align="center"><a href="${t.other}">${shot('lang')}</a></p>

<p align="center">${still(typing(t.font, t.typing), plain(t.typing[0]))}</p>

${still(`${SKY}/sky-${t.lang}.svg`, t.skyAlt, ' width="100%"')}

${shot('about')}

${shot('bots')}

<p align="center">${still(posterUrl, t.posterAlt, ' width="830"')}</p>

${shot('tools')}

${shot('now')}

${shot('activity')}

<p align="center">${themed(s.dark, s.light, t.streakAlt)}</p>

<p align="center">${themed(`${SNAKE}/snake-dark.svg`, `${SNAKE}/snake.svg`, t.snakeAlt)}</p>

<p align="center">${shot('bye')}</p>

${still(catUrl, t.catAlt, ' width="100%"')}

${still(footer(t.footer), t.footer, ' width="100%"')}
`;
  writeFileSync(join(ROOT, t.file), readme);
  console.log(`${t.file} : ${Object.keys(shots).length} images`);
}

await browser.close();
