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

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: `ex-` のプランの手順

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 3: コミットメッセージの形

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
