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

/** 消す。git の起動は引数で受ける。終了コード非 0 なら投げる */
export function deleteRef(run: GitRun, name: string): { deleted: string } {
  const result = run(['branch', '-D', name]);
  if (result.status !== 0) {
    throw new Error(`refs: git が失敗した: ${(result.stderr ?? result.stdout).trim()}`);
  }
  return { deleted: name };
}

/** 道具が受ける操作 */
export type Action =
  | { readonly action: 'list' }
  | { readonly action: 'delete'; readonly name: string };
export type ActionResult =
  | { readonly refs: ConsultRef[] }
  | { readonly deleted: string }
  | { readonly refused: string };

/** 引数を検証して操作にする。知らない形は投げる */
export function parseAction(raw: unknown): Action {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('refs: 引数がオブジェクトではない');
  }
  const { action, name } = raw as { action?: unknown; name?: unknown };
  if (action === 'list') {
    if (name !== undefined) {
      throw new Error('refs: list に name は渡せない');
    }
    return { action: 'list' };
  }
  if (action === 'delete') {
    if (typeof name !== 'string' || name === '') {
      throw new Error('refs: delete には空でない name が要る');
    }
    return { action: 'delete', name };
  }
  throw new Error(`refs: 知らない action: ${JSON.stringify(action)}`);
}

/**
 * 操作を実行する。git の起動は引数で受ける（道具の登録から切り離し、ここでテストできる形）。
 * 消す前に判定し、拒むものは消さない。
 */
export function runAction(action: Action, run: GitRun): ActionResult {
  if (action.action === 'list') {
    return { refs: listConsultRefs(run) };
  }
  const verdict = judgeRef(action.name);
  if (!verdict.ok) {
    return { refused: verdict.reason };
  }
  return deleteRef(run, action.name);
}
