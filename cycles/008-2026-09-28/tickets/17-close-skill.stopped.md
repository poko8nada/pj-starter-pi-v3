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

### Unplanned

- なし

Commit:
