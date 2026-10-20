import { statSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

/** oxfmt が扱える拡張子（整形対象） */
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

/** oxlint --deny-warnings が扱える拡張子 */
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
 * その run の間に変わったファイルを git に聞く。
 *
 * 状態の文字（` M` など）だけでは足りない。既に dirty なファイルをさらに編集しても
 * 状態は ` M` のままなので、内容の同一性が要る。そこで mtime / ctime とサイズで指紋を取る。
 * ctime を混ぜるのは、mtime を保つ書き換え（ツールが時刻を復元する場合）を拾うため。
 * porcelain は未追跡を `-uall` で個別に出し、git 管理外は出さない（ビルド成果物を拾わない）。
 */

/** `git status --porcelain -z` の出力からパスを取り出す */
export function parseStatus(output: string): string[] {
  const paths: string[] = [];
  const fields = output.split('\0');

  for (let index = 0; index < fields.length; index += 1) {
    const entry = fields[index];
    if (entry.length < 4) {
      continue; // 空か、`XY path` に満たない行
    }
    paths.push(entry.slice(3));

    // rename / copy は元のパスが次のフィールドに続く（X と Y のどちらかが R / C）
    const [x, y] = entry;
    if (x === 'R' || x === 'C' || y === 'R' || y === 'C') {
      index += 1;
    }
  }

  return paths;
}

/** パスの指紋（更新時刻・変更時刻・サイズ）。消えた、または読めないパスは入らない */
export function fingerprint(paths: readonly string[]): Map<string, string> {
  const prints = new Map<string, string>();

  for (const path of paths) {
    try {
      const stat = statSync(path, { bigint: true });
      prints.set(path, `${stat.mtimeNs}:${stat.ctimeNs}:${stat.size}`);
    } catch {
      // 対象から外す。消えたファイルをツールに渡すと異常終了する
    }
  }

  return prints;
}

/** 前回の指紋から新しく現れた、または内容が変わったパス */
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
 * 未コミットのファイルの指紋を取る。git が答えられなければ undefined を返し、
 * 呼び出し側が edit/write の記録に落ちる。
 *
 * status のパスはリポジトリルートからの相対なので、ルートを前置して絶対パスに直す
 * （サブディレクトリから実行してもルートからの相対で返る）。
 */
export async function snapshot(
  pi: ExtensionAPI,
  cwd: string,
): Promise<Map<string, string> | undefined> {
  // --no-optional-locks: 索引の更新でロックを取らせない（エージェントの git と衝突させない）
  const status = await pi.exec(
    'git',
    ['--no-optional-locks', 'status', '--porcelain', '-z', '-uall'],
    { cwd },
  );
  if (status.code !== 0) {
    return undefined;
  }

  // ルートが取れないと status の相対パスを絶対パスに直せない。推測せずに代替へ落ちる。
  const root = await pi.exec('git', ['rev-parse', '--show-toplevel'], { cwd });
  if (root.code !== 0) {
    return undefined;
  }

  return fingerprint(parseStatus(status.stdout).map((path) => join(root.stdout.trim(), path)));
}
