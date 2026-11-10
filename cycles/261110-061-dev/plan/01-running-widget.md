# PLAN `running-widget`

- No: 01, 02, 03
- Place: base
- Boundary Plans: なし

## Goal

稼働中のサブエージェントの数がエディタの上に他の拡張の表示と並んで表示されるようになり、`/consult-status` がなくなる。

## Design

- Inside:
  - Modules: `view/widget.ts` を足します。役割の数え方、1 行の組み立て、`setWidget` の呼び出しを 1 か所にまとめ、`index.ts` では tick と `session_start` から呼ぶだけにします。新しい表示の処理は `view/notice.ts` と同じ view の関心に置きます。短い名前は名前の先頭 3 文字で作り、並び順は `types.json` の並び順を使います。名前と順序の出どころを 1 つに保つためです。作業はスライス 1、2 の順に進めます。`index.ts`、`index.test.ts`、`README.md` は 2 つのスライスが触りますが、スライス 1 は表示の追加、スライス 2 はコマンドの削除で、変える行は重なりません。
  - Dirs: なし。
- Outside:
  - Extract: なし。
  - Colocate: なし。

## Files

```text
.pi/extensions/consult/
  index.ts                        update
  index.test.ts                   update
  README.md                       update
  consult.fixture.ts              update
  types.json
  policy/
    types.ts
  run/
    log.ts
    log.test.ts
  tool/
    consult.ts                    update
    consult.test.ts
    subagents.ts
  view/
    widget.ts                     add
    widget.test.ts                add
```

## Slices

## 1.稼働中の数の表示

エディタの上に、いまの session で稼働しているサブエージェントの数を役割ごとに出す 1 行を加えます。

### Types

```ts
/** 1 つの役割の稼働数 */
export interface RoleCount {
  readonly role: string;
  readonly count: number;
}

/** ウィジェットを出すための窓口。pi の `ExtensionUIContext` の `setWidget` だけを使う */
export type WidgetUI = Pick<ExtensionUIContext, 'setWidget'>;

/** ウィジェットのキー。他の拡張と重ならない名前にする */
export const WIDGET_KEY = 'consult-running';

/** 役割の短い名前。名前の先頭 3 文字 */
export function roleShort(role: string): string;

/** 記録を役割ごとに数え、order の順、そのあとに初出順で返す */
export function countRoles(
  runs: readonly RunRecord[],
  order: readonly string[],
): readonly RoleCount[];

/** 数が 0 より大きい役割だけの 1 行。1 つもなければ undefined */
export function runningLine(counts: readonly RoleCount[]): string | undefined;

/** 行をウィジェットにセットする。行がなければ消す */
export function showRunning(ui: WidgetUI, counts: readonly RoleCount[]): void;

/** types.json の並びを読む。読めなければ空の配列 */
export function roleOrder(): readonly string[];

/** tick に渡す引数。表示の窓口を足す */
export interface TickPort {
  readonly pi: PiFace;
  readonly place: Place;
  readonly sessionNow: () => string;
  readonly check?: CheckRecord;
  readonly ui: WidgetUI;
}
```

### Steps

1. `.pi/extensions/consult/view/widget.ts`
   1. add: `WIDGET_KEY` と `roleShort` を定義する。`roleShort` は名前の先頭 3 文字を返す。`ExtensionUIContext` は型として取り込む。

      ```ts
      export const WIDGET_KEY = 'consult-running';

      /** 役割の短い名前。名前の先頭 3 文字（research → res） */
      export function roleShort(role: string): string {
        return role.slice(0, 3);
      }
      ```

   2. add: `countRoles(runs, order)` を足す。記録を役割ごとに数え、`order` の順、そのあとに初出順で返す。
   3. add: `runningLine(counts)` を足す。数が 0 より大きい役割だけを `[res:2 rev:1]` の 1 行にする。1 つもなければ `undefined` を返す。
   4. add: `showRunning(ui, counts)` を足す。行があれば 1 行の配列、なければ `undefined` を `WIDGET_KEY` に渡す。

2. `.pi/extensions/consult/index.ts`
   1. update: `TickPort` に `ui: WidgetUI` を足す。
   2. update: 拡張のルート（`EXTENSION_DIR`）と、`types.json` の並びを読む `roleOrder()` を足す。読めなければ空の配列を返す。
   3. update: `consult_run` の実行で、サブエージェントを始めた直後に `showRunningOnce(ctx.ui, place, session)` を呼ぶ。
   4. update: tick で `runningRuns` の配列を持ち、音を鳴らしたあとに `showRunning(port.ui, countRoles(running, roleOrder()))` を個別の try/catch で呼ぶ。
   5. update: `session_start` で、`runningRuns` をもとに同じ表示を 1 回セットする。表示の更新に失敗しても握りつぶし、開始を止めない。

3. `.pi/extensions/consult/index.test.ts`
   1. update: `portFor` にテスト用の `ui` を足して、`setWidget` の呼び出しを記録する。
   2. update: tick の検査に次のケースを足す。

      - `widget`: (happy) review が 1 体稼働している → `consult-running` に `[rev:1]` をセットする
      - `widget`: (empty) 何も稼働していない → `consult-running` に `undefined` をセットする
      - `widget`: (error) `setWidget` が投げる → 音は鳴り、完了報告の送信は続く

4. `.pi/extensions/consult/view/widget.test.ts`
   1. add: 次のケースを持つ。

      - `widget`: (happy) research 2 体と review 1 体があり、`order` が `types.json` の並びの場合 → `[res:2 rev:1]`
      - `widget`: (boundary) 定めた 5 つの役割に含まれない `custom` が 1 体 → `[cus:1]`
      - `widget`: (boundary) 先頭 3 文字が同じ `research` と `researcher` が 1 体ずつ → `[res:1 res:1]`
      - `widget`: (empty) 記録がない → `undefined`

5. `.pi/extensions/consult/README.md`
   1. update: `Background and stopping` の detached の段落のあとに、表示の段落を足す。

      ```md
      Above the editor, consult shows one line for the running subagents of this session: one count per role in brackets (`[res:2 pro:1]`), in the order `types.json` gives, and a role with none is left out, so an idle line is gone. It is read from the same record as the sound, and it is set when a subagent starts, from the same 5-second tick and at `session_start`, so a subagent that was running before a reload is counted.
      ```

### Policy

- Allowed:
  - 表示では、`ctx.ui.setWidget` に文字列の配列を渡してよい。
  - consult は、表示の値を開始、5 秒ごとの tick、`session_start` でセットし直してよい。
  - consult は、他の拡張と同じ場所に consult 固有のキーで表示を出してよい。
  - 先頭 3 文字が同じ役割は、同じ短い名前で表示してよい。
- Forbidden:
  - consult は、表示の更新が失敗しても、サブエージェントの実行、音、完了報告を止めない - 表示は補助であり、実行の成否に関係しない。
  - consult は、テーマの色を含む文字列を保持しない - テーマを変えたときに古い色が残るため。
  - consult は、他の拡張のキーを使わない - 同じキーでは後の書き込みが前の表示を消すため。
  - consult は、表示の順序を保証しない - 順序を定めた文書がないため。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/index.ts .pi/extensions/consult/view/widget.ts .pi/extensions/consult/index.test.ts .pi/extensions/consult/view/widget.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: この base の plan の look — オーナーが、`/reload` のあとのエディタの上で `res:2 pro:1` を見て、承認する。承認でこのスライスを閉じる。

## 2.`/consult-status` の廃止

`/consult-status` をなくし、稼働の確認はウィジェットに、一覧は `consult_subagents` に、停止は `/consult-cancel` に寄せます。

### Types

なし

### Steps

1. `.pi/extensions/consult/index.ts`
   1. drop: `registerCommands` から `consult-status` の登録を消す。
2. `.pi/extensions/consult/tool/consult.ts`
   1. drop: `ConsultRuntime.commands` から `status` を消す。
   2. drop: `createRuntime` の `commands.status` の実装を消す。
3. `.pi/extensions/consult/index.test.ts`
   1. update: テスト用の `registerCommand` が名前を記録するようにして、次のケースを足す。

      - `command`: (happy) 拡張の入口を呼び出す → `consult-cancel` と `consult-sound` が登録され、`consult-status` は登録されない

4. `.pi/extensions/consult/README.md`
   1. update: `Background and stopping` の表の user の行から `/consult-status` の記載を消し、`/consult-cancel <id>` だけを残す。

### Policy

- Allowed:
  - 稼働の数はウィジェットで確認し、一覧はエージェントが `consult_subagents` で確認し、停止は `/consult-cancel` で扱う。
  - consult は、`DEFINITION.md` の Unit を変更しない。
- Forbidden:
  - consult は、メモリ上の一覧だけを出す仕組みを新しく増やさない - 再読み込み後に一覧が空になるため。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/index.ts .pi/extensions/consult/tool/consult.ts .pi/extensions/consult/index.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: この base の plan の look — オーナーが、`/reload` のあとに `/consult-status` がなく、README の表の user の行から `/consult-status` の記載が消え、`/consult-cancel <id>` だけが残っていることを確認して、承認する。承認でこのスライスを閉じる。

## Notes

### Slice 1: 稼働中の数の表示

- Findings: なし
- Unplanned: `cycles/261110-061-dev/plan/01-running-widget.md:128` と `.pi/extensions/consult/view/widget.test.ts:44` — 衝突のケースの期待値を `res:1 res:2` から `res:1 res:1` に直した。`research` と `researcher` がそれぞれ 1 体で、テストが赤になるため待てなかった。
- Unplanned: `.pi/extensions/consult/consult.fixture.ts` に `aWidgetUI` を置き、2 つのテストにあった同じ偽の `ui` を 1 か所にまとめた。`plan` の `Files` になかったが、オーナーの指示で共有したため、待てなかった。
- Unplanned: オーナーの確認で、`[]` のあしらいと、開始の瞬間の表示を足した。ADR の `C5`、`Decision`、`Policy` と、`plan` の 1 行、手順、テストの期待値を直した。開始の遅れは確認で見つかったため、待てなかった。
- Commit:
- Stopped:

### Slice 2: `/consult-status` の廃止

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
