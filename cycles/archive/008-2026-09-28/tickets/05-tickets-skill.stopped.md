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
- （影響読み `consult-4` の指摘と、親の修正）
  - blocking（直した）: `work/SKILL.md:100` の「The two fields」が古い（`Notes` は `Stopped` で 3 つになった）→ 「The fields」に直した
  - blocking（直した）: 止まった step の `Commit: なし（理由）` は、続きが通って commit できても `squash.mjs` が埋めない（空の `Commit:` しか埋めない）→ `format.md` に「続きが終わったら、理由は unit の commit の hash に置き換わる」を足した。`squash.mjs` 側が `なし（理由）` を書き換えるかは次のサイクルで見る
  - 直した: `Stopped` の項目を、定義の unit 10 と同じ 6 つに揃えた（子の最後の本文、worktree の id を足した）。止まらなかった step ではこの節を書かない、も明記
  - 未対応: 転記するのが誰かが未定（子の記録は worktree の外に道具が置くが、ticket に移す主体が無い）。`close` の checklist が `Stopped` を素通りさせる（step 17 の担当）。`Stopped` は凍った ticket に後から書くので、凍結の規則にその 1 行が無い（`Carry over` 2 本目）

### Unplanned

- なし

Commit: c83173f + 5d79c90（c83173f = step 05 の子、5d79c90 = 影響読みの blocking 2 件の修正）
