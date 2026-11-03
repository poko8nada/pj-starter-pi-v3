# PLAN `adr-affected`

- No: 02, 06
- Place: base
- Boundary Plans: `design-removal` (01) は、同じ `adr/SKILL.md` の design の参照を先に消す。`plan-cut` (04) は、この plan が書く `affected.md` の `### Code` と `### External` から、この plan の `Paths` と `Boundary.External` を取る。

## Files

```text
.pi/skills/adr/
  SKILL.md                update
  references/
    format.md             drop
    adr.format.md         add
    affected.format.md    add
    tasks.md              update
  scripts/
    scaffold.mjs          drop
    scaffold.test.ts      drop
    index.mjs             add
    index.test.ts         add
    cycle.mjs             add
    adr.mjs               add
    affected.mjs          add
lib/git-env.mjs
cycles/261103-053-dev/
  affected.md             add
```

## Slices

## 1.adr の書式の分割と affected.md の書式

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/adr/references/adr.format.md`:
   - add: `format.md` の内容をこのファイルに移し、`references/format.md` への参照を `references/adr.format.md` に変える。
2. `.pi/skills/adr/references/format.md`:
   - drop: このファイルを削除する（内容は `adr.format.md` に移した）。
3. `.pi/skills/adr/references/affected.format.md`:
   - add: `affected.md` の書式を定める。エントリーごとの `## <NN>: <問い>`、その下の `### Code` と `### External`、path ごとの見出しと6つのバレット（`Search`、`Adr`、`Direction`、`Relation`、`Role`、`Role change`、`Adjustment`）の形にする。`Search` は1検索1行の `NN: <検索名> - <ヒット数/対象ファイル数>: <見えていないもの>` とし、各見出しがその path の検索を記録し「同上」と書かないこと、`Direction` は選んだ1つをイタリックにすること、`Role change` は `**Change**` か `Not change` で変わる場合だけ子のバレットを置くこと、`Adjustment` は `**YES**` か `No` で必要な場合だけ子のバレットを置くこと、`Generate` はビルド生成物に限り、変更が作る・変える・消すソースファイルは `Read by` にすること、`<>` の中の説明は日本語で書くことを定める。
4. `.pi/skills/adr/references/tasks.md`:
   - update: 影響範囲の調査の任務文を加える。入力はエントリーの変更とし、調べ方の11の手順（名前の検索、前方向と後方向、検索の記録、役割、前後の比較、調整、検査、生成）と、答える9つの問いを書く。場所の列挙やフォルダの名前の指示は入れない。
5. `.pi/skills/adr/SKILL.md`:
   - update: `## Files` に `affected.md`、`references/adr.format.md`、`references/affected.format.md` を加える。
   - update: 手順に、エントリーの選択肢が決まった後、校正と同時に影響範囲の調査を行わせ、`affected.md` に書く段階を加える。
   - update: `references/format.md` への参照を `references/adr.format.md` に変える。

### Verify

- Always:
  - `pnpm test:run .pi/skills/adr`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -rn 'references/format.md' .pi/skills/adr/SKILL.md .pi/skills/adr/references`
  - `grep -n '### Code' .pi/skills/adr/references/affected.format.md`
  - `grep -n '### External' .pi/skills/adr/references/affected.format.md`
  - `grep -n 'Read:' .pi/skills/adr/references/affected.format.md`
  - `grep -n 'Check:' .pi/skills/adr/references/affected.format.md`
  - `grep -n 'Generate:' .pi/skills/adr/references/affected.format.md`
- Added: base の外観: オーナーが `adr.format.md`、`affected.format.md`、`adr/SKILL.md` の差分を読み、書式と手順が意図どおりであることを確かめる。オーナーの OK をもって閉じる。

## 2.スクリプトの分割

### Types

```ts
/** 開いたサイクルの dir を返す。なければ null */
export function openCycleDir(cyclesDir: string): string | null;

/** 両ルートの名前から次の NNN を決める */
export function nextNNN(names: readonly string[]): number;

/** 末尾の改行を調整して entrySkeleton(nnn) を追記する */
export function appendEntry(markdown: string, nnn: number): string;

/** 親の下に葉だけを作る */
export function createLeafDir(parentDir: string, name: string): string;

/** CLI 引数を読む */
export function parseArgs(argv: readonly string[]): {
  readonly root: string;
  readonly nnn: number | null;
};

/** `## NN:` の最大値を返す。壊れた見出しがあれば例外を投げる */
export function lastEntryNumber(markdown: string): number | null;

/** ブランチ名から slug を作る */
export function slugBranch(branch: string): string;

/** ローカル日付から YYMMDD を作る */
export function toYYMMDD(date: Date): string;

/** サイクルのフォルダ名を組み立てる */
export function cycleDirName(nnn: number, yymmdd: string, slug: string): string;

/** `cycles/` と `cycles/archive/` の dir 名を集める */
export function dirNames(cyclesDir: string, archiveDir: string): readonly string[];

/** 1 エントリー分の adr の骨組みを返す */
export function entrySkeleton(nnn: number): string;

/** adr.md の骨組みを返す */
export function adrSkeleton(nnn: number): string;

/** 1 エントリー分の affected の骨組みを返す */
export function affectedEntrySkeleton(nnn: number): string;

/** affected.md の骨組みを返す */
export function affectedSkeleton(nnn: number): string;
```

### Steps

1. `.pi/skills/adr/scripts/cycle.mjs`:
   - add: `openCycleDir`、`nextNNN`、`appendEntry`、`createLeafDir`、`parseArgs`、`lastEntryNumber`、`slugBranch`、`toYYMMDD`、`cycleDirName`、`dirNames` を `scaffold.mjs` からこのファイルに移す。壊れた見出しで例外を投げる扱いと、開いたサイクルがない場合と、ファイルがすでにある場合の扱いも同じにする。
2. `.pi/skills/adr/scripts/adr.mjs`:
   - add: `entrySkeleton`、`adrSkeleton` を `scaffold.mjs` からこのファイルに移し、`references/adr.format.md` の書式に合わせる。
3. `.pi/skills/adr/scripts/affected.mjs`:
   - add: `affectedEntrySkeleton`、`affectedSkeleton` を書き、`references/affected.format.md` の書式に合わせる。
4. `.pi/skills/adr/scripts/index.mjs`:
   - add: エントリーポイントを書く。`--root <dir>` と `[<nnn>]` を受け、開いたサイクルでは `adr.md` と `affected.md` に次のエントリーを追記し、開いたサイクルがなければフォルダと `adr.md` と `affected.md` を作る。開いたサイクルに `<nnn>` が渡されたら処理を拒む。
5. `.pi/skills/adr/scripts/scaffold.mjs`:
   - drop: このファイルを削除する。
6. `.pi/skills/adr/scripts/scaffold.test.ts`:
   - drop: このファイルを削除する。
7. `.pi/skills/adr/scripts/index.test.ts`:
   - update: (happy) `scaffold.test.ts` を読み、`adrSkeleton`、`slugBranch`、`toYYMMDD`、`nextNNN`、`cycleDirName`、`createLeafDir`、`dirNames`、`parseArgs`、`lastEntryNumber`、`appendEntry`、`openCycleDir` のテストを移す → 今の期待値を保つ。
   - update: (happy) `entrySkeleton` のテストを移す → `adr.format.md` の見出しと一致する。
   - update: (error) `lastEntryNumber` の壊れた見出しのテストを移す → 理由付きで例外を投げる。
   - update: (error) CLI の `<nnn>` の拒否のテストを移す → 理由付きで処理が止まる。
   - update: (happy) CLI の追記と新しい dir のテストを移す → `adr.md` の `## NN:` と新しい dir。
   - add: (happy) 開いたサイクルで `adr.md` と `affected.md` の両方に次のエントリーが追記される → 両ファイルに `## 02:` が増える。
   - add: (happy) 開いたサイクルがなければ `adr.md` と `affected.md` が作られる → 両ファイルができる。
   - drop: なし（すべて `index.test.ts` に移すか、`affected.md` のテストとして足すため）。
8. `.pi/skills/adr/SKILL.md`:
   - update: `## Files` の `scaffold.mjs` を `index.mjs`、`cycle.mjs`、`adr.mjs`、`affected.mjs` に置き換える。
   - update: 手順3の呼び出し先を `node .pi/skills/adr/scripts/index.mjs` に変える。

### Verify

- Always:
  - `pnpm test:run .pi/skills/adr`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -rn 'scaffold.mjs' .pi/skills/adr`
- Added: base の外観: オーナーが `index.mjs`、`cycle.mjs`、`adr.mjs`、`affected.mjs` と `index.test.ts` の差分を読み、エントリーポイントと骨組みが意図どおりであることを確かめる。オーナーの OK をもって閉じる。

## 3.053 の affected.md

### Types

```ts
なし;
```

### Steps

1. `cycles/261103-053-dev/affected.md`:
   - add: エントリー 01 から 06 までの `## <NN>: <問い>` と、その下の `### Code` と `### External` を書く。エントリーごとに影響範囲の調査を行わせ、path ごとの見出しと6つのバレット（`Search`、`Adr`、`Direction`、`Relation`、`Role`、`Role change`、`Adjustment`）で書く。`Search` は1検索1行、`Direction` はイタリック、`Role change` と `Adjustment` は2値で、必要な場合だけ子のバレットを置く。入力はエントリーの変更とし、plan md の `Files` は使わない。

### Verify

- Always:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `test "$(grep -c '^## 0[1-6]:' cycles/261103-053-dev/affected.md)" = 6`
  - `test "$(grep -c '^### Code' cycles/261103-053-dev/affected.md)" = 6`
  - `test "$(grep -c '^### External' cycles/261103-053-dev/affected.md)" = 6`
  - `test "$(grep -c 'Search:' cycles/261103-053-dev/affected.md)" -ge 6`
  - `test "$(grep -c 'Direction:' cycles/261103-053-dev/affected.md)" -ge 6`
  - `test "$(grep -c 'Role change:' cycles/261103-053-dev/affected.md)" -ge 6`
  - `test "$(grep -c 'Adjustment:' cycles/261103-053-dev/affected.md)" -ge 6`
- Added: base の外観: オーナーが `affected.md` を読み、エントリーごとの影響範囲が意図どおりであることを確かめる。オーナーの OK をもって閉じる。

## Notes

### Slice 1: adr の書式の分割と affected.md の書式

- Findings: なし
- Unplanned: 手順の一覧に「the affected」を足した（`adr/SKILL.md` の 12 行目）。手順7を足したため、一覧の「the scope, the research, the options, the decision and the write」に「the affected」が必要だった。オーナーのトリアージで、書式と任務文を3群から4方向（`Read:`、`Read by:`、`Check:`、`Generate:`）と役割の変化に直した。具体例を固定値にせず、変更が変える関係と役割を一般形で書く形にした。
- Commit: 75f3d99
- Stopped: なし

### Slice 2: スクリプトの分割

- Findings: なし
- Unplanned: `index.test.ts` で、`entrySkeleton` の1件は `format.md` から `adr.format.md` に名前を変えた。`affectedEntrySkeleton` と `affectedSkeleton` の2件、両方への追記と両方の作成の2件を足した。
- Commit: 7091c0e
- Stopped: なし

### Slice 3: 053 の affected.md

- Findings: 6つのエントリーを6体の `research` で書き、`Verify` を通した。`affected.md` の語を ja-check の error に合わせて、テンプレート、バージョン、作業ツリー、理由、残り、セクション、一覧に置き換えた。
- Unplanned: オーナーのトリアージで、`affected.format.md` の `<>` の中の説明を日本語に直し、`Search` を `Names`、`Ranges`、`Hits`、`Blind`、`Adr` の入れ子に直した。さらに、`Search` を検索ごとの番号付きのバレットに直し、`Adr` を `Search` の外の path ごとのバレットに出した。053 の `affected.md` は、このサイクルの最後に6体で作り直す。
- Commit: 38c691f
- Stopped: なし

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
