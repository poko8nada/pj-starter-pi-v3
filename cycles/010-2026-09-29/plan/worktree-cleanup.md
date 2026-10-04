# PLAN `worktree-cleanup`

## Files

```text
.pi/extensions/consult/
  run/
    worktree.ts                update
    worktree.test.ts           update
    child.ts
    child.test.ts
  tool/
    worktree.ts                update
    worktree.test.ts           update
    commit.ts
    children.ts
    children.test.ts
    consult.ts
  index.ts                     update
  README.md                    update
README.md
README.ja.md
```

## Slices

1. 一覧がゴーストを出さない
   - Verify:
     - test: `pnpm run test:run .pi/extensions/consult/run/worktree.test.ts`
       - 実体の無い path の登録 → 一覧に出ない(happy)
       - 実体がある登録 → 一覧に出る(happy)
       - 作業場が 1 つも無い → 空の一覧(empty)
       - git が断る（リポジトリでない）→ 空の一覧(error)
       - 権限: 置き場が読めない → 当てはまらない（git の出力だけを見るため）
   - Steps:
     1. `.pi/extensions/consult/run/worktree.ts`: `parseWorktrees` が実体の無い path の行を落とす（`prunable` の行を返さない）
     2. `.pi/extensions/consult/run/worktree.test.ts`: 上の4ケースを書く
2. `remove` が片付ける
   - I/O:
     ```ts
     export type RemoveOptions = {
       readonly force?: boolean;
       readonly busy?: boolean;
     };
     export type RemoveOutcome = 'removed' | 'missing' | 'busy' | 'dirty';
     export type RemoveResult = {
       readonly outcome: RemoveOutcome;
       readonly cleanup: CleanupReport;
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
   - Verify:
     - test: `pnpm run test:run .pi/extensions/consult/run/worktree.test.ts`
       - 作業場を作って消す → 登録と実体が消え、`removed`(happy)
       - 取り込み済みの枝 → 消え、報告に `state: 'removed'`(happy)
       - 未マージの枝 → 残り、報告に `state: 'kept'` / `reason: 'unmerged'`(happy)
       - `force` で未マージの枝 → 捨てられ、報告に `state: 'removed'`(happy)
       - 実体の無い登録（ゴースト）→ `prune` で消え、`missing` と `pruned` にそのパス(missing)
       - 作業場の無い id → `missing`(missing)
       - 掃除する物が無い → `pruned: []`、`branches: []`(empty)
       - `options` を渡さない → `force` / `busy` は既定（false）(undefined)
       - 同じ id で 2 回目 → `missing`(a second call)
       - 子が走っている → `busy` で断り、掃除もしない(concurrency)
       - 変更が残っている → `force` 無しでは `dirty`、`force` なら消える(boundary values)
       - `consult/` のような空の id → 作業場が無いので `missing`(invalid input)
       - `git worktree lock` した作業場 → 例外。成功として扱わない(error)
       - 権限: 置き場を読めない → 当てはまらない（git の出力だけを見るため）
   - Steps:
     1. `.pi/extensions/consult/run/worktree.ts`: この形を先に置く（`RemoveOptions` を名前付きで受け、`RemoveOutcome` から `removed-branch-kept` を落とす）
     2. `.pi/extensions/consult/run/worktree.ts`: `git worktree prune` を先に呼ぶ。順序は prune → 登録の再確認（prune で消えた登録は `missing` になる）
     3. `.pi/extensions/consult/run/worktree.ts`: `prune` と `worktree remove` の成否を見る。失敗したら例外を投げる（`createWorktree` と同じ形。成功として扱わない）
     4. `.pi/extensions/consult/run/worktree.ts`: `removeWorktree` から自分の枝の削除を外す（枝の運命は掃除が決める）
     5. `.pi/extensions/consult/run/worktree.ts`: どの作業場にも checkout されていない `consult/*` を列挙する
        - Outside: design の `External: git` の `Version`。検査を走らせる環境の版も確かめる
     6. `.pi/extensions/consult/run/worktree.ts`: 枝の規則を1つにする。取り込み済み → 消して `removed`、未マージ → 残して `kept` / `reason: 'unmerged'`。`force` のときはその unit の枝だけ捨て、`removed` として報告に入れる
        - Outside: design の `External: git` の `Contract`。`consult/*` の命名で見分ける
     7. `.pi/extensions/consult/tool/worktree.ts`: `removeText` が、報告の消した物・残した物を言う
     8. `.pi/extensions/consult/run/worktree.test.ts`: 掃除と枝のケースを書く
     9. `.pi/extensions/consult/tool/worktree.test.ts`: 道具の面のケース（`removeText` の文言）を書く
3. セッションの開始時に静かに1回走らせる
   - I/O:
     ```ts
     cleanWorktrees(cwd: string): CleanupReport
     ```
   - Verify:
     - test: `pnpm run test:run .pi/extensions/consult/run/worktree.test.ts`
       - 掃除してから 2 回目を呼ぶ → 何も消さない(happy / a second call)
       - 掃除する物が無い → 何も消さない(empty)
       - 走っている子の作業場 → 消さず、その枝も消さない(concurrency)
       - git が断る → 例外。`session_start` はそれを握って静かに続ける(error)
       - 権限: 置き場を読めない → 当てはまらない（git の出力だけを見るため）
   - Steps:
     1. `.pi/extensions/consult/run/worktree.ts`: 掃除だけを単独で呼べる形にする（`removeWorktree` の中と同じ物を使う）
     2. `.pi/extensions/consult/index.ts`: `session_start` からそれを呼ぶ。失敗は握って知らせない
     3. `.pi/extensions/consult/run/worktree.test.ts`: 上の4ケースを書く
4. 説明を合わせる
   - Verify:
     - read: `review` の子に `.pi/extensions/consult/README.md` と `removeText` を渡す
       - 消す物・残す物・返す物が一致するか報告させる
       - 合格: `consult_worktree` の説明に、消す物・残す物（未マージは残す）・返す物がある
   - Steps:
     1. `.pi/extensions/consult/README.md`: `consult_worktree` に、消す物・残す物（未マージは残す）・返す物を足す
     2. `README.md`: 道具の1行が現物と食い違っていないか確かめ、食い違うなら直す
     3. `README.ja.md`: 同じことを日本語側で確かめ、食い違うなら直す
5. 統合: ゴーストと取り込み済みの枝がある状態から `remove` が片付ける
   - Verify:
     - cli: `consult_worktree remove <id>` を、実体の無い登録と、取り込み済み / 未マージの枝がある状態で走らせる
       - 出力が消した物・残した物を言い、その後の一覧にゴーストが出ない(happy)
       - 2 回目は何も消さない(happy)
   - Steps:
     1. `.pi/extensions/consult/run/worktree.test.ts`: その状態を作り、`remove` の後の一覧と報告を確かめる

## Notes

### Slice 1: 一覧がゴーストを出さない

- Findings:
  - `parseWorktrees` が `prunable` 行の登録を落とすようにした、ゴーストを一覧に出さないため
- Unplanned:
  - なし
- Commit:

### Slice 2: `remove` が片付ける

- Findings:
- Unplanned:
- Commit:

### Slice 3: セッションの開始時に静かに1回走らせる

- Findings:
- Unplanned:
- Commit:

### Slice 4: 説明を合わせる

- Findings:
- Unplanned:
- Commit:

### Slice 5: 統合: ゴーストと取り込み済みの枝がある状態から `remove` が片付ける

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:

## Acceptance

- Ran:
- Findings:
- Merge:
