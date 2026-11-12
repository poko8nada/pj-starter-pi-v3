# ADR 063

## 01: adr は、エントリの Context をいつ書き、どこに置くか

### Research & Trial

- F1: `adr.md` のエントリのセクションの並びは、`references/adr.format.md` の Shape と `Entries` が `Research & Trial`、`Scope`、`Context`、`Decision`、`Definition` の順に定めている。出所: `.pi/skills/adr/references/adr.format.md:9-64,71`
- F2: `scripts/adr.mjs` の `entrySkeleton` はセクションの並びを固定文字列で返し、`adrSkeleton` はそれを呼ぶだけである。出所: `.pi/skills/adr/scripts/adr.mjs:7-62,70-74`
- F3: `scripts/index.test.ts` は並びを 3 か所で固定値として持つ。`expected` 配列の `toEqual`、`checkEntry` 用の helper `entry`、`--check` のテストの inline の ADR である。出所: `.pi/skills/adr/scripts/index.test.ts:232-241,255-280,599`
- F4: `--check`（`checkEntry`）はセクションの並びを見ない。`section` は見出し名で本文を切り出し、`checkEntry` は `C<n>` と `F<n>` の重複、未知の参照、`Decision` が参照していない項目だけを調べる。出所: `.pi/skills/adr/scripts/adr.mjs:82-89,142-174`
- F5: `.pi/skills/adr/SKILL.md` はセクションの並びを 1 行で定めておらず、`## Japanese Proofread` が形を `references/adr.format.md` に従わせている。出所: `.pi/skills/adr/SKILL.md:248-255`
- F6: セクション名で読む箇所はあるが、並びの位置で読む箇所はない。`plan` は `Main`、`Sub`、`Policy`、`Scope`、`Definition` を読み、`close` は `Context` と `Research & Trial` の名を挙げるだけである。出所: `.pi/skills/plan/SKILL.md:184`、`.pi/skills/plan/references/tasks.md:45`、`.pi/skills/close/SKILL.md:175,184`
- F7: `cycles/*/adr.md` は 27 件（直下 11 件、`archive/` 16 件）あり、`Research & Trial` が `Context` より前にあるのは 2 件（`261111-062-dev` と `261112-063-dev`）だけである。出所: `cycles/**/adr.md` の見出し位置
- F8: 提案する順（`Context`、`Research & Trial`、`Scope`）に一致する既存の `adr.md` は 0 件である。25 件は `Context`、`Scope`、`Research & Trial` の順で、2 件は `Research & Trial`、`Scope`、`Context` の順である。出所: `cycles/**/adr.md` の見出し位置

### Scope

- In:
  - behaviour: adr スキルは、プリリサーチを待つ間に全エントリの `Context` を書き、`## One entry` から `Context` の手順を削る。`Decision` が採用しなかった `Context` の項目は、ラベルを外して `Context` に残す（内容は消さない）。
  - format: `adr.md` のエントリのセクションの並びを `Context`、`Research & Trial`、`Scope`、`Decision`、`Definition` にし、`Context` の項目の種類に `intent`（オーナーの意図と意志）を足す。
  - prose: `SKILL.md` と `adr.format.md` の説明（`Scope` の Note、`Entries`、`Context` の項）を、新しい手順と並びに合わせて書き直し、`Context` の定義を事実だけでなく意図と意志を含む形にする。
  - refactor: `adr.mjs` の `entrySkeleton` が返す骨組みを、新しい並びにする。
  - errors: `index.test.ts` が固定している並びの期待値を、新しい並びに変える。
- Out:
  - behaviour: プリリサーチの走らせ方（エントリごとの問い、並列の実行、全部を待つ）と、議論ループ中の `C<n>` の追記は変えない（このエントリの関心事ではない）。
  - format: `Decision` と `Definition` の形を変えない（関心事が違う）。
  - naming: セクションと欄の名前を変えない（並びだけを変える）。
  - migration: 既存の 27 件の `cycles/*/adr.md` は移行しない（記録はその時点の形で残す）。
  - dependency: パッケージ、ライブラリ、外部契約は扱わない。
  - speed: 作業時間や資源の上限は設定しない。
  - security: 秘密情報、権限、露出は扱わない。
  - deploy: 配布やリリースはない。
  - logs and monitoring: 新しい記録や通知は増やさない。

### Context

- C1: いまのエントリのセクションは、`Research & Trial`、`Scope`、`Context`、`Decision`、`Definition` の順に並ぶ（F1）。
- C2: `Context` はいま、エントリ段階の `### 2. Context` で、`Scope` の合意のあとに書く。番号は `C1` から振る（`.pi/skills/adr/SKILL.md:126-141`）。
- C3: プリリサーチはエントリ段階より前に走り、その間エージェントは結果を待つ（`.pi/skills/adr/SKILL.md:75-105`）。
- C4: オーナーの要望は、プリリサーチを待つ間に、その時点で分かっている `Context` を全エントリに先に書き、並びは `Context` を先頭にし、議論ループ中の `C<n>` の追記は変えないこと（`ROADMAP.md` の 030 の ideas）。
- C5: 並びを定めるのは `adr.format.md` と `entrySkeleton` の固定文字列で、`--check` は並びを見ない。テストは並びを 3 か所で固定値として持つ（F1〜F4）。
- C6: セクションを読む側（`plan`、`close`、`affected`）はセクション名で読み、並びの位置に依存しない（F6）。
- C7: 既存の `cycles/*/adr.md` は 27 件あり、`Context` が先のものが 25 件、`Research & Trial` が先のものが 2 件で、提案する順に一致するものは 0 件である（F7, F8）。
- C8: 既存の記録はその時点の形で残す。このエントリは移行しない（`Scope` の `Out` の `migration` についてオーナーの承認を得た）。

### Decision

- Status: **accepted**
- Main: adr スキルは、プリリサーチを待つ間に全エントリの `Context` を書き、`adr.md` のエントリは `Context` を先頭に置く
  - Add:
    - `adr/SKILL.md` のサイクル段階に、`### 4. Pre-research` の直後の独立した手順 `### 5. Context` を置く。`### 4. Pre-research` の手順 3（並列で走らせる）と手順 4（待つ）の間に、走らせた直後に、結果を待つ前に全エントリの `Context` を section 5 で書く手順を足す。新しいエントリが見つかったときは、そのエントリの `Context` も書く（C2, C3, C4）
    - `adr.format.md` の `Context` の項に、プリリサーチの間と議論ループで書く規則（C2, C4, F5）
  - Update:
    - `adr.md` のエントリの並びを `Context`、`Research & Trial`、`Scope`、`Decision`、`Definition` にする（C1, C5, C7, F1）
    - `adr.format.md` の `Shape` と `Entries` の並びの 1 行（C1, C5, F1）
    - `adr.mjs` の `entrySkeleton` が返す骨組みの並び（C5, F2）
    - `index.test.ts` が固定している並びの期待値（C5, F3）
    - `adr/SKILL.md` の `## One entry` の手順番号を詰める（C2）
    - `adr/SKILL.md` の `The opening proposal` の手順 1 に、`Context` を読む手順を足す（C1, C2）
    - `adr.format.md` の `## Context` の定義を、事実だけでなくオーナーの意図と意志を含む形に変える（C2, C4）
    - `adr/SKILL.md` の `Context` の `kind` に `intent` を足し、`constraint` から `Who` の望みを外す（C2, C4）
    - `adr/SKILL.md` の `### 5. Decision` の手順 2 と `adr.format.md` の `## Context` に、採用しなかった項目の扱いを足す（C2, C4, F4）
  - Drop:
    - `adr/SKILL.md` の `## One entry` の `### 2. Context` の手順（C4, F5）
    - `adr/SKILL.md` の `### 1. Scope` の Note の 1 行（制約は `Context` に `C<n>` として足す、という行）（C2, C6）
- Sub: なし
- Policy:
  - Allowed:
    - プリリサーチを待つ間に、全エントリの `Context` を書いてよい（C3, C4）
    - 議論ループで `C<n>` を足してよい（C4）
  - Forbidden:
    - 既存の `cycles/*/adr.md` を並べ替えない - 記録はその時点の形で残すため（C7, C8, F7, F8）
    - 並びを見る検査を `--check` に足さない - 読む側はセクション名で読むため（C5, C6, F4, F6）

#### Details

- `adr/SKILL.md` の新しい手順 `### 5. Context`

  ```md
  ### 5. Context

  Steps:

  1. Once the pre-research is running, write the items of every entry, in the split's order.
  2. Write what is settled at that point: the cycle's intent, the roadmap item, the split, and what the owner said.
  3. Write one entry's own items only: its premise, its constraint, its intent, and its question.
  4. Number them `C1`, `C2`, ... in each entry.

  View:

  | kind       | what it is                              |
  | ---------- | --------------------------------------- |
  | premise    | how it behaves now                      |
  | constraint | a limit, or what must not change        |
  | intent     | what the owner wants to become, and why |
  | question   | the entry's question                    |

  Note: do not leave out what is known. What is not known yet stays out, and the research or the discussion adds it.
  Note: write what is settled. A guess stays in the chat.
  ```

- `adr/SKILL.md` の `### 4. Pre-research` の手順（新しい手順 4 を足す）

  ```md
  1. Read the `Look it up` section of `references/tasks.md`.
  2. Propose the pre-research of every entry together. Name the entry, the type, the question, and what the answer decides.
  3. Run the approved ones in parallel. Group the entries whose question is the same, and run one `research` or `trial` subagent per group.
  4. Write every entry's `Context` in section 5 while they run.
  5. Wait for all of them, and write each result in its entry's `Research & Trial`.
  6. Show the owner a new entry found while the pre-research runs, and add it after the answer, with its `Context`.
  ```

- `adr.format.md` の `## Context` の定義

  ```md
  ## Context

  What limits the entry: a fact, and the owner's intent or will.

  - An item is one line, `C<n>: <the item>`.
  - The number runs from `C1`, in the order the items were settled.
  - A code or a document does not go here; it goes under `Decision`'s `#### Details`.
  - When the decision does not weigh an item, remove its `C<n>:` label and keep the item here as a plain bullet.
  ```

- `adr/SKILL.md` の `### 5. Decision` の手順（手順 2 を広げる）

  ```md
  1. Check that every `C` and every `F` is carried.
  2. When a `C` is not carried, explain it to the owner. When they say it no longer limits the entry, remove its `C<n>:` label and keep the item in `Context` as a plain bullet. Otherwise return to section 3.
  3. When an `F` is not carried, remove its `F<n>:` label and keep the fact in `Research & Trial` as a plain bullet. Do not delete the content.
  4. Wait for the owner's judgement: `accepted` or `rejected`.
  5. Write `Status`.
  ```

- `adr/SKILL.md` の `## One entry` の手順の並び（番号を詰める）

  ```md
  1. Scope
  2. The opening proposal
  3. Discussion Loop
  4. Decision
  5. Definition
  6. Affected
  7. Next entry
  ```

- `adr/SKILL.md` の `The opening proposal` の手順 1
  ```md
  1. Read the entry's `Context` and its pre-research facts in `Research & Trial`, and what they decide.
  ```

### Definition

- `Unit.adr-skill`(kept): エントリのセクションの並びと `Context` を書く時点が変わるだけで、オーナーが決め、エージェントが記録するという主機能は変わらない（`rules/definition.rules.md:35`）。
- `Who.owner`(kept): `Context` にオーナーの意図と意志を書くようになるが、判断をするのがオーナーであるという役割は変わらない。

## 02: plan の cut は、どの粒度でプランを分けるか

### Research & Trial

- F1: `cut.md` の `## Cut` は「同じ input を読む作業は 1 プランに留める」「分割は input が違い、かつ同時に走れるときだけ」「順序は一方が他方の出力を読むときだけ」と定め、`### Asking of a split` は「同じ path に触る 2 つは 1 プラン」と定める。出所: `.pi/skills/plan/references/cut.md:9,10,13,15,23`
- F2: `## Where` の「ファイルを離すか、2 つを順序付けるか」は重複時の順序付けを許すが、`### Asking of a split` の「複数のプランに依存する断片は、すべての後に置く」に、共有の断片を前に置く形はない。出所: `.pi/skills/plan/references/cut.md:24,74`
- F3: `### Present` の `- ADR: <NN>[, <NN>...]`、`references/format.md` の `- No: <NN>[, <NN>...]`、`scripts/plan.mjs` の `--entries` は、2 つのエントリを根拠に持つ 1 プランを書式として許す。出所: `.pi/skills/plan/references/cut.md:36,49-55`、`.pi/skills/plan/references/format.md:12,133,151-152`、`.pi/skills/plan/scripts/plan.mjs:51-59,119-122`
- F4: 書式が定めていないのは、重複ファイルだけのプランがどの `ADR` を名乗るか、同じエントリ番号を複数のプランが名乗れるか、単一エントリの断片や共有の断片だけのプランの `Why` に何を書くか、の 3 点である。出所: `.pi/skills/plan/references/cut.md:36-56`、`.pi/skills/plan/references/format.md:147-152`
- F5: `affected/<NN>.md` の Path ブロックが持つのは `Kind` と `Edge` だけで、触る部分の位置を持たない。`Change` という項目は `affected.format.md` にない。出所: `.pi/skills/adr/references/affected.format.md:9-21,70-81`
- F6: よって `affected` だけで、Path が一致する「重複して触るファイル」は判定できるが、同じ Path の中の別の箇所という「触る部分の違い」は判定できない。出所: `.pi/skills/adr/references/affected.format.md:70-81`
- F7: 同じ Path が複数エントリに現れた例は実在する。`062-dev` の `affected/01.md` と `02.md` では 7 件が重複し、`scripts/harness/list/index.mjs` は同じ Path でも `Edge` の相手が違う。出所: `cycles/261111-062-dev/affected/01.md:82-84`、`cycles/261111-062-dev/affected/02.md:85-88`
- F8: `plan` の `### 3. Cut, and present` は cut を提示してオーナーの合意を待つ。`yolo` の `### 1. plan` は cut を提示せず、プランを書いて 5 観点でレビューする。出所: `.pi/skills/plan/SKILL.md:46-61`、`.pi/skills/yolo/SKILL.md:26-37`
- F9: `close` の `## Collected` の見出しは、番号を plan のファイル名（`NN-<slug>`）から、`(ADR ...)` を plan md の `- No:` の値から取る。よって `- No: 01, 02` でも見出しは `### 03 03-cut-out (ADR 01, 02)` になり、解析の `^### (\d+)\s+(\S+)` は壊れない。出所: `.pi/skills/close/scripts/collect.mjs:229-233,255,274,307,360-362`

### Scope

- In:
  - behaviour: plan の cut に、複数のエントリが重複して触る設定ファイルや文書を別のプランに切り出す形と、同じファイルでも触る部分が明確に違えば 1 つのプランにまとめない規則を足す。分割した 2 つのプランが同じファイルの別の部分を変えるときは、`work` のマージで両方の変更を残す。
  - format: `### Present` の表と `references/format.md` の `No` に、共有のファイルだけのプランが名乗る `ADR` と、その `Why` の書き方を足す。
  - prose: `cut.md` の矛盾する 4 つの規則を新しい 2 つの規則に合わせて書き直し、触る部分の違いはエージェントがファイルを読んで判断することを明記する。
- Out:
  - refactor: コードを変えない（cut の規則は `cut.md` にだけある）。
  - naming: プランの id の付け方を変えない（既存の `NN-<slug>` のまま）。
  - compatibility: `yolo` の参照を変えない（`yolo` は cut の順序を使うだけで、規則を写していない）。
  - errors: テストを変えない（`No` はカンマ区切りをすでに許す）。
  - migration: 過去のサイクルの plan は移行しない（記録はその時点の形で残す）。
  - dependency: パッケージ、ライブラリ、外部契約は扱わない。
  - speed: 作業時間や資源の上限は設定しない。
  - security: 秘密情報、権限、露出は扱わない。
  - deploy: 配布やリリースはない。
  - logs and monitoring: 新しい記録や通知は増やさない。

### Context

- C1: いまの `cut.md` は 4 つの規則を持つ。「同じ input を読む作業は 1 プラン」「分割は input が違い、同時に走れるときだけ」「順序は一方が他方の出力を読むときだけ」「同じ path に触る 2 つは 1 プラン」である（F1）。
- C2: `### Asking of a split` の「複数のプランに依存する断片は、すべての後に置く」に、共有の断片を前に置く形はない（F2）。
- C3: 書式は 2 エントリを持つ 1 プランをすでに許す（`- ADR: 01, 02`、`- No: 01, 02`、`plan.mjs` の `--entries`）（F3）。
- C4: 書式が定めていないのは 3 点である。共有のファイルだけのプランが名乗る `ADR`、同じエントリ番号を複数のプランが名乗れるか、そのプランの `Why` に何を書くか（F4）。
- C5: `affected/<NN>.md` は Path ごとの `Kind` と `Edge` だけを持ち、ファイル内の位置を持たない。`Change` という項目はない（F5）。
- C6: よって「重複して触るファイル」は `affected` で判定できるが、「触る部分が明確に違う」は判定できない（F6）。
- C7: 同じ Path が複数エントリに現れた例は実在し、`062-dev` では 7 件が重複した（F7）。
- C8: `plan` の cut はオーナーに提示して合意を待つ。`yolo` の plan 段階は cut を提示せずにプランを書く（F8）。
- C9: オーナーの要望は、同じファイルを触るなら 1 プランという原則を残しつつ、プランが大きくなりそうなら重複するファイル群を別のプランに切り出し、触る部分が明確に違えばまとめなくてよいとすること。現行の記述との衝突は、新しい規則を正とする（`ROADMAP.md` の 030 の ideas）。
- C10: 過去のサイクルの plan は移行しない（`Scope` の `Out` の `migration` についてオーナーの承認を得た）。
- C11: オーナーの追加の条件は、切り出してよいのは共有する Path が設定ファイルか文書（`Kind` が `config` か `doc`）のときに限り、コードは切り出さないこと。コードの変更が先になると機能が一時的に不全になりうるが、設定ファイルと文書ではほぼないため。順序は内容で決める（オーナーの指示）。
- C12: オーナーの追加の指示は、触る部分が明確に違うなら 2 つのプランを並列で走らせてよく、その場合はマージで同じファイルのコンフリクトを両方解決すること。コンフリクトは必ず起きるのではなく、変更が近い行に重なる場合に起きる（オーナーの指示）。

### Decision

- Status: **accepted**
- Main: plan の cut は、複数のエントリが重複して触る設定ファイルや文書を別のプランに切り出し、触る部分が明確に違えば 1 つのプランにまとめない
  - Add:
    - `cut.md` の `## Cut` に、切り出しの規則。共有する Path への変更が複数のエントリで同じ内容であり、その Path の `Kind` が `config` か `doc` のとき、その Path 群を別のプランにする（C1, C7, C9, C11, F1, F7）
    - `cut.md` の `## Cut` に、触る部分が明確に違えば 1 つのプランにまとめない規則と、分割した 2 つのプランを並列で走らせてよい規則（C1, C9, C12, F1）
    - `cut.md` の `### Asking of a split` に、切り出したプランを内容に応じた位置に置く順序（先に固定しない）（C2, C9, C11, F2）
    - `### Present` の表と `references/format.md` に、切り出したプランが両方のエントリ番号を `ADR` に名乗り、`Why` に共有の理由を書く形（C4, C8, F4, F8）
    - `plan/references/format.md` の `- No:` に、同じエントリ番号が別のプランにも現れてよいことを足す（C3, F3, F9）
  - Update:
    - `cut.md` の「同じ input を読む作業は 1 プラン」を、共有のファイルを含む場合の例外つきにする（C1, C9, F1）
    - `cut.md` の「分割は input が違い、同時に走れるときだけ」を、順序つきの分割を許す形にする（C1, C9, F1）
    - `cut.md` の「順序は一方が他方の出力を読むときだけ」を、共有のファイルでも順序を置ける形にする（C1, C2, F1, F2）
    - `cut.md` の「同じ path に触る 2 つは 1 プラン」を、触る部分が明確に違えば分割できる形にする（C1, C6, C9, F1, F6）
    - `cut.md` の `Why` の説明を、`affected` で判定できない場合の書き方に合わせる（C4, C6, F4, F6）
  - Drop: なし
- Sub: work は、同じファイルの別の部分を変える 2 つのプランのマージで、両方の変更を残す
  - Add:
    - `work/SKILL.md` の `### 9. Merge` の手順 2 に、コンフリクトは両方の変更を残し、意味が変わるなら止めることを足す（C9, C12, F1）
  - Update: なし
  - Drop: なし
- Policy:
  - Allowed:
    - 1 つのプランが複数のエントリを名乗ってよい（C3, F3）
    - 切り出したプランを、内容に応じて他のプランより前にも後にも置いてよい（C2, C9, C11, F2）
    - 同じエントリ番号が複数のプランに現れてよい（C3, F3, F9）
  - Forbidden:
    - `affected/<NN>.md` に触る部分を持たせない - 位置はファイルを読んで判断するため（C5, C6, F5, F6）
    - 過去のサイクルの plan を移行しない - 記録はその時点の形で残すため（C10）
    - 共有だけを理由にコード（`module`）を切り出さない - コードの変更が先になると機能が一時的に不全になり得るため（C11）

#### Details

- `cut.md` の `## Cut` と `### Asking of a split` の新しい規則

  ```md
  ## Cut

  - A path that more than one entry changes with the same change, and that is a `config` or a `doc`, is cut into a plan of its own.
  - Where that plan sits is decided by what it holds: before, after, or between the others.
  - Two plans may touch the same path when the parts they change are clearly different.
  - The parts are read from the file, not from the affected: the plan step reads every path whole before it writes.
  - Two plans that change different parts of the same path may run at once. Their merge keeps both changes.

  ### Asking of a split

  - Does a half leave the branch failing lint, typecheck or test? Then keep it together.
  - Is a half not usable on its own? Then keep it together.
  - Do the two touch the same path? Then they are one plan, unless the parts they change are clearly different.
  - Does a piece depend on more than one plan? Then it is its own plan, after all of them, or before them when it holds a shared `config` or `doc`.
  ```

- `work/SKILL.md` の `### 9. Merge` の手順 2

  ```md
  2. Resolve a conflict there. Two plans that changed different parts of the same path keep both changes. When keeping both would change either side's meaning, stop and ask the owner.
  ```

- `### Present` の `Why`
  ```text
  - Why: <read the `Kind` and the `Edge` in the affected, and write what those say and why they make these entries one plan; when two plans change the same path, write the part each one changes; do not list the field names alone>
  ```

### Definition

- `Unit.plan-skill`(kept): cut の規則と `Present` の `Why` が変わるだけで、1 plan 分の作業の形と順序を決めて書けるという主機能は変わらない（`rules/definition.rules.md:35`）。
- `Unit.work-skill`(kept): マージのコンフリクトの扱いが加わるだけで、plan を 1 つずつ片付けられるという主機能は変わらない（`rules/definition.rules.md:35`）。

## 03: close の Verify は、何を見るか

### Research & Trial

- F1: Verify の規則は `### 6. Verify, by Unit` にあり、Notes が「チェックは Unit の機能のものであり、変更のものではない」と定め、`## How not to write this` も同じことを繰り返す。出所: `.pi/skills/close/SKILL.md:114-133,197`
- F2: `## Verified` の形は `### <Unit>` ごとに `Plans:`、`Result:`、`Fixed:` を持ち、`Plans:` は Unit が名指すエントリを切ったプランの `No` を並べる。出所: `.pi/skills/close/references/format.md:39-47,143`
- F3: `references/format.md` も「チェックは Unit の機能のもの」と定め、「変更は work が見た」と続ける。出所: `.pi/skills/close/references/format.md:148-149`
- F4: `scripts/collect.mjs` は `## Collected` だけを作り直し、`## Triage` 以降をそのまま残す。`## Verified` とその項目名は読まないし、書かない。出所: `.pi/skills/close/scripts/collect.mjs:335-340,378-394`
- F5: `scripts/collect.test.ts` は `## Verified` を含む初期ファイルも、検証項目も持たない。出所: `.pi/skills/close/scripts/collect.test.ts:23-27`
- F6: `yolo` は close 段階で「`## Verified` は完成時点で空のまま（それが正常）」と定め、トリアージへの判断、`_ex-change_`、検証をスキップの対象に挙げる。出所: `.pi/skills/yolo/SKILL.md:58,64`
- F7: `plan` の手順（`plan/SKILL.md`）に Acceptance を書く段階はなく、`work` の `### 7. Acceptance` が plan md の `## Acceptance`（`Goal`、`Ran`、`Findings`、`Doubts`）を書く。`README.md` と `README.ja.md` に Verify と Verified の記述はない。出所: `.pi/skills/work/SKILL.md:160-194`、`.pi/skills/plan/references/format.md:317-331`、`README.md:24-29`、`README.ja.md:24-29`
- F8: 過去の `close.md` は `## Verified` に `### Unit.<name>`、`Plans:`、`Result: OK`、`Fixed: なし` を書いている。出所: `cycles/261111-062-dev/close.md:26-40`

### Scope

- In:
  - behaviour: close の Verify は、Unit ごとの機能確認に加えて、今サイクルで変わったところの確認も行う。どちらもエージェントが確認方法を提示し、今サイクルで変わった箇所の説明も行う。
  - format: `## Verified` に、今サイクルで変わったところの確認とその結果を書く項目を足す。
  - prose: `SKILL.md` の `### 6. Verify, by Unit` と `references/format.md` の `## Verified` の説明を、新しい確認に合わせて書き直す。
  - naming: 今サイクルで変わったところの確認に付ける項目名を決める。
- Out:
  - refactor: コードを変えない（`collect.mjs` は `## Verified` を読まないし書かない）。
  - errors: テストを変えない（`collect.test.ts` は `## Verified` を検証していない）。
  - compatibility: `yolo` の close 段階を変えない（検証はスキップのままで、`## Verified` は完成時点で空のまま）。
  - migration: 過去のサイクルの `close.md` は移行しない（記録はその時点の形で残す）。
  - dependency: パッケージ、ライブラリ、外部契約は扱わない。
  - speed: 作業時間や資源の上限は設定しない。
  - security: 秘密情報、権限、露出は扱わない。
  - deploy: 配布やリリースはない。
  - logs and monitoring: 新しい記録や通知は増やさない。

### Context

- C1: Verify の規則は `### 6. Verify, by Unit` にあり、「チェックは Unit の機能のものであり、変更のものではない」と定めている。`## How not to write this` も同じことを繰り返す（F1）。
- C2: `## Verified` は `### <Unit>` ごとに `Plans:`、`Result:`、`Fixed:` を持ち、`Plans:` がその Unit を切ったプランの `No` を並べる（F2）。
- C3: `references/format.md` も「チェックは Unit の機能のもの」「変更は work が見た」と定めている（F3）。
- C4: `collect.mjs` は `## Collected` だけを作り直し、`## Triage` 以降をそのまま残す。`## Verified` とその項目名は読まないし書かない（F4）。
- C5: `collect.test.ts` は `## Verified` を含む初期ファイルも検証項目も持たない（F5）。
- C6: `yolo` は close 段階で `## Verified` を完成時点で空のままにし、検証をスキップする（F6）。
- C7: `plan` の手順に Acceptance を書く段階はなく、`work` の `### 7. Acceptance` が plan md の `## Acceptance` を書く。`README.md` と `README.ja.md` に Verify と Verified の記述はない（F7）。
- C8: 過去の `close.md` は `## Verified` に `### Unit.<name>`、`Plans:`、`Result: OK`、`Fixed: なし` を書いている（F8）。
- C9: オーナーの要望は、Unit ごとの機能確認に加えて、今サイクルで変わったところの確認も行い、どちらもエージェントが確認方法を提示し、変わった箇所の説明も行うこと（`ROADMAP.md` の 030 の ideas）。
- C10: 過去のサイクルの `close.md` は移行しない（`Scope` の `Out` の `migration` についてオーナーの承認を得た）。
- C11: 新しい確認の結果は Unit ごとに書く（`Scope` についてオーナーの承認を得た）。

### Decision

- Status: **accepted**
- Main: close の Verify は、Unit ごとの機能確認に加えて、その Unit を切ったプランが今サイクルで変えたところの確認も行い、どちらも確認方法と変わった箇所の説明を添える
  - Add:
    - `SKILL.md` の `### 6. Verify, by Unit` に、Unit の機能と、その Unit を切ったプランが変えたところの 2 つを、1 回の提示で見る手順（C1, C9, C11, F1）
    - `references/format.md` の `## Verified` に、`Result:` の下の `Change:`（変更の確認の結果）を足す（C2, C9, C11, F2）
  - Update:
    - `SKILL.md` の Notes の「チェックは Unit の機能のものであり、変更のものではない」を、2 つを見る形に変える（C1, C9, F1）
    - `SKILL.md` の View の表の「its function; the acceptance and the merge already looked at the change」を、2 つを見る形に変える（C1, C9, F1）
    - `SKILL.md` の `## How not to write this` の該当行を、2 つを見る形に変える（C1, F1）
    - `references/format.md` の「チェックは Unit の機能のもの」「変更は work が見た」を、2 つを見る形に変える（C3, C9, F3）
    - `references/format.md` の `## Verified` の項目の説明を、新しい項目に合わせる（C2, F2）
  - Drop: なし
- Sub: なし
- Policy:
  - Allowed:
    - Unit ごとに、機能と変更の確認を 1 度に提示してよい（C9, C11）
    - 変更の確認の範囲は、その Unit を名指すエントリを切ったプラン（`Plans:` のプラン）が変えたところとしてよい（C2, F2）
  - Forbidden:
    - acceptance のチェックをそのまま繰り返さない - 変更の確認は、変わった箇所と、それが意図どおりかを示すものであるため（C1, C7, F1, F7）
    - 過去のサイクルの `close.md` を移行しない - 記録はその時点の形で残すため（C8, C10, F8）
    - 変更の説明を `## Verified` に書かない - 何が変わったかは plan md の `Steps` がすでに持っているため（C9, F7）
    - `collect.mjs` と `collect.test.ts` を変えない - `## Verified` を読まず書かず、テストもそれを検証していないため（C4, C5, F4, F5）
    - `yolo` の close 段階を変えない - 検証をスキップするままで、`## Verified` の形を写していないため（C6, F6）

#### Details

- `SKILL.md` の `### 6. Verify, by Unit` の手順 1 と 2

  ```md
  1. Take one Unit at a time: propose how to check its function, and how to check what the plans that cut it changed — the command to run and what to see, or the place to read and what to look for, and the result that means it works.
  2. Explain what changed, in the same message: what every plan in `Plans:` changed, and where.
  ```

- `references/format.md` の `## Verified` の形

  ```md
  ## Verified

  ### <Unit>

  - Plans:
    - `<plan id>`
  - Result: <OK / 見つかったもの / しない — 理由>
  - Change: <OK / 見つかったもの / しない — 理由>
  - Fixed: `_ex-change_` (<commit>)
  ```

- `close/SKILL.md` の新しい文（Notes、View、`## How not to write this`）

  ```text
  The check has two parts: the Unit's function, and the change the plans made.
  | a line under `Users can do` | its function, and the change the plans that cut it made |
  ... the verification is of the Unit's function and the change, in `## Verified`.
  ```

- `close/references/format.md` の `Fields` に足す `Change` の 2 行

  ```md
  - `Change` is `OK` when the owner checked what the plans changed and it is as intended, and what they found when it is not.
  - `Change` is `しない` with the reason on the same line when they will not check.
  ```

- `close/references/format.md` の書き換える 3 行（`Fixed`、148 行、149 行）
  ```text
  written only when the function or the change did not work
  The check has two parts: the Unit's function, and the change the plans made.
  The acceptance saw the plan's work; this check sees the Unit after the merge.
  ```

### Definition

- `Unit.close-skill`(kept): 検証が Unit の機能に加えて今サイクルの変更も見るようになるだけで、サイクル終了後にクロージングできるという主機能は変わらない（`rules/definition.rules.md:35`）。

## 04: yolo は、いつから発動でき、どこまで歩くか

### Research & Trial

- F1: yolo の発動条件は `## When it runs` の表が「オーナーが、ADR の全エントリが accepted の後に開始したとき」と定め、ADR の行を「このスキルの仕事ではない。エントリの accepted も検査もしない」としている。出所: `.pi/skills/yolo/SKILL.md:15-20`
- F2: yolo の `## Procedure` は `### 1. plan`、`### 2. work`、`### 3. close` の 3 段階だけで、ADR のエントリ段階の見出しを持たない。`## How not to write this` は「ADR が accepted しなかった変更を決めない」と定める。出所: `.pi/skills/yolo/SKILL.md:24-66,99-101`
- F3: `adr` は「エントリを判断に移せるのはオーナーだけで、エージェントに権利はなく、この手順は飛ばせない」と 2 か所で定め、`### 5. Decision` は「オーナーの判断（accepted か rejected）を待つ」と定める。出所: `.pi/skills/adr/SKILL.md:168,189,199`
- F4: `adr` の `### 1. Scope`、`### 2. Context`、`### 3. The opening proposal` はオーナーの修正と合意を前提にし、`### 7. Affected` は結果を待たずに次のエントリへ進むと定める。出所: `.pi/skills/adr/SKILL.md:111-124,127-141,143-157,228-238`
- F5: `close` の `### 9. Proposed` は、次サイクルの ADR を「意図を省き、ROADMAP を更新し、エントリを分割し、プリリサーチを走らせ、各エントリの `Context` と `Research & Trial` を埋める。`Scope` は空のまま」と定め、次のセッションは `Scope` から始まるとする。出所: `.pi/skills/close/SKILL.md:171-193`
- F6: yolo の発動点をスキャフォールドの直後に移すと、yolo が歩く範囲は `close` の `### 9. Proposed` が次のセッションへ残す範囲（`Scope` 以降）と重なるが、その重なりを扱う規則はどのスキルにもない。出所: `.pi/skills/yolo/SKILL.md:15-20`、`.pi/skills/close/SKILL.md:171-193`
- F7: `DEFINITION.md` の `yolo-skill` は「オーナーの確認を挟まずにクローズのトリアージまで進めることができる」とあり、`README.md` と `README.ja.md` も「トリアージで止まる」と書く。`plan` と `work` は yolo の plan を worktree として扱う。出所: `DEFINITION.md:28`、`README.md:29`、`README.ja.md:29`、`.pi/skills/plan/references/cut.md:72`、`.pi/skills/work/SKILL.md:190,204,211,218`
- F8: yolo を使った実行の記録は、過去のサイクルにない。出所: `cycles/*/adr.md` と `cycles/*/plan/*.md` の検索

### Scope

- In:
  - behaviour: yolo の発動条件を、ADR の全エントリが accepted の後から、エントリ分割のスキャフォールドができた後（プリリサーチより前）に変え、プリリサーチとエントリ段階（Scope、Context、The opening proposal、Discussion Loop、Decision、Definition）も歩くようにする。
  - format: `## Procedure` の段階の並びに、プリリサーチとエントリ段階を足す。
  - prose: `## When it runs`、`## Procedure`、`## How not to write this` の説明を、新しい発動点と歩く範囲に合わせて書き直す。
  - naming: 新しい段階の見出しの名前を決める。
  - compatibility: `adr` の「オーナーだけがエントリを判断に移せる」規則との関係と、`close` の `### 9. Proposed` が残す範囲との重なり、`README.md` と `README.ja.md` の `yolo` の行（変えない）を決める。
- Out:
  - behaviour: オーナーが開始する権利（エージェントは選べない）と、停止点（トリアージの前）を変えない。
  - refactor: コードを変えない（yolo は文書だけ）。
  - errors: テストを変えない（yolo のテストはない）。
  - migration: 過去の yolo の記録はない（使った記録がないため、移行しない）。
  - dependency: パッケージ、ライブラリ、外部契約は扱わない。
  - speed: 作業時間や資源の上限は設定しない。
  - security: 秘密情報、権限、露出は扱わない。
  - deploy: 配布やリリースはない。
  - logs and monitoring: 新しい記録や通知は増やさない。

### Context

- C1: いまの yolo は、オーナーが ADR の全エントリを accepted にした後に開始でき、ADR を「このスキルの仕事ではない。エントリの accepted も検査もしない」と定める（F1）。
- C2: いまの yolo の `## Procedure` は `### 1. plan`、`### 2. work`、`### 3. close` の 3 段階だけで、エントリ段階の見出しを持たない（F2）。
- C3: `adr` は「エントリを判断に移せるのはオーナーだけで、エージェントに権利はなく、この手順は飛ばせない」と 2 か所で定める（F3）。
- C4: `adr` の `### 1. Scope`、`### 2. Context`、`### 3. The opening proposal` はオーナーの修正と合意を前提にする。`### 7. Affected` は結果を待たずに次のエントリへ進む（F4）。
- C5: `close` の `### 9. Proposed` は、次サイクルの `Context` と `Research & Trial` を先に埋め、`Scope` を空のまま残し、次のセッションは `Scope` から始まると定める（F5）。
- C6: 発動点をスキャフォールドの直後に移すと、yolo が歩く範囲は `close` の `### 9. Proposed` が残す範囲と重なる。重なりを扱う規則は、どのスキルにもない（F6）。
- C7: `DEFINITION.md` の `yolo-skill` は「オーナーの確認を挟まずにクローズのトリアージまで進めることができる」とあり、`README.md` と `README.ja.md` も「トリアージで止まる」と書く（F7）。
- C8: yolo の発動点はオーナーが決め、エージェントは選べない（F1）。
- C9: オーナーの要望は、yolo をエントリ分割のスキャフォールドができた後（プリリサーチより前）から発動できるようにすること（`ROADMAP.md` の 030 の ideas）。
- C10: オーナーの承認により、`close` は変えず、重なりは既存の「通った段階は歩き直さない」規則で扱う。
- C11: オーナーの指示により、`adr.md` の `## Japanese Proofread` は yolo では走らせない。plan の校正をスキップするのと同じ扱いである。

### Decision

- Status: **accepted**
- Main: yolo は、エントリ分割のスキャフォールドができた後（プリリサーチより前）から発動でき、プリリサーチとエントリ段階も歩く
  - Add:
    - `## Procedure` の `### 1. plan` の前に、`adr` の段階（`### 1. adr`）。オーナーの修正と合意を前提にする `adr` の手順を、エージェントの手順として歩き、`affected` は待たない（C2, C4, C9, C11, F2, F4）
    - `## When it runs` の表に、スキャフォールドの後なら動く行と、ADR のエントリ段階もこのスキルが歩く行（C1, C9, F1）
    - エントリ段階の Note に、エージェントがオーナーの代わりをする例外（C3, C9, F3）
    - `## How not to write this` に、エントリ段階を飛ばさないこと（C2, F2）
  - Update:
    - `## When it runs` の「after every entry of the ADR is accepted」を、スキャフォールドの後に変える（C1, C9, F1）
    - `## When it runs` の「started before that」を、スキャフォールドの前に変える（C1, C9, F1）
    - 冒頭の `description` と `# yolo` の説明を、新しい発動点に合わせる（C1, F1）
    - `## When it runs` の ADR の行（このスキルの仕事ではない）を、yolo がエントリ段階を歩く形に変える（C1, C3, F1, F3）
    - `## Procedure` の Note（3 段階）を 4 段階に変える（C2, F2）
  - Drop: なし
- Sub: なし
- Policy:
  - Allowed:
    - エージェントが、エントリを判断に移してよい（C3, C9, F3）
  - Forbidden:
    - `close` の `### 9. Proposed` を変えない - 次のセッションが `Scope` から始まる規則は、yolo 以外の経路のため（C5, C10, F5）
    - 通った段階を歩き直さない - `close` の `### 9. Proposed` が先に埋めた `Context` と `Research & Trial` をやり直さないため（C6, C10, F6）
    - トリアージの前で止まる - 停止点は `close` のものであり、このスキルはそれを動かさないため（C7, F7）
    - `adr.md` の日本語校正を走らせない - plan の校正をスキップするのと同じ扱いにするため（C11）
    - エージェントが yolo を選ばない - 発動点はオーナーが決めるため（C8, F1）
    - 過去の yolo の記録を移行しない - yolo を使った記録がないため（F8）

#### Details

- `yolo/SKILL.md` の `description`

  ```text
  Use when the owner says to run the cycle through without their confirmations, at any time after the entries' scaffold is made.
  ```

- `## When it runs` の表

  ```md
  | the owner starts it, after the entries' scaffold is made | it runs |
  | started before that | it does not run: nothing runs, and it says so |
  | a stage the cycle has passed | that stage is not walked again |
  | the ADR's entry stage | walked here: the agent settles each entry by the checks `When a step cannot run` gives |
  ```

- エントリ段階の Note

  ```md
  Note: the agent takes the owner's place for the entry: it proposes, settles, and moves the entry to the decision.
  ```

- `## Procedure` の `### 1. adr`

  ```md
  ### 1. adr

  Steps:

  1. Walk the adr skill's cycle stage and entry stage, in its order: the pre-research, every entry's `Context`, its `Scope`, the opening proposal, the discussion, the decision, and its `Definition`.
  2. Give each entry's affected to a `research` subagent, and go on without waiting for it.
  3. Go on to the plan.

  Notes:

  - The agent takes the owner's place for the entry: it proposes, settles, and moves the entry to the decision.
  - skips: the Japanese proofread, and the owner's look at every step of the entry stage.
  ```

- `## Procedure` の Note（`three stages` を `four stages` に）
  ```text
  The cycle's four stages run in their order. Each keeps its work. Each loses only its look at the owner.
  ```

### Definition

- `Unit.yolo-skill`(kept): 発動点が早くなるだけで、オーナーの確認を挟まずにクローズのトリアージまで進められるという主機能は変わらない（`rules/definition.rules.md:35`）。
