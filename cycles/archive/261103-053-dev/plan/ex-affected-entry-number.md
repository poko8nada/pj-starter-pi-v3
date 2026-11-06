# PLAN `ex-affected-entry-number`

- Place: worktree
- Boundary Plans: なし（サイクルの plan はすべて終わっている）

## Files

```text
.pi/skills/adr/scripts/
  affected.mjs            update
  cycle.mjs               update
  index.mjs               update
  index.test.ts           update
```

## Slices

## 1. 骨組みにエントリーの番号を渡す

### Types

```ts
/** 1 エントリー分の affected の骨組み。`nnn` はエントリーの番号 */
export function affectedEntrySkeleton(nnn: number): string;

/** `affected.md` の骨組み。`cycle` はサイクルの番号、`entry` は最初のエントリーの番号 */
export function affectedSkeleton(cycle: number, entry: number): string;

/** dir 名からサイクルの番号を抜く。合わなければ null */
export function cycleNumberOf(name: string): number | null;
```

### Steps

1. `.pi/skills/adr/scripts/affected.mjs`:
   - update: `affectedSkeleton(cycle, entry)` に変え、見出しの後に `affectedEntrySkeleton(entry)` を書く。
2. `.pi/skills/adr/scripts/cycle.mjs`:
   - update: 私的な `extractNNN` を `cycleNumberOf` として出し、`openCycleDir` と `nextNNN` もそれを使う。
3. `.pi/skills/adr/scripts/index.mjs`:
   - update: 開いたサイクルで `affected.md` がない分岐を、`cycleNumberOf` でサイクルの番号を取り、`affectedSkeleton(cycle, next)` を書く形に直す。
   - update: 新しいサイクルの作成を `affectedSkeleton(nnn, 1)` に直す。
4. `.pi/skills/adr/scripts/index.test.ts`:
   - update: `affectedSkeleton` の検査を新しい引数に合わせ、開いたサイクルで `affected.md` がない場合に `## 03:` が書かれる検査を足す。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n 'affectedSkeleton' .pi/skills/adr/scripts/affected.mjs .pi/skills/adr/scripts/index.mjs`
  - 変更した全ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。ダメなら直し、`Unplanned` に書く。
- Added: なし

## Notes

### Slice 1: 骨組みにエントリーの番号を渡す

- Findings: なし
- Unplanned: なし
- Commit: d908c99
- Stopped: なし

## Work Review

### Round 1

- Stale: なし — JSDoc は `.pi/skills/adr/scripts/affected.mjs:41` と `.pi/skills/adr/scripts/cycle.mjs:82` で新引数・新名前に直され、旧1引数の呼び出しは `.pi/skills/adr/scripts/index.test.ts:305,307,390` で新2引数に直っており、`references/` に `affectedSkeleton` の記述はなく、履歴の旧署名 (`cycles/261103-053-dev/plan/adr-affected.md:119`、`cycles/261103-053-dev/close.md:57`) は記録として残すもののため古くなる文書・コメント・検査は無いことを確かめた。
- Unlisted: なし — 差分の4件は `## Files` の4件と一致し、`.pi/skills/adr/scripts/index.mjs:7,17,50` の `basename` 追加・`cycleNumberOf` 導入・番号取り出しと `.pi/skills/adr/scripts/index.mjs:51` の throw は `Steps` の「番号を取り `affectedSkeleton(cycle, next)` を書く」の同一ファイル内の実装であり、Files 外の変更は無いことを確かめた。
- Gaps: 新規サイクル作成で `.pi/skills/adr/scripts/index.mjs:84` が書く `affectedSkeleton(nnn, 1)` の内容 (見出しのサイクル番号と `## 01:`) を確かめる検査がなく、`.pi/skills/adr/scripts/index.test.ts:399` の検査は2ファイルの存在だけを見るため、番号を取り違える回帰を検出できない。
  - fixed: 新しいサイクルの `affected.md` が `# Affected 001` で始まり `## 01:` を持つ断言を足した（`571ca15`）。
- Unproven: なし — 更新された `.pi/skills/adr/scripts/index.test.ts:304` の2ケースは `entry` を無視して常に `## 01:` を書く回帰と表題・番号の取り違えで失敗し、`.pi/skills/adr/scripts/index.test.ts:411` の欠落分岐の検査は `cycle`・`next` の取り違えや常に `1` を書く回帰で失敗するため、名指す振る舞いを壊せば赤になることを確かめた。
- Noise: なし — `.pi/skills/adr/scripts/index.test.ts:304,411` の数値・文字列は仕様の番号とテンプレートの見出しそのものであり、型やスキーマが保証する前提だけの検査や誰も気づかない検査は無く、重複する振る舞いの検査も無いことを確かめた。
- Doubts:
  - `.pi/skills/adr/scripts/index.mjs:51` の `cycle === null` の throw は `.pi/skills/adr/scripts/cycle.mjs:199` の `openCycleDir` が null を弾くため現行経路では到達不能であり、境界防御として残すか到達不能番として削るかは判断が要るため所見にせず残す。

## Acceptance

- Ran: `pnpm test:run`（732テスト、マージ後）、`pnpm typecheck`（root と .pi）、`pnpm lint`、`pnpm format:check`、`grep -n 'affectedSkeleton' .pi/skills/adr/scripts/affected.mjs .pi/skills/adr/scripts/index.mjs`、変更した4ファイルの通読、レビュー consult-83 と consult-87、指摘の修正 `571ca15`。
- Findings: なし
- Doubts: 新規作成の検査は `nnn=1` のみで、`nnn≠1` の新規作成を区別できない。同じ分岐のため実害はない。
