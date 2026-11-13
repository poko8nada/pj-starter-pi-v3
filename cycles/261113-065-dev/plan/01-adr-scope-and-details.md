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

   3. update: `In:` と `Out:` の説明のうち、`kind in scope` と `kind out of scope` と書いた2本を、問いの答えと 031 の in/out の意味に合わせた2行に置き換える。`When a kind is Out, carry its reason.` 以降の3本は変えない。

      ```md
      - `In:` holds one line per kind that answers yes — what this session changes, or checks for consistency — in `<kind>: <what is done>`.
      - `Out:` holds one line per kind that answers no — not a target, with the reason on the line — in `<kind>: <what is not done>（理由）`.
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
      - Write the specific name, the logic, the method, the schema and the structure. A whole text or a whole logic is written when it is the decision. The plan concretizes what is not decided.
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

### Cleanup: なし

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - `.pi/skills/adr/references/adr.format.md:150` — 前行 `:149` の `#### Details` holds the concrete code and documents と、新しい規則の第1文 `Write the concrete decision: the document, the specific name, the logic, the method, the schema, the structure.` が同じ「具体物を書く」を二度言う。150 で新しく加わったのは `A whole text or a whole logic ...` と `The plan concretizes what is not decided.` の2文だけなので、149 の言い直しは冗長（重複）。
    - fixed: 第1文を `Write the specific name, the logic, the method, the schema and the structure.` に直し、149 の言い直しを消した。
  - `.pi/skills/adr/references/adr.format.md:115-117` — `In:` が `answers yes` を、`Out:` が `answers no` を受ける形になったため、`:117` の When a kind is `Out`, carry its reason. は `:116` の `（理由）` と同じことを言う行として残る（ただし重複自体は変更前からあり、この差分が作ったものではないので記録のみ）。
    - left: `When a kind is Out, carry its reason.` は Slice 1 の Policy が「以降の3本は変えない」と決めており、この修正では触れられない。重複は変更前からある。
- Unlisted: なし（差分は `adr.format.md` と本 plan の `## Notes` のみ。`## Files` の他のパスは触っていない）
- Gaps:
  - `.pi/skills/adr/references/adr.format.md:115-116` — `In:` の意味が `<what is done>` のままで、「このセッションで変更する、または整合を確認する作業対象になる（`ROADMAP.md:65`）」「作業対象にならない（`:66`）」という in/out の定義が `Scope` のどこにも無い。ADR 01 の C1 は 031 の ideas を6点として数えており、この定義はその1点。問いに yes と答えた kind が何を意味するか（変更するのか、整合を確認するだけか）が読めないため、`Goal` の「14の問いへの yes/no で決まる」は成立しても判定の意味が欠ける。plan の Slice 1 step 3 がこの2行の文言を固定しているので、plan が決めた範囲との衝突はオーナーの判断が要る。
    - fixed: Slice 1 step 3 の更新済みフェンスどおり、`In:` を「what this session changes, or checks for consistency」、`Out:` を「not a target, with the reason on the line」の意味を持つ2行に直した。
- Policy: なし（`13種を残さない`・`過去の cycles/*/adr.md を書き換えない`・`In:`/`Out:` の入れ子の形を変えない、の3つの Forbidden は保たれ、Allowed の範囲を出ていない）
- Unproven: なし（`Added: なし` の計画どおりテストを足しておらず、`index.test.ts` は `### Scope`/`#### Details` の見出しの有無だけを見るので、壊れても緑のままになる新しいテストは無い）
- Noise: なし（テストの追加が無く、型・スキーマ・DB 制約で決まる case も書いていない）
- Doubts:
  - `.pi/skills/adr/references/adr.format.md:111` の `all 14 kinds` は表から導出できる数。表の kind を増減したときにこの行だけ古くなる。plan が文言を決めた行なので finding にはしない。
  - この役では `pnpm test:related` / `typecheck` / `lint` / `format:check` を実行できない（subagent-guard で `git diff`/`status`/`log` 以外が打てない）。表の桁そろえが prettier の整形と一致するかは未確認。

### Round 2

- Stale:
  - なし（`.pi/skills/adr/references/adr.format.md:150` の fixed を確認した。第1文から `the document` と `concrete` が消え、`:149` の「具体物を書く」の言い直しではなくなっている。149 はセクションが何を持つか、150 は書く要素の列挙で、役割が分かれた）
- Unlisted: なし（修正の差分 `ef1a49b` は `adr.format.md` の2箇所と本 plan の `## Notes`・Round 1、および Slice 1 step 3 のフェンスのみで、`## Files` の他のパスは触っていない。plan md は `## Files` に無い作業文書）
- Gaps:
  - なし（`.pi/skills/adr/references/adr.format.md:115-116` の fixed を確認した。`In:` に「what this session changes, or checks for consistency」、`Out:` に「not a target, with the reason on the line」が入り、問いの yes/no が何を意味するか読めるようになった。031 の in/out の意味と一致する）
- Policy:
  - なし（修正は Slice 1 の Allowed の範囲で、`13種を残さない`・`過去の adr.md を書き換えない`・`In:`/`Out:` の入れ子の形を変えない、の3つの Forbidden に触れていない。`:117` を変えなかったのも Slice 1 step 3 の「以降の3本は変えない」に従っている）
- Unproven: なし（fixed の2点は文書の文言だけで、テストで決まる挙動を持たない。`Added: なし` の計画どおり新しいテストは無い）
- Noise: なし（修正は2行の文言と plan のフェンスの同期だけで、テスト・型・スキーマ・DB 制約に触れていない）
- Doubts:
  - `.pi/skills/adr/references/adr.format.md:116` の `with the reason on the line` は `:117` の `When a kind is Out, carry its reason.` と同じことを言う。Round 1 で `left` として記録済みで、Slice 1 の Policy に従った結果なので finding にしない。
  - 本 plan の Slice 1 step 3 のフェンスを「031 の in/out の意味に合わせた」に広げている。Round 1 の Gaps は「plan が決めた範囲との衝突はオーナーの判断が要る」としていたので、この拡張にオーナーの承認があるかは修正の記録からは分からない。
  - `:149` と `:150` はどちらも `#### Details` に何を置くかに触れる。149 はセクションの役割、150 は書く要素の列挙で役割が違うと読んだが、重なりが残ると読む余地はある。
  - この役では `pnpm test:related` / `typecheck` / `lint` / `format:check` を実行できない（subagent-guard で `git diff`/`status`/`log` 以外が打てない）。長くなった `:115-116` が prettier の整形に合うかは未確認。

## Acceptance

- Goal: adr の `Scope` が14の問いへの yes/no で決まり、`#### Details` が決めた具体物を適宜持つようになる — 達成している（`## Scope` に14種の表と4本の規則、`In:`/`Out:` の意味、`## Decision` の `#### Details` に具体物の規則が入っている）
- Ran: `pnpm test:run`（65 files / 830 tests）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、変更した `adr.format.md` の `## Scope` と `## Decision` の読み直し
- Findings: なし
- Doubts: なし
