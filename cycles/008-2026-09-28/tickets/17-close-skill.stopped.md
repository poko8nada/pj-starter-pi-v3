# close-skill.stopped

Acceptance:

- 開いたチケットを close で判断する段が無く、残った worktree も放置される、が解ける: close は開いているチケットを穴として扱い、調査の段で理由を確かめ、owner と「続ける / 落とす / 持ち越す」を決める。決めたとおりに、残った worktree を `consult_resume` の `remove` で消すか、残すかする

Owner: at the end

## Todo

- `.pi/skills/close/SKILL.md`
  - `## Steps` の調査と判断の段 — 開いているチケット（止まった step）を穴として扱い、その理由を調べ、owner と「続ける / 落とす / 持ち越す」を決める、という段を足す
  - `## Steps` の最後 — 残った worktree を `consult_resume` の `remove` で消すか、残すかを決めて実行する段を足す
  - `## The review's checklist` — 開いたチケットと残った worktree が説明されているか、を観点に足す

## Verify

### read

- `review` の子に `.pi/skills/close/SKILL.md` を渡し、開いたチケットの扱いと、残った worktree の片付けを報告させる
- 合格: 開いたチケットを穴として扱い、調査の段で理由を確かめ、owner と「続ける / 落とす / 持ち越す」を決める、と書いてある。残った worktree を `consult_resume` の `remove` で消すか残すかを決めて実行する、とも書いてある（1 行）

## Notes

### Findings

- なし
- （`read` の検証 `consult-7` の指摘と、親の修正。合格条件は満たしていた）
  - blocking（直した）: step 8（commit で凍結）と step 9（commit の後に「開いたチケットが名指さない worktree は finding」）が矛盾していた → step 9 は「何も決めない。step 4 が決めていない物は step 4（commit の前）に戻す」とし、finding を commit の後に作らないようにした
  - blocking（直した）: 「落とす」でチケットの状態が更新されない（`Stopped` が残り `Commit:` も空なので、次の close でまた穴として拾われる）→ `Commit: なし（owner が落とした。理由は Stopped のとおり）` を書く、と足した
  - blocking（直した）: 「持ち越す」worktree が次のサイクルの削除条件（「開いたチケットが名指さない物」）で消える → `Carry over` 行が名指す id を削除から除く、と足した
  - 未対応: 「続ける」ときの記録先が無い（`Bad` / `Carry over` は他の 2 つにしか無い）。決定者の書き分けが `:40` と `:51` で違う。開いている判定が `:26` と `:50` で別の形（実際に効くのは `Stopped` があるか）。step 9 は worktree だけを見て、止まった子が残した `consult/` ref を見ていない

### Unplanned

- なし

Commit: 1e64c01 + a765c35（1e64c01 = 子が worktree で作ったコミットを親が取り込んだ物、a765c35 = `read` の検証の blocking 3 件の修正）
