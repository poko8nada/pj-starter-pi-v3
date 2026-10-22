# PLAN `record-delivery`

## Files

```text
.pi/extensions/consult/
  run/
    log.ts               update
    log.test.ts          update
    delivery.ts          update
    delivery.test.ts     update
  tool/
    consult.ts           update
    consult.test.ts      update
    subagents.ts         update
    subagents.test.ts    update
    sound.ts             update
    sound.test.ts        update
    worktree.ts
    worktree.test.ts
  index.ts               update
  index.test.ts          add
  README.md              update
```

## Slices

## 1.記録に、走行を指す値と印を足す

### Types

```ts
// .pi/extensions/consult/run/log.ts
export interface RunRecord {
  // 既存の欄は変えない
  /** 報告の本文。完了の行には必ず入る */
  readonly notice?: string;
  /** 報告を渡した時刻。印の行にだけ入る */
  readonly delivered?: number;
}

/** 走行を指す値。session と subagent と started の 3 つで 1 つに決まる */
export function runKey(record: RunRecord): string;

/** 印を持つ行から、渡し済みの走行の集合を作る */
export function deliveredKeys(records: readonly RunRecord[]): ReadonlySet<string>;

/** 報告がまだ渡されていない完了の行か */
export function isWaiting(record: RunRecord, delivered: ReadonlySet<string>): boolean;
```

### Steps

1. `.pi/extensions/consult/run/log.ts`:
   - `RunRecord` に `delivered` を足し、`parseRun` で数値として読む。
   - `runKey`、`deliveredKeys`、`isWaiting` を足す。
2. `.pi/extensions/consult/run/log.test.ts`:
   - 印の行から集合を作る試験と、印の有無で `isWaiting` が変わる試験を足す。

### Verify:

- test: `pnpm test:run .pi/extensions/consult/run/log.test.ts`
  - (happy) `ended: 2000` と `notice` を持つ行と、同じ走行の `delivered: 3000` の行 → `deliveredKeys` がそのキーを含み、`isWaiting` が偽
  - (happy) 印の無い完了の行 → `isWaiting` が真
  - (empty) 行が 0 本 → `deliveredKeys` が空
  - (boundary values) `started` が同じで `session` が違う 2 走行 → キーが別
  - (boundary values) `started` と `session` が同じで `subagent` が違う 2 走行 → キーが別
  - (boundary values) `session` と `subagent` が同じで `started` が違う 2 走行 → キーが別で、印は片方にだけ効く
  - (error) `delivered: "x"` の行 → `parseRun` が `delivered` を落とし、印として数えない
  - (empty) `notice` の無い終わりの行 → `isWaiting` が偽
  - _no case_: `runKey` の区切り文字 — 内部の文字列で、外から見えない

## 2.完了を記録の 1 行にし、渡したら印を書く

### Types

```ts
// .pi/extensions/consult/run/delivery.ts
export interface Cursor {
  readonly ended: number;
}

/** まだ渡していない完了の行を、古い順に返す。古い目録の ended 以下は渡し済みとみなす */
export function pendingReports(
  place: Place,
  scope: ReadScope & { readonly session: string },
): RunRecord[];

/** 渡した印を、記録に 1 行足す */
export function appendDelivered(place: Place, record: RunRecord, at?: Date): void;

// .pi/extensions/consult/tool/consult.ts
function completionRecord(job: BackgroundJob, report: SubagentReport | undefined): RunRecord;

export function createRuntime(
  pi: PiFace,
  place: Place,
  run?: ConsultRunner,
  sessionNow?: () => string,
  check?: CheckRecord,
  psRun?: PsRun,
): ConsultRuntime;
```

### Steps

1. `.pi/extensions/consult/run/delivery.ts`:
   - `Delivery`、`createDelivery`、`unreadNotices`、`writeCursor` を消し、`pendingReports` と `appendDelivered` を足す。
   - 目録の `ended` は、直す前に書かれた `notice` 行のための水位として読む。新しい印は記録の行にする。
2. `.pi/extensions/consult/tool/consult.ts`:
   - `closeRecord` を `completionRecord` にし、`token` を写す。記録への追記はしない。
   - `runInBackground` が、完了の行を `notice`（本文）つきで 1 行だけ書く。`.catch` も同じで、本文は `failureOutcome` の物にする。
   - `RuntimeState.delivery` と `deliver` を消し、`createRuntime` から `delivery` の引数を外す。
3. `.pi/extensions/consult/index.ts`:
   - `createDelivery` を消し、`deliverUnread` を `pendingReports` と `appendDelivered` で書き直す。
   - `session_shutdown` の `delivery.detach()` を消す。
4. `.pi/extensions/consult/run/delivery.test.ts`:
   - 配達の試験を `pendingReports` と `appendDelivered` の試験に置き換える。目録の試験は残す。
5. `.pi/extensions/consult/tool/consult.test.ts`:
   - `setup` から `delivery` の引数を外す。
   - 完了の試験を「`pi.sendMessage` は呼ばれず、記録に本文と `token` の 1 行が増える」に変える。
   - 「終了行は `token` を持たない」の試験を「完了の行は `token` を持つ」に変える。

### Verify:

- test: `pnpm test:run .pi/extensions/consult/run/delivery.test.ts .pi/extensions/consult/tool/consult.test.ts`
  - (happy) 印の無い完了の行 → `pendingReports` がその行を返す
  - (happy) `appendDelivered` の後 → `pendingReports` が返さない
  - (boundary values) 古い目録 `{ ended: 2000 }`、`ended: 2000` の完了 → 返さない。`ended: 2001` → 返す
  - (empty) 行が 0 本 → 空
  - (happy) 走行が完了する → 記録に 1 行、`notice` に本文、`token` は開始行の `token` と同じ UUID。`pi.sendMessage` は呼ばれない
  - (happy) 印の無い完了が 2 行（`started: 1000`、`2000`）→ 古い順に 2 行返す
  - (boundary values) 印の無い完了が別の session に 1 行 → `scope.session` の行だけ返す
  - (empty) 開始行（`ended` 無し）と、`notice` の無い終わりの行 → どちらも返さない
  - (error) runner が投げる → 記録に 1 行、`notice` に失敗の本文
  - _no case_: `appendDelivered` の既定の時刻 — `Date.now()` で、外から観測しない

## 3.セッションの tick が記録を読み、音も同じ印で決める

### Types

```ts
// .pi/extensions/consult/index.ts
export interface TickPort {
  readonly pi: PiFace;
  readonly place: Place;
  readonly sessionNow: () => string;
  readonly check?: CheckRecord;
}

/** 印の無い完了を渡す。渡した数を返す */
export function flushPending(port: TickPort): number;

/** 5 秒ごとに、印の無い完了を渡し、まだあれば音を鳴らす。すでに動いていれば何もしない */
export function startTick(port: TickPort): void;

export function stopTick(): void;

// .pi/extensions/consult/tool/sound.ts
export type Player = () => void;
export const SOUND_INTERVAL_MS = 5000;
export function playSound(): void;
export function isSoundEnabled(): boolean;
export function setSoundEnabled(on: boolean): void;
export function setPlayer(next: Player): () => void;
```

### Steps

1. `.pi/extensions/consult/index.ts`:
   - `TickPort`、`flushPending`、`startTick`、`stopTick` を足す。tick は `flushPending` を呼び、`runningRuns` か `pendingReports` が空でなければ `playSound` を呼ぶ。`flushPending` の失敗は捕まえ、次の tick に任せる。
   - `session_start` で `startTick` を呼び、`session_shutdown` で `stopTick` を呼ぶ。
   - `announceRunningSubagents` から `startSound` を外す（知らせは残す）。
2. `.pi/extensions/consult/tool/sound.ts`:
   - `startSound`、`stopSound`、`isSoundRunning` を消す。残すのは `playSound`、`setPlayer`、`isSoundEnabled`、`setSoundEnabled`、`SOUND_INTERVAL_MS`。
3. `.pi/extensions/consult/tool/consult.ts`:
   - `beginRun` から `startSound` を外す。
4. `.pi/extensions/consult/index.test.ts`:
   - 偽の `pi` と偽のタイマーで、tick の試験を書く。
5. `.pi/extensions/consult/tool/sound.test.ts`:
   - タイマーの試験を消し、`playSound` と `setPlayer` と `enabled` の試験だけにする。
6. `.pi/extensions/consult/tool/consult.test.ts`:
   - 音の試験を消し、`stopSound` と `isSoundRunning` の import を外す。

### Verify:

- test: `pnpm test:run .pi/extensions/consult/index.test.ts .pi/extensions/consult/tool/sound.test.ts`
  - (happy) 印の無い完了の行、`startTick`、5 秒進める → `pi.sendMessage` が 1 回、印の行が 1 本、音が 1 回
  - (happy) さらに 5 秒進める → 送らず、印も増やさない
  - (happy) 走っている開始行 → 5 秒進める → 音が 1 回。送らない
  - (empty) 何も無い → 5 秒進めても、送らず鳴らさない
  - (boundary values) 音が off、印の無い完了 → 鳴らさず、送る
  - (error) `sendMessage` が投げる → 印を書かない。次の tick で送り直す
  - (happy) `flushPending` が 1 件渡す → 1 を返す。0 件 → 0 を返す
  - (happy) `startTick` を 2 回呼ぶ → タイマーは 1 本。5 秒で送信 1 回、音 1 回
  - (happy) `stopTick` の後、10 秒進める → 送らず鳴らさない
  - _no case_: 5 秒という間隔 — `SOUND_INTERVAL_MS` の値そのもの
  - _no case_: 同時実行 — tick は同期で、`flushPending` の間に別の tick は走らない

## 4.一覧が印を見る

### Types

```ts
// .pi/extensions/consult/tool/subagents.ts
export interface RowState {
  readonly alive: boolean;
  readonly waiting: boolean;
}

export function rowOf(record: RunRecord, state: RowState, now: number): string;

export function rowsOf(
  records: readonly RunRecord[],
  check: CheckRecord | undefined,
  now: number,
): string[];
```

### Steps

1. `.pi/extensions/consult/tool/subagents.ts`:
   - `RowState` を足し、`rowOf` の第 2 引数を `RowState` にする。
   - `rowsOf` が `deliveredKeys` と `isRunning` から `RowState` を作る。
   - 状態の文字列は、`alive` なら `running (pid N)`、`waiting` なら `running`、それ以外は `stateOf(record)`。
2. `.pi/extensions/consult/tool/subagents.test.ts`:
   - 生きた開始行、印の無い完了の行、印のある完了の行の 3 つを足す。

### Verify:

- test: `pnpm test:run .pi/extensions/consult/tool/subagents.test.ts`
  - (happy) 走っている開始行 → `running (pid N)`
  - (happy) 印の無い完了の行 → `running`（pid を出さない）
  - (happy) 印のある完了の行 → `done`
  - (empty) 記録が 0 本 → `no subagents in this project yet`
  - _no case_: `SubagentState` の `turn-limit` / `error` / `aborted` — 既存の `stateOf` の枝で、この slice は変えない
  - _no case_: `alive` と `waiting` が同時に真 — 開始行は `notice` を持たないので起きない

## 5.README を新しい振る舞いに合わせる

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/consult/README.md`:
   - 「Background and stopping」の節を、完了は記録の 1 行に行き、セッションが 5 秒ごとに読み直し、渡したら印の行を足す、と書き直す。
   - 「the next boot of the same session hands those notices over」の文を消し、古い目録は読むだけだと書く。

### Verify:

- read: サブエージェントが `.pi/extensions/consult/README.md` の「Background and stopping」と `cycles/261023-033-dev/adr.md` を読み、節が採った形と合っているかを報告する
  - (happy) 完了は記録の 1 行に行き、セッションが定期的に読み、渡したら印を足す、と報告する
  - (happy) 古い目録は読むだけで、新しくは書かない、と報告する
  - (empty) 「the next boot of the same session」の文が無い、と報告する
  - _no case_: 文面そのもの — 意味が合っていればよい

## 6.統合: リロードをまたいだ報告が、リロードなしで届く

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/consult/index.test.ts`:
   - 古いインスタンスが書いた完了の行を、新しいインスタンスの tick が 1 回だけ渡す試験と、その前後で一覧と音が変わる試験を書く。
2. 全体の試験を走らせる。

### Verify:

- test: `pnpm test:run .pi/extensions/consult`
  - (happy) 古いインスタンスが書いた完了の行 → 新しい tick が 1 回渡し、印を書く。次の tick は渡さない
  - (happy) 同じ印を、一覧は `running` から `done` へ、音は鳴るから鳴らないへ、見る
  - (happy) `pnpm test:run .pi/extensions/consult` が通る
  - _no case_: typecheck と lint — commit の lefthook が見る

## Notes

### Slice 1: 記録に、走行を指す値と印を足す

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 0e22efb

### Slice 2: 完了を記録の 1 行にし、渡したら印を書く

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 4d16160

### Slice 3: セッションの tick が記録を読み、音も同じ印で決める

- Findings:
  - tick は flush 後に pending を見ると配達 tick で鳴らないため delivered 数も条件に入れた
  - 走行中判定は既定 2 日窓のため試験の開始行は当日で書く
  - index.test.ts の tmp import は 1 段浅い
  - session 変数の影を避け current にした
- Unplanned:
  - なし
- Commit: d033f9a

### Slice 4: 一覧が印を見る

- Findings:
  - 印の無い完了は `running`（pid 無し）、印ありは `done`、生きた開始行は `running (pid N)`
- Unplanned:
  - `rowsOf`/`listText` に全行を渡し中で `latest` する補正（`latest` 済みでは印行が落ちるため）。Types は変えない
- Commit: 93b69d0

### Slice 5: README を新しい振る舞いに合わせる

- Findings:
  - Background 節が採った形（1 行・5 秒・印）と合い、旧文は無い
- Unplanned:
  - なし
- Commit: 30a70eb

### Slice 6: 統合: リロードをまたいだ報告が、リロードなしで届く

- Findings:
  - 旧完了は新 tick が 1 回だけ渡し、一覧は running→done、音は鳴る→鳴らない
  - 全体 379 件 pass
- Unplanned:
  - なし
- Commit: a74c659

### Cleanup: 試験の重複と消えた振る舞いの棚卸し（slice 外）

- Checked: Files の試験 (`log`、`delivery`、`consult`、`subagents`、`sound`、`index`) を走査
- Dropped (重複):
  - `consult.test.ts` `controlSubagent: list`「知らせの文は consult_subagents: で始まる」→ 7 分岐版が含むため
  - `consult.test.ts` `音` の末尾の `nope` 断定 2 行 → 専用の不正引数試験（`usage` まで見る）が強いため。`音` は on/off 切替のみ残す
  - `subagents.test.ts`「走っているサブエージェント（終了行が無く check が running）は running」→ 新規「走っている開始行 → running (pid N)」が pid 形式まで見るため
  - `subagents.test.ts`「一覧の check を差し替え」（`listText` 単位）→ 道具単位「list の check の口が効く」が配線まで見るため
  - `index.test.ts`「さらに 5 秒進める → 送らず、印も増やさない」→ `reload` 2 件（送り 1 回・印・音・一覧の前後）が含むため
- Dropped (消えた振る舞い・止めた分岐): なし。`startSound`/`stopSound`/`isSoundRunning`、`createDelivery`/`unreadNotices`/`writeCursor`、`closeRecord` への参照は残っておらず、2 行書きの断定も無い。slice 済みで除去済み
- Kept: 層をまたぐ空入力（`pendingReports` 空／`flushPending` 0 件／tick 無音）は各層の契約として残す。連番の 5 件は分岐が別（最大値・混在・他 session・内存・終了済み）のため残す
- Verify: `pnpm test:run .pi/extensions/consult` 18 files / 375 tests pass（379 - 4）

## Review

### Round 1

- Stale:
  - `.pi/extensions/consult/run/log.ts:46` — `notice` の欄注が「届け先のセッションが無かったとき」「次に起動したセッションが読む」のまま。いまは完了が必ず `notice` 行になり tick が 5 秒ごとに読むため、条件も読み時も古い。
    - fixed: 欄注を「完了は必ずこの 1 行になり、tick が 5 秒ごとに読んで渡し、渡すたびに印の行を足す」に書き直した。
  - `.pi/extensions/consult/README.md:66` — 一覧の説明が「終わりの行があれば仕上がりで読む（pid が生きていても finished）」のまま。印の無い完了は `running`（pid 無し）で出るため、終わり行＝仕上がり表示の断定が崩れている。
    - fixed: 渡し済みの終わりは仕上がり表示、印の無い完了は渡すまで `running`（pid 無し）と書き分けた。
  - `.pi/extensions/consult/README.md:201` — Sound 節が「走っている間だけ」「タイマーは走行者が居なくなると自分で止まる」「終わりには鳴らない」のまま。いまは渡し待ち（`pending`／配達 tick の `delivered`）でも鳴り、タイマーは `session_shutdown` の `stopTick` まで生きるため。
    - fixed: Sound 節を tick 主語に書き直した（渡し待ちでも鳴る・タイマーは `session_shutdown` まで・自分で止まらない）。
  - `.pi/extensions/consult/README.md:237` — Tests 表の `run/delivery.test.ts` 説明が「send when attached, write to the record when not」のまま。`createDelivery`／`unreadNotices` は消え、いまは `pendingReports`／`appendDelivered` の試験のため。
    - fixed: `pendingReports`／`appendDelivered`（印の行・旧 cursor の水位）の説明に直した。
  - `.pi/extensions/consult/README.md:240` — Tests 表の `tool/consult.test.ts` 説明に「the sound」が残る。`consult.test.ts` から音の試験（と `stopSound`／`isSoundRunning` の import）は消え、音は `sound.test.ts` と `index.test.ts` が見るため。
    - fixed: 「the sound」を削り、完了の行（`sendMessage` なし）の説明に直した。
  - `.pi/extensions/consult/README.md:241` — Tests 表の `tool/sound.test.ts` 説明が「one timer, one sound every 5 seconds」のまま。タイマーは `index.ts`（`startTick`／`stopTick`）に移り、`sound.ts` は `playSound` だけのため。
    - fixed: `playSound`・player 差し替え・タイマーは `index.ts` の旨に直した。
- Unlisted:
  - なし（製品の変更は README・index・run/log・run/delivery・tool/consult・tool/subagents・tool/sound とその試験のみで、いずれも ## Files に名指しされている。`worktree.*` は無変更のまま）。
- Gaps:
  - なし（各 slice の Verify の弾は対応する試験がある。印行の厳密な数え方の穴は Unproven 側に挙げる）。
- Unproven:
  - `.pi/extensions/consult/index.test.ts:82` — 題が「印の行が 1 本増える」を名指すが、断定は戻り値 1 と `sent` 1 件のみ。`flushPending` が印を 0 本／2 本書いてもこの試験は通り、2 本重複は全試験が通る。
    - fixed: 行数 2・`deliveredKeys` 1・`pendingReports` 空の断定を足し、0 本／2 本では落ちるようにした。
  - `.pi/extensions/consult/index.test.ts:104` — 題が「送り 1 回、印 1 本、音 1 回」を名指すが、断定は `sent` 1 件と音 1 回のみ。tick が印を書かなくても・重ね書きしても初回 tick の断定は通り、重複は全試験が通る。
    - fixed: 行数 2・`deliveredKeys` 1・`pendingReports` 空の断定を足し、書かない／重ね書きでは落ちるようにした。
- Doubts:
  - `isWaiting` の `record.delivered !== undefined → false`（`.pi/extensions/consult/run/log.ts:291`）に名指しの試験が無い。現行の書き手は両持ち行（`ended`＋`notice`＋`delivered`）を書かないため、到達不能な防御か死枝かの切り分けが付かなかった。finding にはしない。
    - left: 書き手が両持ち行を書かないため、到達不能か死枝か切り分けず残す。
  - 印だけの行のみの入力に対する `listText`（`.pi/extensions/consult/tool/subagents.ts:179`）の専用試験が無い。`rows.length === 0 → message` への切替え自体は `[]` の試験で見るが、印のみ 1 件→文言の分岐は Verify の空弾（記録 0 本）の名指し外のため、finding にはしない。
    - left: Verify の空弾の名指し外で、実入力では印のみ単独は起きないため足さない。
  - 私的な `deliverUnread`（`.pi/extensions/consult/index.ts:67`）の `session_start` 配線を叩く試験が無い。論理は `flushPending` と同形で Verify の名指しも tick 側のため、finding にはしない。
    - left: `flushPending` と同形で Verify の名指しも tick 側のため、私的配線の試験は足さない。

## Acceptance

- Ran:
- Findings:
- Doubts:
