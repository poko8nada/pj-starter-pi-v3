# tickets-skill.stopped

Acceptance:

- step が止まったことを書き込む欄が無い、が解ける: 止まった step のチケットは開いたまま残り、理由（落ちた検査の出力、変えたファイル、走った回数、時刻）が書かれている

Owner: at the end

## Todo

- `.pi/skills/tickets/SKILL.md`
  - `## Steps` のチケットの閉じ方 — 止まったときは閉じない、という段を足す（`Commit:` の扱いと、開いたまま残る形）
- `.pi/skills/tickets/references/format.md`
  - `Notes` — 止まった理由の欄（`Stopped:`）の形を足す: 落ちた検査の出力、変えたファイル、走った回数、時刻
  - `Commit:` — いまの形（何も変えない step）に加えて、止まった step でも `Commit: なし（理由）` を取れる、と書く

## Verify

### read

- `review` の子に `.pi/skills/tickets/SKILL.md` と `.pi/skills/tickets/references/format.md` を渡し、止まった step の扱いを報告させる
- 合格: 止まったチケットは閉じずに開いたまま残る、と書いてあり、`Stopped:` の欄に 4 項目（落ちた検査の出力、変えたファイル、走った回数、時刻）があり、`Commit:` の扱いが書いてある（1 行）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
