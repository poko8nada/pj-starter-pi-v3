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

- `consult/README.md`（`## Trust`）: 「穴は 3 つ」と断定しているが、同じコマンド内の代入（`FOO=.env; cat $FOO`）は `guard.ts` にしか書いていない。閉じるには: README にも書くか、断定をやめるかを決める
- `consult/child/guard.ts`: glob（`cat .e*`）と、コマンドで組み立てた名前（`node -e "…'.en'+'v'"` など）は、トークンが秘密の名前にならないので通る。閉じるには: この族も穴として書くか、ホストと OS の境界に委ねると決める

### Unplanned

- なし

Commit: 25759d5（05・06 が同じコミット。`read` は、guard が止める範囲と穴 3 つが両方のファイルにあることを確かめた）
