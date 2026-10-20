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

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
