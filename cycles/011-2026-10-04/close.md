# Close 011

## Integration

なし — `second-opinion` の `Boundary.Plans` が名指すのは写す順序（head sentence の "what it waits for"）で、plan をまたいで使う物ではない。継ぎ目にテストする物が無い。

## Collected

### second-opinion

1. Review Round 1 / 15行以内（`answer.ts` の既定質問・`README.md`）の強制が無い。`runOpinion` は子の本文をそのまま返し（`index.test.ts:117-127` が素通しを保証）、Verify は文面に `15行` が入ることしか見ない / left: 強制（切断・拒否）は plan I/O の「子の本文をそのまま返す」と矛盾するため入れない。15行は子への指示として残す

## Triage

owner 確認済み。

- 1: このサイクルで直した: 「全体15行以内」は owner の同意が無かった細部だった。`answer.ts`（指示文とコメント）・`answer.test.ts`・`README.md` から記述を外し、ADR 04-1 の `決めた形` からも外した `done`
