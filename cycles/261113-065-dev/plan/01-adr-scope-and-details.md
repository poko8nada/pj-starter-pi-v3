# PLAN `adr-scope-and-details`

- No: 01, 03
- Place: worktree
- Boundary Plans: なし

## Goal

adr の `Scope` が14の問いへの yes/no で決まり、`#### Details` が決めた具体物を適宜持つようになる

## Design

- Inside:
  - Modules: なし（`adr.format.md` の `## Scope` と `## Decision` の2つのセクションを書き換えるだけで、ファイルやモジュールの統合・分割はない）
  - Dirs: なし（ディレクトリの統合・分割・移動はない）
- Outside:
  - Extract: なし（ほかの文書と共有する新しいモジュールはない）
  - Colocate: なし（コロケーションに変えるモジュールはない）

## Files

```text
.pi/
  skills/
    adr/
      references/
        adr.format.md          update
        affected.format.md
        tasks.md
      scripts/
        adr.mjs
        cycle.mjs
        index.mjs
        index.test.ts
      SKILL.md
    plan/
      references/
        tasks.md
      SKILL.md
ROADMAP.md
```

## Slices

## 1.Scope の問いの表と判定の規則

`Scope` の判定を、13種の説明から14種の問いへ変える。

### Types

なし

### Steps

1. `.pi/skills/adr/references/adr.format.md`
   1. update: `## Scope` の13種の表（`kind | what it is`）を、14種の問いの表（`kind | question (yes → in)`）に置き換える。

      ```md
      | kind          | question (yes → in)                                                                                                                               |
      | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
      | result        | Does what can be observed from outside change? (what is returned, written, or emitted; side effects; what a reader receives)                      |
      | logic         | Do the decisions, steps, or rules that produce the result change? (conditions, order, algorithms, constraints, instructions a reader must follow) |
      | structure     | Does how things are divided, ordered, nested, or placed change? (module split, schema shape, section layout, file placement)                      |
      | expression    | Does the surface notation change? (names, wording, tone, formatting, spelling)                                                                    |
      | upstream      | Is an external thing the product relies on added, updated, or removed? (package, library, external contract, data source, cited source)           |
      | downstream    | Does anything else name, reference, or assume the changed thing? (callers, queries, links, other documents, documents that describe it)           |
      | existing      | Must an existing entity be moved or fixed? (stored data, installed versions, already-distributed documents, past records)                         |
      | cost          | Do time, resources, or money change? (speed, memory, API calls, tokens, effort)                                                                   |
      | safety        | Does it touch secrets, permissions, exposure, or personal data?                                                                                   |
      | failure       | Does the way things fail change, or is there a check, validation, constraint, or failure path that must be kept?                                  |
      | verification  | Must the means of confirming correctness (tests, checks, review steps) be added or changed?                                                       |
      | observability | Do the records or signals the product leave change? (logs, metrics, audit records)                                                                |
      | release       | Does it affect how the change is published, distributed, or applied, or how it can be rolled back?                                                |
      | other         | Is there a concern that none of the above covers?                                                                                                 |
      ```

   2. add: 表の直後の空行のあとに、4本だけの独立した箇条書きとして、`In:`/`Out:` の説明の前に置く。

      ```md
      - Judge each kind on its own; several kinds may be `In` at the same time.
      - Every kind belongs to `In` or `Out`, and to only one of them; every Full entry writes all 14 kinds.
      - When the document directs a reader's behavior, a change only in `expression` puts `result` and `logic` in too, if it changes what the reader does.
      - When a change of `logic` changes the artifact, `result` is `In` too; both may be `In`.
      ```

   3. update: `In:` と `Out:` の説明のうち、`kind in scope` と `kind out of scope` と書いた2本を、問いの答えに合わせた2行に置き換える。`When a kind is Out, carry its reason.` 以降の3本は変えない。

      ```md
      - `In:` holds one line per kind that answers yes, in `<kind>: <what is done>`.
      - `Out:` holds one line per kind that answers no, in `<kind>: <what is not done>（理由）`.
      ```

### Policy

- Allowed:
  - 14種の問いの文面を、`ROADMAP.md` 031 の ideas のとおりに写す
  - 判定の規則を、表の下の箇条書きとして置く
- Forbidden:
  - 13種の kind を新しい表に残さない - 14種への置き換えがこのエントリの決定である
  - 過去の `cycles/*/adr.md` を新しい14種に書き換えない - 記録はその時点の形で残す
  - `In:`/`Out:` の入れ子の箇条書きの形を変えない - plan、close、yolo が `Scope` を読む形を保つ

### Verify

- Always:
  - 関連テスト（`pnpm test:related .pi/skills/adr/references/adr.format.md`。関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## 2.Decision の Details の規則

`#### Details` が、決めた具体物を適宜持ち、決めていない部分を plan に任せるようにする。

### Types

なし

### Steps

1. `.pi/skills/adr/references/adr.format.md`
   1. add: `## Decision` の `#### Details` の1本目の説明の直後に、規則を1本足す。この規則が `ROADMAP.md` 031 の ideas より優先する（ROADMAP は直さない）。

      ```md
      - Write the concrete decision: the document, the specific name, the logic, the method, the schema, the structure. A whole text or a whole logic is written when it is the decision. The plan concretizes what is not decided.
      ```

### Policy

- Allowed:
  - 決めた具体物を、必要なら全文や全ロジックも含めて書く
  - 決めていない部分を plan に任せる。plan はエントリを全文読み、レビューは `#### Details` を読まない
  - Full は `#### Details` を `なし`、Simple は `_omission_` で開く
- Forbidden:
  - 決めた具体物を省いて一般論だけを書かない - plan が具体化できない
  - フェンスの形（1 タイトル 1 フェンス、1 フェンス 1 項目）を変えない - 既存の `#### Details` の読み方を保つ

### Verify

- Always:
  - 関連テスト（`pnpm test:related .pi/skills/adr/references/adr.format.md`。関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## Notes

### Slice 1: Scope の問いの表と判定の規則

- Findings: なし
- Unplanned: なし
- Commit: dee9699
- Stopped:

### Slice 2: Decision の Details の規則

- Findings: なし
- Unplanned: なし
- Commit: a95294d
- Stopped:

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
