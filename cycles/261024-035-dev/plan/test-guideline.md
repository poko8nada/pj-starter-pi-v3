# PLAN `test-guideline`

## Files

```text
.pi/
  skills/
    design/
      references/
        tasks.md                  update
    propose/
      SKILL.md                    update
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
README.md                         update
README.ja.md                      update
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

## 3.クローズ

### Types

なし

### Steps

1. `.pi/skills/close/SKILL.md`:
   - 手順「オーナーに確認するかを聞く」を、トリアージの後ろに足し、以降の番号を 1 つずつずらす。
   - 「How not to do this」の「Do not write a test」を、確認の手順と矛盾しない文に直す。
2. `.pi/skills/close/references/format.md`:
   - `## Shape` の最後に `## Verified` を置き、Unit ごとの `Plans`、`Result`、`Fixed` を書く。
   - `## Verified` の規則に、`## Triage` の後ろに置く理由を書く。

### Verify:

- look: オーナーが 2 枚を読み、確認の聞き方と記録の置き場が意図通りかを答える
  - (happy) オーナーが 2 枚を読み、OK を返す → スライスを閉じる
  - (error) オーナーが穴を返す → 直してから commit する
  - _no case_: `## Triage` 以降を残すこと — もとの振る舞いで、今回は触らない

## 4.読み直しで見つけた不備

### Types

なし

### Steps

1. `.pi/skills/propose/SKILL.md`:
   - `the four things` を 5 に直す。
2. `.pi/skills/design/references/tasks.md`:
   - 観点 6 に、検査の例（テスト、コマンド、エージェントの `read`、オーナーの目）を足す。
3. `.pi/skills/work/SKILL.md`:
   - 受入に、振る舞いを足さない plan ではエージェントが読む、と足す。
   - テストの片付けに、`## Test cases` が禁じるテストを足す。
4. `.pi/skills/work/references/tasks.md`:
   - 片付けのタスクに、`## Test cases` が禁じるテストを足す。
5. `.pi/skills/plan/references/format.md`:
   - フロントの行を、オーナーがサーバーを立てて見る形にする。
   - `## Test cases` の「2 回」を、いつ使うかに書き換える。
6. `.pi/skills/yolo/SKILL.md`:
   - plan の段から `the cases` を外し、`the steps` と `the verify` にする。
   - close の段の `skips` に Unit の確認を足し、`## Verified` を書かないと足す。
7. `.pi/skills/close/references/format.md`:
   - `Plans` から `なし` を消す。
   - `Fixed` と `## Closing` で、commit の置き場が分かるようにする。
8. `README.md`、`README.ja.md`:
   - close の行に、Unit の確認を足す。

### Verify:

- look: オーナーが 8 つのステップの変更を読む
  - (happy) オーナーが読み、OK を返す → スライスを閉じる
  - (error) オーナーが穴を返す → 直してから commit する

## 5.統合: 新しい形の plan md が閉じられる

### Types

なし

### Steps

1. `.pi/skills/plan/references/format.md`:
   - 変更なし。統合の前提として `## Shape` と `## Verify` を読む。

### Verify:

- use: サブエージェントが `plan/SKILL.md` と `references/format.md` を読み、使い捨ての plan md を `/tmp` に書いて、詰まった所を報告する。あわせて `grep -rn "^#\+ \(Kinds\|Cases\|Walk\)$" .pi/skills` と `grep -rn "slice's cases" .pi/skills` の行数を報告する
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

- Findings: なし
- Unplanned:
  - レビューのタスクの「`look` / `use` のチェック」を `Added` に直した。種類の名前が消えたため。
- Commit: 8809a0c

### Slice 3: クローズ

- Findings: なし
- Unplanned:
  - `## Verified` の位置を、先頭から最後（`## Triage` の後ろ）に変えた。確認が最後の手順になったため。`collect.mjs` は `## Triage` 以降を残すので、変更は要らなかった。
  - 手順を 8 つに組み直した（トリアージ → `ex-` → Unit の確認 → オーナー）。
  - `## Verified` に `Fixed` を足した（動かなかったときの `ex-`）。
  - `close/references/format.md` の `Plans`、`Fixed`、`## Closing` は、スライス 4 の分も同じファイルにある。commit はスライス 3 に寄せた。
- Commit: 0b37aaf

### Slice 4: 読み直しで見つけた不備

- Findings: なし
- Unplanned:
  - オーナーの指示で、8（`adr` の決め直しの道）と 12（フラットなときの `index`）は書かないと決めた。plan md の `Files` と `Steps` から外した。
  - `close/references/format.md` の `Plans`、`Fixed`、`## Closing` は、スライス 3 の commit に入った。
- Commit: d405681

### Slice 5: 統合: 新しい形の plan md が閉じられる

- Findings: なし
- Unplanned:
  - 統合の `use` で、形が決めていない所が 4 つ出た。`Files` の `add` と `drop` の例、外と会わないコードステップの `Outside:` 行、使わない形のステップ、`Added` に複数当たるときの書き方。どれも `format.md` で決めて、再実行したら 0 になった。
  - 統合の `grep` は `Kinds\|Cases\|Walk` だったが、`Walk the relations` のような普通の動詞に当たった。節の名前（`^#\+ ...$`）と `slice's cases` に絞り直した。
- Commit: 4e5b0f2

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
