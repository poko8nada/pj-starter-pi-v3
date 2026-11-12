# PLAN `adr-type`

- No: 01, 02
- Place: worktree
- Boundary Plans: なし

## Goal

ADR のエントリが Type を持ち、スクリプトが Type と omission を書く

## Design

- Inside:
  - Modules: `adr.mjs` に `typeLine`、`scopeBody`、`detailsBody` を足し、`entrySkeleton` と `cycle.mjs` の `setEntryType` で共有する。`section` の本文を `sectionAt` に移し、`sectionRange` を `checkEntry` と `replaceSection` で共有する。Type の形とセクションの範囲を1か所に置くため。
  - Dirs: なし
- Outside:
  - Extract: なし
  - Colocate: なし

## Files

```text
.pi/
  skills/
    adr/
      references/
        adr.format.md         update
      scripts/
        adr.mjs               update
        affected.mjs
        cycle.mjs             update
        index.mjs             update
        index.test.ts         update
      SKILL.md                update
    plan/
      scripts/
        index.mjs
```

## Slices

## 1.format に Type と omission を足す

エントリの Type と Simple の omission を、ADR の形として定める。

### Types

なし

### Steps

1. `.pi/skills/adr/references/adr.format.md`
   1. update: `## Shape` の例の `## <NN>: <問い>` の直後に Type の行を置く。

      ```md
      ## <NN>: <問い>

      Type: _Full_

      ### Context
      ```

   2. update: `## Entries` の次に `## Type` のセクションを置く。

      ```md
      ## Type

      The entry's way of working.

      - The line sits under the entry's heading, before `Context`: `Type: _Full_` or `Type: _Simple_`.
      - `_Full_` walks every step of the entry stage.
      - `_Simple_` keeps `Scope` and `#### Details` as `_omission_`, does not walk the `Scope` step or the Discussion Loop, and settles the `Decision` with the owner directly.
      - `_omission_` means the entry does not record the item because of its type. `なし` means the item has nothing to record. A Full entry uses `なし`; a Simple entry uses `_omission_`.
      ```

   3. update: `## Entries` の箇条書きの末尾に Type の行の規則を足す。

      ```md
      - Every entry has one `Type:` line under its heading, before `Context`.
      ```

   4. update: `## Scope` の箇条書きの末尾に Simple の規則を足す。

      ```md
      - A Simple entry's body is `_omission_`.
      ```

   5. update: `## Decision` の `#### Details` の規則に Simple の規則を足す。

      ```md
      - When `#### Details` has nothing, write `なし` under it. A Simple entry's body is `_omission_`.
      ```

### Policy

- Allowed:
  - Simple から Full への変更
  - 分割のときの Full から Simple への変更
- Forbidden:
  - エージェントが Type を決めること - Type を決めるのはオーナーである
  - Simple の条件を満たさないエントリを Simple として提案すること - Simple は軽い手順なので、条件を省くと判断が抜ける
  - Discussion Loop が始まった後に Full から Simple へ変えること - 定まった議論を捨てるため

### Verify

- Always:
  - `pnpm test:related <changed files>`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: other — `adr.format.md` の5か所を ADR の 01 と読み合わせる

## 2.スクリプトの骨組みに Type と omission を出す

`entrySkeleton` と `checkEntry` が Type と omission を書けるようにする。

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/adr/scripts/adr.mjs`
   1. add: `typeLine`、`scopeBody`、`detailsBody` を足す。

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

   2. update: `entrySkeleton` と `adrSkeleton` に Type を渡し、Type 行と Scope と Details を差し込む。

      ```js
      export function entrySkeleton(nnn, title, type = 'Full') {
        const q = title === undefined ? '<問い>' : title;
        return `## ${String(nnn).padStart(2, '0')}: ${q}
      
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
      ```

   3. add: `sectionRange` と `sectionAt` を足し、`section` を `sectionAt` に委ねる。

      ```js
      /**
       * `heading` の行番号の範囲を返す。見出しがなければ `null`。
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
       * `### <name>` のセクションの本文を返す。セクションがなければ空文字。
       * @param {string} entry
       * @param {string} name
       * @returns {string}
       */
      function section(entry, name) {
        return sectionAt(entry, `### ${name}`);
      }

      /**
       * `heading` の本文を返す。見出しがなければ空文字。
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

   4. update: `checkEntry` に Type と omission の検査を足す。今の `C` と `F` の検査はそのまま残す。

      ```js
      /**
       * エントリの `Type:` の値を返す。行がなければ `null`。
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

### Policy

- Allowed:
  - 古い `--add <title>` と `--set <NN> <title>` の呼び出し
- Forbidden:
  - Type を省略した `--set` で既存の Type を変えること - 呼び出し元の意図しない変更になるため
  - 過去の `cycles/*/adr.md` を検査すること - `--check` は開いているサイクルだけを読むため

### Verify

- Always:
  - `pnpm test:related <changed files>`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: other — `node .pi/skills/adr/scripts/index.mjs --check` を `cycles/261112-064-dev/adr.md` に通す

## 3.adr スキルの手順を Full と Simple に分ける

`## One entry` を2つの進め方に分割し、Simple の進め方を定める。

### Types

なし

### Steps

1. `.pi/skills/adr/SKILL.md`
   1. update: `### 3. Entries` に Type の提案を足す。

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

      > 手順5の `--add`、`--delete`、`--set` の3行はそのまま残し、スライス5で変える。

   2. update: `## One entry` の冒頭と `### 0. Type` を足す。

      ```md
      The entry stage runs once per entry, in the order the split gave. An entry is `_Full_` or `_Simple_`. A Simple entry keeps `Scope` and `#### Details` as `_omission_` and skips `### 1. Scope` and `### 3. Discussion Loop`. A Full entry walks the steps below.

      ### 0. Type

      Steps:

      1. Read the entry's `Type:` line.
      2. When the owner changes a Simple entry to Full before the `Decision`'s confirmation, write `_Full_` in the line, and walk the steps from `### 1. Scope` as a Full entry.

      Notes:

      - The owner decides the `Type`; the agent writes it.
      - A Full entry does not become Simple after the entry stage starts.
      ```

   3. update: `### 2. The opening proposal` を Full と Simple に分ける。

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

   4. update: `### 4. Decision` を Full と Simple に分ける。

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

### Policy

- Allowed:
  - Simple から Full への変更
  - 分割のときの Full から Simple への変更
- Forbidden:
  - エージェントが Type を決めること - Type を決めるのはオーナーである
  - Simple の条件を満たさないエントリを Simple として提案すること - Simple は軽い手順なので、条件を省くと判断が抜ける
  - Discussion Loop が始まった後に Full から Simple へ変えること - 定まった議論を捨てるため

### Verify

- Always:
  - `pnpm test:related <changed files>`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: other — `## One entry` の Full と Simple の流れを、ADR の 01 と読み合わせる

## 4.スクリプトの引数と本文の書き換え

`--add` と `--set` が Type を受け取り、`--set` が本文も書き換える。

### Types

```ts
type AddArg = { readonly title: string; readonly type: 'Full' | 'Simple' };
type SetArg = {
  readonly nn: number;
  readonly title: string;
  readonly type: 'Full' | 'Simple' | null;
};
```

### Steps

1. `.pi/skills/adr/scripts/cycle.mjs`
   1. add: `replaceSection` と `setEntryType` を足す。

      ```js
      import { detailsBody, entrySkeleton, scopeBody, sectionRange, typeLine } from './adr.mjs';

      /**
       * `heading` の本文を `body` に置き換える。見出しがなければ投げる。
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
       * `type` の形に置き換える。なければ投げる。
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
      ```

   2. update: `appendEntry` に `type` を渡す。JSDoc に `@param {'Full' | 'Simple'} [type]` を足す。

      ```js
      export function appendEntry(markdown, nnn, title, type = 'Full') {
        return append(markdown, entrySkeleton(nnn, title, type));
      }
      ```

   3. update: `parseArgs` に `typeArg` を足し、`add` と `set` を Type 付きの形にする。`--add` の3番目と `--set` の4番目の Type を読み、省略時は `--add` が Full、`--set` が `null` である。JSDoc の説明は今のまま、`@typedef Args` と `@returns` を新しい形にする。

      ```js
      /**
       * `Full` か `Simple` なら返し、そうでなければ `null` を返す。
       * @param {string | undefined} value
       * @returns {'Full' | 'Simple' | null}
       */
      function typeArg(value) {
        return value === 'Full' || value === 'Simple' ? value : null;
      }

      /**
       * 引数を読む。
       * @typedef {{ root: string, add: { title: string, type: 'Full' | 'Simple' } | null, del: number | null, set: { nn: number, title: string, type: 'Full' | 'Simple' | null } | null, check: boolean }} Args
       * @param {readonly string[]} argv
       * @returns {Args}
       */
      export function parseArgs(argv) {
        let root = process.cwd();
        let add = null;
        let del = null;
        let set = null;
        let check = false;
        const ops = () => [add !== null, del !== null, set !== null, check].filter(Boolean).length;
        for (let i = 0; i < argv.length; i++) {
          const arg = argv[i];
          if (arg === '--root') {
            const value = argv[i + 1];
            if (value === undefined) throw new Error('missing value for --root');
            root = value;
            i++;
          } else if (arg === '--add') {
            const value = argv[i + 1];
            if (value === undefined) throw new Error('missing value for --add');
            if (ops() > 0) throw new Error('too many operations');
            if (value.trim() === '') throw new Error('empty title for --add');
            const type = typeArg(argv[i + 2]) ?? 'Full';
            add = { title: value, type };
            i += typeArg(argv[i + 2]) === null ? 1 : 2;
          } else if (arg === '--delete') {
            const value = argv[i + 1];
            if (value === undefined) throw new Error('missing value for --delete');
            if (ops() > 0) throw new Error('too many operations');
            if (!/^\d+$/.test(value)) throw new Error(`not an entry number: ${value}`);
            const n = Number(value);
            if (n < 1) throw new Error(`not an entry number: ${value}`);
            del = n;
            i++;
          } else if (arg === '--set') {
            const nnValue = argv[i + 1];
            const titleValue = argv[i + 2];
            if (nnValue === undefined || titleValue === undefined) {
              throw new Error('missing value for --set');
            }
            if (ops() > 0) throw new Error('too many operations');
            if (!/^\d+$/.test(nnValue)) throw new Error(`not an entry number: ${nnValue}`);
            const n = Number(nnValue);
            if (n < 1) throw new Error(`not an entry number: ${nnValue}`);
            if (titleValue.trim() === '') throw new Error('empty title for --set');
            const setType = typeArg(argv[i + 3]);
            set = { nn: n, title: titleValue, type: setType };
            i += setType === null ? 2 : 3;
          } else if (arg === '--check') {
            if (ops() > 0) throw new Error('too many operations');
            check = true;
          } else {
            throw new Error(`unknown argument: ${arg}`);
          }
        }
        return { root, add, del, set, check };
      }
      ```

2. `.pi/skills/adr/scripts/index.mjs`
   1. update: `--add` と `--set` の分岐を、Type と本文の書き換えに合わせる。

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

   2. update: 用法の注釈を Type 付きにする。

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

### Policy

- Allowed:
  - 古い `--add <title>` と `--set <NN> <title>` の呼び出し
- Forbidden:
  - Type を省略した `--set` で既存の Type を変えること - 呼び出し元の意図しない変更になるため
  - 過去の `cycles/*/adr.md` を検査すること - `--check` は開いているサイクルだけを読むため

### Verify

- Always:
  - `pnpm test:related <changed files>`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: other — 捨てる ADR に `--add <title> Simple` と `--set <NN> <title> Full` を実行し、Type と omission を確かめる

## 5.SKILL.md の scaffold の行

`--add` と `--set` の3行を、新しい引数に合わせる。

### Types

なし

### Steps

1. `.pi/skills/adr/SKILL.md`
   1. update: `### 3. Entries` の手順5の3行を Type 付きにする。

      ```md
      5. Add every agreed entry at once, in the split's order, with the scaffold:
         - `node .pi/skills/adr/scripts/index.mjs --add <title> [Full|Simple]` appends an entry with the title and `Type` to the end of `adr.md` and creates `affected/<NN>.md`.
         - `node .pi/skills/adr/scripts/index.mjs --delete <NN>` deletes entry `NN` from `adr.md` and `affected/<NN>.md`, and renumbers the rest.
         - `node .pi/skills/adr/scripts/index.mjs --set <NN> <title> [Full|Simple]` replaces the title of entry `NN` in `adr.md` and `affected/<NN>.md`. When the `Type` is given, it also writes the `Type:` line, `Scope` and `#### Details` in `adr.md` in that `Type`'s shape; when it is omitted, the `Type` stays.
      ```

### Policy

- Allowed:
  - 古い `--add <title>` と `--set <NN> <title>` の呼び出し
- Forbidden:
  - Type を省略した `--set` で既存の Type を変えること - 呼び出し元の意図しない変更になるため
  - 過去の `cycles/*/adr.md` を検査すること - `--check` は開いているサイクルだけを読むため

### Verify

- Always:
  - `pnpm test:related <changed files>`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: other — 手順5の3行を、`index.mjs` の用法と読み合わせる

## 6.テストを新しい形に合わせる

骨組み・引数・検査の新しい形を、テストで固定する。

### Types

なし

### Steps

1. `.pi/skills/adr/scripts/index.test.ts`
   1. update: `entrySkeleton` の期待値、`entry()` helper、`--check` の inline ADR に Type を足す。`entry()` と inline ADR は `Type: _Full_` で、`entrySkeleton` の期待する見出しに `Type:` を足し、今のアサートは残す。
   2. update: `parseArgs` の `--add` と `--set` のテストを、Type 付きに直す。`--add` は `{ title, type: 'Full' }`、`--add 題名 Simple` は `{ title, type: 'Simple' }`、`--set 2 題名` は `{ nn: 2, title, type: null }`、`--set 2 題名 Full` は `{ nn: 2, title, type: 'Full' }` を確かめ、古い `--delete`/`--check` のテストは残す。
   3. add: Type がない、値が違う、Simple の Scope と Details が `_omission_` でない、Full が `_omission_` の検査を足す。更新後の `entry()` で作り、対象の1か所だけを崩して、6つのメッセージを確かめる。

      ```text
      checkEntry: (error) Type is missing → "NN: Type is missing"
      checkEntry: (error) Type is wrong → "NN: Type is not _Full_ or _Simple_: _Foo_"
      checkEntry: (error) Simple Scope written → "NN: Simple Scope is not _omission_"
      checkEntry: (error) Simple Details written → "NN: Simple Details is not _omission_"
      checkEntry: (error) Full Scope omission → "NN: Full Scope is _omission_"
      checkEntry: (error) Full Details omission → "NN: Full Details is _omission_"
      ```

   4. add: `entrySkeleton` の Full と Simple、`setEntryType` の Full と Simple、`--set` の Type と本文のテストを足す。`Type:` 行、Scope、Details、題名の切替えを `toContain` と `toEqual` で確かめる。

      ```text
      entrySkeleton: (happy) Full → Type: _Full_ と Scope/Details の骨組み
      entrySkeleton: (happy) Simple → Type: _Simple_ と Scope/Details の _omission_
      setEntryType: (happy) Full → Type 行と Scope/Details を Full の形にし、題名を変える
      setEntryType: (happy) Simple → Type 行と Scope/Details を _omission_ にし、題名を変える
      --set: (happy) Type なし → Type 行を変えない
      --set: (happy) Type あり → Type 行と本文を変える
      ```

### Policy

- Allowed:
  - 古い `--add <title>` と `--set <NN> <title>` の呼び出し
- Forbidden:
  - Type を省略した `--set` で既存の Type を変えること - 呼び出し元の意図しない変更になるため
  - 過去の `cycles/*/adr.md` を検査すること - `--check` は開いているサイクルだけを読むため

### Verify

- Always:
  - `pnpm test:related <changed files>`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: other — `pnpm test:run` で adr のテストを通す

## Notes

### Slice 1: format に Type と omission を足す

- Findings: なし
- Unplanned: なし
- Commit: 1023c75
- Stopped:

### Slice 2: スクリプトの骨組みに Type と omission を出す

- Findings: `pnpm test:related` で 11 件失敗する。旧テストの inline ADR に `Type:` 行がなく、`checkEntry` が `Type is missing` を返すため。
  - left: スライス6でテストを新しい形に合わせるときに閉じる。このスライスでは旧テストを変えない。
- Unplanned: なし
- Commit:
- Stopped:

### Slice 3: adr スキルの手順を Full と Simple に分ける

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 4: スクリプトの引数と本文の書き換え

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 5: SKILL.md の scaffold の行

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 6: テストを新しい形に合わせる

- Findings:
- Unplanned:
- Commit:
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
