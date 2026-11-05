# PLAN `ex-tasks-verb`

- Place: base
- Boundary Plans: なし

## Design

- Inside:
  - Modules: なし。`tasks.md` の手順2の動詞の一覧に1語を加えるだけであり、統合も分割もしない。
  - Dirs: なし。
- Outside:
  - Extract: なし。
  - Colocate: なし。

## Files

```text
.pi/skills/adr/
  references/
    tasks.md               update
```

## Slices

## 1.抽出動詞の補遺

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/adr/references/tasks.md`:
   - update: 手順2の動詞の一覧に `align` を加える。「そろえる」の対応語であり、他の動詞では拾えない。
     ```md
     2. Take the objects: for each kind in the `Scope`'s `in`, for each sentence of the `Adopted`, take the verbs (remove, drop, replace, rewrite, add, align, move, merge, retire) and their objects. Split a sentence with two operations; a sentence that states a result is an operation. The object list goes to the report before the search.
     ```

### Verify

- Always:
  - `pnpm test:related .pi/skills/adr/references/tasks.md`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `align` を grep ツールでリポジトリ全体に大小文字を問わず検索する。`tasks.md` の手順2の動詞の一覧に `align` があり、他の8語が残っていることを、差分の追加行で確かめる
  - 変えたファイル全体と、そのファイルが名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added:
  - a `base` plan's look — オーナーがスライスの変更を読み、OK がスライスを閉じる

## Notes

### Slice 1: 抽出動詞の補遺

- Findings: なし
- Unplanned:
  - 改めるべき日本語の文書がなく、オーナーの指摘があったため、検証に追加した壊れた文の行を削除した。
  - 手順の順序が前後した。作業（1語の追加と検査）を先にし、校正を後に走らせた。正しくはレビュー、校正、確認、作業の順である
- Commit: `26d3f61`
- Stopped:

### Cleanup: なし

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale: なし — `tasks.md:28` の1語追加が古くする現役の文書・コメント・テストはない。動詞の一覧を持つ現役ファイルは `tasks.md` のみで、一致する文言を持つ `01-adr.md:193` と `ex-tasks-verb.md:38` は `cycles/` 配下の計画記録であり、`tasks.md` の手順7が検索・更新の対象から外すもののため。
- Unlisted: なし — スライスを閉じる変更（`tasks.md:28` に `align` を加え他8語を残す1行）は `Files`（`ex-tasks-verb.md:17-21`）の `update` 指定と一致する。差分中の `02-plan.md:105-106` の1行削除は壊れた検証文の除去であり `## Notes` の `Unplanned` に開示済みで、スライスの振る舞いを追加・変更するものではないため `Files` への追加を要しない。`ex-tasks-verb.md` 自体は計画記録であり `Files` の命名対象外のため。
- Gaps: なし — `Verify`（`ex-tasks-verb.md:44-52`）の grep 確認（リポジトリ全体・大小文字を問わず `align` を探し差分の追加行で `align` あり・他8語残存を確かめる）と読合せ・オーナーの look は、1語追加という振る舞いの全体を直接確かめられる。コード分岐もテスト追加もないため、未実行の振る舞いは残らない。
- Unproven: なし — このスライスはテストを追加・変更しておらず、振る舞いを壊しても緑のまま残るテストはない。grep 確認は `align` 欠落時に差分の追加行で不合格となるため、見逃し green を生まない。
- Noise: なし — 追加されたテストがなく、型・スキーマ・DB 制約が既に決める前提や誰も気づかないケース、マジックナンバー・ハードコード文字列の持ち込みはない。
- Doubts: なし — 修正やオーナー判断を要する残件はない。`01-adr.md:193` の旧8語引用は履歴記録であり更新対象ではない。

### Round 2

- なし — `ex-tasks-verb.md:48`の検索行について、grep ツールを使い、リポジトリ全体で大小文字を問わず`align`を検索し、`ex-tasks-verb.md:38`の追加行に`align`があり他の8語が残ることを確かめたため。

## Acceptance

- Ran:
  - `pnpm test:run`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`ja-check` — すべて緑。
  - 検索の確認: `align` のリポジトリ全体の検索で、`tasks.md` の一覧に `align` があり他の8語が残ることを確かめた。
  - 通読: 変えた文書全体と名指す文書を読んだ。
  - `Added`: a `base` plan's look — オーナーの確認済み。
  - 振る舞いを加えない文書の変更であり、変えた内容を読んだ。
- Findings: なし
- Doubts: なし
