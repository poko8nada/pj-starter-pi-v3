# ADR 064

## 01: adr は、エントリの Type をどう持ち、Simple は何を省くか

Type: _Full_

### Context

- C1: このサイクルは、`ROADMAP.md` の 030 のうち、ADR に Type（Full と Simple）を設ける部分だけを扱う。030 の他の項目は 063-d で実装済みである。
- C2: いまのエントリは、`## NN: <問い>` のあとに `### Context`、`### Research & Trial`、`### Scope`、`### Decision`、`### Definition` の順に並び、Type の行を持たない。
- C3: いまのエントリ段階は、`Scope` を書いてオーナーに直してもらい、`Decision` に最初の提案を書き、`Scope` の `In` 項目ごとに Discussion Loop で議論する。オーナーが `Decision` に進むと、`Definition` と affected が続く。
- C4: Type の値の表記は `_Full_` と `_Simple_` である（オーナーの回答）。
- C5: Simple でも `Context` と `Research & Trial` は残る。Simple が省略するのは `Scope`、`Decision` の `#### Details`、Discussion Loop である（オーナーの回答）。
- C6: 現在の手順が Full で、Simple は2つ目の型である。Simple では、エージェントが `Decision` を提案として書き、オーナーが直接確認する。
- C7: Type はエントリ分割のときに、エージェントがエントリごとに理由付きで提案する。Type を決めるのはオーナーであり、オーナーは Simple で始めたエントリを途中で Full に変えることができる。
- C8: Simple を提案してよい条件は、`ROADMAP.md` 030 の4つである。git を使えば可逆的な実装であること、機能の統廃合などで Unit を横断しないこと、オーナーの意図の解釈が一意であること、実装の概要を推測でき、実装内容が単一で比較対象がないこと。
- C9: ADR のエントリは Type をどう持ち、Simple はどの手順を省くか。

### Research & Trial

- F1: work は、分岐のない手順をそのまま書き、2つの進め方が分かれる箇所だけを、同じ手順の中の `Worktree:` と `Base:` の箇条書きで分けている。出所: `.pi/skills/work/SKILL.md:54,68,82,96,130,134,147,169,202,224`
- 2つの進め方は `worktree plan`、`base plan`、`the worktree's plan md`、`the base's plan md` の形で指し、`Place` の値は `worktree` と `base` である。出所: `.pi/skills/work/SKILL.md:8,10,36`、`.pi/skills/plan/SKILL.md:8`
- F3: `Place` は plan md の先頭の `- Place: <worktree|base>` が持ち、cut のときに理由付きで提案され、オーナーの回答で決まる。出所: `.pi/skills/plan/references/format.md:13`、`.pi/skills/plan/SKILL.md:53,58`
- plan のスキャフォールドは `--place <worktree|base>` を引数に取る。出所: `.pi/skills/plan/SKILL.md:68`
- 後続の yolo は、`base` plan の owner look を、base でエージェントが実行する check に置き換える。出所: `.pi/skills/yolo/SKILL.md:92`
- F6: `section()` は `### Name` に完全一致する行を探し、その次の行から次の `### ` までを返すので、`## NN:` と `### Context` の間の `Type:` 行はどのセクションにも入らない。出所: `.pi/skills/adr/scripts/adr.mjs:83,87`
- F7: `checkEntry()` は `## NN:` でエントリを分割し、`Context`・`Research & Trial`・`Decision` のセクションだけから `C` と `F` を読むので、`Type:` 行を参照にも重複にも数えない。出所: `.pi/skills/adr/scripts/adr.mjs:143,148,149,160`
- F8: `lastEntryNumber()`、`entryNumbers()`、`renumberEntries()`、`setEntryTitle()`、`deleteEntry()` は `## NN:` の見出し行と本体の先頭行だけを扱い、見出しの直後に増える行を書き換えない。出所: `.pi/skills/adr/scripts/cycle.mjs:10,30,93,122,135`
- F9: `--add` は `entrySkeleton` を追記し、`--set` は `setEntryTitle` で題名だけを変える。どちらも `Type:` 行を持たない。出所: `.pi/skills/adr/scripts/index.mjs:95,102,150`
- テストは `entrySkeleton` の見出しの並び（`## 01: <問い>` の次が `### Context`）と、`Type:` 行のない inline ADR を固定している。出所: `.pi/skills/adr/scripts/index.test.ts:228,255,594`
- F11: plan のスクリプトは `adr.md` からエントリ番号だけを読み、close の `collect.mjs` は `adr.md` を読まない。出所: `.pi/skills/plan/scripts/index.mjs:48`、`.pi/skills/close/scripts/collect.mjs:348`

### Scope

- In:
  - behaviour: adr スキルは、エントリ分割で各エントリの Type を理由付きで提案し、Simple では `Scope`、Discussion Loop、`#### Details` を省いて、`Decision` の提案をオーナーが直接確認する。
  - format: `adr.md` のエントリの見出しの直後に `Type:` の行を置き、Simple の `Scope` と `#### Details` を `_omission_` にする。
  - naming: `Type`、`_Full_`、`_Simple_`、`_omission_` の名前と表記を決める。
  - prose: `SKILL.md` と `adr.format.md` に、Type の提案、Simple の条件、Simple から Full への変更、Simple の `Decision` の確認手順を書く。
- Out:
  - refactor: スクリプトの骨組みと引数は変えない（02 の関心事）。
  - errors: `--check` の検査は変えない（02 の関心事）。
  - compatibility: 既存の記録に `Type:` 行を加えない（記録はその時点の形で残す）。
  - migration: 既存の記録やインストール済みのバージョンを移さない（この変更は文書と手順だけである）。
  - dependency: パッケージ、ライブラリ、外部契約は扱わない。
  - speed: 作業時間や資源の上限は設定しない。
  - security: 秘密情報、権限、露出は扱わない。
  - deploy: 配布やリリースはない。
  - logs and monitoring: 新しい記録や通知は増やさない。

### Decision

- Status: **accepted**
- Main: adr のエントリは `Type:` を持ち、Full と Simple の2つの手順に分かれる。Full は現在の手順で、Simple は `Scope` と `#### Details` を `_omission_` にし、Discussion Loop を省いて、`Decision` の提案をオーナーが直接確認する（C1）。
  - Add:
    - エントリの見出しの直後の `Type:` 行（`_Full_` または `_Simple_`）（C2, C4, C9, F6, F7, F8, F9, F11）
    - エントリ分割における、各エントリの Type と理由の提案（C7, F3）
    - Simple を提案してよい4つの条件（C8）
    - Simple のエントリ段階（`Scope` を `_omission_` にし、Discussion Loop を省く、`#### Details` を `_omission_`）（C5, C6）
    - Simple から Full への変更の手順（C7）
    - `adr.format.md` の Type と `_omission_` の定義（C4, C9）
  - Update:
    - `## One entry` の手順を、Full と Simple の2つの進め方に分ける（C3, C6, F1）
    - `### 3. Entries` の分割の提案に、Type の提案を加える（C7）
    - `Scope` と `#### Details` の Note に、Simple の `_omission_` を加える（C5）
  - Drop:
    - なし
- Sub: なし
- Policy:
  - Allowed:
    - Simple から Full への変更（C7）
    - 分割のときの Full から Simple への変更（C7）
  - Forbidden:
    - エージェントが Type を決めること - Type を決めるのはオーナーである（C7）
    - Simple の条件を満たさないエントリを Simple として提案すること - Simple は軽い手順なので、条件を省くと判断が抜ける（C8）
    - Discussion Loop が始まった後に Full から Simple へ変えること - 定まった議論を捨てるため（C7）

#### Details

- `adr/SKILL.md` の `### 3. Entries` の手順（手順 5 の 3 行はそのまま残し、02 が変える）

  ```md
  ### 3. Entries

  Steps:

  1. Split the cycle into entries. One entry has one `Main`.
  2. Propose each entry's `Type` with its reason, in the split's order, and show it with the split:
     - `Type` is `_Full_` or `_Simple_`.
     - A Simple proposal meets all of these:
       - the change is reversible with git.
       - it crosses no Unit, as merging functions would.
       - the owner's intent has a single reading.
       - the outline of the work is inferable, and there is one way to do it, with nothing to compare.
     - The reason names the conditions the entry meets, when the proposal is Simple.
  3. Show the owner the split, each entry's intent, and each entry's `Type`.
  4. Rewrite a rejected split, and show it again. When only a `Type` is rejected, keep the split, and write the owner's `Type` for that entry.
  5. Add every agreed entry at once, in the split's order, with the scaffold.
  ```

- `adr/SKILL.md` の `## One entry` の冒頭の文

  ```md
  The entry stage runs once per entry, in the order the split gave. An entry is `_Full_` or `_Simple_`. A Simple entry keeps `Scope` and `#### Details` as `_omission_` and skips `### 1. Scope` and `### 3. Discussion Loop`. A Full entry walks the steps below.
  ```

- `adr/SKILL.md` の `### 0. Type` の新しい見出し

  ```md
  ### 0. Type

  Steps:

  1. Read the entry's `Type:` line.
  2. When the owner changes a Simple entry to Full before the `Decision`'s confirmation, write `_Full_` in the line, and walk the steps from `### 1. Scope` as a Full entry.

  Notes:

  - The owner decides the `Type`; the agent writes it.
  - A Full entry does not become Simple after the entry stage starts.
  ```

- `adr/SKILL.md` の `### 2. The opening proposal` の新しい手順

  ```md
  ### 2. The opening proposal

  Steps:

  1. Read the entry's `Context` and its pre-research facts in `Research & Trial`, and what they decide.
  2. Read the `Decision` section of `references/adr.format.md`.
  3. Write the opening proposal in the entry's `Decision`, with `Status` empty:
     - Full: with `#### Details` `なし`.
     - Simple: with `#### Details` kept as `_omission_`.
  4. Say what the facts decide and what the proposal is, and go on:
     - Full: go to the Discussion Loop.
     - Simple: go to the `Decision`.
  ```

- `adr/SKILL.md` の `### 4. Decision` の新しい手順

  ```md
  ### 4. Decision

  Steps:

  1. Check that every `C` and every `F` is carried.
  2. When a `C` is not carried:
     - Full: explain it to the owner. When they say it no longer limits the entry, remove its `C<n>:` label and keep the item in `Context` as a plain bullet. Otherwise return to section 3.
     - Simple: add it to the proposal, and ask the owner again.
  3. When an `F` is not carried, remove its `F<n>:` label and keep the fact in `Research & Trial` as a plain bullet. Do not delete the content.
  4. Wait for the owner's judgement:
     - Full: `accepted` or `rejected`, after the discussion.
     - Simple: `accepted` or `rejected`, on the proposal directly.
  5. Write `Status`.
  ```

- `adr.format.md` の `## Shape` の Type の行

  ```md
  ## <NN>: <問い>

  Type: _Full_

  ### Context
  ```

- `adr.format.md` の `## Type` の新しいセクション

  ```md
  ## Type

  The entry's way of working.

  - The line sits under the entry's heading, before `Context`: `Type: _Full_` or `Type: _Simple_`.
  - `_Full_` walks every step of the entry stage.
  - `_Simple_` keeps `Scope` and `#### Details` as `_omission_`, does not walk the `Scope` step or the Discussion Loop, and settles the `Decision` with the owner directly.
  - `_omission_` means the entry does not record the item because of its type. `なし` means the item has nothing to record. A Full entry uses `なし`; a Simple entry uses `_omission_`.
  ```

- `adr.format.md` の `## Entries` に加える行

  ```md
  - Every entry has one `Type:` line under its heading, before `Context`.
  ```

- `adr.format.md` の `## Scope` に加える行

  ```md
  - A Simple entry's body is `_omission_`.
  ```

- `adr.format.md` の `## Decision` の `#### Details` の規則

  ```md
  - When `#### Details` has nothing, write `なし` under it. A Simple entry's body is `_omission_`.
  ```

### Definition

- `Unit.adr-skill`(kept): エントリに Type が増え、Simple の進め方が加わるだけで、オーナーが Type を決め、エージェントが記録するという主機能は変わらない（`rules/definition.rules.md:35`）。
- `Who.owner`(kept): Type を決めるのがオーナーであるという役割は、いまの「判断をする」から変わらない。

## 02: adr のスクリプトは、Type をどう受け取り、骨組みと検査にどう出すか

Type: _Full_

### Context

- C1: このサイクルは、`ROADMAP.md` の 030 のうち、ADR に Type（Full と Simple）を設ける部分だけを扱う。030 の他の項目は 063-d で実装済みである。
- C2: `--add <title>` はエントリを追記して `affected/<NN>.md` を作る。`--set <NN> <title>` は `adr.md` と affected の見出しを変える。骨組みを `entrySkeleton` が返し、Type の行を持たない。
- C3: `--check` は `C<n>` と `F<n>` の重複、未知の参照、`Decision` が参照していない項目を調べる。セクションの並びと Type は検査しない。
- C4: Type の行の形は 01 で決める。`## NN: <問い>` の直後に `Type: _Full_` または `Type: _Simple_` を置く形を前提にする。
- C5: Type は `--add` と `--set` の両方で受け取れるようにする（`ROADMAP.md` 030）。
- C6: スクリプトが Type を受け取り、骨組みに Type の行を出し、`--check` が Type を検査する。古い呼び出しを壊さないようにする。
- C7: `--add` と `--set` は Type をどう受け取り、骨組みと検査にどう反映するか。

### Research & Trial

- F1: `parseArgs` は `--add` の次の1値を題名、`--set` の次の2値を番号と題名として読み、テストがその形を固定している。出所: `.pi/skills/adr/scripts/cycle.mjs:251,267`、`.pi/skills/adr/scripts/index.test.ts:169,177`
- F2: `entrySkeleton` は `## NN: <問い>` の次を空行、その次を `### Context` にする骨組みを返し、`Type:` 行を持たない。出所: `.pi/skills/adr/scripts/adr.mjs:9`
- F3: `--add` は `entrySkeleton` を `adr.md` に追記して `affected/<NN>.md` を作り、`--set` は `adr.md` と `affected/<NN>.md` の題名を置換する。出所: `.pi/skills/adr/scripts/index.mjs:95,102,150,155`
- F4: `--check` は `Context`・`Research & Trial`・`Decision` のセクションだけを読み、見出し直後の行を検査しない。出所: `.pi/skills/adr/scripts/adr.mjs:148,149,160`
- F5: テストは骨組みの見出しの並び、`entry()` helper、`--check` の inline ADR、`--add`/`--set`/`--delete` の CLI を固定している。出所: `.pi/skills/adr/scripts/index.test.ts:212,228,255,521,540,553,578,594`
- F6: `--add` と `--set` の呼び出し元は `adr/SKILL.md` の scaffold の行だけであり、`close` は scaffold が次サイクルの `adr.md` を書く、と記すだけである。出所: `.pi/skills/adr/SKILL.md:55,57`、`.pi/skills/close/SKILL.md:192`
- plan のスクリプトは `adr/scripts/cycle.mjs` から `entryNumbers` を取り込み、`## NN:` の番号だけを読む。出所: `.pi/skills/plan/scripts/index.mjs:9,48`
- `product-ready` と `harness-sync` は `adr.md` を読まず、`scripts/` に `adr.md` を読む検査はない。出所: `scripts/product-ready/index.mjs:7`、`scripts/harness-sync/index.mjs:3`

### Scope

- In:
  - behaviour: `--add` と `--set` が Type を受け取り、`adr.md` と `affected/<NN>.md` の骨組みに Type 行を書く。Simple のときは `Scope` と `#### Details` に `_omission_` を書く。
  - refactor: `parseArgs`、`entrySkeleton`、`index.mjs` の呼び出しと用法の注釈を、Type を受け取る形に変える。
  - format: `entrySkeleton` が返す骨組みに `Type:` 行を加え、Simple の `Scope` と `#### Details` を `_omission_` にする。
  - naming: Type の引数の名前、位置、既定値を決める。
  - prose: `SKILL.md` の `--add` と `--set` の説明を、新しい引数に合わせる。
  - errors: `--check` が Type 行の有無と値を検査する。
  - compatibility: 古い `--add <title>` と `--set <NN> <title>` の呼び出しを壊さない。
- Out:
  - migration: 既存の `cycles/*/adr.md` は移行しない（`--check` は開いているサイクルだけを読む）。
  - dependency: パッケージ、ライブラリ、外部契約は扱わない。
  - speed: 作業時間や資源の上限は設定しない。
  - security: 秘密情報、権限、露出は扱わない。
  - deploy: 配布やリリースはない。
  - logs and monitoring: 新しい記録や通知は増やさない。

### Decision

- Status: **accepted**
- Main: adr のスクリプトは Type を受け取り、骨組みに Type 行を書き、Simple の `Scope` と `#### Details` に `_omission_` を書き、`--check` が Type 行を検査する（C1, C7）。
  - Add:
    - `--add` と `--set` の Type の引数。`--set` は Type 行と、Scope と `#### Details` の本文も、新しい Type の形に書き換える（C5, F1）
    - `entrySkeleton` が返す `Type:` 行（C2, C4, F2）
    - Simple の `Scope` と `#### Details` の `_omission_`（C4, C6）
    - `--check` の Type 行の検査（C3, C4, F4）
    - 新しい引数と骨組みのテスト（C6, F5）
  - Update:
    - `parseArgs` が Type を読む形（C5, F1）
    - `index.mjs` の `--add` と `--set` の分岐（C6, F3）
    - `SKILL.md` の `--add` と `--set` の行と、`index.mjs` の用法の注釈（C6, F6）
    - 古い引数の形を固定しているテスト（C6, F5）
  - Drop:
    - なし
- Sub: なし
- Policy:
  - Allowed:
    - 古い `--add <title>` と `--set <NN> <title>` の呼び出し（C5, F1）
  - Forbidden:
    - Type を省略した `--set` で既存の Type を変えること - 呼び出し元の意図しない変更になるため（C5, F1）
    - 過去の `cycles/*/adr.md` を検査すること - `--check` は開いているサイクルだけを読むため（C6）

#### Details

- `adr.mjs` の Type の部品

  ```js
  /**
   * `Type:` 行を返す。
   * @param {'Full' | 'Simple'} type
   * @returns {string}
   */
  export function typeLine(type) {
    return type === 'Simple' ? 'Type: _Simple_' : 'Type: _Full_';
  }

  /**
   * `### Scope` の本文を返す。
   * @param {'Full' | 'Simple'} type
   * @returns {string}
   */
  export function scopeBody(type) {
    if (type === 'Simple') return '_omission_';
    return `- In:
    - <kind>: <何をするか>
  - Out:
    - <kind>: <何をしないか>（理由）`;
  }

  /**
   * `#### Details` の本文を返す。
   * @param {'Full' | 'Simple'} type
   * @returns {string}
   */
  export function detailsBody(type) {
    if (type === 'Simple') return '_omission_';
    return `- <フェンスのタイトル>
  \`\`\`text
  <決まったコードや文書>
  \`\`\``;
  }
  ```

- `adr.mjs` の `sectionRange` と `sectionAt`

  ```js
  /**
   * `heading` の行番号の範囲を返す。見出しがなければ `null` を返す。
   * @param {readonly string[]} lines
   * @param {string} heading
   * @returns {{ start: number, end: number } | null}
   */
  export function sectionRange(lines, heading) {
    const start = lines.indexOf(heading);
    if (start === -1) return null;
    const level = /^#+/u.exec(heading)[0].length;
    const end = lines.findIndex(
      (line, index) =>
        index > start && /^(#+)\s/u.test(line) && /^#+/u.exec(line)[0].length <= level,
    );
    return { start, end: end === -1 ? lines.length : end };
  }

  /**
   * `### <name>` のセクションの本文を返す。セクションがなければ空文字を返す。
   * @param {string} entry
   * @param {string} name
   * @returns {string}
   */
  function section(entry, name) {
    return sectionAt(entry, `### ${name}`);
  }

  /**
   * `heading` の本文を返す。見出しがなければ空文字を返す。
   * @param {string} entry
   * @param {string} heading
   * @returns {string}
   */
  function sectionAt(entry, heading) {
    const lines = entry.split('\n');
    const range = sectionRange(lines, heading);
    if (range === null) return '';
    return lines.slice(range.start + 1, range.end).join('\n');
  }
  ```

- `adr.mjs` の `entrySkeleton` と `adrSkeleton` の変更

  ```js
  export function entrySkeleton(nnn, title, type = 'Full') {
    const q = title === undefined ? '<問い>' : title;
    return `## ${String(nnn).padStart(2, '0')}: ${q}
  ```

${typeLine(type)}

### Context

- C1: <前提。いまの振る舞い>
- C2: <制約。上限、変えないと決めたこと>
- C3: <意図。オーナーの意図と意志>

### Research & Trial

- F1: <事実>。出所: <出所>

### Scope

${scopeBody(type)}

### Decision

- Status:
- Main: <この関心事は、何がどうなるか>
  - Add:
    - <増えるもの>（C1）
  - Update:
    - <変わるもの（何がどうなるか）>（C1）
  - Drop:
    - <消えるもの>（F1）
- Sub: <この関心事は、何がどうなるか>
  - Add:
    - <増えるもの>（C1）
  - Update:
    - <変わるもの（何がどうなるか）>（C1）
  - Drop:
    - <消えるもの>（F1）
- Policy:
  - Allowed:
    - <して良いこと>（C2）
  - Forbidden:
    - <明示的にしてはいけないこと> - <しない理由>（C2）

#### Details

${detailsBody(type)}

### Definition

- \`Unit.<name>\`(updated): <新しい行>
- \`Unit.<name>\`(kept): <その行が動かない理由>
  `;
  }

  export function adrSkeleton(nnn, title, type = 'Full') {
  return `# ADR ${String(nnn).padStart(3, '0')}

${entrySkeleton(1, title, type)}`;
}

````

- `cycle.mjs` の `replaceSection` と `setEntryType`

```js
import { detailsBody, entrySkeleton, scopeBody, sectionRange, typeLine } from './adr.mjs';

/**
 * `heading` の本文を `body` に置き換える。見出しがなければエラーを投げる。
 * @param {string} entry
 * @param {string} heading
 * @param {string} body
 * @returns {string}
 */
function replaceSection(entry, heading, body) {
  const lines = entry.split('\n');
  const range = sectionRange(lines, heading);
  if (range === null) throw new Error(`section not found: ${heading}`);
  return [
    ...lines.slice(0, range.start + 1),
    '',
    ...body.split('\n'),
    '',
    ...lines.slice(range.end),
  ].join('\n');
}

/**
 * 番号 `nn` のエントリーの題名、Type 行、`### Scope` と `#### Details` の本文を、
 * `type` の形に置き換える。エントリがなければエラーを投げる。
 * @param {string} markdown
 * @param {number} nn
 * @param {string} title
 * @param {'Full' | 'Simple'} type
 * @returns {string}
 */
export function setEntryType(markdown, nn, title, type) {
  const { head, bodies } = splitEntries(markdown);
  let found = false;
  const next = bodies.map((body) => {
    if (bodyNumber(body) !== nn) return `## ${body}`;
    found = true;
    let entry = body.replace(/^\d{2}:\s*[^\n]*/, `${body.slice(0, 2)}: ${title}`);
    entry = entry.replace(/^Type: .*$/mu, typeLine(type));
    entry = replaceSection(entry, '### Scope', scopeBody(type));
    entry = replaceSection(entry, '#### Details', detailsBody(type));
    return `## ${entry}`;
  });
  if (!found) throw new Error(`entry not found: ${String(nn).padStart(2, '0')}`);
  return `${head}${next.join('')}`;
}
````

- `cycle.mjs` の `parseArgs` の Type

  ```js
  /**
   * `Full` か `Simple` ならその値を返し、そうでなければ `null` を返す。
   * @param {string | undefined} value
   * @returns {'Full' | 'Simple' | null}
   */
  function typeArg(value) {
    return value === 'Full' || value === 'Simple' ? value : null;
  }

  // `--add`
  const addType = typeArg(argv[i + 2]) ?? 'Full';
  add = { title: value, type: addType };
  i += typeArg(argv[i + 2]) === null ? 1 : 2;

  // `--set`
  const setType = typeArg(argv[i + 3]);
  set = { nn: n, title: titleValue, type: setType };
  i += setType === null ? 2 : 3;
  ```

- `index.mjs` の `--add` と `--set`

  ```js
  // `--add`（開いたサイクル）
  writeFileSync(adrPath, append(current, entrySkeleton(next, add.title, add.type)));
  writeFileSync(path, affectedEntrySkeleton(next, add.title));

  // `--add`（新しいサイクル）
  writeFileSync(join(leaf, 'adr.md'), adrSkeleton(nnn, add.title, add.type));
  writeFileSync(affectedPath(leaf, 1), affectedEntrySkeleton(1, add.title));

  // `--set`
  const markdown = readFileSync(adrPath, 'utf8');
  writeFileSync(
    adrPath,
    set.type === null
      ? setEntryTitle(markdown, set.nn, set.title)
      : setEntryType(markdown, set.nn, set.title, set.type),
  );
  if (existsSync(path)) {
    writeFileSync(path, setEntryTitle(readFileSync(path, 'utf8'), set.nn, set.title));
  }
  ```

- `adr.mjs` の `checkEntry` の Type と omission

  ```js
  /**
   * エントリの `Type:` の値を返す。行がなければ `null` を返す。
   * @param {string} entry
   * @returns {string | null}
   */
  function typeOf(entry) {
    const head = beforeHeading(entry, '### Context');
    const found = /^Type: (.*)$/mu.exec(head);
    return found ? found[1] : null;
  }

  export function checkEntry(markdown) {
    const problems = [];
    const entries = markdown.split(/^## (?=\d{2}:)/mu).slice(1);
    for (const body of entries) {
      const nn = body.slice(0, 2);
      const type = typeOf(body);
      if (type === null) problems.push(`${nn}: Type is missing`);
      else if (type !== '_Full_' && type !== '_Simple_') {
        problems.push(`${nn}: Type is not _Full_ or _Simple_: ${type}`);
      }
      if (type === '_Simple_') {
        if (section(body, 'Scope').trim() !== '_omission_') {
          problems.push(`${nn}: Simple Scope is not _omission_`);
        }
        if (sectionAt(body, '#### Details').trim() !== '_omission_') {
          problems.push(`${nn}: Simple Details is not _omission_`);
        }
      } else if (type === '_Full_') {
        if (section(body, 'Scope').trim() === '_omission_') {
          problems.push(`${nn}: Full Scope is _omission_`);
        }
        if (sectionAt(body, '#### Details').trim() === '_omission_') {
          problems.push(`${nn}: Full Details is _omission_`);
        }
      }
      const cs = labels(section(body, 'Context'), /^- C(\d+):/gmu);
      // ... 今の C/F の検査をそのまま続ける ...
    }
    return problems;
  }
  ```

- `index.test.ts` の `--check` の inline ADR と、加える場合

  ```text
  既存の inline ADR に `Type: _Full_` を加える。
  加える場合: Type がない、Type の値が違う、Simple の Scope が `_omission_` でない、
  Simple の Details が `_omission_` でない、Full の Scope が `_omission_`、Full の Details が `_omission_`。
  ```

- `SKILL.md` の `### 3. Entries` の手順 5 の 3 行

  ```md
  5. Add every agreed entry at once, in the split's order, with the scaffold:
     - `node .pi/skills/adr/scripts/index.mjs --add <title> [Full|Simple]` appends an entry with the title and `Type` to the end of `adr.md` and creates `affected/<NN>.md`.
     - `node .pi/skills/adr/scripts/index.mjs --delete <NN>` deletes entry `NN` from `adr.md` and `affected/<NN>.md`, and renumbers the rest.
     - `node .pi/skills/adr/scripts/index.mjs --set <NN> <title> [Full|Simple]` replaces the title of entry `NN` in `adr.md` and `affected/<NN>.md`. When the `Type` is given, it also writes the `Type:` line, `Scope` and `#### Details` in `adr.md` in that `Type`'s shape; when it is omitted, the `Type` stays.
  ```

- `index.mjs` の用法の注釈

  ```js
  /**
   * index — adr と affected の入口。
   *
   *   node index.mjs --root <dir> --add <title> [Full|Simple]
   *   node index.mjs --root <dir> --delete <NN>
   *   node index.mjs --root <dir> --set <NN> <title> [Full|Simple]
   *   node index.mjs --root <dir> --check
   */
  ```

### Definition

- `Unit.adr-skill`(kept): スクリプトが Type と omission を書くようになるだけで、オーナーが Type を決め、エージェントが記録するという主機能は変わらない（`rules/definition.rules.md:35`）。

## 03: plan・close・yolo は、Simple のエントリをどう読むか

Type: _Full_

### Context

- C1: このサイクルは、`ROADMAP.md` の 030 のうち、ADR に Type（Full と Simple）を設ける部分だけを扱う。030 の他の項目は 063-d で実装済みである。
- C2: plan は ADR の `Main`、`Sub`、`Policy`、`Scope`、`Definition` を読み、レビューに送る。`Goal` は plan が `Main` から作る。
- C3: close は次サイクルの ADR で、intent を省き、`ROADMAP.md` を更新し、エントリを分割し、プリリサーチを実行し、`Context` と `Research & Trial` を書く。`Scope` は空にし、次セッションは `Scope` から始まる。
- C4: yolo はエントリ段階で、`Context`、`Scope`、最初の提案、Discussion Loop、`Decision`、`Definition` の順に歩く。
- C5: Simple でも `Context` と `Research & Trial` は残る（オーナーの回答）。
- C6: 01 が Simple を設けたあと、plan・close・yolo の記述が Simple のエントリと食い違わないようにする。plan は `_omission_` を省略として読み、close は Type を次セッションに残し、yolo は Simple で `Scope` と Discussion Loop を歩かない。
- C7: plan・close・yolo は Simple のエントリをどう読むか。

### Research & Trial

- F1: plan は対象のエントリの `Main` 行から `Goal` を作り、`Sub`・`Policy`・`Scope`・`Definition` を ADR 対照レビューに送る。出所: `.pi/skills/plan/SKILL.md:25,184`、`.pi/skills/plan/references/tasks.md:45`
- F2: plan は `Definition` をスコープの境界とし、`Scope` を越える手順を書かないと定めるが、`Scope` が空や `_omission_` であることを検査するテストはない。出所: `.pi/skills/plan/SKILL.md:24`、`.pi/skills/plan/references/format.md:216`、`.pi/skills/plan/scripts/index.test.ts:127`
- F3: plan の初回レビューは ADR を照合せず、ADR 対照レビューだけが `Scope` を読む。出所: `.pi/skills/plan/SKILL.md:173,177,184`
- F4: close は次サイクルの ADR で、提案項目を意図抜きで移し、`ROADMAP.md` の更新、分割、プリリサーチ、`Context` と `Research & Trial` の充填の順に行う。`Scope` は空にし、次セッションは `Scope` から始まる。出所: `.pi/skills/close/SKILL.md:176,177,193`、`.pi/skills/close/references/format.md:111`
- F5: close の `collect.mjs` は plan md だけを読み、`adr.md` を読まない。出所: `.pi/skills/close/scripts/collect.mjs:348`
- F6: yolo の adr 段階は、プリリサーチ、各エントリの `Context`、`Scope`、最初の提案、議論、決定、`Definition` を順に歩く。エントリ段階の手順は省かず、失われるのはオーナーへの提示だけである。出所: `.pi/skills/yolo/SKILL.md:30,115`
- work は ADR の欄を読まず、`adr.md` を文書コミットの対象としてだけ扱う。出所: `.pi/skills/work/SKILL.md:22,42`

### Scope

- In:
  - behaviour: plan は Simple の `Scope` と `#### Details` の `_omission_` を省略として読み、close は次のサイクルの分割で Type を提案して次のセッションに残し、yolo は Simple のエントリで `Scope` と Discussion Loop を歩かない。
  - format: close の次サイクルの表と、次のセッションの開始位置を `Scope` から `Type` に変える。
  - prose: plan の `references/tasks.md` と、close・yolo の `SKILL.md` と `references` の、ADR の読み方の記述を直す。
- Out:
  - refactor: plan・close・yolo のスクリプトは変えない（plan のスクリプトはエントリ番号だけを読み、close の `collect.mjs` は `adr.md` を読まない）。
  - naming: セクションと欄の名前は変えない。
  - errors: 新しい検査やテストは加えない（このエントリは読み方の文書だけである）。
  - compatibility: 既存の `cycles/*/adr.md` を読む形は変えない（記録はその時点の形で残す）。
  - migration: 既存の記録を移行しない。
  - dependency: パッケージ、ライブラリ、外部契約は扱わない。
  - speed: 作業時間や資源の上限は設定しない。
  - security: 秘密情報、権限、露出は扱わない。
  - deploy: 配布やリリースはない。
  - logs and monitoring: 新しい記録や通知は増やさない。

### Decision

- Status: **accepted**
- Main: plan・close・yolo は、Simple のエントリの `_omission_` を省略として読み、次のセッションの開始位置を Type にし、Simple では `Scope` と Discussion Loop を歩かない（C1, C7）。
  - Add:
    - plan のレビュー用タスク文に、Simple の `Scope` と `#### Details` の `_omission_` を省略として読む規則（C2, C5, C6, F1, F2, F3）
    - close の次のセッションの開始位置を Type にする規則（C3, C6, F4）
    - close の分割で Type を提案し、次のセッションに残す規則（C3, C6, F4）
    - yolo の Simple のエントリで `Scope` と Discussion Loop を歩かない規則（C4, C6, F6）
  - Update:
    - plan の `references/tasks.md` のレビュー用タスク文（C6, F1, F3）
    - close の `SKILL.md` の `### 9. Proposed` の手順と、`references/format.md` の表（C3, C6, F4）
    - yolo の `SKILL.md` の adr 段階の手順 1（C6, F6）
  - Drop:
    - なし
- Sub: なし
- Policy:
  - Allowed:
    - Simple の `_omission_` を省略として読む（C2, C5, C6）
  - Forbidden:
    - Simple の `Scope` を、範囲を決めていないものとして扱うこと - `_omission_` は省略である（C2, C5, C6）
    - 3つのスキルのスクリプトを変えること - 読み方の文書だけを変えるため（C6, F5）

#### Details

- `plan/references/tasks.md` の `## Review of a plan against the ADR` の手順 1 に加える行

  ```text
     - When the entry is Simple, its `Scope` and `#### Details` are `_omission_`. Read the omission as the entry not recording them, not as an empty scope. The plan's range is held by `Definition`.
  ```

- `close/SKILL.md` の `### 9. Proposed` の手順 1、2、View、Notes

  ```md
  ### 9. Proposed

  Steps:

  1. Take the `**proposed**` lines to the next cycle's ADR: omit the intent; first update `ROADMAP.md`; then split the entries, proposing each entry's `Type`; then run the pre-research; then fill each entry's `Context` and `Research & Trial`.
  2. Leave the `Scope` as the scaffold wrote it. Do not commit the next cycle's files.
  3. Stop there: another session starts from the next cycle's ADR.

  View:

  | the next cycle          | what is filled                           |
  | ----------------------- | ---------------------------------------- |
  | `ROADMAP.md`            | the proposed items                       |
  | each entry              | `Type`, `Context` and `Research & Trial` |
  | each `affected/<NN>.md` | the scaffold                             |
  | `Scope`                 | the scaffold's                           |

  Notes:

  - The intent is omitted; this is not the normal ADR.
  - The next cycle's `adr.md` and `affected/*.md` are written by the adr skill's scaffold and the pre-research.
  - The next session starts at the entry's `Type`.
  - The files are not committed.
  ```

- `close/references/format.md` の `### **proposed**` の手順

  ```md
  ### `**proposed**`

  - The next cycle's ADR takes it.
  - The close updates the roadmap, splits the next cycle's entries, proposes each entry's `Type`, runs the pre-research, and fills each entry's `Context` and `Research & Trial`.
  - The close leaves the `Scope` as the scaffold wrote it and commits nothing of the next cycle.
  - `Then:` is what the next cycle should discuss.
  ```

- `yolo/SKILL.md` の `### 1. adr` の手順 1

  ```md
  1. Walk the adr skill's cycle stage and entry stage, in its order, from where the cycle stands: the pre-research, every entry's `Context`, its `Scope`, the opening proposal, the discussion, the decision, and its `Definition`. A `_Simple_` entry skips its `Scope` and the discussion. A stage the cycle has passed is not walked again.
  ```

- `yolo/SKILL.md` の `## How not to write this` の 1 行

  ```md
  - When you walk the entry stage: do not skip a step of it, except the steps a `_Simple_` entry skips by its `Type`. The steps are walked, and only their look at the owner is lost.
  ```

### Definition

- `Unit.plan-skill`(kept): レビュー用のタスク文に omission の読み方が増えるだけで、1 plan 分の作業の形と順序を決めて書けるという主機能は変わらない（`rules/definition.rules.md:35`）。
- `Unit.close-skill`(kept): 次のセッションの開始位置が Scope から Type に変わるだけで、サイクル終了後にクロージングできるという主機能は変わらない（`rules/definition.rules.md:35`）。
- `Unit.yolo-skill`(kept): Simple のエントリで Scope と Discussion Loop を歩かなくなるだけで、オーナーの確認を挟まずにクローズのトリアージまで進められるという主機能は変わらない（`rules/definition.rules.md:35`）。
