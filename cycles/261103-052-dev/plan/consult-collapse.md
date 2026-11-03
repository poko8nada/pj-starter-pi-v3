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
