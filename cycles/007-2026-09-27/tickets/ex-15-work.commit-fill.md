# work.commit-fill

Acceptance:

- 空の `Commit:` のチケットも、ユニットの終わりの squash で新しいハッシュが入る（`work/SKILL.md` の「every ticket of the unit」と、`tickets/references/format.md` の「step の時点では空」が両立する）

## Todo

- `.pi/skills/work/scripts/squash.mjs`
  - 単位のチケットの名前を受け取れるようにする（例: `<cycle-dir> <base-hash> <hash>... [--tickets <name>...] [run]`。`run` は最後のまま）
  - 名前を受け取ったチケットでは、空の `Commit:`（`^Commit:\s*$`）も新しいハッシュで埋める。古いハッシュの書き換え（注記を残す）と `なし（理由）` の素通りは今のまま
  - 乾燥の出力に、埋める行も出す（今の「書き換えるチケット」の形に揃える）
- `.pi/skills/work/scripts/squash.test.ts`
  - 空の `Commit:` のチケットが名指しされていれば埋まる（happy）
  - 名指しされていないチケットの空の `Commit:` は触らない（happy、boundary）
- `.pi/skills/work/SKILL.md` の step 11 — squash の行に、単位のチケットの名前を渡すことを足す
- `.pi/skills/work/SKILL.md` の step 4 — 「several steps to one child: one call, one ref, and the same hash in both tickets」は step の時点でハッシュが入る前提なので、「同じユニットのコミットを指す（step 11 で書く）」に直す

## Verify

### test

- `pnpm test:run .pi/skills/work`
  - 名指ししたチケットの空の `Commit:` が埋まる（happy）
  - 名指ししないチケットは空のまま（happy、boundary）
  - 古いハッシュの書き換えと注記の保存は今までどおり（happy）
  - `--tickets` が無い今の呼び方も通る（happy、boundary）

### read

- `review` の子に `.pi/skills/work/SKILL.md` だけを渡す
  - 報告させる: ユニットの終わりに、チケットの `Commit:` を誰がどう書くか（空のときと、古いハッシュのとき）

## Notes

### Findings

- このチケットは、作業を始める前に `## Todo` を 1 行足した（理由: `close` の統合で、同じ穴の残りが見つかった。step 4 の「the same hash in both tickets」は、step の時点でハッシュが入る前提で、`tickets/references/format.md` の「空」と食い違う）

### Unplanned

- なし

Commit:
