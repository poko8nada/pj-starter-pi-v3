/**
 * child-guard — 子にだけ読ませる guard。
 *
 * `consult` が子の起動引数に `-e <このファイル>` を入れる。子だけがこれを読む
 * （pi の拡張探索はディレクトリの `index.ts` なので、この名前のファイルは自動では読まれない）。
 *
 * 判定は**解決後の絶対パス**で行う。bash のトークンは先に変数展開する。
 * `$VAR` / `${VAR}` は `process.env` から引く（未定義は空。bash と同じ）。
 * 展開しても `$` や backtick が残るトークン（`$(...)`、`$((...))`、`$'...'`、`$1`、`$?`、`${X:-default}`）
 * は、中身を推測せず止める。値が決まらないものを通さない（fail-closed）。
 *
 * **シェルは真似ない。** 止める側に倒すのは「値が決まらない `$`」までで、それ以外のシェルの
 * 流儀（単語分割、演算子、`~` の展開）は追わない。その線の外に残る穴が 3 つ:
 *   - `cat${IFS}.env` のような単語分割: `$IFS` を空白に割らないので `cat.env` の 1 語になる
 *   - `cat .env;ls` のような演算子の接着: `;` で語を割らないので `.env;ls` の 1 語になる
 *   - 非 bash の `path` を展開しないのに pi は `~` を展開する: `~` の先を解決できない
 *
 * このほか、同じコマンドの中で代入した変数（`FOO=.env; cat $FOO`）は guard からは分からない。
 * 本当の境界はホストの権限設定（`pi-permission-system`）と OS 側にある。
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

/**
 * 展開できないトークンに付ける印。ファイル名に NUL は入らないので、実在の名前と衝突しない。
 * この印が付いたトークンは、中身を見る前に拒む。
 */
const UNRESOLVED = '\u0000';

/**
 * シェルの変数展開。`$VAR` / `${VAR}` を `process.env` から引く（未定義は空。bash と同じ）。
 *
 * 展開しても `$` が残るトークンは「解決できなかった」として `UNRESOLVED` を付ける。`$(...)`、`$((...))`、
 * `$'...'`、`$1`、`$?`、`${X:-default}` がこれに当たる。**中身を推測しない**という規則であって、
 * たまたま `.env` に見えないから通す、ということではない。分からないものは通さない（fail-closed）。
 *
 * シェルは真似ない: ここがやるのは `$VAR` / `${VAR}` の置換だけで、単語分割や演算子は扱わない。
 *
 * 残る穴: ここが見るのは guard 自身の `process.env` だけ。同じコマンドの中で代入した
 * 変数（`FOO=.env; cat $FOO`）は分からない。本当の境界はホストの権限設定
 * （`pi-permission-system`）と OS 側にある。
 */
export function expandVars(token: string): string {
  if (token.includes('`')) {
    return UNRESOLVED + token;
  }
  const expanded = token
    .replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, name: string) => process.env[name] ?? '')
    .replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, name: string) => process.env[name] ?? '');
  return expanded.includes('$') ? UNRESOLVED + expanded : expanded;
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

/**
 * 引数として見るキー。pi の道具がパスを渡す名前は実測で `path` だけ
 * （`read` / `edit` / `write` / `ls` / `grep` / `find`。`node_modules/@earendil-works/pi-coding-agent/dist/core/tools/*.js` の schema）。
 * `bash` は `command` を別に読む。候補を推測で並べない。
 */
const PATH_KEYS = ['path'] as const;

/** 道具の入力から、パスとして見る文字列を取り出す */
function pathsFrom(name: string, input: unknown): string[] {
  if (name === 'bash') {
    const command = str(input, 'command');
    if (command === undefined) {
      return [];
    }
    return (
      command
        // シェルの単語分割と演算子は真似ない。`\s+` で割るだけなので `cat${IFS}.env` は 1 語のまま、
        // `cat .env;ls` の `;` も語を割らない（残る穴）。
        .split(/\s+/)
        // 展開を先に、引用符と `\` を剥がすのを後に。逆にすると `$'\x2eenv'` が `$x2eenv`
        // （普通の変数名）になって素通りする（2026-09-27 の検査で見つかった）。
        .map((token) => unquote(expandVars(token)))
        .filter((token) => token !== '' && token !== '--')
    );
  }
  // 非 bash の `path` は展開しない。pi は `~` を展開するので、その先は解決できない（残る穴）。
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
    if (path.includes(UNRESOLVED)) {
      return { block: true, reason: '読めない: 展開できないトークンがある（child-guard）' };
    }
    if (isSecretPath(path, cwd)) {
      return { block: true, reason: `読めない: ${path} は秘密として扱う（child-guard）` };
    }
  }
  return {};
}

export default function (pi: ExtensionAPI) {
  pi.on('tool_call', (event, ctx) => {
    try {
      // pi の `tool_call` が渡すキーは `toolName` と `input`。
      // 出所: `node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/types.d.ts` の `ToolCallEvent`
      // （`ReadToolCallEvent` は `input: { path }`、`BashToolCallEvent` は `input: { command }`）。
      // `name` / `arguments` は控え（古い名前のため）。
      const name = str(event, 'name') ?? str(event, 'toolName') ?? '';
      const input = at(event, 'input') ?? at(event, 'arguments');
      return judgeToolCall(name, input, ctx.cwd);
    } catch {
      // pi は投げた handler を捕まえない（止まらずに走ってしまう）。fail-closed で止める。
      return { block: true, reason: '読めない: child-guard の判定に失敗した' };
    }
  });
}
