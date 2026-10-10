# PLAN `record-and-delivery`

## Files

```text
.pi/extensions/consult/
  index.ts                    update
  README.md
  run/
    place.ts                  add
    place.test.ts             add
    log.ts                    update
    log.test.ts               update
    worktree.ts               update
    worktree.test.ts          update
    delivery.ts               update
    delivery.test.ts          update
    child.ts
    run.ts
    git-env.ts
  tool/
    consult.ts                update
    consult.test.ts           update
    children.ts               update
    children.test.ts          update
    worktree.ts               update
    worktree.test.ts          update
    sound.ts                  update
    sound.test.ts             update
    commit.ts
    run.ts
test/
  tmp.ts
```

- 印の無い file のうち、呼び手として見るのは `tool/commit.ts` と `tool/run.ts`（`ExecuteArgs` と `PARAMETERS` の形を共有する）と、`tool/consult.ts` の `RunExecuteArgs`（`createRuntime` の引数が増える）だけ。`run/child.ts`・`run/run.ts`・`run/git-env.ts` と `test/tmp.ts` は import されているだけなので、見ない
- `README.md` は `consult-readme` が書く（この plan の merge を待つ）
- 置き場を偽物にするテストは、`tmpDir()` と `placeFor` で作る（記録を読む側）。worktree を作るテスト（`run/worktree.test.ts`・`tool/worktree.test.ts`・`tool/children.test.ts` の fixture）は今まで通り、実リポジトリと `CONSULT_ROOT` の差し替えを使う（`rootFor` と `ensureRoot` が残るため）。`process.kill` は `controlChild` の引数で差し替える

## Slices

1. 置き場を値にする
   - I/O:
     ```ts
     // run/place.ts
     export interface Place {
       readonly dir: string;
       readonly toplevel: string;
     }
     export function projectKey(toplevel: string): string;
     export function dayName(at: Date): string;
     export function placeFor(root: string, toplevel: string): Place;
     export function dayFile(place: Place, at: Date): string;
     export function windowFiles(place: Place, at: Date, days: number): string[];
     export function oldFiles(place: Place, at: Date, keepDays: number): string[];

     // run/log.ts
     export const RECORD_DAYS = 2;
     export const KEEP_DAYS = 30;
     export interface RunRecord {
       readonly session: string;
       // child / role / worktree? / pid / started / ended? / state? / reason? / files? / turns? / spend? / notice?
     }
     export interface ReadScope {
       readonly session?: string;
       readonly days?: number;
       readonly at?: Date;
     }
     export function appendRun(place: Place, record: RunRecord, at?: Date): void;
     export function readRuns(place: Place, scope?: ReadScope): RunRecord[];
     export function parseRun(line: string): RunRecord | undefined;

     // run/worktree.ts
     export function resolveReal(path: string): string;
     export function consultRoot(): string;
     export function topLevel(cwd: string): string;
     export function rootFor(cwd: string): string | undefined;
     export function ensureRoot(cwd: string): string;

     // tool/consult.ts
     export function createRuntime(
       pi: PiFace,
       place: Place,
       run?: ConsultRunner,
       delivery?: Delivery,
       sessionNow?: () => string,
     ): ConsultRuntime;

     // 消える形: run/log.ts の logPath・unitOf・PARENT_UNIT（記録は unit の入れ物の下に無い）
     ```
   - Verify:
     - test: `pnpm vitest run .pi/extensions/consult/run`
       - (happy) 別の道で同じ名前の repo を 2 つ作ると、`projectKey` が違う値になる → 置き場が分かれる
       - (happy) この機械は JST（`date +%Z` が `JST`）。`dayName(new Date('2026-10-09T15:30:00Z'))` → `'2026-10-10'`（UTC で組む実装なら `'2026-10-09'` になる）
       - (empty) 置き場が無い → `readRuns` が `[]`、`windowFiles` が `[]`
       - (boundary) `windowFiles(place, new Date(2026, 9, 10), 2)` は今日と昨日の 2 件を新しい順に返す。3 日前の file は返さない
       - (boundary) `<place.dir>/delivered.json` を置いても `windowFiles` は拾わない
       - (boundary) `appendRun(place, r, new Date(2026, 9, 9, 23, 59))` と `appendRun(place, r2, new Date(2026, 9, 10, 0, 1))` → `2026-10-09.jsonl` と `2026-10-10.jsonl` に 1 行ずつ（日をまたぐ子の開始と終わりが別の file に入る）
       - (boundary) `at` を渡さない `appendRun` は今日の file に書く
       - (boundary) `oldFiles(place, new Date(2026, 9, 10), 30)` が `2026-09-09.jsonl` を返し、`2026-09-10.jsonl` を返さない（9-10 がちょうど 30 日前。含む側は残す）
       - (boundary) `readRuns(place, { session: 'A' })` は session 'A' の行だけを返し、`readRuns(place)` は両方を返す
       - (boundary) `readRuns(place, { days: 2 })` は 3 日前に書いた行を返さない
       - (error) session の無い行を書いた file を `readRuns` が読んでも、その行は返らない
       - (empty) `rootFor(cwd)`: worktree が無い repo → `undefined`。呼ぶ前後で `<root>` 直下の並びが同じ
       - (boundary) `ensureRoot(cwd)` を 2 回呼ぶと、同じ根を返し、作るのは 1 回だけ
     - cli: `npx tsc -p .pi/tsconfig.json --noEmit`
       - (error) `createRuntime(pi)` の 1 引数呼び出しを一時的に書くと赤になる（確かめたら戻す）
     - cli: 消した形
       - (empty) `grep -rn "logPath\|unitOf\|PARENT_UNIT" .pi/extensions/consult` → 0 件
   - Steps:
     1. `run/place.ts`: `Place` と 5 つの純関数を作る。`projectKey` は `node:crypto` の `createHash('sha1')`。`dayName` はローカルの getter で組み立てる（`toISOString` は UTC なので使わない）。`windowFiles` と `oldFiles` は `^\d{4}-\d{2}-\d{2}\.jsonl$` に合う名前だけを拾う
     2. `run/place.test.ts`: 上のケースを書く。時刻は `new Date(2026, 9, 10)` で直接作り、根は `tmpDir()` を使う
     3. `run/log.ts`: `RunRecord` に `session` を足し、`appendRun` / `readRuns` を `Place` と `ReadScope` で受ける形にする。`parseRun` は `session` も必須にする。`logPath` と `unitOf` と `PARENT_UNIT` を消す
     4. `run/log.test.ts`: 窓・日割り・`session` のケースに書き換える
     5. `run/worktree.ts`: `resolveReal`・`consultRoot`・`topLevel` を export する。`rootFor` を読み取り専用にし（`string | undefined`。作らない）、`ensureRoot` を足す。`createWorktree` と `unitRoot` を `ensureRoot` に寄せる。`removeWorktree` は unit の入れ物だけを消す（記録はその下に無い）
        - Outside: design の `git`。頂点を引く道と `gitEnv` は既存のまま変えない
     6. `run/worktree.test.ts`: `rootFor` が作らないこと、`ensureRoot` が 1 回だけ作ること、worktree があればそれを使うことを足す
     7. `tool/consult.ts`: `createRuntime` の第 2 引数に `place` を、第 5 引数に `sessionNow` を入れる。state に両方を持つ。`beginRun` と `runInBackground` は `state.place` と `state.sessionNow()` を使い、`rootFor(ctx.cwd)` を呼ばない。開始の行・終わりの行・notice にその session を書く
     8. `tool/consult.test.ts`: `createRuntime(pi, place, fakeRunner)` の形に直し、place は `placeFor(tmpDir(), tmpDir())` で作る。`CONSULT_ROOT` の差し替えを落とす
     9. `index.ts`: `place = placeFor(consultRoot(), topLevel(process.cwd()) か process.cwd())` を作り、`session` を module の変数にして `createRuntime(pi, place, undefined, delivery, () => session)` に渡す。`topLevel` が投げたら `process.cwd()` に落とす（読み込みで投げない）

2. 一覧が記録から真実を読む
   - I/O:
     ```ts
     // run/log.ts
     export function pidAlive(pid: number): boolean;
     export function isRunning(
       record: RunRecord,
       alive?: (pid: number) => boolean,
     ): boolean;
     export function runningRuns(place: Place, scope: ReadScope & { readonly session: string }): RunRecord[];

     // tool/children.ts
     export function latest(records: readonly RunRecord[]): RunRecord[];
     export function rowOf(record: RunRecord, running: boolean, now: number): string;
     export interface ChildrenHost {
       readonly place: Place;
       readonly sessionNow: () => string;
       control(action: ControlAction, session: string): ControlOutcome;
     }
     export function rowsOf(
       records: readonly RunRecord[],
       alive: (pid: number) => boolean,
       now: number,
     ): string[];
     export function listText(records: readonly RunRecord[], now: number): string;

     // tool/worktree.ts
     export function createWorktreeTool(place: Place): (…args: ExecuteArgs) => Promise<…>;
     export function runningIn(place: Place, id: string, alive?: (pid: number) => boolean): boolean;
     ```
   - Verify:
     - test: `pnpm vitest run .pi/extensions/consult`
       - (happy) 開始行と終了行（同じ子）→ `latest` が 1 本に畳む
       - (boundary) 終わりの行が無く pid が生きていて、`alive` が true → `isRunning` が true、行は `running`
       - (error) 終わりの行が無く `alive` が false → `rowsOf` を通した行が `lost`（`done` ではない）
       - (empty) 記録が空 → `rowsOf` が `[]`
       - (happy) `createChildrenTool` で、記録に 2 つの session の子が居る時、いまの session の子だけが出る
       - (boundary) 3 日前に始まっていまも走っている子（終わりの行が無い）→ 一覧に出ない（2 日より長く走る子。受け入れる限界）
       - (happy) 3 日前に始まって今日終わった子 → 終わりの行が今日の file にあり、`state` 付きで出る
       - (happy) `runningIn(place, id)`: 走っている子がある → true。終わった子だけ → false
       - (happy) `runningIn(place, id)`: 別の session の走っている子でも true（作業場を守る側なので、session で絞らない）
     - cli: `grep -rn "rootFor(" .pi/extensions/consult`
       - (happy) 残る行が `run/worktree.ts` の `ensureRoot` の中とテストの言及だけ
   - Steps:
     1. `run/log.ts`: `runningRuns` を足す（`readRuns` を session で絞るだけ。`alive` の口は `runningIn` と `isRunning` が持つ）。`pidAlive` を `isRunning` から使えるようにする
     2. `tool/children.ts`: `rowsOf` を「記録をそのまま出す」形にし、`rowOf` に `lost` を足す。`ChildrenHost` を `place`・`sessionNow`・`control(action, session)` にし、`children` を落とす。execute は `latest(readRuns(host.place, { session: host.sessionNow() }))` を読む。`listText` の署名を合わせる
     3. `tool/children.test.ts`: `lost` の表示、session の絞り込み、窓の外の行、`new Set()` の live 集合の削除
     4. `tool/worktree.ts`: `runningIn` を place から読む形にし、`rootFor(cwd)` を呼ばない。道具を `createWorktreeTool(place)` の形にする
     5. `tool/worktree.test.ts`: `runningIn` が place から読むこと、終わった子だけなら false であること
     6. `index.ts`: `session_start` の掃除（`oldFiles` + `rmSync`。失敗は握る）と、`createWorktreeTool(place)`・`createChildrenTool({ place, sessionNow, control })` の結線を足す

3. 完了の配達
   - I/O:
     ```ts
     // run/delivery.ts
     export interface Cursor {
       readonly ended: number;
     }
     export function readCursor(place: Place, session: string): Cursor | undefined;
     export function writeCursor(place: Place, session: string, cursor: Cursor): void;
     export function pruneCursors(place: Place, at: Date, keepDays: number): void;
     export function unreadNotices(
       place: Place,
       scope: ReadScope & { readonly session: string },
     ): RunRecord[];
     export function createDelivery(place: Place): Delivery;
     ```
   - Verify:
     - test: `pnpm vitest run .pi/extensions/consult/run/delivery.test.ts`
       - (happy) `writeCursor` → `readCursor` が同じ値を返す
       - (empty) 目録が無い → `unreadNotices` が窓の中の通知を全部返す
       - (happy) 目録の `ended` より古い通知は返らない。同じ `ended` の通知は返らない
       - (boundary) 3 日前の通知を `unreadNotices(place, { session, days: KEEP_DAYS })` が返す（配達は `KEEP_DAYS` を渡すので、時間で失わない）
       - (boundary) `days` を省いた `unreadNotices(place, { session })` は、同じ 3 日前の通知を返さない（既定は `RECORD_DAYS`）
       - (error) `delivered.json` が壊れている（JSON でない）→ `readCursor` が `undefined`（全部返す側に倒れる）
       - (happy) 別の session の通知は返らない。別の session の目録の欄は、この session の未読に影響しない
       - (happy) `pruneCursors(place, at, KEEP_DAYS)` が古い `ended` の欄を消し、新しい欄を残す
       - (happy) 届け先が無い時の `send` は notice を 1 行足し、目録を進めない（進めるのは、通知を渡すループが終わった所で 1 回だけ）
     - cli: `grep -n "writeCursor\|readCursor" .pi/extensions/consult/index.ts`
       - (happy) 目録を進める呼び出しが、通知を渡すループより後にある
   - Steps:
     1. `run/delivery.ts`: `Cursor`・`readCursor`・`writeCursor`・`pruneCursors`・`unreadNotices` を足し、`createDelivery` を `Place` で受ける形にする
     2. `run/delivery.test.ts`: 上のケースを書く。置き場は `placeFor(tmpDir(), tmpDir())` で作る
     3. `index.ts`: `session_start` で `session` を読み、未読を 1 つずつ `pi.sendMessage` に渡す（`content` は `record.notice`、`details` は記録の欄から組み直す）。全部渡し終えてから `writeCursor` を 1 回呼ぶ。同じ所で `pruneCursors(place, new Date(), KEEP_DAYS)` を呼ぶ

4. 音と、前のセッションの子を止める
   - I/O:
     ```ts
     // tool/sound.ts
     export function startSound(runningNow: () => boolean): void;
     export function stopSound(): void;
     export function isSoundRunning(): boolean;
     export function playSound(): void;
     export function setPlayer(next: Player): () => void;
     export function isSoundEnabled(): boolean;
     export function setSoundEnabled(on: boolean): void;

     // tool/consult.ts
     export function controlChild(
       action: ControlAction,
       children: ReadonlyMap<string, RunningChild>,
       place: Place,
       session: string,
       kill?: (pid: number) => void,
     ): ControlOutcome;

     // 消える形: tool/sound.ts の runningChildren
     ```
   - Verify:
     - test: `pnpm vitest run .pi/extensions/consult/tool`
       - (happy) 述語が true のまま 3 tick → 3 回鳴る
       - (happy) 述語が false になった次の tick → 鳴らず、`isSoundRunning()` が false
       - (boundary) `enabled` が off でも、述語が true の間は `isSoundRunning()` が true のまま（鳴らないだけ）
       - (boundary) `startSound` を 2 回呼んでもタイマーは 1 本
       - (boundary) 別の session の子だけが走っている時、自分の session の述語（`runningRuns(place, { session })`）は false → 次の tick で鳴らず、タイマーが消える
       - (happy) そのインスタンスが掴んでいる子 → `abort()` で止まり、`cancelled: true`
       - (happy) 掴んでいない子（記録だけ、pid 生存）→ 差し替えた `kill` がその pid で 1 回呼ばれ、`cancelled: true`
       - (error) pid が死んでいる子 → `kill` を呼ばず、止められない理由を返す
       - (error) 記録に無い id → `kill` を呼ばず、理由を返す
       - (error) 別の session の子 → 止めず、理由を返す
       - (boundary) 掴んでいる子は `kill` を呼ばない（`abort` だけ）
     - cli: `grep -rn "runningChildren" .pi/extensions/consult`
       - (empty) 0 件
   - Steps:
     1. `tool/sound.ts`: `startSound` に述語を渡す形にし、tick で「居なければ `stopSound()` して戻る」をやる。`runningChildren` を消す
     2. `tool/sound.test.ts`: 述語で止まること、off でもタイマーの寿命が変わらないこと。`runningChildren` のケースは `run/log.test.ts` に移す
     3. `tool/consult.ts`: 内側の `control` を `controlChild` に改名し、`kill` を最後の引数にする。掴んでいない子は記録から引いて `kill(pid)` を送る（生きている pid なら送る。記録は書かない。終わりの行はその子を持っていた側の仕事）。`ConsultRuntime.control(action, session)` にし、commands は `sessionNow()` を渡す。`beginRun` の `startSound` に述語（`runningRuns(state.place, { session: state.sessionNow() })`）を渡し、`finally` の `stopSound` を消す
     4. `tool/consult.test.ts`: 上のケース（`kill` の差し替え）。現行 239-260 行の「子が 0 体になったら音が止まる」期待を、述語で止まる形に書き換える
     5. `index.ts`: `announceRunningChildren(session)` にし、`startSound` に同じ述語を渡す。`session_shutdown` の `stopSound` は残す

5. 統合: reload をまたいでも報告が届き、テストが本物に書かない
   - I/O:
     ```text
     なし（振る舞いを足さない。slice 1–4 の合わせを確かめる）
     ```
   - Verify:
     - cli: 本物の置き場を数える → `pnpm test:run` → 数え直す
       - (happy) 本物の置き場は `/tmp/pi-consult/records/<project>/`（この repo は `_pj-starter-pi-v3-5a13ebdd`）。`find /tmp/pi-consult/records -name '*.jsonl' | wc -l` と `cat /tmp/pi-consult/records/*/*.jsonl 2>/dev/null | wc -l` の 2 つが増えない（減るのは 30 日の掃除の仕事なので許す）
       - (happy) `pnpm vitest run .pi/extensions/consult` が緑、`pnpm lint` が緑、`npx tsc -p .pi/tsconfig.json --noEmit` が緑
       - (error) 壊し 1: `rowOf` の `lost` を `record.state ?? 'done'` に戻す → 一覧のテストが赤に戻る（確かめたら戻す）
       - (error) 壊し 2: `createChildrenTool` の session の絞り込みを外す → 一覧のテストが赤に戻る（確かめたら戻す）
     - look: 親が子を 1 体走らせ、その間に owner が `/reload` を打つ
       - 子が終わったあと、完了の報告が owner に届く
       - `consult_children` に走っている子が出て、`cancel` で止められる
       - 子の終了で音が止まる（`afplay` が 5 秒ごとに生まれ続けない）
   - Steps:
     1. `run/log.ts`: slice 1–4 の残りを閉じる（残り物はないはず）

## Notes

### Slice 1: 置き場を値にする

- Findings:
  - なし
- Unplanned:
  - `createRuntime` を plan の I/O どおり 5 引数にすると `oxlint` の `max-params`（上限 4）で commit が止まった。`.pi/extensions/intent-router/state.ts:200` の先例と同じ `// eslint-disable-next-line max-params -- <理由>` で黙らせた（結果: `pnpm lint` 緑）。
  - `lint --deny-warnings` が `place.ts` の `sort`/`reverse`（配列を破壊する）と `index.ts` の unsafe assertion を指摘したので、`toSorted`/`toReversed` と `ctx.sessionManager.getSessionId()` の直呼びに直した（plan の形は変えていない）。
- Commit: `consult(record-and-delivery): place-valued records with session`

### Slice 2: 一覧が記録から真実を読む

- Findings:
  - なし
- Unplanned:
  - `index.ts` の `default` 関数が `max-lines-per-function`（上限 80）を超えたので、起動の掃除（`oldFiles` + `rmSync`、`cleanWorktrees`）を `sweep(place, cwd)` に切り出した（plan の形は変えていない）。
- Commit: `consult(record-and-delivery): list read from records`

### Slice 3: 完了の配達

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: `consult(record-and-delivery): deliver unread notices`

### Slice 4: 音と、前のセッションの子を止める

- Findings:
  - なし
- Unplanned:
  - `controlChild` が plan の I/O どおり 5 引数なので、`createRuntime` と同じ `// eslint-disable-next-line max-params -- <理由>` を付けた。
- Commit: `consult(record-and-delivery): predicate sound and kill by pid`

### Slice 5: 統合: reload をまたいでも報告が届き、テストが本物に書かない

- Findings:
  - 本物の TUI で子を走らせながらの `/reload` 目視（報告が届く・一覧と cancel・音が止まる）はここではやっていない
    - `left: 子を起こして reload を打つ実演環境が無いため。配達の結線（session_start で未読を渡し、渡し終えてから目録を 1 回進める）は捨てテストで確かめた（1 回だけ渡り、2 回目は渡らない）が、そのテストは commit していない`
- Unplanned:
  - なし
- Commit: `consult(record-and-delivery): integrate records and delivery`

## Review

### Round 1

- Stale:
  - `.pi/extensions/consult/tool/worktree.ts:91-96` の旧コメント（`log.jsonl`・この unit のもの）が新コメントと重複して残っている
    - `fixed: 旧い方のコメントブロックを消し、新しい方（置き場の日ごとのファイル・session で絞らない）だけを残した`
  - `.pi/extensions/consult/tool/children.ts:4-5` の「前のセッションが走らせた子まで出る」が 01-4 の session 絞り（7-8）と矛盾している
    - `fixed: 4-5 行目を「子は親のプロセスに従属しないので、reload で親が差し替わっても、同じ session の子は出る」に直した`
  - `.pi/extensions/consult/index.ts:175,179` の consult_children 説明（previous session を表示・停止不可）が session 絞りと kill による停止（`controlChild`）と矛盾している
    - `fixed: description を this session の表示＋前インスタンスの子も pid で止める旨に、guidelines を this session の一覧＋別 session は止めない旨に直した`
  - `.pi/extensions/consult/README.md:68,87,178,189` が旧置き場（`<root>/<unit>/log.jsonl`）と旧振る舞い（他 session 表示・Abort のみ）のままである（plan は consult-readme が書くとしている）
    - `left: README は consult-readme の plan が書く。この plan の Files は「README.md は変更しない」と明記している`
- Unlisted:
  - なし
- Gaps:
  - `session_start` の配達結線（未読を 1 つずつ送り終えてから目録を 1 回進め、2 回目は送らない）に commit された check が無い（捨てテスト未 commit・slice5 look 未実施で、tmp place＋fake pi の二重が作れるため look の代替にならない）
    - `left: plan の slice 5 が look（owner が子を走らせて /reload）でこの振る舞いを覆っている。index.ts は import すると拡張を登録してしまうので、配線を単体で読む二重物が作れない（plan の slice 3 は cli の grep で順序を見る）`
  - `index.ts` の `placeOf` の落とし（`topLevel` が投げたら cwd に落とす）に check が無い（非 repo の tmpDir で二重が作れる）
    - `left: これも index.ts の読み込み時の分岐で、テストから届かない。落ちれば起動そのものが失敗して見える（plan の slice 1 は「読み込みで投げない」と書いているだけ）`
- Unproven:
  - `run/delivery.test.ts` の壊れ目録テストの `unreadNotices` 断言が空の置き場の 0 件を見ているため、壊れ→全部返すが無くても緑のままになる
    - `fixed: 通知行を 1 本書いた置き場で目録を壊し、unreadNotices がその 1 本を返す形に直した`
  - `run/delivery.test.ts` の遅延置き場テストが `CURSOR_FILE` の不在だけを見て dir の有無を見ないため、`mkdir` が足されても緑のままになる
    - `fixed: existsSync(found.dir) が false である断言を足した`

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Unproven:

## Acceptance

- Ran:
  - plan の cli の grep: `rootFor(` の残りは `run/worktree.ts` の `ensureRoot` の中とテストの言及だけ。`runningChildren` は 0 件。`logPath`・`unitOf`・`PARENT_UNIT` は 0 件
  - `pnpm vitest run .pi/extensions/consult` → 16 files / 306 tests passed
  - `pnpm test:run`（全体）→ 32 files / 518 tests passed
  - `pnpm lint`・`pnpm typecheck` → 緑
  - 本物の置き場 `/tmp/pi-consult/records`: 全体スイートの前後とも `*.jsonl` が 0 件（**テストが本物に書かない**）
  - 旧い置き場の走行中子: `ps -p <pid>` との突き合わせで 0 件（slice 5 の前提）
  - 壊し 1: `rowOf` の `lost` を `record.state ?? 'done'` に戻す → children の「終わりの行が無く pid も死んでいる → lost（done と偽らない）」が赤 → 復旧
  - 壊し 2: `createChildrenTool` の session の絞りを外す → children の「2 つの session の子が居る → いまの session の子だけが出る」が赤 → 復旧
  - 壊し 3: `startSound` の tick から述語を外す（鳴り続ける）→ sound の「述語が false になった次の tick」が赤 → 復旧
- Findings:
  - plan の slice 5 の look（親が子を 1 体走らせ、その間に owner が `/reload` を打つ）は**未実施**。この look は新しいコードが読み込まれた pi でしか成立せず、それは merge の後になるため
    left: merge の後に owner の `/reload` で見る（報告が届く・一覧に出て止められる・音が止まるの 3 つ）
