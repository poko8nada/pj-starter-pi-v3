/**
 * consult の ref を一覧し、消してよいかを判定する。
 *
 * git を起動しない部分（`parseRefs` / `judgeRef`）と、起動を受け取る部分（`listConsultRefs`）を
 * 分けてある。判断と解釈は git 無しで試せる。
 */

export interface ConsultRef {
  readonly hash: string;
  readonly name: string;
}

/** git の起動。テストから差し替える */
export type GitRun = (args: readonly string[]) => {
  readonly status: number;
  readonly stdout: string;
  readonly stderr?: string;
};

/** consult の ref の接頭辞 */
export const REF_PREFIX = 'consult/';

/** `refs/heads/` を落とす前の、git が返す名前の頭 */
const HEADS = 'refs/heads/';

/**
 * `--format='%(objectname) %(refname)'` の出力（2 列）を一覧にする。
 * `refs/heads/` は落とさない（それは `listConsultRefs` の仕事）。
 */
export function parseRefs(output: string): ConsultRef[] {
  const refs: ConsultRef[] = [];
  for (const raw of output.split('\n')) {
    const line = raw.trim();
    if (line === '') {
      continue;
    }
    const parts = line.split(/\s+/);
    if (parts.length !== 2) {
      throw new Error(`refs: 2 列ではない行: ${JSON.stringify(line)}`);
    }
    const hash = parts[0];
    const name = parts[1];
    refs.push({ hash, name });
  }
  return refs;
}

/**
 * consult の ref を一覧する。git は `refs/heads/consult/` で絞り、名前から
 * `refs/heads/` を落として `consult/…` の形にする。
 */
export function listConsultRefs(run: GitRun): ConsultRef[] {
  const result = run([
    'for-each-ref',
    '--format=%(objectname) %(refname)',
    `${HEADS}${REF_PREFIX}`,
  ]);
  if (result.status !== 0) {
    throw new Error(`refs: git が失敗した: ${(result.stderr ?? '').trim()}`);
  }
  return parseRefs(result.stdout)
    .filter((ref) => ref.name.startsWith(`${HEADS}${REF_PREFIX}`))
    .map((ref) => ({
      hash: ref.hash,
      name: ref.name.startsWith(HEADS) ? ref.name.slice(HEADS.length) : ref.name,
    }));
}

/** 1 本の名前から、消してよいかを判定する。名前だけを見る */
export function judgeRef(name: string): { ok: true } | { ok: false; reason: string } {
  if (!name.startsWith(REF_PREFIX)) {
    return { ok: false, reason: `${REF_PREFIX} で始まらない` };
  }
  return { ok: true };
}
