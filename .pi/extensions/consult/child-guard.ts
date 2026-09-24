/**
 * child-guard — 子にだけ読ませる guard。
 *
 * `consult` が子の起動引数に `-e <このファイル>` を入れる。子だけがこれを読む
 * （pi の拡張探索はディレクトリの `index.ts` なので、この名前のファイルは自動では読まれない）。
 *
 * 判定は**解決後の絶対パス**で行う。ホストの `pi-permission-system` はコマンド文字列を見るので、
 * 変数で組んだパスはすり抜けうる（2026-09-24 の実測）。こちらは実ファイルの位置で見る。
 *
 * 純関数 2 つ（`isSecretPath` / `judgeToolCall`）が判定の全部を持つ。本体はそれを返すだけ。
 */

import { realpathSync } from 'node:fs';
import { basename, isAbsolute, resolve } from 'node:path';
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

/** 秘密とみなす名前。git が無視する全部ではなく、名前で決める */
export const SECRET_NAMES = ['.env', '.envrc', '*.pem', '*.key'] as const;

/** 1 つの名前が規則に合うか。`*.x` は接尾辞、それ以外は完全一致 */
function matchesName(name: string, pattern: string): boolean {
  if (pattern.startsWith('*.')) {
    return name.endsWith(pattern.slice(1));
  }
  return name === pattern;
}

/**
 * パスが秘密を指すか。**解決後の絶対パス**で見る。
 *
 * 解決できない（存在しない・読めない）場合は、**解決前のベース名**で規則を見る。
 * bash のトークンは `cat` のような存在しない語を含むので、それを全部止めると子が凍る（2026-09-24 の実演）。実体が無いものは読めないので、名前が秘密でなければ通す。
 */
export function isSecretPath(path: string, cwd: string): boolean {
  const absolute = isAbsolute(path) ? path : resolve(cwd, path);
  let name: string;
  try {
    name = basename(realpathSync(absolute));
  } catch {
    name = basename(absolute);
  }
  return SECRET_NAMES.some((pattern) => matchesName(name, pattern));
}

/**
 * シェルの引用符とエスケープを剥がす。
 * `cat .e""nv` の `.e""nv` を `.env` にする（引用符で字面を割る抜け方を塞ぐ）。
 */
export function unquote(token: string): string {
  return token.replaceAll('"', '').replaceAll("'", '').replaceAll('\\', '');
}

/** オブジェクトからキーを引く。オブジェクトでなければ undefined。キャストを使わない */
function at(value: unknown, key: string): unknown {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  for (const [k, v] of Object.entries(value)) {
    if (k === key) {
      return v;
    }
  }
  return undefined;
}

/** 文字列のキーだけを取る */
function str(value: unknown, key: string): string | undefined {
  const raw = at(value, key);
  return typeof raw === 'string' ? raw : undefined;
}

/** 引数として見るキー。道具によって名前が違う */
const PATH_KEYS = ['path', 'file_path', 'filePath', 'file'] as const;

/** 道具の入力から、パスとして見る文字列を取り出す */
function pathsFrom(name: string, input: unknown): string[] {
  if (name === 'bash') {
    const command = str(input, 'command');
    if (command === undefined) {
      return [];
    }
    return command
      .split(/\s+/)
      .map((token) => unquote(token))
      .filter((token) => token !== '' && token !== '--');
  }
  const paths: string[] = [];
  for (const key of PATH_KEYS) {
    const value = str(input, key);
    if (value !== undefined && value !== '') {
      paths.push(unquote(value));
    }
  }
  return paths;
}

/** 1 つの道具呼び出しを通すか拒むか。拒むときは「読めない」を含む文を返す */
export function judgeToolCall(
  name: string,
  input: unknown,
  cwd: string,
): { block?: true; reason?: string } {
  for (const path of pathsFrom(name, input)) {
    if (isSecretPath(path, cwd)) {
      return { block: true, reason: `読めない: ${path} は秘密として扱う（child-guard）` };
    }
  }
  return {};
}

export default function (pi: ExtensionAPI) {
  pi.on('tool_call', (event, ctx) => {
    try {
      const name = str(event, 'name') ?? str(event, 'toolName') ?? '';
      const input = at(event, 'input') ?? at(event, 'arguments');
      return judgeToolCall(name, input, ctx.cwd);
    } catch {
      // pi は投げた handler を捕まえない（止まらずに走ってしまう）。fail-closed で止める。
      return { block: true, reason: '読めない: child-guard の判定に失敗した' };
    }
  });
}
