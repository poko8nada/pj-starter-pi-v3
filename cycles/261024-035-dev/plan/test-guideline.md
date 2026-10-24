# PLAN `test-guideline`

## Files

```text
.pi/
  skills/
    plan/
      SKILL.md                    update
      references/
        format.md                 update
        tasks.md                  update
    work/
      SKILL.md                    update
      references/
        tasks.md                  update
    close/
      SKILL.md                    update
      references/
        format.md                 update
    yolo/
      SKILL.md                    update
```

## 1.プランの形と手順

### Types

なし

### Steps

1. `.pi/skills/plan/references/format.md`:
   - `## Shape` の `### Verify:` からケースの行を消し、`### Steps` をコード、テスト、文書の 3 つの形にする。
   - `## Files` に、ファイルの構造の作り方を足す（関心ごとの dir、テストはコロケーション、入り口は機能直下の `index`、少なければフラット、増えたら構造変更を提案）。
   - `## Slices` から統合スライスの行を消す。base plan の `look` の行は残す。
   - `## Verify` を「常に確認するもの」と「実装内容で足すもの」に書き換え、`### Kinds`、`### Cases`、`#### Walk` を消す。
   - `## テストとテストケースの考え方` を足し、6 つの基準を書く。
   - `## Types` の「It is the source of the slice's cases」を、ケースを持たない形に直す。
2. `.pi/skills/plan/SKILL.md`:
   - 手順 5 を「`Types` を歩き、ケースを書く」から「`Verify` を書く」に変える。
   - 手順 6 を、`Verify` の 2 分割に合わせる。
   - 手順 9 のレビューの観点を、テストのステップの妥当性と `Verify` の妥当性に変える。
   - ファイルの説明を、新しい節に合わせる。
3. `.pi/skills/plan/references/tasks.md`:
   - レビューのタスクを、`Unrunnable`、`Unproven`、`Noise`、`Gaps` の 4 つで書き直す。`Noise` と `Gaps` は「テストとテストケースの考え方」に照らす。

### Verify:

- look: オーナーが 3 枚を読み、ADR 01 の `Adopted` と合うかを答える
  - (happy) オーナーが 3 枚を読み、OK を返す → スライスを閉じる
  - (error) オーナーが穴を返す → 直してから commit する
  - _no case_: 整形 — commit のフックが `*.md` を整形する（`lefthook.yaml` 8 行）
  - _no case_: テストと型 — どちらもスキルの md を読まない

## 2.ワークの受入とレビュー

### Types

なし

### Steps

1. `.pi/skills/work/SKILL.md`:
   - 手順 7 の受入から「(integration slice included)」を外す。
   - 手順 6 のレビューに、テストのステップのケースの妥当性を見ることを足す。
2. `.pi/skills/work/references/tasks.md`:
   - レビューの観点に `Noise` を足し、テストのステップを「テストとテストケースの考え方」に照らすと書く。

### Verify:

- look: オーナーが 2 枚を読み、受入とレビューの観点が、スライス 1 の `Verify` の形（常に + 条件付き、ケースなし）と合うかを答える
  - (happy) オーナーが 2 枚を読み、受入の文がスライス 1 の形と合っていて、OK を返す → スライスを閉じる
  - (error) オーナーが穴を返す → 直してから commit する

## 3.クローズと yolo

### Types

なし

### Steps

1. `.pi/skills/close/SKILL.md`:
   - 先頭に手順「オーナーに確認するかを聞く」を足し、以降の番号を 1 つずつずらす。
   - 「How not to do this」の「Do not write a test」を、確認の手順と矛盾しない文に直す。
2. `.pi/skills/close/references/format.md`:
   - `## Shape` に `## Verified` を `## Triage` の後ろとして足し、`Asked` と `Result` の規則を書く。
3. `.pi/skills/yolo/SKILL.md`:
   - plan の段から `the cases` を外す。
   - close の段の `skips` に、機能の確認も飛ばすと足す。

### Verify:

- look: オーナーが 3 枚を読み、確認の聞き方と記録の置き場が意図通りかを答える
  - (happy) オーナーが 3 枚を読み、OK を返す → スライスを閉じる
  - (error) オーナーが穴を返す → 直してから commit する
  - _no case_: `collect.mjs` が `## Verified` を消さないこと — スクリプトを読めば分かる（`## Triage` 以降を残す）

## 4.統合: 新しい形の plan md が閉じられる

### Types

なし

### Steps

1. `.pi/skills/plan/references/format.md`:
   - 変更なし。統合の前提として `## Shape` と `## Verify` を読む。

### Verify:

- use: サブエージェントが `plan/SKILL.md` と `references/format.md` を読み、使い捨ての plan md を `/tmp` に書いて、詰まった所を報告する。あわせて `grep -rn "Kinds\|Cases\|Walk" .pi/skills` の行数を報告する
  - (happy) 常に確認するものと実装内容で足すものを埋めた plan md が、`Kinds`、`Cases`、`Walk` を使わずに書け、詰まった所が 0 で、grep が 0 行 → 閉じる
  - (error) 形が決まらず書けない所が 1 つ以上ある → 閉じない。直してから再実行する
  - (error) grep が 1 行以上 → 閉じない。名前を消してから再実行する

## Notes

### Slice 1: プランの形と手順

- Findings: なし
- Unplanned:
  - 足した節を日本語で書いていた（`format.md` の本文は英語）。全部英語にし、`常に` / `足す` を `Always` / `Added`、`### ファイルの構造` を `### Structure`、`## テストとテストケースの考え方` を `## Test cases` にした。
  - Shape の `### Steps` が古い形のままだった。コード、テスト、文書の 3 つの形に直した。
  - Shape の `## Review` に `Noise` が無かった。足した。
  - `## Test cases` が「いつ、誰が使うか」を書いていなかった。2 つの使い道を 1 文目に書き、手順 5、手順 9、レビューのタスクから指した。
  - `## Review` の観点を 1 段落に並べていた。観点ごとに 1 本に割った。
- Commit: b08aa92

### Slice 2: ワークの受入とレビュー

- Findings:
- Unplanned:
- Commit:

### Slice 3: クローズと yolo

- Findings:
- Unplanned:
- Commit:

### Slice 4: 統合: 新しい形の plan md が閉じられる

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
