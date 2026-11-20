# PLAN `each`

- ADR-No: 02
- Place: worktree
- Boundary Plans: `ports`（order 1）と `guard`（order 2）。同じ `.pi/extensions/context-precompact/index.test.ts` を変えるため、統合の衝突を避けてこの plan を後に置く。

## Goal

`context-precompact` のテストが、繰り返しではなく、事例ごとのテストで落ちた場所を示す。

## Refactor

- Inside:
  - Modules: なし。1 つのテストファイルの中で、3 つのテストの形を変える。
  - Dirs: なし。
- Outside:
  - Extract: なし。事例の表はそれぞれのテストの中に置き、他のテストと共有しない。
  - Colocate: なし。

## Files

```text
.pi/
  extensions/
    context-precompact/
      index.test.ts           update
```

## Slices

## 1.繰り返しを事例ごとのテストに分ける

3 つの繰り返しを `it.each` の事例に分割し、ループの中の `await` を各事例の本体に置き、抑制 5 件を消す。

### Types

なし

### Steps

1. `.pi/extensions/context-precompact/index.test.ts`
   1. update: `now で拡張か Pi が off なら preparing と off になりパスを作らない` の 2 つの配線の繰り返しを、`it.each` の 2 事例にする。題名は `now で $name なら preparing と off になりパスを作らない` とする。各事例が自分の `branch`・配線・`fakeCtx` を作る（C3, F1, F5）。

      ```ts
      const wirings = [
        {
          name: '拡張が off',
          make: () =>
            createPrecompactWiring(fakePi().pi, {
              settingsDir: settingsDirWith(settingsDocument({ enabled: false })),
              now: () => 0,
              compactFn: compactOk(),
            }),
        },
        {
          name: 'Pi が off',
          make: () =>
            createPrecompactWiring(fakePi(false).pi, {
              settingsDir: settingsDirWith(settingsDocument()),
              now: () => 0,
              compactFn: compactOk(),
            }),
        },
      ] as const;

      it.each(wirings)(
        'now で $name なら preparing と off になりパスを作らない',
        async ({ make }) => {
          const { branch } = sessionWithTurns(3);
          const wiring = make();
          const setup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
          await wiring.onCommand('now', setup.ctx);
          await wiring.flush();
          expect(setup.notified).toEqual([
            { message: chatText({ kind: 'preparing' }), type: 'info' },
            { message: noticeText('off'), type: 'info' },
          ]);
          expect(wiring.getState().running).toBe(false);
        },
      );
      ```

   2. drop: 456 行目の抑制コメントを消す（C1）。
   3. drop: 458 行目の抑制コメントを消す（C1）。
   4. update: `buildSessionProjection と getBranch と getContextUsage の例外は failed になる` の 3 つの例外の繰り返しを、次の 3 事例にする（C3, F1, F3, F5）。

      ```ts
      it.each(['projection', 'branch', 'usage'] as const)(
        'buildSessionProjection と getBranch と getContextUsage のうち %s の例外は failed になる',
        async (thrown) => {
          const { branch } = sessionWithTurns(3);
          const { pi } = fakePi();
          const wiring = createPrecompactWiring(pi, {
            settingsDir: settingsDirWith(settingsDocument()),
            now: () => 0,
            compactFn: compactOk(),
          });
          const bad = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS), throws: thrown });
          await wiring.onCommand('now', bad.ctx);
          await wiring.flush();
          expect(wiring.getState().status.kind, thrown).toBe('failed');
        },
      );
      ```

   5. drop: 826 行目の抑制コメントを消す（C1）。
   6. drop: 828 行目の抑制コメントを消す（C1）。
   7. update: `壊れた settings で on と off は warning になる` の 2 つの命令の繰り返しを、次の 2 事例にする（C3, F1, F3, F5）。

      ```ts
      it.each(['on', 'off'] as const)(
        '壊れた settings で %s は warning になる',
        async (command) => {
          const dir = tempDir();
          writeFileSync(join(dir, 'settings.json'), '{');
          const { pi } = fakePi();
          const wiring = createPrecompactWiring(pi, {
            settingsDir: dir,
            now: () => 0,
            compactFn: compactOk(),
          });
          const setup = fakeCtx({ branch: [], usage: undefined });
          await wiring.onCommand(command, setup.ctx);
          expect(setup.notified[0]?.type, command).toBe('warning');
        },
      );
      ```

   8. drop: 923 行目の抑制コメントを消す（C1）。

### Policy

- Allowed:
  - 事例の値は `as const` のタプルで渡し、リテラル型を題名と引数に使う（F3）
  - 各事例は自分の配線と準備を作る（F5）
  - 前例がないため、3 つの表をどれも `it.each` の事例にする。事例が自分の配線と準備を作る形に揃える。行の形は、値が文字列なら配列、値が配線ならオブジェクトにする（F1, F4）
- Forbidden:
  - 事例を `Promise.all` でまとめない - 事例が 1 つのテストのままになり、落ちた事例が題名に出ない（C3）
  - 何を確かめるかを変えない - テストの意味を変えないため（C3）
  - 題名に `happy:` などの接頭辞を付けない - このファイルの題名の形を変えず、ADR の `values & expression` は `%s` の追加だけを示す

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/index.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `index.test.ts` の 440-470 行、808-836 行、905-930 行、およびそれらが読む `index.ts` 全体を読み、3 つの表の題名と期待が元のテストと同じ内容か確かめる
- Added:
  - `pnpm test:run .pi/extensions/context-precompact/index.test.ts` で、`context-precompact` のテストの件数が 3 件から 7 件（2 + 3 + 2）に増え、すべて通ることを確かめる
  - `pnpm suppression-check --report` を、作業の前に 1 度、後に 1 度実行する。違反が 5 件減る（`index.test.ts:456`、`:458`、`:826`、`:828`、`:923`）

## Notes

### Slice 1: 繰り返しを事例ごとのテストに分ける

- Findings: なし
- Unplanned: なし
- Commit: 4ff5def947f15eaadd96c4551810f891fd4d7006
- Stopped: なし

### Cleanup: なし

- Findings:
- Unplanned:

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
