# PLAN `cycle-rules`

- No: 03, 05, 06
- Place: worktree
- Boundary Plans: なし（`readme` は README とテンプレートだけを書き、このプランの4ファイルを読まない）

## Files

```text
rules/
  roadmap.md                  update
.pi/skills/
  adr/
    SKILL.md                  update
  close/
    SKILL.md                  update
  work/
    SKILL.md                  update
```

## Slices

## 1.ロードマップの記法の統一

### Types

```ts
なし;
```

### Steps

1. `rules/roadmap.md`:
   - update: `## Fields` の `status` の行を `_todo_`、`wip`、`done` にし `todo` だけをアンダースコアで囲む理由を書き、`cycles` の行に `NNN-m`、`NNN-d`、`NNN-f` の形と、`m` は `main`、`d` は `dev`、`f` は `feat` を指し、末尾の文字はサイクルのフォルダ名の接尾辞の最初の語の頭文字とする規則を書き、`## Who writes it` の `cycles` の文と同じ語でつなぐ。
2. `.pi/skills/adr/SKILL.md`:
   - update: `## 2. Roadmap` の候補の語 `todo` を `_todo_` にし、表の形と規則は `rules/roadmap.md` が持つことをその行で示す。`close/SKILL.md` の `done` と `wip` は `rules/roadmap.md` の語と同じままで一致するため変えない。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - grep ツールで `` `todo` `` を `rules/roadmap.md`、`.pi/skills/adr/SKILL.md`、`.pi/skills/close/SKILL.md` から検索し、0件であることを確かめる
  - grep ツールで `NNN-m` を `rules/roadmap.md` から検索し、1件以上であることを確かめる
  - grep ツールで `done` と `wip` を `.pi/skills/close/SKILL.md` から検索し、各1件以上であることを確かめる
  - `rules/roadmap.md`、`.pi/skills/adr/SKILL.md`、`.pi/skills/close/SKILL.md` の status と cycles の記述を読み、3つが同じ語で食い違わないことを確かめる
  - 変更した2ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる
- Added: `other — node scripts/checks/ja-check.mjs rules/roadmap.md .pi/skills/adr/SKILL.md` が 0 件で終わる

## 2.`ex-` のプランの手順

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/close/SKILL.md`:
   - update: 第 9 手順と第 10 手順の `ex-` のプランの行に、プラン自体のレビューと修正とコミットを挟み、そのあと `Place` が worktree なら worktree を作り `base` ならオーナーの確認を挟まずに走ることを書き、既存の `ex-` の行（命名と `No` の出所）の続きとして並べる。
2. `.pi/skills/work/SKILL.md`:
   - update: 第 4 手順の `base` のプランの行を、`ex-` のプランはオーナーの OK を待たずに走り `ex-` 以外の `base` のプランはこれまでどおり 1 スライスごとに待つ形に分け、第 3 手順の `Place` の既定（`ex-` は worktree）と食い違わないようにつなぐ。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `.pi/skills/close/SKILL.md` の第 9 手順と第 10 手順を読み、`ex-` のプランにレビュー・修正・コミットが入り、`worktree` と `base` の分岐が書かれていることを確かめる
  - `.pi/skills/work/SKILL.md` の第 4 手順を読み、`ex-` の例外と `ex-` 以外の確認が分かれて書かれていることを確かめる
  - `.pi/skills/plan/SKILL.md` のレビューと校正の順序を読み、`close/SKILL.md` の `ex-` の行の順序と食い違わないことを確かめる
  - 変更した2ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる
- Added: `other — node scripts/checks/ja-check.mjs .pi/skills/close/SKILL.md .pi/skills/work/SKILL.md` が 0 件で終わる

## 3.コミットメッセージの形

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/work/SKILL.md`:
   - update: 第 2 手順のコミットメッセージを `update: NNN-<suffix>'s ADR, affected and plan` にし、`<suffix>` はサイクルのフォルダ名の番号より右（`261104-054-dev` なら `dev`）であると書き、束ねる対象（`adr.md`・`affected.md`・`plan/*.md`）と時点は変えない。
2. `.pi/skills/close/SKILL.md`:
   - update: 第 13 手順にコミットメッセージ `close: NNN-<suffix>'s close and roadmap` を足し、`<suffix>` の取り方を `work` の第 2 手順と同じ語で書き、束ねる `close.md` と `ROADMAP.md` と 1 コミットの形は変えない。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - grep ツールで `NNN-<suffix>` を `.pi/skills/work/SKILL.md` と `.pi/skills/close/SKILL.md` から検索し、各1件以上であることを確かめる
  - grep ツールで `NNN's` を `.pi/skills/work/SKILL.md` と `.pi/skills/close/SKILL.md` から検索し、0件であることを確かめる
  - `git log --format=%s` で直近のコミットメッセージを読み、`update: NNN's …` の形に `-<suffix>` を足す変更であり、対象と時点が変わらないことを確かめる
  - 変更した2ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる
- Added: `other — node scripts/checks/ja-check.mjs .pi/skills/work/SKILL.md .pi/skills/close/SKILL.md` が 0 件で終わる

## Notes

### Slice 1: ロードマップの記法の統一

- Findings: なし
- Unplanned: なし
- Commit: 371496e consult(cycle-rules): unify roadmap notations
- Stopped: なし

### Slice 2: `ex-` のプランの手順

- Findings: なし
- Unplanned: なし
- Commit: a36cc28 consult(cycle-rules): define ex-plan review and base run
- Stopped: なし

### Slice 3: コミットメッセージの形

- Findings: なし
- Unplanned: なし
- Commit: ff9a7c5 consult(cycle-rules): qualify commit messages with suffix
- Stopped: なし

## Work Review

### Round 1

- Stale: なし — `rules/roadmap.md:11`・`.pi/skills/adr/SKILL.md:45`・`.pi/skills/close/SKILL.md:101` の status と cycles の語は一致し、残る旧形は履歴（`cycles/261103-053-dev/adr.md:24`、`ROADMAP.md:88,238` の ideas 記録）で書換対象外のため。
- Unlisted: なし — 差分の4ファイルは `## Files` の4ファイル（`rules/roadmap.md`、`.pi/skills/adr/SKILL.md`、`.pi/skills/close/SKILL.md`、`.pi/skills/work/SKILL.md`）と一致するため。
- Gaps: なし — スライス1から3の各行為（記法統一、`ex-` の分岐、suffix 付与）に対応する grep・読み通し・`ja-check` の弾があり、漏れがないため。
- Unproven: なし — テスト手順がなく、grep 計数は行為を戻すと赤になる（旧形が再発すれば 0件要求が崩れ、新行を消せば 1件以上要求が崩れる）ため。
- Noise: なし — テスト手順がなく、grep の文字列はプランと ADR の決定値で `## Test cases` の判定対象がないため。
- Doubts:
  - `.pi/skills/work/SKILL.md:78` の `base` plan の look の行は `ex-` の例外を書かず新設の第4手順（`.pi/skills/work/SKILL.md:46`）と見かけ上ずれて見えるが、見方が無い場合は適用外と読めるため所掌外として残す。
  - `.pi/skills/close/SKILL.md:102` の file と `.pi/skills/adr/SKILL.md:45` の table の語の違いは status と cycles の語の一致を崩さず、プランが変えないと決めた範囲のため残す。
  - `rules/roadmap.md:12` の when more than one is present と More than one is allowed は重複に見えるが、新文自体の文体で五視点のいずれにも属さないため残す。
  - `ROADMAP.md:238` の 044などの記述と直近ログの旧形メッセージは suffix 規則以前の履歴で、過去を書き換えない決定のため残す。

## Acceptance

- Ran: `pnpm test:run`（64ファイル、742テスト）、`pnpm typecheck`（root と .pi が ok）、`pnpm lint`、`pnpm format:check`、grep ツールで `todo` が0件・`NNN-m` が1件以上・`done` と `wip` が各1件以上・`NNN-<suffix>` が各1件以上・`NNN's` が0件、3スキルの読み合わせ、`node scripts/checks/ja-check.mjs` が0件、レビュー consult-32（指摘なし、疑義4件）。
- Findings: なし
- Doubts: なし
