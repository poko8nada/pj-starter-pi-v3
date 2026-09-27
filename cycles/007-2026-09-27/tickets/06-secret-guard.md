# secret-guard

Acceptance:

- 「シェルは真似ない（止めるのは、値が決まらない `$` まで）」と決まり、その線と穴 3 つが `guard.ts` の doc と `consult/README.md` の `## Trust` に書いてある

## Todo

- `.pi/extensions/consult/child/guard.ts`
  - モジュールの doc と該当箇所のコメント — 「シェルを真似ない」という線と、穴 3 つ（`cat${IFS}.env` のような単語分割、`cat .env;ls` のような演算子の接着、非 bash の `path` を展開しないのに pi は `~` を展開すること）を書く。止める側に倒すのは「値が決まらない `$`」までと明記する
- `.pi/extensions/consult/README.md`
  - `## Trust` — 同じ線と穴 3 つを書く（guard がどこまで守り、本当の境界はホストと OS であること）

## Verify

### read

- `review` の子に `.pi/extensions/consult/child/guard.ts` と `.pi/extensions/consult/README.md` だけを渡す
  - 報告させる: guard が止める範囲（値が決まらない `$` まで）と、残る穴 3 つ。両方のファイルに書いてあるか

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
