# PLAN `suppression-multi-path`

- ADR-No: 01
- Place: worktree
- Boundary Plans: なし

## Goal

CLI が複数のパスを 1 回で受け取れることが、テストで保たれる。

## Refactor

- Inside:
  - Modules: なし。ヘルパーは既存の `writeViolationTree` の隣に置き、このテストファイルの中で完結する。
  - Dirs: なし。
- Outside:
  - Extract: なし。ヘルパーはこのテストファイルだけが使う。
  - Colocate: なし。

## Files

```text
scripts/
  checks/
    suppression-check.json
    suppression-check.mjs
    suppression-check.test.ts   update
test/
  scripts.fixture.ts
```

## Slices

## 1.複数パスのテスト

CLI が複数のパスを 1 回で受け取り、すべてを走査してファイル名の順で表示することを、テストで保つ。

### Types

なし

### Steps

1. `scripts/checks/suppression-check.test.ts`
   1. add: `writeViolationTree` の隣に、2 つの違反を持つツリーを作るヘルパーを加える。

      ```ts
      function writeTwoViolations(root: string): void {
        writeViolationTree(root);
        writeFile(root, 'b.ts', '// @ts-expect-error\n');
      }
      ```

   2. add: `suppression-check cli` の `describe` に、複数パスを 1 回で渡すテストを加える。逆順の確認は同じテストの 2 番目の断言とする。

      ```ts
      it('cli: happy 2 つのコードファイルと対象外のパスを 1 回で渡す → 2 件の行、件数、exit 1', () => {
        const root = fakeRoot();
        writeTwoViolations(root);
        writeFile(root, 'c.md', '// eslint-disable-next-line max-params -- x\n');

        const first = runCli(root, ['a.ts', 'b.ts', 'c.md', 'missing.ts']);
        expect(first.status).toBe(1);
        expect(first.stdout).toContain(
          'a.ts:1: eslint-disable-next-line [eslint] max-params not allowed',
        );
        expect(first.stdout).toContain('b.ts:1: @ts-expect-error [tsc] all not allowed');
        expect(first.stdout).toContain('suppression-check: 2 files, 2 violations, 0 allowed.');
        expect(first.stdout.indexOf('a.ts:1:')).toBeLessThan(first.stdout.indexOf('b.ts:1:'));

        const reversed = runCli(root, ['b.ts', 'a.ts']);
        expect(reversed.status).toBe(1);
        expect(reversed.stdout).toContain('suppression-check: 2 files, 2 violations, 0 allowed.');
        expect(reversed.stdout.indexOf('a.ts:1:')).toBeLessThan(reversed.stdout.indexOf('b.ts:1:'));
      });
      ```

### Policy

- Allowed:
  - 変更は `scripts/checks/suppression-check.test.ts` に限る。
  - 既存の `runCli` と一時ディレクトリの前提を使う。
  - 期待値には、2 件の行、`2 files, 2 violations, 0 allowed.`、exit 1 を書く。
  - 入力の順を逆にしたときも表示がファイル名の順であることを確かめる。
- Forbidden:
  - スクリプトの `resolveTargets`、`run`、`formatRecord` を変えない - 複数パスはすでに正しく動いており、変える理由がないため。
  - `.md` と存在しないパスが件数に入らないことを、新しい外部の契約として書き足さない - 既存の `resolveTargets` の振る舞いであり、このエントリーの主題ではないため。
  - 単一パスのテストを書き換えない - 既存の契約を保つため。

### Verify

- Always:
  - `pnpm test:related scripts/checks/suppression-check.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、明示されたファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## Notes

### Slice 1: 複数パスのテスト

- Findings: なし
- Unplanned: なし
- Commit: f620ea2c084311ac8b264fc71990b542d32a0c27
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
