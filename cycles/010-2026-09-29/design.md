# DESIGN 010

## Plans

### `plan/consult.md`

- Carries:
  - ADR 02-1: consult.worktree
  - ADR 02-2: consult.docs
- Targets:
  ```text
  .pi/extensions/consult/
    run/
      worktree.ts                update
      worktree.test.ts           update
    tool/
      worktree.ts                update
      worktree.test.ts           update
    index.ts                     update
    README.md                    update
  README.md                      update
  README.ja.md                   update
  ```
- Types:
  - ADR 02-1:
    | Type            | I/O | Example                                 | Reason                             |
    | --------------- | --- | --------------------------------------- | ---------------------------------- |
    | `RemoveOptions` | In  | `{ force: true }`                       | `force` と `busy` を名前付きにする |
    | `CleanupReport` | Out | `{ pruned: [], branches: [] }`          | 掃除が返す形                       |
    | `ConsultBranch` | Out | `consult/3-stack.formatter`             | 名前空間に縛る                     |
    | `OrphanBranch`  | Out | `{ state: 'kept', reason: 'unmerged' }` | 処分は二択。第三の状態を作らない   |
    | `reason`        | Out | `'unmerged'`                            | 現状は未マージのみ                 |
    ```ts
    export type RemoveOptions = {
      readonly force?: boolean;
      readonly busy?: boolean;
    };
    export type ConsultBranch = `consult/${string}`;
    export type OrphanBranch =
      | { readonly state: 'removed'; readonly branch: ConsultBranch }
      | { readonly state: 'kept'; readonly branch: ConsultBranch; readonly reason: 'unmerged' };
    export type CleanupReport = {
      readonly pruned: readonly string[];
      readonly branches: readonly OrphanBranch[];
    };
    ```
- Granularity: 同じ unit の `.worktree` + `.docs` を `plan/consult.md` 1枚に載せる。同じ worktree・同じ子がやり、doc は実装の従属物だから
- Blocked by: なし
