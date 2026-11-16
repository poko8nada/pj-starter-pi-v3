# PLAN `consult-tool-view`

- No: 02
- Place: worktree
- Boundary Plans: 01-consult-run-sub

## Goal

consult の `tool`、`view`、`index`、`policy` のテストが、各テスト固有の事実だけを残し、同じ事実をレイヤーごとに1回確認する形になる。

## Design

- Inside:
  - Modules: なし
  - Dirs: なし
- Outside:
  - Extract: `consult.fixture.ts` に `aPiFace()`、`aToolCall()`、`START_TOKEN` を足す。`index` と `tool/consult` の偽 `PiFace`、`tool/subagents` と `tool/worktree` の 5 要素タプル、3 ファイルの `Wed Oct 21 12:41:12 2026` の直書きを 1 か所に寄せるため。
  - Colocate: なし

## Files

```text
.pi/
  extensions/
    consult/
      policy/
        types.test.ts
        types.ts
      tool/
        commit.test.ts        update
        consult.test.ts       update
        consult.ts
        subagents.test.ts     update
        subagents.ts
        worktree.test.ts      update
        worktree.ts
      view/
        notice.test.ts
        notice.ts
        widget.test.ts        update
        widget.ts
      consult.fixture.ts      update
      index.test.ts           update
      index.ts
      README.md
      types.json
test/
  temp-dir.ts
```

## Slices

## 1.fixture のモックとタプル

偽 `PiFace`、5 要素タプル、`Wed Oct 21 12:41:12 2026` を `consult.fixture.ts` に寄せる。

### Types

```ts
export function aPiFace(): {
  readonly pi: PiFace;
  readonly sent: readonly ConsultMessage[];
  readonly calls: ReadonlyArray<{
    readonly message: ConsultMessage;
    readonly options?: ConsultSendOptions;
  }>;
  readonly failNext: () => void;
};

export function aToolCall<T, C>(
  params: T,
  ctx: C,
  id?: string,
): [string, T, undefined, undefined, C];

export const START_TOKEN: string;

function aNewWorktree(dir: string, id?: string): Promise<Outcome>;
```

### Steps

1. `.pi/extensions/consult/consult.fixture.ts`
   1. update: `PiFace`、`ConsultMessage`、`ConsultSendOptions` を `./tool/consult.ts` から import する。
   2. update: `aPiFace()` を足す。`sent`、`calls`、`failNext` を持ち、`failNext()` の後の 1 回だけ投げてから記録する。

      ```ts
      export function aPiFace(): {
        readonly pi: PiFace;
        readonly sent: readonly ConsultMessage[];
        readonly calls: ReadonlyArray<{
          readonly message: ConsultMessage;
          readonly options?: ConsultSendOptions;
        }>;
        readonly failNext: () => void;
      } {
        const sent: ConsultMessage[] = [];
        const calls: Array<{ message: ConsultMessage; options?: ConsultSendOptions }> = [];
        let fail = false;
        const pi: PiFace = {
          sendMessage: (message, options) => {
            if (fail) {
              fail = false;
              throw new Error('gone');
            }
            sent.push(message);
            calls.push({ message, options });
          },
        };
        return {
          pi,
          sent,
          calls,
          failNext: () => {
            fail = true;
          },
        };
      }
      ```

   3. update: `aToolCall()` を足す。

      ```ts
      export function aToolCall<T, C>(
        params: T,
        ctx: C,
        id = 'call',
      ): [string, T, undefined, undefined, C] {
        return [id, params, undefined, undefined, ctx];
      }
      ```

   4. update: `START_TOKEN` を足す。

      ```ts
      export const START_TOKEN = 'Wed Oct 21 12:41:12 2026';
      ```

   5. update: 冒頭の説明に「偽 `PiFace` は `aPiFace()`、5 要素タプルは `aToolCall()`、開始時刻は `START_TOKEN` で作る」を足す。
2. `.pi/extensions/consult/index.test.ts`
   1. update: `fakePi(fail)` を `const made = aPiFace(); if (fail.next) made.failNext(); return { pi: made.pi, sent: made.sent };` に変える。
3. `.pi/extensions/consult/tool/consult.test.ts`
   1. update: `fakePi()` の本体を `aPiFace()` にし、`{ pi, calls }` を返す。使わなくなった `ConsultMessage` と `ConsultSendOptions` の import を落とす。
   2. update: `setup()` の `placeFor(tempDir(), tempDir())` を `aPlace()` にし、`placeFor` の import を落とす。`aPlace` を import する。
   3. update: 2 か所の `Wed Oct 21 12:41:12 2026` を `START_TOKEN` にし、`START_TOKEN` を import する。
4. `.pi/extensions/consult/tool/subagents.test.ts`
   1. update: `../consult.fixture.ts` から `aToolCall` と `START_TOKEN` を import し、10 か所の 5 要素タプルを `aToolCall(params, { cwd: tempDir() })` にする。`const args: SubagentsArgs` の型注釈は残す。
   2. update: 1 か所の `Wed Oct 21 12:41:12 2026` を `START_TOKEN` にする。
5. `.pi/extensions/consult/tool/worktree.test.ts`
   1. update: `../consult.fixture.ts` から `aToolCall` と `START_TOKEN` を import し、`call` helper の `createWorktreeTool(place, check)('call-1', params, undefined, undefined, { cwd })` を `createWorktreeTool(place, check)(...aToolCall(params, { cwd }, 'call-1'))` にする。`call(params, cwd, check?)` のシグネチャは変えない。
   2. update: `new` の前提をローカル helper `aNewWorktree(dir, id = '2-b')` にまとめる。成功する 14 か所を `aNewWorktree(dir)`（`id` を渡す 1 か所は `aNewWorktree(dir, id)`）にし、id なしのエラー系はそのまま残す。

      ```ts
      function aNewWorktree(dir: string, id = '2-b') {
        return call({ action: 'new', id }, dir);
      }
      ```

   3. update: 3 か所の `Wed Oct 21 12:41:12 2026` を `START_TOKEN` にする。
6. 01 が `index.test.ts` と `tool/subagents.test.ts` の `place()`、done の `record()`、`aAt()` を置換済みである。02 はそれをそのまま使い、重複定義を戻さない。

### Policy

- Allowed:
  - テストの削除と統合、fixture への helper の移動、古い文言の修正
- Forbidden:
  - 製品コードと consult の実装を変える - テストの整理だけを行うため
  - 単体テストが確認している値を配線テストでも同じ値で確認する - 同じ事実を2回確認しないため
  - 失敗経路の確認を落とす - 残す失敗経路を守るため
  - `policy` のテストを変える - 重複した確認がないため

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## 2.登録と status のレイヤー

`renderNotice` の登録、status の文面、完了行の表示を、それぞれ 1 つのレイヤーに残す。

### Types

なし

### Steps

1. `.pi/extensions/consult/index.test.ts`
   1. update: レンダラー登録のテストは `expect(received).toHaveLength(1)` だけを確認する。`renderNotice` の import を落とす。
   2. update: `consult-status` のテストは `commands.get('consult-status')` と `description` の断言だけを残し、`notices`、`ctx`、ハンドラ呼び出しを消す。
   3. update: reload のテストは `sent` と `played` の 3 断言だけを残し、`rowsOf` の `before` と `after` を落とす。`rowsOf` の import を落とし、`readRuns` は残す。
2. `.pi/extensions/consult/tool/consult.test.ts`
   1. update: `expect(notices).toHaveLength(1); expect(notices[0]?.type).toBe('info');` にし、題名を「走っている記録がない → info で通知する」にする。
   2. update: 同じ 2 断言にし、題名を「開始行と終わりの行を渡しても info で通知する」にする。

### Policy

- Allowed:
  - テストの削除と統合、fixture への helper の移動、古い文言の修正
  - `view/notice.test.ts:56` の `aClick()` の 9 項目は型を満たすため残す。値の確認は単体が持ち、配線は `notices`/`sent`/`played` の経路だけを確認する。
- Forbidden:
  - 製品コードと consult の実装を変える - テストの整理だけを行うため
  - 単体テストが確認している値を配線テストでも同じ値で確認する - 同じ事実を2回確認しないため
  - 失敗経路の確認を落とす - 残す失敗経路を守るため
  - `policy` のテストを変える - 重複した確認がないため

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## 3.ウィジェットのレイヤー

表示内容を `view/widget.test.ts` の単体に寄せ、`showRunningOnce` と `startTick` はキーだけを確認する。

### Types

```ts
export const WIDGET_KEY: string;
export interface RoleCount {
  readonly role: string;
  readonly count: number;
}
export type WidgetUI = Pick<ExtensionUIContext, 'setWidget'>;
export function runningLine(counts: readonly RoleCount[]): string | undefined;
export function showRunning(ui: WidgetUI, counts: readonly RoleCount[]): void;
export function aWidgetUI(): {
  readonly ui: WidgetUI;
  readonly calls: ReadonlyArray<{ readonly key: string; readonly content: unknown }>;
};
```

### Steps

1. `.pi/extensions/consult/view/widget.test.ts`
   1. update: `countRoles / runningLine` の `describe` の後に、`showRunning` の 2 ケースを足す。期待値は `runningLine` から取る。

      ```ts
      describe('showRunning', () => {
        it('showRunning: (happy) role 1 件 → line を widget に渡す', () => {
          const counts = [{ role: 'review', count: 1 }];
          const { ui, calls } = aWidgetUI();
          showRunning(ui, counts);
          expect(calls).toEqual([{ key: WIDGET_KEY, content: [runningLine(counts)] }]);
        });

        it('showRunning: (empty) 0 件 → undefined を渡す', () => {
          const { ui, calls } = aWidgetUI();
          showRunning(ui, []);
          expect(calls).toEqual([{ key: WIDGET_KEY, content: runningLine([]) }]);
        });
      });
      ```

   2. update: `./widget.ts` の `showRunning` と `WIDGET_KEY`、`../consult.fixture.ts` の `aWidgetUI` を import する。
2. `.pi/extensions/consult/index.test.ts`
   1. update: 4 つのテスト（`startTick` の 2 件、`showRunningOnce` の 2 件）の内容の断言を `expect(calls.some((call) => call.key === WIDGET_KEY)).toBe(true)` にし、題名を `startTick: (happy) 走っている review が 1 体 → consult-running を更新する`、`startTick: (empty) 何も走っていない → consult-running を更新する`、`showRunningOnce: (happy) 走っている記録 → consult-running を更新する`、`showRunningOnce: (empty) 記録がない → consult-running を更新する` にする。
   2. update: `setWidget` が投げるテストはそのまま残す。

### Policy

- Allowed:
  - テストの削除と統合、fixture への helper の移動、古い文言の修正
- Forbidden:
  - 製品コードと consult の実装を変える - テストの整理だけを行うため
  - 単体テストが確認している値を配線テストでも同じ値で確認する - 同じ事実を2回確認しないため
  - 失敗経路の確認を落とす - 残す失敗経路を守るため
  - `policy` のテストを変える - 重複した確認がないため

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## 4.古い文言

`commit.test.ts` の `use` を、現在の検査の名前に直す。

### Types

なし

### Steps

1. `.pi/extensions/consult/tool/commit.test.ts`
   1. update: 冒頭のコメントから「最後のメインエージェントの `use` 検証」を落とし、「`consult_worktree` の検査が実もので見る」に直す。

### Policy

- Allowed:
  - テストの削除と統合、fixture への helper の移動、古い文言の修正
- Forbidden:
  - 製品コードと consult の実装を変える - テストの整理だけを行うため
  - 単体テストが確認している値を配線テストでも同じ値で確認する - 同じ事実を2回確認しないため
  - 失敗経路の確認を落とす - 残す失敗経路を守るため
  - `policy` のテストを変える - 重複した確認がないため

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## Notes

### Slice 1: fixture のモックとタプル

- Findings: なし
- Unplanned:
  - `tool/consult.test.ts` の `placeFor` の import を残した。`setup()` 以外に 17 か所が `placeFor(tempDir(), tempDir())` を使っており、落とすと `typecheck` が通らないため。`setup()` の 1 か所だけ `aPlace()` にした。
  - `tool/consult.test.ts` の `beginRun` の `fixed` も `START_TOKEN` にした。plan の 2 か所に加えた 3 か所目で、同じ値を残すと重複になるため。
  - `tool/consult.test.ts` の `fakePi()` の戻りを `Pick<ReturnType<typeof aPiFace>, 'pi' | 'calls'>` にした。`ConsultMessage` と `ConsultSendOptions` の import を落としても型が通るため。
  - `index.test.ts` の `fakePi()` の `sent` を `readonly ConsultMessage[]` にした。`aPiFace()` の `sent` が readonly のため。
- Commit: 58eb583
- Stopped:

### Slice 2: 登録と status のレイヤー

- Findings: なし
- Unplanned: なし
- Commit: 78fb31f
- Stopped:

### Slice 3: ウィジェットのレイヤー

- Findings: なし
- Unplanned: なし
- Commit: 1c30c25
- Stopped:

### Slice 4: 古い文言

- Findings: なし
- Unplanned: なし
- Commit: 7fd8bb4
- Stopped:

### Cleanup: 重複する番号・文面・短名とUSAGE断言

- Findings:
  - `tool/consult.test.ts` の `記録に consult-7 と consult-2 が混ざっている → 次は consult-8` を落とした。`記録に consult-3 がある → consult-4` と同じ最大+1を見ており、`high` が先頭のため最大の証明にもならないため。`consult-3` の reload、`別 session`、`連続 2 体`、`終わった番号` は残す。
  - `tool/consult.test.ts` の `終わった記録だけ → no subagents running in this session を出す` を落とした。配線の `info` は `走っている記録がない` が持ち、文面は `tool/subagents.test.ts` の `running で走っている記録がない` が持つため。`別セッション` の絞りは残す。
  - `view/widget.test.ts` の `order にない役割は初出順で後ろに置き` の `custom` 1 件を落とした。`zeta` と `alpha` の 2 件が未知の配置と初出順と短名をすでに見ているため。
  - `tool/subagents.test.ts` の `expect(USAGE).toContain('cancel needs id')` を落とした。直前の `rejects.toThrow` と同じ文を見ており、`USAGE` の自己言及のため。投げる側の確認は残す。
  - 66 ファイル、869 件のテストが成功（3 件減）。`pnpm test:run`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` が通る。
- Unplanned:
  - `tool/subagents.test.ts` の `USAGE` の import を落とした。断言を落とした後に未使用となり、`typecheck` が通らないため。

## Work Review

### Round 1

- Stale:
  - `.pi/extensions/consult/index.test.ts:320` の題名「入口を呼ぶ → consult のレンダラーとして renderNotice が登録される」が古い。テストは `received` の長さだけを見て何が登録されたかを確認していないのに、題名だけが具体名 `renderNotice` を残しているため。理由: 変更が中身の確認を `view/notice.test.ts:202` に移したのに題名が残ったため。
    - fixed: 題名から具体名 `renderNotice` を落とし「入口を呼ぶ → consult のレンダラーが 1 件登録される」に直した。長さだけを見る確認と一致させたため。
  - `.pi/extensions/consult/index.test.ts:325` の題名「consult-status を登録し、handler を呼ぶと commands.status が info で通知する」が古い。テストは `commands.get` と `description` だけを見て `notices`・`ctx`・ハンドラ呼び出しを消しているのに、題名が呼び出しと通知を約束しているため。理由: plan の Steps 2.1.2 が確認を登録と説明文だけに絞ったのに題名が旧いままのため。
    - fixed: 題名を「consult-status を登録する → 説明文を持つ」に直し、呼び出しと通知の約束を落とした。`get` と `description` だけを見る確認と一致させたため。
  - `.pi/extensions/consult/index.test.ts:274` の題名「同じ印で一覧は running から done へ、音は鳴る状態から鳴らない状態へ」が古い。テストは `sent` と `played` の 3 断言だけを残し `rowsOf` の before/after を落としているのに、題名が一覧の running→done をうたっているため。理由: plan の Steps 2.1.3 が配線を通知と音だけに絞ったのに題名が旧いままのため。
    - fixed: 題名を「同じ印で tick を進める → 送り 1 回、音 1 回、2 回目は送らない」に直し、一覧の running→done を落とした。`sent` と `played` だけを見る確認と一致させたため。
- Unlisted: なし。理由: diff が触った 7 ファイル（fixture・index.test・consult.test・subagents.test・worktree.test・widget.test・commit.test）はすべて `## Files` の `update` 名指し内であり、製品コード・`policy`・`README` 等に変更はないため。
- Gaps: なし。理由: 落とした断言は同分岐・到達不能・重複であり、文面は `tool/subagents.test.ts:183` と `:190` の `listText`、内容は `view/widget.test.ts` の `runningLine` と `showRunning`、登録内容は `view/notice.test.ts:202` が持つため。Goal の「同じ事実をレイヤーごとに1回」が保たれているため。
- Policy: なし。理由: 製品コードと consult 実装の変更はなく、配線はキー・型・件数だけを見て同じ値の二重確認をしていないため。失敗経路（`sendMessage` 投げ・`setWidget` 投げ・`cancel` 投げ等）は残り、`policy` のテスト変更もないため。`Allowed` の削除・統合・移動・文言修正の範囲内のため。
- Unproven: なし。理由: 長さだけ・キーだけ・型だけの配線の絞りは plan の Steps 2〜3 が決めたレイヤー分割であり、中身が壊れれば `registerNotice`・`listText`・`runningLine`・`showRunning` の単体が赤くなるため、単体で見れば見逃さないため。
- Noise: なし。理由: 残る値（`START_TOKEN`・`'call'`・`'gone'`・`review` 等）は plan・ADR が残すと決めた値かファクトリへの入力であり、断言自体は変数から取り、型が決める確認や魔数・直書き断言の新設はないため。
- Doubts: なし。

### Round 2

- Stale:
  - OK — `.pi/extensions/consult/index.test.ts:320` は「入口を呼ぶ → consult のレンダラーが 1 件登録される」になっており、本文は `received` の長さ 1 だけを見る（`:320-323`）。`renderNotice` の import・参照はなく、題名と確認が一致する。理由: 具体名を落として長さだけの確認と一致させるという `fixed:` の内容どおりになり、古さが解消されたため。
  - OK — `.pi/extensions/consult/index.test.ts:325` は「consult-status を登録する → 説明文を持つ」になっており、本文は `commands.get('consult-status')` と `description` だけを見る（`:325-329`）。`notices`・`ctx`・ハンドラ呼び出しはなく、題名と確認が一致する。理由: 呼び出しと通知の約束を落とすという `fixed:` の内容どおりになり、古さが解消されたため。
  - OK — `.pi/extensions/consult/index.test.ts:274` は「同じ印で tick を進める → 送り 1 回、音 1 回、2 回目は送らない」になっており、本文は `sent` と `played` の 3 断言だけを見る（`:283-287`）。`rowsOf` の import・参照はなく、一覧の running→done の文言は題名にない。理由: 一覧を落として通知と音だけに絞るという `fixed:` の内容どおりになり、古さが解消されたため。
- Unlisted:
  - 確認対象なし — `fixed:` の指定がないため見ない。
- Gaps:
  - 確認対象なし — `fixed:` の指定がないため見ない。
- Policy:
  - 確認対象なし — `fixed:` の指定がないため見ない。
- Unproven:
  - 確認対象なし — `fixed:` の指定がないため見ない。
- Noise:
  - 確認対象なし — `fixed:` の指定がないため見ない。
- Doubts:
  - なし — `fixed:` 3 件は題名どおりに直っており、所見に至らない疑義も残らなかったため。

## Acceptance

- Goal: consult の `tool`、`view`、`index`、`policy` のテストが、各テスト固有の事実だけを残し、同じ事実をレイヤーごとに1回確認する形になる。達成した。
- Ran: `pnpm test:run`（66 ファイル、869 件成功）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、plan の Always の読合わせ。
- Findings: なし。
- Doubts: cleanup で 3 件減（重複する番号・文面・短名と USAGE 断言）。plan の見込みは 2 件増だったが、cleanup 後は base より 1 件少ない 869 件。
