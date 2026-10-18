// Affiche « nuit et jour » de la section des bots : Roxy côté nuit, Eris côté jour, séparées par
// une vague bordée de nuages. Page HTML capturée en PNG par build.mjs (une seule image pour les
// deux thèmes de GitHub : l'affiche a son propre fond).

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const side = (cls, { name, tag, chips }) => `<div class="${cls}">
  <h3>${esc(name)}</h3>
  <div class="tag">${esc(tag)}</div>
  <div class="chips">${chips.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}</div>
</div>`;

export const posterHtml = ({ roxy, eris }) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@700&family=Nunito:wght@700;800&family=Jua&display=block" rel="stylesheet">
<style>
*{box-sizing:border-box}
html,body{margin:0;background:transparent}
#poster{width:830px;height:380px;position:relative;border-radius:30px;overflow:hidden;background:linear-gradient(160deg,#211638,#5d4385);font-family:Nunito,Jua,sans-serif}
.day{position:absolute;inset:0;background:linear-gradient(200deg,#ffe0b5,#ffafcc);clip-path:path('M470 0 C430 60 520 110 450 170 C390 225 470 280 405 330 C385 350 380 365 372 380 L830 380 L830 0 Z')}
.n,.d{position:absolute;top:34px}
.n{left:38px;width:340px;color:#fbeefe}
.d{right:38px;width:300px;color:#6b2a3f;text-align:right}
h3{margin:0;font:700 54px/1 Fredoka,Jua,sans-serif}
.tag{font-weight:800;font-size:14.5px;opacity:.88;margin:8px 0 14px}
.chips{display:flex;flex-wrap:wrap;gap:7px}
.d .chips{justify-content:flex-end}
.chip{font-weight:700;font-size:13px;padding:5px 11px;border-radius:99px;white-space:nowrap}
.n .chip{background:#ffffff1f;box-shadow:inset 0 0 0 1px #ffffff2e}
.d .chip{background:#ffffffa8}
.dot{position:absolute;border-radius:50%;background:#fff}
.moon{position:absolute;left:330px;top:44px;width:46px;height:46px;border-radius:50%;box-shadow:-13px 9px 0 0 #fff4d1}
.sun{position:absolute;left:520px;top:282px;width:56px;height:56px;border-radius:50%;background:#fff3b0;box-shadow:0 0 0 10px #fff3b05c,0 0 0 22px #fff3b02e}
.cloud{position:absolute;background:#fff;border-radius:99px}
.cloud::before,.cloud::after{content:"";position:absolute;background:#fff;border-radius:50%}
.cloud::before{width:55%;height:150%;left:14%;bottom:30%}
.cloud::after{width:40%;height:120%;right:12%;bottom:35%}
</style></head><body>
<div id="poster">
  <div class="day"></div>
  <div id="stars"></div>
  <div class="cloud" style="left:452px;top:46px;width:70px;height:22px"></div>
  <div class="cloud" style="left:418px;top:200px;width:84px;height:26px"></div>
  <div class="cloud" style="left:386px;top:318px;width:64px;height:20px"></div>
  <div class="moon"></div>
  <div class="sun"></div>
  ${side('n', roxy)}
  ${side('d', eris)}
</div>
<script>
// Étoiles reproductibles, côté nuit seulement. Dans un bloc : la page de capture est réutilisée
// d’une langue à l’autre, et une 2e déclaration de seed arrêterait le script.
{
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const box = document.getElementById('stars');
for (let i = 0; i < 40; i++) {
  const d = document.createElement('div');
  const s = 1 + rnd() * 2.2;
  d.className = 'dot';
  Object.assign(d.style, { left: rnd() * 400 + 'px', top: rnd() * 380 + 'px', width: s + 'px', height: s + 'px', opacity: String(0.5 + rnd() * 0.5) });
  box.appendChild(d);
}
}
</script>
</body></html>`;
