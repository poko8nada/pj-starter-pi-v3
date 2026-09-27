# work-skill

Acceptance:

- `work/SKILL.md` step 7 に、`read` / `use` は `consult` の子を 1 体走らせる、と書いてある
- チケットが名指しした type に文書を `input` で渡し、返ってきたテキストを証拠にする、と書いてある

## Todo

- `.pi/skills/work/SKILL.md`
  - step 7（Run the `Verify`）— `read` / `use` の走らせ方を足す
    - `read` / `use` は `consult` の子を 1 体走らせる（type はチケットが名指しする）
    - 文書は `input` で渡す（子は読みだけの type で、書かせない）
    - 証拠は子が返したテキスト。親が読んで判定する
  - step 7 の既存の 1 行（子に求めるのは拒否の文であって、ファイルではない）と矛盾しない形にする

## Verify

### read

- `review` の子に `.pi/skills/work/SKILL.md` だけを渡す
  - `read` / `use` の型をどう走らせるかを報告させる（どの子を、何を渡し、何を証拠にするか）
  - それが step 7 の 1 か所に書いてあるか報告させる

### use

- `review` の子に `.pi/skills/work/SKILL.md` だけを渡す
  - 「`read` の型で `cycles/006-2026-09-27/plan.md` を読ませ、`What` の行数と `Depends` の一覧を報告させる」というチケットがあるとして、その `Verify` のブロックを書かせる
  - スキルだけで書けたか、足りなかった所を報告させる

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
