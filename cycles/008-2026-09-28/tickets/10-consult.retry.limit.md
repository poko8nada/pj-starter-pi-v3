# consult.retry.limit

Acceptance:

- 上限で打ち切られると結果が途中のまま届き、打ち切りは本文の 1 行だけで判断に使う所に来ない、が解ける: 上限で止まったら同じループが 1 回走り、それでも止まれば打ち切りと回数が本文に明示される
- 上限と使用量が 1 回ごとに数えられていない、が解ける: 上限は 1 回ごと、使用量は合算して 1 回分として報告される

Owner: at the end

## Todo

- `.pi/extensions/consult/run/run.ts`
  - 上限で止まった（`stopped`）ときの分岐 — `consult.retry.reject` と同じループに入れる（続きを指示する文を足して、同じ worktree・`--continue` で 1 回だけ）
  - 使用量の合算 — 複数回走った分を足して 1 回分として返す
  - 上限の数え方 — 1 回ごとに数える（合計はそのぶん多い）ことを doc に書く
- `.pi/extensions/consult/tool/consult.ts`
  - 本文の組み立て — 打ち切られたことと走った回数を明示する行（`consult stopped early` の行の隣に、回数と、続きを走らせたかどうか）
- `.pi/extensions/consult/run/run.test.ts`（update）
  - 上限で止まる場合の再走、合算、本文の表示を確かめる

## Verify

### test

- `pnpm test consult`（4 ケース）
  - 上限で打ち切られる → もう 1 回走り、2 回目が通れば `ref` ができる（happy）
  - 2 回とも打ち切られる → 本文に打ち切りと回数が出る（error）
  - 2 回走ったときの使用量 → 合算されている（happy）
  - 打ち切り（`stopped`）と拒否（`failed`）が両方起きる → 走った回数の合計が本文に出る（error）

## Notes

### Findings

- なし

- （影響読み `consult-11` の指摘と、親の修正）
  - blocking（直した）: `README.md:121` の「ref が途中の姿になることはない」は 2 経路で偽（2 回とも上限で止まる／中断が続きの前に来る）→ 「止まった回の仕事は単独ではコミットせず、続きがあれば一緒にコミットする。2 回目も上限で止まるか、続きの前に中断が来たら、ref にはその時点の仕事が入り、本文に打ち切りが出る」に直した
  - 直した: `README.md:53` が拒否の道しか語っていなかった → 上限停止も入れた
  - 未対応: 親が読む `[consult]` 行（`tool/consult.ts:332` の `usageLine`）まで通しで合算を確かめる検査が無い
  - 未対応: 読み取り専用の型（`research` / `review`）の上限停止は再走しない（worktree が無いため）。本文は `stopped early` の 1 行だけになる
  - 未対応: 1 回目が上限で止まり 2 回目が完走してフックに拒否されると、`combineRuns` は `stopped` を最後の回からしか取らないので、打ち切りの事実が本文にも `stopped.json` にも残らない

### Unplanned

- `.pi/extensions/consult/run/retry.ts`: 上限で止まったときの再走を、拒否の再走と同じ `attemptAndCommit` に入れた（上限で止まった回はコミットせず、続きと合わせて 1 回だけコミットする）
  - なぜ: チケットの `Todo` は `run/run.ts` を名指しするが、step 09 が再走のループを `run/retry.ts`（`MAX_ATTEMPTS = 2`）に置いた。同じループに入れるにはそちらが正しい。途中の仕事をコミットすると、同じ `consult/<label>` の ref をもう一度作る所で落ちる
- `.pi/extensions/consult/tool/render.ts`: `compose` が、打ち切りの行の隣に走った回数と続きの有無を出すようにした
  - なぜ: 本文は `tool/consult.ts` が組み立てるのではなく `tool/render.ts` の `compose` が組む。行を打ち切りの行の隣に置くにはそちらが要る
- `.pi/extensions/consult/run/retry.test.ts`: 上限の再走と本文の表示の検査をここに置いた（`run.test.ts` には合算と `compose` の検査を置いた）
  - なぜ: 再走のループが `retry.ts` にあるので、その検査は隣に置くのが自然。チケットが名指しする `run.test.ts` だけでは、走らせた回数と本文の検査がループから離れる

Commit: 0c33129 + efec87e（0c33129 = 子の実装を親が衝突を解いて取り込んだ物、efec87e = 影響読みの blocking（README の文面））
