/**
 * `scripts/` のテストが使う表示の印と旗。
 *
 * 何をする物か
 * - 表示行の印（`ok`、`failed`）と区画の名（`copy`、`remove`、`same`、`legacy`）と旗（`--run`、`--only`）を 1 か所に集める。
 * - 断言はここから取り、`'root: ok'` のような行を各所に書かない。道と名と件数はテストが渡した値から取る。
 *
 * どう使うか
 * - `statusLine(name, OK)` で `root: ok` の形、`countLine(COPY, n)` で `copy (n):` の形、`indented(rel)` で `  <rel>` の形を作る。
 * - `RUN_FLAG` と `ONLY_FLAG`（と `onlyEquals`）で引数を組み立てる。`INVALID_LIST_LINE` で一覧の壊れの理由を見る。
 *
 * 何をしないか
 * - 定数と小さな組み立てだけ。プロセスも FS も開かない。テストの外で読まれても、何も起きずに止まらない。
 */

/** 表示の印: 成功 */
export const OK = 'ok';

/** 表示の印: 失敗 */
export const FAILED = 'failed';

/** 区画の名: 写す物 */
export const COPY = 'copy';

/** 区画の名: 消す物 */
export const REMOVE = 'remove';

/** 区画の名: 自分自身 */
export const SAME = 'same';

/** 区画の名: 古い道 */
export const LEGACY = 'legacy';

/** 旗: 実行する */
export const RUN_FLAG = '--run';

/** 旗: 絞る */
export const ONLY_FLAG = '--only';

/** 一覧が壊れたときの理由の行 */
export const INVALID_LIST_LINE = 'the list is not valid JSON';

/** `root: ok` の形を作る */
export function statusLine(name: string, status: string): string {
  return `${name}: ${status}`;
}

/** `copy (n):` の形を作る */
export function countLine(name: string, count: number): string {
  return `${name} (${count}):`;
}

/** `  <rel>` の形を作る */
export function indented(value: string): string {
  return `  ${value}`;
}

/** `--only=<value>` の形を作る */
export function onlyEquals(value: string): string {
  return `${ONLY_FLAG}=${value}`;
}

/** `pull: <from> → <to>` の形を作る */
export function pullLine(from: string, to: string): string {
  return `pull: ${from} → ${to}`;
}

/** `push: <from> → <to>` の形を作る */
export function pushLine(from: string, to: string): string {
  return `push: ${from} → ${to}`;
}

/** `same: <target>` の形を作る */
export function sameLine(target: string): string {
  return `${SAME}: ${target}`;
}
