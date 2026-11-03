# PLAN `consult-collapse`

- No: 01, 02
- Place: base

## Files

```text
.pi/extensions/consult/
  view/
    notice.ts                    add
    notice.test.ts               add
  index.ts                       update
  README.md                      update
```

## Slices

## 1.折りたたみの1行と展開

### Types

```ts
import type { Component } from '@earendil-works/pi-tui';
import type {
  CustomMessage,
  MessageRenderer,
  MessageRenderOptions,
  Theme,
} from '@earendil-works/pi-coding-agent';

/** 1行に並べる部分（`consult-1`、`code`、`done`）。details から読み取れた部分だけを順に保持し、空の場合は `[consult]` だけになる */
export type NoticeParts = readonly string[];

/** details（外部から渡される未知の値）から、1行に並べる部分を読み取る。読み取れた部分だけを入れ、`type` は role として読み取る */
export function noticeParts(details: unknown): NoticeParts;

/** 部分と案内から1行を組み立てる。部分は ` — ` でつなぎ、案内は括弧で添える */
export function noticeLine(parts: NoticeParts, expandLabel: string): string;

/** 展開時に並べる行（`turns`、`spend`、`files`）。読み取れたものだけを含む */
export function noticeDetailLines(details: unknown): readonly string[];

/** consult のメッセージを描画する。常にコンポーネントを返し、undefined は返さない */
export function renderNotice(
  message: CustomMessage<unknown>,
  options: MessageRenderOptions,
  theme: Theme,
): Component;

/** レンダラーを登録する側のインターフェース。pi の `ExtensionAPI` が満たす */
export interface NoticeRegistry {
  registerMessageRenderer(customType: string, renderer: MessageRenderer<unknown>): void;
}

/** `consult` のメッセージのレンダラーを登録する */
export function registerNotice(pi: NoticeRegistry): void;
```

### Steps

1. `.pi/extensions/consult/view/notice.ts`:
   - `noticeParts`、`noticeLine`、`noticeDetailLines`、`renderNotice`、`registerNotice` を書き、折りたたみは `Text(line, 0, 0)` とし、展開は `Box` に詳細の行と本文の `Markdown` を入れ、`renderNotice` は `keyText('app.tools.expand')` を案内の名前に使う。
2. `.pi/extensions/consult/index.ts`:
   - default export で `registerNotice(pi)` を呼ぶ。
3. `.pi/extensions/consult/view/notice.test.ts`:
   - (happy) `details` に `id`・`type`・`state` がある → `[consult] consult-1 — code / done (ctrl+o で展開)` を返す。
   - (happy) `details` に `id`・`type` だけがある → `[consult] consult-1 — code (ctrl+o で展開)` を返す。
   - (empty) `details` が `undefined` → 例外を投げずに `[consult] (ctrl+o で展開)` を返す。
   - (happy) `expanded` が真 → `turns`・`spend`・`files` と本文を描画するコンポーネントを返す。
   - (happy) `expanded` が偽 → 1行だけを描画し、`turns`・`spend`・`files` と本文を描画しない。
   - (happy) `registerNotice` に偽の registry を渡す → `'consult'` と `renderNotice` を受け取る。
4. `.pi/extensions/consult/README.md`:
   - `## What comes back` を、既定では1行だけを表示して `ctrl+o` で本文を開く形に書き換え、現在の全文表示の説明は残さない。
   - `## Tests` の表に `view/notice.test.ts` の行を加える。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/view/notice.ts .pi/extensions/consult/index.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -c 'consult consult-1 (code) finished' .pi/extensions/consult/README.md` が `0` であること（変更前は1件）
- Added:
  - base の見た目: オーナーが `fullscreen` で pi を再読み込みし、consult の完了報告が1行で表示されて `ctrl+o` で本文が開くことを確かめ、オーナーの OK で閉じる。

## 2.クリックで開閉する

### Types

```ts
import type { TuiMouseEvent } from '@earendil-works/pi-tui';

/** 開いた報告の時刻（ms）。コンポーネントの再作成をまたいで保持し、プロセス内でのみ持つ */
const opened: Set<number>;

/** クリックで開いた報告の時刻（ms）。`message.timestamp` をキーにし、見つからない場合は折りたたみとして扱う */
export function isOpened(timestamp: number): boolean;

/** クリックによる開閉状態を反転し、反転後の状態を返す。見つからない時刻は折りたたみ状態から始める */
export function toggleOpened(timestamp: number): boolean;

/** マウスイベントが左クリックかどうかを判定する。左クリック以外は false */
export function isLeftClick(event: TuiMouseEvent): boolean;
```

### Steps

1. `.pi/extensions/consult/view/notice.ts`:
   - 折りたたみの1行を `MouseRegion` で包み、`isLeftClick` のときだけ `toggleOpened(message.timestamp)` を呼び、表示を `options.expanded || isOpened(message.timestamp)` で決め、案内を `(ctrl+o かクリックで展開)` に変える。
2. `.pi/extensions/consult/view/notice.test.ts`:
   - (happy) 閉じた報告を左クリックする → 開いた表示になる。
   - (happy) 開いた報告を左クリックする → 折りたたんだ表示になる。
   - (happy) `expanded` が真でクリックによる開閉状態がない → 開いた表示になる。
   - (happy) `button: 'right'` でクリックする → 表示は変わらない。
   - (happy) 時刻の違う2件の報告のうち1件をクリックする → 開くのはその1件だけになる。
3. `.pi/extensions/consult/README.md`:
   - `## What comes back` に、報告はクリックでも開閉できることを書く。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/view/notice.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -ri` で `isOpened`、`toggleOpened`、`isLeftClick` を探し、古い説明が残っていないことを確かめる。
- Added:
  - base の見た目: オーナーが `fullscreen` で pi を再読み込みし、報告をクリックして開閉することを確かめ、オーナーの OK で閉じる。

## Notes

### Slice 1: 折りたたみの1行と展開

- Findings: なし
- Unplanned:
  - `view/notice.ts:19` — `CustomMessage` がパッケージから公開されていないため、`Parameters<MessageRenderer>[0]` で同じ型を取り、`NoticeMessage` と名付けた。
  - `view/notice.ts:22` — テストで `Theme` を組み立てられないため、描画関数は `fg` と `bg` だけを受ける `NoticePaint` にした。`Theme` はそのまま渡せる。
  - `view/notice.ts:63` — `keyText('app.tools.expand')` はキーが未設定のとき空文字を返すため、案内の名前が空のときは案内を添えないようにした。
- Commit: 27c59eb base(consult-collapse): 折りたたみの1行と展開
- Stopped: なし

### Slice 2: クリックで開閉する

- Findings: なし
- Unplanned:
  - `view/notice.ts:148` — クリックのあとの再描画で表示を変えるため、部品は `render` のたびに `Box` と `Text` を組み直す形にした（1回だけ作ると表示が変わらない）。
  - `view/notice.ts:132` — テストが `handleMouse` を呼べるように、`renderNotice` の戻り値を `Component` から `MouseRegion` に変えた。
  - `view/notice.ts:95` — 案内を `(ctrl+o かクリックで展開)` に変え、`noticeLine` のテスト3件の期待値を更新した。
- Commit: 76c1029 base(consult-collapse): クリックで開閉する
- Stopped: なし

### Cleanup: 表示のテスト

- Findings: なし（`view/notice.test.ts` と `index.test.ts` を読み、重なるケース、消えた振る舞いのケース、型が決める前提のケースは見つからなかった）
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - `.pi/extensions/consult/index.ts:2` — 頭注の「道具とスラッシュコマンドの登録だけ」が `registerNotice(pi)` (`.pi/extensions/consult/index.ts:212`) と矛盾し stale である。
    - fixed: 頭注を「道具、スラッシュコマンド、完了報告のレンダラーの登録を行う」に直した。
  - `.pi/extensions/consult/README.md:202` — `index.ts` の説明「registers the tools and the commands, and nothing else」がレンダラー登録と矛盾し stale である。
    - fixed: 「the entry: registers the tools, the commands and the message renderer」に直した。
  - `.pi/extensions/consult/README.md:201` — `## The code` のツリーに新設の `view/` がなく構成を載せておらず stale である。
    - fixed: ツリーに `view/  the finished message: the collapsed line, the expanded details, and the click` の行を足した。
- Unlisted:
  - なし — 差分の対象は Files の4件のみで、plan md 自体の更新は対象外である。
- Gaps:
  - `.pi/extensions/consult/view/notice.ts:95` — `expandLabel` が空のとき案内を添えない分岐を確かめるテストがなく、キー未設定時が未検証である。
    - fixed: 「案内の名前が空 → 案内を添えない」を足した。
  - `.pi/extensions/consult/view/notice.ts:117` — `bodyOf` の配列 `content` (blocks) 経路を描画テストが通らず、文字列のみで未検証である。
    - fixed: 「本文が文字の塊の配列 → 本文を描画する」を足した。
  - `.pi/extensions/consult/view/notice.ts:99` — `noticeDetailLines` の欠け (`files` なしの読み取り専用など) や空 (`(none)`) の展開表示が未検証で、全件ありのみである。
    - fixed: 「turns・spend・files がない → 詳細の行を描画しない」と「files が空 → files: (none) を描画する」を足した。
- Unproven:
  - `.pi/extensions/consult/view/notice.test.ts:110` — 折りたたみ描画が `toContain` の前方一致のみで、`keyText` の配線が壊れても緑のままである。
    - fixed: `keyText` を `ctrl+o` に固定するモックを置き、折りたたみの1行を案内込みで確かめるようにした。
- Noise:
  - なし — 固定文字列と数値は ADR・plan の決定値 (1行形、案内文、幅78) か共有 fixture の値で、型が決める前提の重複はない。
- Doubts:
  - Added の base 目視 (fullscreen 再読込での1行表示と `ctrl+o`/クリックの開閉) の所有者 OK が `## Acceptance` に未記録で、close には所有者確認が残る。

## Acceptance

- Ran:
  - `pnpm typecheck` — `root: ok`、`.pi: ok`。
  - `pnpm test:run` — 64ファイル、726件すべて通過。
  - 振る舞いを壊して赤になるかの確認:
    - `noticeParts` の `state` を落とす → 2件が赤。
    - 表示の論理和（`expanded || isOpened`）を `expanded` に変える → 3件が赤。
    - `registerNotice` の `customType` を `consult` から `archive` に変える → 1件が赤。
  - 壊したファイルは `git checkout` で戻し、作業ツリーが元に戻ったことを確かめた。
  - base の見た目（`Added`）: オーナーが `fullscreen` で再読み込みし、1行表示、`ctrl+o`、クリックでの開閉を確かめ、OK を返した。
- Findings:
  - `.pi/extensions/consult/index.ts:212` — `registerNotice(pi)` を消しても自動の検査は緑のままである（`index.test.ts` は default export を呼ばない）。
    - left: `ExtensionAPI` の偽物を作ると型の断言が必要になり、lint の `no-unsafe-type-assertion` が許さない。配線は1行であり、`registerNotice` 自体はテストで確かめている。
- Doubts:
  - なし — レビューの Doubt（検査を実行できなかった）は、受け入れで実行して確かめた。
