import { statSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

/** oxfmt が扱える拡張子である（整形対象）。 */
const FORMATTABLE_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.mjs',
  '.cjs',
  '.json',
  '.jsonc',
  '.md',
  '.mdx',
  '.yaml',
  '.yml',
  '.css',
  '.html',
]);

/** oxlint --deny-warnings が扱える拡張子である。 */
const LINTABLE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mts', '.cts', '.mjs', '.cjs']);

/**
 * 対象拡張子で絞り込む。
 * 非対応の拡張子を渡すと oxfmt/oxlint が「No files found」で異常終了するため、
 * 実行前に対象を確定させておく必要がある。
 */
export function filterByExtensions(paths: readonly string[], kind: 'format' | 'lint'): string[] {
  const allowed = kind === 'format' ? FORMATTABLE_EXTENSIONS : LINTABLE_EXTENSIONS;
  return paths.filter((path) => allowed.has(extname(path).toLowerCase()));
}

/**
 * そのランの間に変わったファイルを git で調べる。
 *
 * 状態を示す文字（` M` など）だけでは足りない。すでに変更済みのファイルをさらに編集しても
 * 状態は ` M` のままのため、内容の同一性が必要である。そこで mtime と ctime とサイズで指紋を取る。
 * ctime を混ぜるのは、mtime を保つ書き換え（ツールが時刻を復元する場合）を検出するためである。
 * porcelain は追跡されていないファイルを `-uall` で個別に出し、git 管理外は出さない（ビルド成果物を含めない）。
 */

/** `git status --porcelain -z` の出力からパスを取り出す。 */
export function parseStatus(output: string): string[] {
  const paths: string[] = [];
  const fields = output.split('\0');

  for (let index = 0; index < fields.length; index += 1) {
    const entry = fields[index];
    if (entry.length < 4) {
      continue; // 空であるか、`XY path` に満たない行は跳ばす。
    }
    paths.push(entry.slice(3));

    // rename と copy は元のパスが次のフィールドに続く（X と Y のどちらかが R または C である）。
    const [x, y] = entry;
    if (x === 'R' || x === 'C' || y === 'R' || y === 'C') {
      index += 1;
    }
  }

  return paths;
}

/** パスの指紋である（更新時刻、変更時刻、サイズ）。消えたパスと読めないパスは入れない。 */
export function fingerprint(paths: readonly string[]): Map<string, string> {
  const prints = new Map<string, string>();

  for (const path of paths) {
    try {
      const stat = statSync(path, { bigint: true });
      prints.set(path, `${stat.mtimeNs}:${stat.ctimeNs}:${stat.size}`);
    } catch {
      // 対象から除外する。消えたファイルをツールに渡すと異常終了する。
    }
  }

  return prints;
}

/** 前回の指紋から新しく現れたパスと内容が変わったパスを返す。 */
export function changedSince(
  before: ReadonlyMap<string, string>,
  after: ReadonlyMap<string, string>,
): string[] {
  const changed: string[] = [];

  for (const [path, print] of after) {
    if (before.get(path) !== print) {
      changed.push(path);
    }
  }

  return changed;
}

/**
 * 未コミットのファイルの指紋を取る。git が答えられない場合は undefined を返し、
 * 呼び出し側は edit と write の記録に切り替わる。
 *
 * status のパスはリポジトリルートからの相対のため、ルートを先頭に付けて絶対パスに直す
 * （サブディレクトリから実行してもルートからの相対で返る）。
 */
export async function snapshot(
  pi: ExtensionAPI,
  cwd: string,
): Promise<Map<string, string> | undefined> {
  // --no-optional-locks: インデックスの更新でロックを取らないようにする（エージェントの git と衝突させない）。
  const status = await pi.exec(
    'git',
    ['--no-optional-locks', 'status', '--porcelain', '-z', '-uall'],
    { cwd },
  );
  if (status.code !== 0) {
    return undefined;
  }

  // ルートが取れないと status の相対パスを絶対パスに直せない。推測せずに代替手段に切り替わる。
  const root = await pi.exec('git', ['rev-parse', '--show-toplevel'], { cwd });
  if (root.code !== 0) {
    return undefined;
  }

  return fingerprint(parseStatus(status.stdout).map((path) => join(root.stdout.trim(), path)));
}
