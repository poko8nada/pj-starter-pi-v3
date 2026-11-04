# PLAN `ex-readme-item-shape`

- Place: base
- Boundary Plans: なし（`readme` のマージ後に、README の項目の形だけを直す）

## Files

```text
README.md                     update
README.ja.md                  update
```

## Slices

## 1.一覧の項目の形

README はプロダクトの入口の地図である。項目の形は次のとおりにする。文書はリンクにし、ツールはバッククォートの名前にし、まとめの項目は「ラベル: コード - 説明」にし、見出しの下の項目は入れ子にする。`skills`、`extensions`、`typecheck`、`test` の見出しには説明を付けない。`localhook` だけは `lefthook` という値を持つ（オーナーが示したとおり）。

### Types

```ts
なし;
```

### Steps

1. `README.md`:
   - update: `## What is in it` を次の全文に置き換え、リンクは3つだけにし、`skills`、`extensions`、`typecheck`、`test`、`localhook` には説明を付けず、ほかのパスはバッククォートで書く。

```md
## What is in it

### Roadmap & Cycle

Product direction and cycle decisions stay traceable from intent to record.

- [DEFINITION.md](DEFINITION.md): Holds the product picture; cycle decisions record intent against its parts and keep the picture current.
- [ROADMAP.md](ROADMAP.md): Holds versioned items; cycles pick items with owner agreement and append cycle numbers on close.
- rules: `rules/*` - Holds shapes and wording rules for definition, roadmap, and readme.

### Agent

Daily work runs through a pi harness with settled roles and bounded duties.

- [AGENTS.md](AGENTS.md): Project rules read every session; issues live on the roadmap and work runs in cycles from adr to close.
- skills:
  - `adr`: Settles intent, roadmap item, and entries, recording decisions on the definition.
  - `plan`: Cuts agreed entries into ordered work units with files and checks.
  - `work`: Runs plan slices in order and leaves records in plan notes.
  - `close`: Collects plan outputs, triages with the owner, and updates the roadmap.
  - `yolo`: Walks cycle stages without owner confirmations and stops at triage.
  - `upgrade`: Upgrades dependencies on its own, apart from cycles.
- extensions:
  - `consult`: Runs one subagent pi with a role and a place, plus worktree and commit helpers.
  - `quality-gate`: Checks only changed parts on each turn, with fix and check stages.
  - `context-precompact`: Prepares context in the background before the threshold and applies it at the boundary.
  - `thinking-scrub`: Stops looped thinking during generation and keeps it out of the next turn.
  - `sound-notify`: Plays a sound and sends a cmux notice while pi waits for the user.

### Checks

Automated gates keep style, correctness, behavior, and wording consistent on every change.

- lint: `oxlint` - Fails on warnings for changed JavaScript and TypeScript.
- format: `oxfmt` - Formats and verifies JavaScript, TypeScript, Markdown, and JSON.
- typecheck:
  - `scripts/checks/typecheck.mjs` - Checks root and harness types on push.
  - `scripts/checks/typecheck-staged.mjs` - Checks only staged files on commit.
- test:
  - `vitest.config.ts` - Product config excluding harness paths.
  - `vitest.starter.config.ts` - Starter config covering all tests.
- japanese-check: `scripts/checks/ja-check.mjs` - Reports banned Japanese words with error and warn counts.
- localhook: `lefthook`
  - pre-commit: Runs format, lint, staged typecheck, related tests, and japanese-check on changed parts.
  - pre-push: Runs full typecheck and tests.

### Handover

Moving work between starter and product stays explicit and repeatable.

- harness-sync: `scripts/harness/*` - Brings starter parts in and returns project parts back without deleting files.
- product-ready: `scripts/product-ready/*` - Replaces roadmap, definition, and readmes with templates and drops starter-only test wiring on first run.

### CI

_Under construction_
```

2. `README.ja.md`:
   - update: `## What is in it` を次の全文に置き換え、英語の README と同じ形のまま説明文は日本語にする。

```md
## What is in it

### Roadmap & Cycle

プロダクトの方向とサイクルの判断は、意図から記録まで追跡できるように残る。

- [DEFINITION.md](DEFINITION.md): プロダクト像を保ち、サイクルの判断をその中の項目と対応付けて残す。
- [ROADMAP.md](ROADMAP.md): バージョンごとの項目を持ち、サイクルが選んだ番号をオーナーの合意のもとで追記する。
- rules: `rules/*` - 定義と roadmap と readme の形と言葉の規則をまとめる。

### Agent

日常の作業は、役割を定めた pi の harness 上で進む。

- [AGENTS.md](AGENTS.md): 毎回読むべき規則を示し、項目は roadmap で管理し、サイクルは adr から close まで進む。
- skills:
  - `adr`: 意図と対象項目とエントリーを定め、定義に関する判断を記録に残す。
  - `plan`: 合意済みの項目を順序付きの作業単位に切り分け、対象ファイルと確認方法を添える。
  - `work`: 作業単位を順に実行し、記録を plan のノートに残す。
  - `close`: 作業の成果を集め、オーナーとともにトリアージし、roadmap を更新する。
  - `yolo`: オーナーの確認を挟まずにサイクルのステージを進め、トリアージで止まる。
  - `upgrade`: 依存をサイクルとは別に単独で更新し、監査まで行う。
- extensions:
  - `consult`: 役割と場所を指定して pi の子エージェントを1体起動し、worktree と commit の補助も持つ。
  - `quality-gate`: ターンの変更分だけを検査し、修正と確認を分けて進める。
  - `context-precompact`: しきい値に達する前にバックグラウンドで準備し、境界で適用する。
  - `thinking-scrub`: 同じ思考の繰り返しを生成中に止めて取り除き、次のターンに持ち越さない。
  - `sound-notify`: pi がユーザーを待つ間に、音と cmux の通知でユーザーに知らせる。

### Checks

自動の検査が、変更のたびに書式と正確さと振る舞いと表現をそろえる。

- lint: `oxlint` - 変更した JavaScript と TypeScript に対し、警告があれば失敗とする。
- format: `oxfmt` - JavaScript、TypeScript、Markdown、JSON の書式をそろえる。
- typecheck:
  - `scripts/checks/typecheck.mjs` - push 時にルートと harness の型を確認する。
  - `scripts/checks/typecheck-staged.mjs` - commit 時に変更分だけの型を確認する。
- test:
  - `vitest.config.ts` - プロダクト用の設定で、harness のパスを除外する。
  - `vitest.starter.config.ts` - スターター用の設定で、すべてのテストを対象にする。
- japanese-check: `scripts/checks/ja-check.mjs` - 禁止語の出現を数え、error と warn で報告する。
- localhook: `lefthook`
  - pre-commit: 変更分に書式と lint と型と関連テストと日本語検査を実行する。
  - pre-push: 全体の型とテストを実行する。

### Handover

スターターとプロダクトの間の移動は、明示的で再現可能な形で行う。

- harness-sync: `scripts/harness/*` - スターターの部品を取り込み、プロジェクトの部品を戻し、ファイルは削除しない。
- product-ready: `scripts/product-ready/*` - roadmap と定義と readme をテンプレートに置き換え、スターター用のテスト配線を外す。

### CI

_Under construction_
```

### Verify

- Always:
  - `pnpm test:run scripts/product-ready`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `node scripts/checks/ja-check.mjs README.ja.md` が error 0、warn 0であることを確かめる
  - `README.md` と `README.ja.md` の `## What is in it` を読み、リンクが `DEFINITION.md`、`ROADMAP.md`、`AGENTS.md` の3つだけで、リンクの文字列にバッククォートがないことを確かめる
  - `test -e DEFINITION.md && test -e ROADMAP.md && test -e AGENTS.md` が成功することを確かめる
  - `README.md` と `README.ja.md` の `## What is in it` を読み、`skills`、`extensions`、`typecheck`、`test` の見出しに説明が付いておらず、「localhook: `lefthook`」が値だけなことを確かめる
  - grep ツールで「rules: `rules/*` -」と「harness-sync: `scripts/harness/*` -」を `README.md` と `README.ja.md` から検索し、各1件であることを確かめる
  - 変更した2ファイルを変更前と並べて読み、矛盾、循環、重複、不足、不自然な流れがないか確かめる
- Added: base — オーナーが差分を読んで承認する

## Notes

### Slice 1: 一覧の項目の形

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
