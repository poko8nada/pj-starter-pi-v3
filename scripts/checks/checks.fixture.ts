/**
 * `scripts/checks/` のテストが使う tsc のスタブと scopes.json の書き込み。
 *
 * - `stubTsc(root)` は `node_modules/.bin/tsc` を置く。渡された `-p` を出し、`STUB_FAIL` がそのパスに含まれるときだけ exit 1 する。
 * - `writeScopes(root, scopes)` は `scripts/checks/scopes.json` を書く。
 *
 * テストの外から呼ばれても、待ち続けずに返る。
 */
import { chmodSync } from 'node:fs';
import { join } from 'node:path';
import { writeFile, writeJson } from '../../test/scripts.fixture.ts';

export function stubTsc(root: string): void {
  const stub = writeFile(
    root,
    join('node_modules', '.bin', 'tsc'),
    '#!/usr/bin/env node\n' +
      "const at = process.argv.indexOf('-p');\n" +
      'const got = at >= 0 ? (process.argv[at + 1] ?? "") : "";\n' +
      'console.log(`stub -p ${got}`);\n' +
      'const fail = process.env.STUB_FAIL ?? "";\n' +
      'if (fail !== "" && got.includes(fail)) process.exit(1);\n' +
      'process.exit(0);\n',
  );
  chmodSync(stub, 0o755);
}

export function writeScopes(root: string, scopes: readonly string[]): void {
  writeJson(root, join('scripts', 'checks', 'scopes.json'), scopes);
}
