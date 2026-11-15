# PLAN `plan-script-tests`

- No: 03
- Place: worktree
- Boundary Plans: なし

## Goal

plan のテストが同じ事実を 1 か所で確認する形になり、`index.mjs` と `SKILL.md` の usage が `--root` と `-w`/`-b` を書き、単体と CLI の重複が消える。

## Design

- Inside:
  - Modules: なし。`index.test.ts` の断言を絞り、`index.mjs` と `SKILL.md` の usage を直す。`describe` と `setupCycle` の構造は変えず、新しい fixture も作らない。`tempDir`/`mkdirSync`/`writeFileSync` は `setupCycle` に残す。モジュールの統合・分割はない。
  - Dirs: なし。
- Outside:
  - Extract: なし。新しい共有のモジュールは作らない。
  - Colocate: なし。

## Files

```text
.pi/
  skills/
    adr/
      scripts/
        cycle.mjs
    plan/
      scripts/
        index.mjs              update
        index.test.ts          update
        plan.mjs
      SKILL.md                 update
test/
  temp-dir.ts
```

## Slices

## 1.usage を実装に合わせる

`index.mjs` と `SKILL.md` の usage が、`--root` と `-w`/`-b` を書く。

### Types

なし

### Steps

1. `.pi/skills/plan/scripts/index.mjs`
   1. update: usage を次の文にする。

      ```text
      node index.mjs <plan id> --order <NN> (--place <worktree|base> | -w | -b) --entries <NN[,NN...]> [--root <dir>]
      ```
2. `.pi/skills/plan/SKILL.md`
   1. update: 57 行目の usage のパス `node .pi/skills/plan/scripts/index.mjs` を残し、オプションを `(--place <worktree|base> | -w | -b) --entries <NN[,NN...]> [--root <dir>]` に合わせる。

### Policy

- Allowed:
  - usage は `index.mjs` と `SKILL.md` の両方を直す。
  - テスト名、コメント、usage を現在の実装に合わせる。
- Forbidden:
  - 製品の CLI の出力、エラー、ファイルの形を変える - 振る舞いを変えないため。
  - usage を `index.mjs` だけ直して `SKILL.md` を残す - 記述が食い違うため。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: other — `grep` で `index.mjs` と `SKILL.md` の usage に `--root` と `-w`/`-b` があることを確かめる。

## 2.テストの重複を整理する

`parseArgs`、`filesTree`、`planSkeleton`、CLI の重複した断言が消える。

### Types

なし

### Steps

1. `.pi/skills/plan/scripts/index.test.ts`
   1. drop: `parseArgs` の `--root`（31-45）。
   2. drop: `filesTree` の「空 → なし」（109-111）と「ルートの file」（113-115）。
   3. update: `planSkeleton` のテストを、補間と見出しリストに絞る。
      - `planSkeleton: (happy) 補間と見出し → # PLAN, No, Place, Files, Goal, Design, Slices, Notes, Work Review, Round 1, Round 2, Acceptance`
      - 残す: `# PLAN`、`- No`、`- Place`、Files のフェンス。
      - 見出しリスト: `['# PLAN \`xxx-update\`', '## Goal', '## Design', '## Files', '## Slices', '## Notes', '## Work Review', '### Round 1', '### Round 2', '## Acceptance']`。
      - 外す: `- Boundary Plans:` と個別の見出しの `toContain`。
      - テスト名: 「見出しの順と値を入れる」。

      ```ts
      const headings = markdown.split('\n').filter((line) => line.startsWith('#'));
      expect(headings).toEqual([
        '# PLAN `xxx-update`',
        '## Goal',
        '## Design',
        '## Files',
        '## Slices',
        '## Notes',
        '## Work Review',
        '### Round 1',
        '### Round 2',
        '## Acceptance',
      ]);
      ```

   4. update: CLI の「plan を作る」から 194-196、198-199 を外し、193 のファイル読み取りと 197 の Files ツリーを残す。
      - `CLI: (happy) plan を作る → ファイルと Files ツリー`
   5. drop: CLI の「place が base」（202-211）。
   6. update: `describe` と `setupCycle` を残し、新しい fixture を作らない。`tempDir`/`mkdirSync`/`writeFileSync` は `setupCycle` に残す。ほかのテスト名は変えない。

### Policy

- Allowed:
  - 単体と配線が同じ事実を確認する場合、判断・変換は単体に残し、配線は経路だけを確認する。
  - usage は `index.mjs` と `SKILL.md` の両方を直す。
  - `parseArgs` のエラーと CLI の停止は残す。
  - 既に存在しない振る舞いのテストはないため、削除は重複と定数の整理に限る。
- Forbidden:
  - 製品の CLI の出力、エラー、ファイルの形を変える - 振る舞いを変えないため。
  - 同じ値の断言を単体と配線の両方に置く - 同じ事実を 2 か所で確認しないため。
  - usage を `index.mjs` だけ直して `SKILL.md` を残す - 記述が食い違うため。
  - テストを整理するために実装の振る舞いを変える - このサイクルの目的がテストの整理だから。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: other — `grep` で `index.test.ts` に `filesTree([])`、`- Boundary Plans:`、`-b` のケースがないことを確かめる。

## Notes

### Slice 1: usage を実装に合わせる

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: テストの重複を整理する

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Cleanup: plan スクリプトのテストの整理

- Findings:
- Unplanned:

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal:
- Ran:
- Findings:
- Doubts:
