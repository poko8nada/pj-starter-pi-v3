// すべての型チェックを回す（root とハーネス）。
// 使い方: node scripts/checks/typecheck.mjs
// 仕組み: scripts/checks/scopes.json の各所のうち tsconfig.json がある物を、
// root の tsconfig.json と合わせて tsc -p で回す
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const root = process.cwd();
const scopesFile = path.join(root, 'scripts', 'checks', 'scopes.json');

// 一覧を読む。無い / 空配列なら root だけ。JSON として読めなければ exit 1
let scopes;
try {
  scopes = JSON.parse(fs.readFileSync(scopesFile, 'utf8'));
} catch (error) {
  if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
    scopes = [];
  } else {
    console.error('the list is not valid JSON');
    process.exit(1);
  }
}
if (!Array.isArray(scopes)) {
  console.error('the list is not valid JSON');
  process.exit(1);
}

const bin = path.join(root, 'node_modules', '.bin', 'tsc');

// root は必ず回す。一覧にあっても tsconfig.json が無ければ黙って飛ばす
const places = [{ name: 'root', tsconfig: path.join(root, 'tsconfig.json') }];
for (const dir of scopes) {
  if (typeof dir !== 'string') {
    continue;
  }
  const tsconfig = path.join(root, dir, 'tsconfig.json');
  if (!fs.existsSync(tsconfig)) {
    continue;
  }
  places.push({ name: dir, tsconfig });
}

let failed = false;
for (const place of places) {
  const result = spawnSync(bin, ['-p', place.tsconfig, '--noEmit'], { stdio: 'inherit' });
  if (result.error) {
    console.error(`[typecheck] Failed to run tsc: ${result.error.message}`);
    console.log(`${place.name}: failed`);
    failed = true;
    continue;
  }
  if (result.status !== 0) {
    console.log(`${place.name}: failed`);
    failed = true;
    continue;
  }
  console.log(`${place.name}: ok`);
}

process.exit(failed ? 1 : 0);
