# PLAN `ex-migration-doc`

## Files

```text
README.md                    update
README.ja.md                 update
test/README.md               update
```

## 1.移行の手順と、現在の形だけを書く

### Types

なし

### Steps

1. `README.md`:
   - Harness の移行の行に、`scripts/harness.local.json` の `starter` の値を `scripts/harness/starter.json` へ移してから、`--run` 付きで pull する、と書く。
   - Getting started の `product:ready` の行から、古い config を打ち消す文（`Tests are not deleted`、`the starter config is gone`）を消し、今の形を肯定で書く。
   - Checks と Harness の他の行に、古い形を打ち消す文が残っていないことを確かめる。

2. `README.ja.md`:
   - 同じ 3 か所を同じ意味で書き換える。

3. `test/README.md`:
   - プロダクトのテストの行を読み、古い形を打ち消す文が無ければそのままにする。

### Verify:

- read: `review` サブエージェントが `README.md`、`README.ja.md`、`test/README.md` を読み、次の各ケースを報告する
  - (happy) `README.md` の Harness の移行の行を読む → `scripts/harness.local.json` の値を `scripts/harness/starter.json` へ移す順序と、`--run` 付きの pull、平置き 6 件の `legacy` が書かれている
  - (happy) `README.md` の Getting started と Checks を読む → 今の形だけが肯定で書かれ、`not deleted`、`gone`、`no longer` のような打ち消しが無い
  - (happy) `README.ja.md` を読む → 同じ 2 か所が同じ意味で書かれている
  - (happy) `test/README.md` を読む → starter config と product config の `exclude` が肯定で書かれている
  - (empty) 3 つを `mode`、`不要`、`no longer`、`gone`、`not deleted` で探す → 打ち消しの文が無い（移行の行が古い `harness.local.json` を名指すのは、移行の手順である）
  - _no case_: 文面の読みやすさ — 読む者の判断

## Notes

### Slice 1: 移行の手順と、現在の形だけを書く

- Findings: なし
- Unplanned: なし
- Commit: 275215a

## Review

### Round 1

- Stale:
  - なし — README.md:28, README.md:44, README.md:53 と test/README.md:7・README.ja.md:28,44,53 は整合し、他文書を陳腐化させない
- Unlisted:
  - なし — diff は README.md・README.ja.md のみで Files の 2 行に収まる (cycles/261020-025-dev/plan/ex-migration-doc.md:6-7)
- Gaps:
  - なし — 移行順序・平置き6件・肯定形・exclude は Verify の happy/empty で exercise される (cycles/261020-025-dev/plan/ex-migration-doc.md:33-37)
- Unproven:
  - なし — Types なしで自動テストがなく (cycles/261020-025-dev/plan/ex-migration-doc.md:15)、旧否定文が残れば read/empty が赤になる
- Doubts:
  - `mode` の部分一致は README.md:29 の `models`・README.md:53/README.ja.md:53 の `harness.mode.json` に当たるが否定文ではないため empty は文単位で判定する前提とし finding としない
  - JA の `2 か所` (cycles/261020-025-dev/plan/ex-migration-doc.md:35) と Steps の `3 か所` の数え方の差は empty が Checks 等を覆うため finding としない
  - test/README.md は Files に update とあるが Steps で clean なら据え置きと決められており (cycles/261020-025-dev/plan/ex-migration-doc.md:27-28)、無変更は finding としない
  - 結論: diff は plan を閉じられる

## Acceptance

- Ran: acceptance の再 `read`（5 ケースすべて pass）、`pnpm typecheck` root ok / .pi ok、`pnpm test:run` 42 files / 711 tests。壊し確認は 2 つ: `README.md:53` から移行の順序を消し、`README.md:28` に `Tests are not deleted: the starter config is gone.` を戻すと、`read` は移行・Getting started・英日一致・grep の 4 ケースが fail。戻すと 5 ケースすべて pass。
- Findings: なし。review Round 1 は 4 観点とも なし。
- Doubts: なし
