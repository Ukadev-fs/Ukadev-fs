// Génère README.md et README.ko.md.
//
// Les blocs de texte sont rendus par GitHub (API markdown), puis photographiés en PNG
// transparents, en thème sombre et clair : le texte du profil ne se sélectionne pas.
// Seuls les widgets animés (bannière, texte tapé, streak, serpent) restent en direct.
//
// Usage : cd tools && npm install && npm run build   (il faut `gh` connecté et Chrome)

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const ROOT = join(import.meta.dirname, '..');
const RAW = 'https://raw.githubusercontent.com/Ukadev-fs/Ukadev-fs/main';
const WIDTH = 830; // largeur du README d'un profil GitHub sur ordinateur
const THEMES = ['dark', 'light'];

const enc = encodeURIComponent;
const plus = (s) => enc(s).replace(/%20/g, '+');
// shields.io : "-" sépare label et message, "_" vaut une espace ; on les double pour les garder.
const shield = (s) => enc(s.replace(/-/g, '--').replace(/_/g, '__'));
const plain = (s) => s.replace(/<[^>]+>/g, ' ').replace(/[*#<>"]/g, '').replace(/\s+/g, ' ').trim();

const PALETTE = 'color=0:ffafcc,50:ffc8dd,100:cdb4db';
const FOOT = 'color=0:cdb4db,50:ffc8dd,100:ffafcc';

const header = (desc) =>
  `https://capsule-render.vercel.app/api?type=rounded&${PALETTE}&height=190&section=header&text=${enc('ukadev ♡')}&fontSize=66&fontColor=6d3b5e&fontAlignY=36&animation=fadeIn&desc=${enc(desc)}&descSize=17&descAlignY=58`;
const footer = (text) =>
  `https://capsule-render.vercel.app/api?type=rounded&${FOOT}&height=90&section=footer&text=${enc(text)}&fontSize=26&fontColor=6d3b5e&fontAlignY=55`;
const typing = (font, lines) =>
  `https://readme-typing-svg.demolab.com?font=${font}&weight=600&size=22&duration=3000&pause=1000&color=F472B6&center=true&vCenter=true&width=640&lines=${lines.map(plus).join(';')}`;
const badge = (label, message, color, logo, logoColor = 'white') =>
  `https://img.shields.io/badge/${label ? `${shield(label)}-` : ''}${shield(message)}-${color}?style=flat-square${logo ? `&logo=${logo}&logoColor=${logoColor}` : ''}`;
const streak = (locale) => {
  const base = `https://streak-stats.demolab.com?user=Ukadev-fs${locale ? `&locale=${locale}` : ''}&hide_border=true&border_radius=18`;
  return {
    dark: `${base}&background=0D1117&stroke=4C2341&ring=F472B6&fire=F9A8D4&currStreakLabel=F9A8D4&currStreakNum=FCE7F3&sideNums=FCE7F3&sideLabels=F5C2E7&dates=B48AA8`,
    light: `${base}&background=FFF5FA&stroke=FBCFE8&ring=F472B6&fire=F472B6&currStreakLabel=DB2777&currStreakNum=6D3B5E&sideNums=6D3B5E&sideLabels=6D3B5E&dates=9D6B8E`,
  };
};
const SNAKE = 'https://raw.githubusercontent.com/Ukadev-fs/Ukadev-fs/output';
const SKILLS = 'https://skillicons.dev/icons?i=nodejs,ts,js,discordjs,sqlite,express,nextjs,docker,git,github&perline=10';

const img = (src, alt) => `<img src="${src}" alt="${alt}" />`;
// GitHub entoure chaque image d'un lien vers sa copie camo (nouvel onglet), sauf dans un <picture>.
const still = (src, alt, extra = '') => `<picture><img src="${src}"${extra} alt="${alt}" /></picture>`;
const themed = (dark, light, alt, extra = '') =>
  `<picture><source media="(prefers-color-scheme: dark)" srcset="${dark}" /><img src="${light}"${extra} alt="${alt}" /></picture>`;

const card = ({ title, tagline, intro, items, badges }) => `    <td width="50%" valign="top">
      <h3>${title}</h3>
      <em>${tagline}</em>
      <p>${intro}</p>
      <ul>
${items.map((i) => `        <li>${i}</li>`).join('\n')}
      </ul>
${badges.map((b) => `      ${b}`).join('\n')}
    </td>`;

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
    md: `## ${t.h.bots}

<table>
  <tr>
${card(t.ego)}
${card(t.talion)}
  </tr>
</table>`,
  },
  { id: 'tools', md: `## ${t.h.tools}\n\n<p align="center">${img(SKILLS, 'tools')}</p>` },
  { id: 'now', md: `## ${t.h.now}\n\n${t.now.map((l) => `- ${l}`).join('\n')}` },
  { id: 'activity', md: `## ${t.h.activity}` },
  { id: 'bye', fit: true, md: `<p align="center">⋆ ˚｡⋆୨♡୧⋆ ˚｡⋆<br />${t.bye}</p>` },
];

const en = {
  lang: 'en',
  file: 'README.md',
  desc: '⋆ discowd bot dev ⋆ nyobiwitus ⋆',
  other: 'https://github.com/Ukadev-fs/Ukadev-fs/blob/main/README.ko.md',
  switcher: '<b>engwish</b> ⋆ <a href="#">한국어</a>',
  font: 'Comfortaa',
  typing: ["h-hii, i'm ukadev nya~ ♡", 'i make discowd bots uwu', 'ego v2 is hewe owo ✧', 'tawion ~ casinyo, econyomy & wpg >w<'],
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
    'my bots speak fwench & engwish, nya~',
    'my dweam: make tawion the #1 casinyo bot on discowd ✧ uwu',
  ],
  ego: {
    title: '🪞 ego <sup>v2 ✧ nyew !</sup>',
    tagline: 'cweaw & safe modewation >w<',
    intro: 'wewwitten fwom scwatch ~ swash commands onwy, and evewy wepwy is a nyeat wittwe cawd ♡',
    items: [
      '🛡️ anti-nyuke, anti-waid, automod pwesets & vewification on join',
      '📋 pwetty wogs, with evewy action cwedited to the wight mod uwu',
      '💾 nyightwy backups you can compawe & westowe',
      '🎀 wewcome cawds dwawn as images, wowe menyus, scheduwed annyouncements',
      '🌍 fwench ow engwish, fowwowing youw discowd wanguage nya~',
    ],
    badges: [
      img(badge('', 'TypeScwipt', '3178C6', 'typescript'), 'TypeScript'),
      img(badge('discowd.js', 'v14', '5865F2', 'discord'), 'discord.js v14'),
      img(badge('vewsion', 'v2 ✧', '8b5cf6'), 'Version 2'),
    ],
  },
  talion: {
    title: '🪙 talion',
    tagline: 'what goes awound comes awound ฅ^•ﻌ•^ฅ',
    intro: 'a casinyo, econyomy & wpg bot ~ evewy sewvew gets its own econyomy and tunyes it with <code>/config</code>',
    items: [
      '🎰 bwackjack, swots with a mystewy jackpot, wouwette, howse wacing',
      '🎭 cwiminyaw & civiw weputation, jaiw, jobs, bwack mawket, achievements',
      '🌍 fwench ow engwish, fowwowing youw discowd wanguage',
      '🔒 tawents awe 100% viwtuaw ~ nyevew bought, nyevew sowd :3',
    ],
    badges: [
      img(badge('', 'JavaScwipt', 'F7DF1E', 'javascript', 'black'), 'JavaScript'),
      img(badge('discowd.js', 'v14', '5865F2', 'discord'), 'discord.js v14'),
      img(badge('status', 'in devewopment >w<', 'f472b6'), 'Status: in development'),
    ],
  },
  now: [
    "🌷 powishing ego v2 with my fwiends' feedback uwu",
    '🫧 buiwding the nyobiwitus website: a page fow each bot, pwus aww the docs',
    '🗺️ teaching my bots mowe wanguages nya~',
  ],
  locale: '',
  streakAlt: 'GitHub streak',
  snakeAlt: 'A snake eating my contribution graph',
  bye: '≽^•⩊•^≼ <i>*waves pawsies*</i> ᓚ₍⑅^..^₎♡',
  footer: 'thx fow stopping by nya~ ♡',
};

const ko = {
  lang: 'ko',
  file: 'README.ko.md',
  desc: '⋆ 디스코드 봇 개발자다냥 ⋆ nobilitus ⋆',
  other: 'https://github.com/Ukadev-fs',
  switcher: '<a href="#">engwish</a> ⋆ <b>한국어</b>',
  font: 'Jua',
  typing: ['아, 안녕~ ukadev다냥 ♡', '디스코드 봇 만든다냥 uwu', 'ego v2 나왔다냥 owo ✧', 'talion ~ 카지노, 경제, rpg >w<'],
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
    '내 봇들은 프랑스어랑 영어를 한다냥~',
    '꿈: talion을 디스코드 1등 카지노 봇으로 만들기 ✧ 냥냥',
  ],
  ego: {
    title: '🪞 ego <sup>v2 ✧ 새거다냥!</sup>',
    tagline: '깔끔하고 안전한 모더레이션이다냥 >w<',
    intro: '처음부터 다시 만들었다냥 ~ 슬래시 명령어만 쓰구, 모든 답장은 귀여운 카드로 온다냥 ♡',
    items: [
      '🛡️ 안티 누크, 레이드 방지, AutoMod 프리셋, 입장 인증이다냥',
      '📋 예쁜 로그, 모든 조치는 진짜 모더레이터 이름으로 기록된다냥 uwu',
      '💾 매일 밤 자동 백업, 비교하구 복원할 수 있다냥',
      '🎀 이미지로 그린 환영 카드, 역할 메뉴, 예약 공지',
      '🌍 디스코드 언어에 맞춰서 프랑스어나 영어로 대답한다냥~',
    ],
    badges: [
      img(badge('', 'TypeScript', '3178C6', 'typescript'), 'TypeScript'),
      img(badge('discord.js', 'v14', '5865F2', 'discord'), 'discord.js v14'),
      img(badge('버전', 'v2 ✧', '8b5cf6'), '버전 v2'),
    ],
  },
  talion: {
    title: '🪙 talion',
    tagline: '뿌린 대로 거둔다냥 ฅ^•ﻌ•^ฅ',
    intro: '카지노, 경제, RPG 봇이다냥 ~ 서버마다 따로 경제가 있구, <code>/config</code>로 직접 설정할 수 있다냥',
    items: [
      '🎰 블랙잭, 미스터리 잭팟 슬롯머신, 룰렛, 경마',
      '🎭 범죄·시민 평판, 감옥, 직업, 암시장, 업적',
      '🌍 디스코드 언어에 맞춰서 프랑스어나 영어로 대답한다냥',
      '🔒 탤런트는 100% 가상 화폐다냥 ~ 사거나 팔 수 없어용 :3',
    ],
    badges: [
      img(badge('', 'JavaScript', 'F7DF1E', 'javascript', 'black'), 'JavaScript'),
      img(badge('discord.js', 'v14', '5865F2', 'discord'), 'discord.js v14'),
      img(badge('상태', '개발 중 >w<', 'f472b6'), '상태: 개발 중'),
    ],
  },
  now: [
    '🌷 친구들 피드백으로 ego v2 다듬는 중이다냥',
    '🫧 nobilitus 웹사이트 만드는 중: 봇별 페이지랑 문서 전부',
    '🗺️ 봇들한테 새로운 언어 가르치는 중이다냥~',
  ],
  locale: 'ko',
  streakAlt: 'GitHub 연속 기여',
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

for (const t of [en, ko]) {
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

  const shot = (id) => {
    const b = blocks.find((x) => x.id === id);
    const dark = shots[`${id}-dark`];
    const light = shots[`${id}-light`];
    return themed(dark.url, light.url, b.alt, ` width="${light.width}"`);
  };
  const s = streak(t.locale);

  const readme = `${still(header(t.desc), 'ukadev ♡', ' width="100%"')}

<p align="center"><a href="${t.other}">${shot('lang')}</a></p>

<p align="center">${still(typing(t.font, t.typing), plain(t.typing[0]))}</p>

${shot('about')}

${shot('bots')}

${shot('tools')}

${shot('now')}

${shot('activity')}

<p align="center">${themed(s.dark, s.light, t.streakAlt)}</p>

<p align="center">${themed(`${SNAKE}/snake-dark.svg`, `${SNAKE}/snake.svg`, t.snakeAlt)}</p>

<p align="center">${shot('bye')}</p>

${still(footer(t.footer), t.footer, ' width="100%"')}
`;
  writeFileSync(join(ROOT, t.file), readme);
  console.log(`${t.file} : ${Object.keys(shots).length} images`);
}

await browser.close();
