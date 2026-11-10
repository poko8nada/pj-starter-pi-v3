# PLAN `running-widget`

- No: 01, 02, 03
- Place: base
- Boundary Plans: なし

## Goal

稼働中のサブエージェントの数がエディタの上に他の拡張の表示と並んで表示されるようになり、`/consult-status` がなくなる。

## Design

- Inside:
  - Modules: `view/widget.ts` を足します。役割の数え方、1 行の組み立て、`setWidget` の呼び出しを 1 か所にまとめ、`index.ts` では tick、`session_start`、開始の直後から呼ぶだけにします。新しい表示の処理は `view/notice.ts` と同じ view の関心に置きます。短い名前は名前の先頭 3 文字で作り、並び順は `types.json` の並び順を使います。名前と順序の出どころを 1 つに保つためです。作業はスライス 1、2 の順に進めます。`index.ts`、`index.test.ts`、`README.md` は 2 つのスライスが触りますが、スライス 1 は表示の追加、スライス 2 はコマンドの削除で、変える行は重なりません。スライス 2 は、なくなるものだけなのでテストケースを持ちません。存在しなくなるものを試すテストは書かないためです。
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
      - `widget`: (happy) 走っている記録で `showRunningOnce` を呼ぶ → `consult-running` に `[rev:1]` をセットする
      - `widget`: (empty) 記録がない → `consult-running` に `undefined` をセットする

4. `.pi/extensions/consult/view/widget.test.ts`
   1. add: 次のケースを持つ。

      - `widget`: (happy) research 2 体と review 1 体があり、`order` が `types.json` の並びの場合 → `[res:2 rev:1]`
      - `widget`: (happy) `order` が辞書順と違う `code` と `research` → `[res:1 cod:1]`
      - `widget`: (boundary) 定めた 5 つの役割に含まれない `custom` が 1 体 → `[cus:1]`
      - `widget`: (boundary) `order` にない `zeta` と `alpha` が 1 体ずつ → `[zet:1 alp:1]`
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
3. `.pi/extensions/consult/README.md`
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
- Commit: b91df7719580155034945c0245d8613b23bc8b59
- Stopped:

### Slice 2: `/consult-status` の廃止

- Findings: なし
- Unplanned: スライス 1 で足した `roleShort` と `showRunning` の単体テストを消した（振る舞いが `runningLine` と tick のテストで重複するため）。`/consult-status` の不在を試すテストも消した（存在しなくなるものを試さない）。
- Commit: ed0a62f1c04dedbb229eae02cb89f279a94951c5
- Stopped:

### Cleanup: 走っている記録の前提

- Findings: なし
- Unplanned: `index.test.ts` の `startTick` のテストと `widget` のテストが、同じ「走っている記録」をそれぞれ組み立てていたので、`running(found, role)` にまとめた。

## Work Review

### Round 1

- Stale:
  - `.pi/extensions/consult/view/widget.ts:4` — 冒頭コメントの例が `res:2 pro:1`（括弧なし）のまま。実装（`:65`）と plan（`plan:107`）は `[res:2 rev:1]` の括弧ありに変わった。理由：`[]` のあしらいを足した Unplanned で期待値は直したが、コメントの例が旧形のまま残ったため。
    - fixed: 冒頭コメントの例を `[res:2 pro:1]` に直した。
  - `.pi/extensions/consult/view/widget.ts:57` — `runningLine` の doc が同じく `res:2 pro:1` の旧形。理由：同上。
    - fixed: `runningLine` の doc を `[res:2 pro:1]` に直した。
  - `.pi/extensions/consult/index.ts:69` — `TickPort` の説明が「保存場所と、いまのセッションと、送る pi だけを持つ」だが、`:76` で `ui` を持つ。「だけ」が偽になった。理由：Steps 2.1 の `ui` 追加に説明が追従していないため。
    - fixed: `TickPort` の説明に「表示の窓口」を足した。
  - `.pi/extensions/consult/index.ts:194` — `registerCommands` の説明が「サブエージェントの一覧と停止、音の切り替え」だが、一覧（`consult-status`）はスライス 2 で消え、残りは cancel と sound のみ（`:195-204`）。理由：コマンド削除にコメントが追従していないため。
    - fixed: `registerCommands` の説明から「一覧」を消した。
  - `.pi/extensions/consult/index.test.ts:213` — ケース名が `rev:1` だが、断言（`:222`）と plan のケース（`plan:121`）は `[rev:1]`。理由：`[]` 追加後の名前の直し忘れで、読む者が形を誤読するため。
    - fixed: ケース名を `[rev:1]` に直した。
  - `.pi/extensions/consult/README.md:176` — 追加段落が「5 秒ごとの tick と `session_start` でセット」と書くが、実装（`index.ts:251-255`）は開始直後にもセットし、plan の fence（`plan:137`）も “set when a subagent starts” を含む。理由：開始直後の表示を足した Unplanned が README に反映されていないため。
    - fixed: 段落を、開始のときにセットすることを含む形に直した。
  - `cycles/261110-061-dev/plan/01-running-widget.md:14` — Design が「tick と `session_start` から呼ぶだけ」と書くが、Steps 2.3（`plan:113`）は開始直後の呼び出しを足した。理由：同じ Unplanned で Steps は直したが Design が旧形のままのため。
    - fixed: Design を「tick、`session_start`、開始の直後」に直した。
- Unlisted:
  - なし — 差分のコード変更はすべて `Files` の指名内（`index.ts`、`index.test.ts`、`README.md`、`consult.fixture.ts`、`tool/consult.ts`、`view/widget.ts`、`view/widget.test.ts`）に収まる。plan と ADR の変更は記録のため対象外。
- Gaps:
  - `.pi/extensions/consult/index.ts:255` — `consult_run` 実行直後の `showRunningOnce`（Steps 2.3）を自動テストが exercised しない。`index.test.ts:212-252` の widget 章は tick のみ。Added の look（`plan:161`）も `/reload` 後の表示だけで、開始から 5 秒以内の表示を確かめない。理由：ADR C5 の「開始の時点でセット」が自動でも目視でも区別されず、Goal の即時性に穴が残るため。
    - fixed: `showRunningOnce` を export し、走っている記録から `[rev:1]` をセットするテストを足した。
  - `.pi/extensions/consult/index.ts:272` — `session_start` での復元（Steps 2.5）を自動テストが exercised しない。Added の look は `/reload` 後を見るが、最初の tick（5 秒後）でも表示されるため、どちらの経路で出たか区別できない。理由：`session_start` 経路が壊れても tick が 5 秒後に直すので目視が通り、経路別の穴が残るため。
    - fixed: 同じ `showRunningOnce` のテストで、`session_start` が呼ぶ関数の振る舞いを確かめた。
- Policy:
  - なし — Allowed（文字列の配列、開始・tick・`session_start` の 3 時点、固有キー、同名短縮）を満たし、Forbidden（失敗時の継続＝try/catch、テーマ色の保持なし、他拡張キー不使用、拡張間の積み順の保証なし）の違反なし。行内の `types.json` 順は ADR C4 の決定値のため、Forbidden の「順序を保証しない」（拡張間の積み順）には当たらない。
- Unproven:
  - `.pi/extensions/consult/view/widget.test.ts:12` — happy が research＋review のみで、`types.json` 順と辞書順が一致する（research＜review）ため、実装が辞書順に変わっても緑のまま。理由：順序の出所（`types.json`）を壊しても検出できず、code＋research のように両順序が逆になる組がないため。
    - fixed: 辞書順と逆になる `code` と `research` のケースを足した。
  - `.pi/extensions/consult/view/widget.test.ts:22` — custom 1 体では「初出順で後ろに置く」配置が観測できず、未知役割の配置を壊しても緑のまま。理由：要素が 1 つでは順序が定義されず、2 体組（例：zeta＋alpha）がないため。
    - fixed: `order` にない `zeta` と `alpha` の 2 体のケースを足した。
- Noise:
  - なし — `[res:2 rev:1]`・`[cus:1]`・`[rev:1]` 等の括弧と短縮名は ADR C4 と plan の決定値のため、指示 4 により finding 化しない。
- Doubts:
  - `.pi/extensions/consult/index.ts:109` — `roleOrder()` の読失敗時 `[]`（Steps 2.2）を確かめるテストがなく、Added の look も正常系のみ。finding 化は見送り、捨て置きか使い捨て確認かをオーナー判断としたい。理由：`types.json` の読み失敗は稀で影響も小さい（初出順表示に退化するだけ）ため。

### Round 2

- Stale:
  - `.pi/extensions/consult/view/widget.ts:4` — fixedを確認。冒頭コメントが `[res:2 pro:1]`（括弧あり）になっている。理由：実装（`:65`）と plan（`plan:107`）の括弧ありと一致し、旧形 `res:2 pro:1` は残っていないため。
  - `.pi/extensions/consult/view/widget.ts:57` — fixedを確認。`runningLine` の doc が `[res:2 pro:1]` になっている。理由：同上、旧形は残っていないため。
  - `.pi/extensions/consult/index.ts:69` — fixedを確認。`TickPort` の説明が「保存場所と、いまのセッションと、送る pi と、表示の窓口を持つ」になっている。理由：`:76` の `ui` と整合し、「だけ」の偽装が解消されたため。
  - `.pi/extensions/consult/index.ts:199` — fixedを確認。`registerCommands` の説明から「一覧」が消え「サブエージェントの停止と、音の切り替え」になっている。理由：スライス 2 で `consult-status` が消え、残り（cancel と sound のみ）と一致するため。
  - `.pi/extensions/consult/index.test.ts:210` — fixedを確認。ケース名が `[rev:1]` になっている。理由：断言（`:219`）と plan のケース（`plan:121`）の `[rev:1]` と一致するため。
  - `.pi/extensions/consult/README.md:176` — fixedを確認。段落が “it is set when a subagent starts, from the same 5-second tick and at `session_start`” を含む形になっている。理由：実装（`index.ts:259` の開始直後、`index.ts:158` の tick、`index.ts:277` の `session_start`）と plan の fence（`plan:141`）に整合するため。
  - `cycles/261110-061-dev/plan/01-running-widget.md:14` — fixedを確認。Design が「tick、`session_start`、開始の直後から呼ぶだけ」になっている。理由：Steps 2.3（`plan:113`）の開始直後の呼び出しと一致するため。
- Unlisted:
  - なし — Round 1 の当該区分に `fixed:` 行がなく、確認対象外。`git diff HEAD~1..HEAD` のコード変更は `index.ts`、`index.test.ts`、`README.md`、`view/widget.ts`、`view/widget.test.ts` に収まる。
- Gaps:
  - `.pi/extensions/consult/index.ts:118`（旧 `:255`）— fixedを確認。`showRunningOnce` が export され、`index.test.ts:251-268` に走っている記録→`[rev:1]` と記録なし→`undefined` の 2 件がある。理由：Steps 2.3 が呼ぶ関数自体の振る舞いが exercised され、呼び出し（`index.ts:259` の開始直後、`index.ts:277` の `session_start`）と対応するため。
  - `.pi/extensions/consult/index.ts:277`（旧 `:272`）— fixedを確認。上記と同じ 2 件で、`session_start` が呼ぶ関数（`showRunningOnce`）の振る舞いが確かめられている。理由：`session_start` ハンドラが当該関数を呼ぶこと（`:277`）と、ヘルパーのテスト内容が一致するため。
- Policy:
  - なし — Round 1 の当該区分に `fixed:` 行がなく、確認対象外。今回差分の表示文言・キー・try/catch に Forbidden の違反なし。
- Unproven:
  - `.pi/extensions/consult/view/widget.test.ts:22` — fixedを確認。`code` と `research` の組で `[res:1 cod:1]` を断言するケースがある。理由：`types.json` 順（research＜code の前後）が辞書順（code＜research）と逆であり、実装が辞書順に変われば赤になるため。
  - `.pi/extensions/consult/view/widget.test.ts:34` — fixedを確認。`zeta` と `alpha` の 2 体で `[zet:1 alp:1]`（初出順）を断言するケースがある。理由：要素 2 体で初出順の配置が観測でき、未知役割の配置を壊せば赤になるため。
- Noise:
  - なし — Round 1 の当該区分に `fixed:` 行がなく、確認対象外。
- Doubts:
  - `.pi/extensions/consult/index.ts:259,277` — `showRunningOnce` のヘルパー自体はテストされたが、`consult_run` の execute（`:259`）と `session_start` ハンドラ（`:277`）の呼び出し元の配線を直接 exercised するテストはない（`entry wiring` はレンダラーのみ）。finding 化は見送り、ヘルパー止まりでよいか・使い捨て確認で足りるかをオーナー判断としたい。理由：ヘルパーが正しくても呼び出しが外れれば Goal の即時性・復元が失われるが、配線の自動テストは既存方針（`entry` の偽物は使う入口のみ）を超える手間が要るため。

## Acceptance

- Goal: 達成している。稼働中のサブエージェントの数が、エディタの上に他の拡張の表示と並んで `[res:2 pro:1]` のように見え、`/consult-status` はない。オーナーが `/reload` のあとに 3 体を動かし、`[res:2 pro:1]` から数が減って消えるまでを見て承認した。
- Ran:
  - `pnpm test:run`: 64 ファイル、791 件が通った。
  - `pnpm typecheck`: `root: ok`、`.pi: ok`。
  - `pnpm lint`: 指摘なし。
  - `pnpm format:check`: すべて整っている。
  - `pnpm test:related .pi/extensions/consult/index.ts .pi/extensions/consult/view/widget.ts .pi/extensions/consult/index.test.ts .pi/extensions/consult/view/widget.test.ts`: 21 件が通った。
  - 壊して赤を確かめた: 角括弧を外す → 7 件が赤、順序を辞書順にする → 2 件が赤、0 体で `undefined` を返さない → 3 件が赤。3 つとも戻した。
- Findings: なし
- Doubts: `.pi/extensions/consult/index.ts:259,277` — `showRunningOnce` のヘルパーはテストしたが、`consult_run` の execute と `session_start` ハンドラの配線を直接試すテストはない。オーナーの look では即時表示と復元を見たが、配線を外したときに赤になるテストはない。
