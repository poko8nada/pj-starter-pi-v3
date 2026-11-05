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

- Goal: なし — ADR 01 の `Adopted`（`adr.md:64` の10動詞のうち「そろえる」）に対応する `align` を `Steps` が運び、`Scope`（prose in）の範囲を越えない。`## Design` も4項目に理由付きで `なし` と答えているため。
- Integration: なし — 今回の変更は既存文への1語追加であり、再設計や他への組み込みを要しない。フェンス（`ex-tasks-verb.md:38`）は文の構造と順序を保っているため。
- Files: なし — 変更が必要な `.pi/skills/adr/references/tasks.md` を `Files` が `update` で名指しし、`Steps` と一致する。他に動詞の一覧を持つファイルはなく、stale を生む文書・コメント・テストもないため。
- Types: なし — 文書の1語追加で、コードが使う宣言はなく、`Types: なし;` が妥当であるため。
- Cases: なし — テストのステップがなく、文書変更による分岐もないので、ケースと接頭辞の照合対象がないため。
- Checks: `ex-tasks-verb.md:48` — 「`align`、`そろえる` を、大小文字を問わず検索する」は命令・範囲・期待結果がなく、そのままでは実行できない。理由: どの検索器（`git grep`／`rg` など）でどこを探し、何件の当たりをもって合格とするかが書かれていない。日本語の「そろえる」に大小文字の区別はなく、検証条件として不明確であるため。
  - fixed: 検索行を、検索器と範囲と合格条件を持つ形に書き直した。`align` はリポジトリ全体の大小文字を問わない検索で、`tasks.md` の一覧にあることと他の8語が残ることを差分の追加行で確かめる。
- Flow: なし — 追加位置（`add` の直後）は文を壊さず、番号・パス・名前・形の不整合や重複・循環・省略を生まないため。

### Round 2

- なし — `ex-tasks-verb.md:48`の検索行について、grep ツールを使い、リポジトリ全体で大小文字を問わず`align`を検索し、`ex-tasks-verb.md:38`の追加行に`align`があり他の8語が残ることを確かめたため。

## Acceptance

- Ran:
- Findings:
- Doubts:
