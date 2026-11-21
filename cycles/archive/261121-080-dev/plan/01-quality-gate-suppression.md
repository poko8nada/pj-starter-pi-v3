# PLAN `quality-gate-suppression`

- ADR-No: 02
- Place: worktree
- Boundary Plans: なし

## Goal

`quality-gate` がターンの変更分の抑制を検査し、エージェントに指摘を返すようになる。

## Refactor

- Inside:
  - Modules: なし。`filterByExtensions` は 1 つのままに保ち、`'all'` を「絞らない」値として受ける。
  - Dirs: なし。
- Outside:
  - Extract: なし。新しいモジュールは作らない。
  - Colocate: なし。

## Files

```text
.pi/
  extensions/
    quality-gate/
      README.md                          update
      gate/
        checks.ts                        update
        checks.test.ts                   update
        checks.fixture.ts
        report.ts                        update
        report.test.ts                   update
        targets.ts                       update
        targets.test.ts                  update
package.json
```

## Slices

## 1.targets への改名

`CheckSpec.kind` を検査の身元ではなく対象の選び方を表す `targets` に改める。

### Types

```ts
type Phase = 'fix' | 'verify';

interface CheckSpec {
  readonly phase: Phase;
  readonly label: string;
  readonly script: string;
  readonly flags: readonly string[];
  /** 対象を選ぶ拡張子の種類である。`all` は絞らない。 */
  readonly targets: 'format' | 'lint' | 'all';
}
```

### Steps

1. `.pi/extensions/quality-gate/gate/targets.ts`
   1. update: `filterByExtensions` の引数名を `kind` から `targets` にし、型を `'format' | 'lint' | 'all'` にする。
   2. update: `targets === 'all'` のときは絞らず、渡されたパスをそのまま返す。

      ```ts
      export function filterByExtensions(
        paths: readonly string[],
        targets: 'format' | 'lint' | 'all',
      ): string[] {
        switch (targets) {
          case 'all':
            return [...paths];
          case 'format':
            return paths.filter((path) => FORMATTABLE_EXTENSIONS.has(extname(path).toLowerCase()));
          case 'lint':
            return paths.filter((path) => LINTABLE_EXTENSIONS.has(extname(path).toLowerCase()));
        }
        const exhaustive: never = targets;
        return exhaustive;
      }
      ```

2. `.pi/extensions/quality-gate/gate/checks.ts`
   1. update: `CheckSpec.kind` を `targets` に改名し、型を `'format' | 'lint' | 'all'` にする。
   2. update: `CHECK_SPECS` の 4 つの `kind` を `targets` にし、`lint:fix` と `lint` を `'lint'`、`format` を `'format'`、`typecheck` を `'all'` にする。
   3. update: `runCheck` の絞り込みを `filterByExtensions(checked, spec.targets)` にし、スキップの条件を `spec.targets !== 'all'` にする。

      ```ts
      const paths = filterByExtensions(checked, spec.targets);
      if (spec.targets !== 'all' && paths.length === 0) {
        return undefined;
      }
      ```

3. `.pi/extensions/quality-gate/gate/targets.test.ts`
   1. update: 既存の `it` の中の `ts`、`md`、`json`、`png`、`paths` を `describe('filterByExtensions')` の先頭に移す。
   2. add: `describe('filterByExtensions')` に、`filter: happy targets が all → 拡張子で絞らない` のケースを加える。

      ```ts
      it('filter: happy targets が all → 拡張子で絞らない', () => {
        expect(filterByExtensions(paths, 'all')).toEqual(paths);
      });
      ```

### Policy

- Allowed:
  - `png` だけのターンでは、既存の `typecheck` だけが走る期待値を変えない。
  - 対象が 0 件のときは、既存のスキップ規則に従う。
- Forbidden:
  - `lefthook.yaml` を変えない - 03 のエントリで扱う。
  - 検出と判定のロジックを変えない - 078-d で決着済みである。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/quality-gate/gate/targets.test.ts .pi/extensions/quality-gate/gate/checks.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、明示されたファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 2.suppression の検査

`quality-gate` の検証に抑制を報告する検査を加える。

### Types

なし

### Steps

1. `.pi/extensions/quality-gate/gate/checks.ts`
   1. add: `CHECK_SPECS` の `lint` と `typecheck` の間に、`suppression` の検証を加える。

      ```ts
      {
        phase: 'verify',
        label: 'suppression',
        script: 'suppression-check',
        flags: [],
        targets: 'lint',
      },
      ```

2. `.pi/extensions/quality-gate/gate/checks.test.ts`
   1. add: `describe('runCheck（runChecks 越しに見る）')` の末尾に、`suppression: happy コードファイルと md を渡す → コードファイルだけを受け取る` のケースを加える。

      ```ts
      it('suppression: happy コードファイルと md を渡す → コードファイルだけを受け取る', async () => {
        const setup = checksSetup();
        const ts = setup.tsFile('a.ts');
        const md = join(setup.dir, 'b.md');
        writeFileSync(md, 'x\n');

        const run = await runChecks(setup.fake.pi, { cwd: setup.dir }, [ts, md]);

        const suppression = setup.fake.calls.find((call) =>
          call.args.includes('suppression-check'),
        );
        expect(suppression?.args).toContain(ts);
        expect(suppression?.args).not.toContain(md);
        expect(run.outcomes.map((outcome) => outcome.label)).toContain('suppression');
      });
      ```

### Policy

- Allowed:
  - verify フェーズだけで実行する。
  - `--report` を付けない（違反だけを返す）。
  - `flags` を空にする（固定のフラグは要らない）。
  - `label` を `suppression` とする。
  - `targets` に `'lint'` を割り当て、lint と同じ拡張子に絞る。
  - 設定の破損の場合は、スクリプトの exit 1 を検査の失敗として扱う。
- Forbidden:
  - fix フェーズに置かない - 直す手段がないため。
  - `targets` に `'all'` を使わない - `md` だけのターンでも検査を起動してしまうため。
  - `lefthook.yaml` を変えない - 03 のエントリで扱う。
  - 新しいスクリプトやパッケージを加えない - `package.json` の script はすでにある。
  - 検出と判定のロジックを変えない - 078-d で決着済みである。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/quality-gate/gate/checks.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、明示されたファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## 3.文面の追従

エージェント向けの文面と README を検査の一覧に `suppression` を加えた形にする。

### Types

なし

### Steps

1. `.pi/extensions/quality-gate/gate/report.ts`
   1. update: エージェント向けの固定文面の検査一覧に `pnpm suppression-check` を加える。

      ```ts
      '  pnpm format / pnpm lint / pnpm suppression-check / pnpm typecheck:staged <files>',
      ```

2. `.pi/extensions/quality-gate/README.md`
   1. update: 冒頭の説明を次の文にする。

      ```md
      Runs format, lint, suppression and typecheck on the files the agent changed in a run, and hands the failures back as a follow-up so the same session fixes them.
      ```

   2. update: 検査の表に `suppression` の行を、`typecheck` の前に加える。

      ```md
      | verify | `suppression` | `pnpm run suppression-check` | reported |
      ```

   3. update: `Relation to lefthook` の段落を次の文にする。lefthook 側の一覧は 03 が扱うため変えない。

      ```md
      lefthook.yaml runs format, lint, typecheck and test at commit time. This extension runs format, lint, suppression and typecheck earlier, while the agent still has the turn open, so the agent fixes its own mistakes instead of the user finding them at commit.
      ```

3. `.pi/extensions/quality-gate/gate/report.test.ts`
   1. add: `describe('buildGateMessage')` に、固定文面が `pnpm suppression-check` を含むことを確かめるケースを加える。

      ```ts
      it('検査の一覧に suppression-check を含む', () => {
        expect(buildGateMessage(report())).toContain('pnpm suppression-check');
      });
      ```

### Policy

- Allowed:
  - 表の `Check` の名は `label` と同じ `suppression` とする。
  - 表の `Script` は `pnpm run suppression-check` とする。
- Forbidden:
  - `lefthook.yaml` を変えない - 03 のエントリで扱う。
  - lefthook 側の検査の一覧を変えない - 03 のエントリで扱う。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/quality-gate/gate/report.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、明示されたファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## Notes

### Slice 1: targets への改名

- Findings: なし
- Unplanned: なし
- Commit: ba3469c3
- Stopped: なし

### Slice 2: suppression の検査

- Findings: なし
- Unplanned: なし
- Commit: 7abb45ce
- Stopped: なし

### Slice 3: 文面の追従

- Findings: なし
- Unplanned: なし
- Commit: a8f0a0fb
- Stopped: なし

### Cleanup: check-ignore 非ゼロの前提をテスト内に移した

- Findings: なし
- Unplanned:
  - `checks.test.ts` の `assertNoExclusion` ヘルパーをなくし、`check-ignore が 0 以外でも出力があれば除外しない` の前提（setup・file・終了コード・ignored 標準出力・断言）をテスト内に移した。ヘルパーが振る舞いに要る前提を隠していたため。挙動の変更なし。

## Work Review

### Round 1

- Stale:
  - なし
- Unlisted:
  - なし
- Gaps:
  - なし
- Policy:
  - なし
- Unproven:
  - なし
- Noise:
  - なし
- Doubts:
  - なし

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal: `quality-gate` がターンの変更分の抑制を検査し、エージェントに指摘を返すようになる。実装は Goal を満たしている。
- Ran: `suppression` の `targets` を一時的に `'all'` に壊し、`checks.test.ts` の 2 件（新しい suppression のケースと `png` だけのケース）が赤になることを確認した。戻した後、`pnpm test:related` 22 件、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` が緑。レビューは `git diff 9cc4e3cf..HEAD` を読み、finding なしと判定した。
- Findings: なし
- Doubts: なし
