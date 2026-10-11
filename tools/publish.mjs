// Construit et publie le profil sans course de cache.
//
// Juste après un push, raw.githubusercontent.com sert encore quelques minutes l'ancien `main` :
// une image demandée à ce moment-là reste en cache avec l'ancien contenu, même sous une adresse
// neuve. On publie donc les images d'abord, puis des README qui pointent vers ce commit précis,
// une adresse dont le contenu ne change jamais.
//
// Usage : cd tools && node publish.mjs "message du commit"

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const message = process.argv[2];
if (!message) throw new Error('Usage : node publish.mjs "message du commit"');

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const commit = (title) => git('commit', '-q', '-m', `${title}\n\n${message}`);

execFileSync('node', ['build.mjs'], { cwd: import.meta.dirname, stdio: 'inherit' });

git('add', 'assets');
if (git('diff', '--cached', '--name-only')) {
  commit('Profile images');
  git('push', '-q');
}
const sha = git('rev-parse', 'HEAD');

for (const file of ['README.md', 'README.ko.md']) {
  const path = join(ROOT, file);
  writeFileSync(path, readFileSync(path, 'utf8').replaceAll('/Ukadev-fs/Ukadev-fs/main/assets/', `/Ukadev-fs/Ukadev-fs/${sha}/assets/`));
}
git('add', '-A');
if (git('diff', '--cached', '--name-only')) {
  commit('Profile README');
  git('push', '-q');
}
console.log(`publié : images du commit ${sha.slice(0, 7)}`);
