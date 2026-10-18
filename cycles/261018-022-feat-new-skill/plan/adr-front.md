# PLAN `adr-front`

## Files

```text
.pi/
  skills/
    adr/
      SKILL.md              update
DEFINITION.md               update
README.md                   update
README.ja.md                update
```

## Slices

## 1.`adr` の文面

### Types

なし

### Steps

1. `.pi/skills/adr/SKILL.md`:
   - description を狭める。`brief` か `propose` を経た問いを受け、選択肢が並んだ状態から始まる形にする。サイクル開始の宣言は受けない。
   - `## Cycle` の 1 つ目の項目を、前段が問いを決めていることを受ける形に書き換える。宣言はここに来ない。
   - entry 2 を「前段の記録を `Context` に落とす」に書き換える。talk をここで繰り返さない。
   - entry 3 を「前段が並べた選択肢を書く」に書き換える。案を出すのも前段の仕事になるためである。決めるのは entry 6 のままにする。
   - entry 4 の `Research & Trial` を「決定の根拠だけを書く」に狭める。前段で調べたことは書かない。
   - 採らなかった案と一行の理由は `Options` に残すという規則を、そのまま残す。
   - entry 3 の「選ぶのはここではない」という規則を、そのまま残す。
   - `references/format.md` は触らない。

2. `DEFINITION.md`:
   - `adr` の行を ADR 022 の 03 の `Definition Change` の文にする。`調べ` を外す。

### Verify:

- read: `review` サブエージェントが `.pi/skills/adr/SKILL.md` を読み、次の各ケースを報告する
  - (happy) description を読む → `brief` か `propose` を経た問いを受け、選択肢が並んだ状態から始まると書かれている
  - (happy) `## Cycle` の 1 つ目の項目を読む → 前段が問いを決めていることを受ける形になっている
  - (happy) entry 2 を読む → 前段の記録を `Context` に落とすと書かれている
  - (happy) entry 3 を読む → 前段が並べた選択肢を書くと書かれている
  - (happy) entry 4 を読む → 決定の根拠だけを書くと書かれている
  - (happy) entry 3 を読む → 採らなかった案と一行の理由を `Options` に残す規則が残っている
  - (happy) entry 3 を読む → 選ぶのはここではないという規則が残っている
  - (error) entry 2 を読む → talk をやり直す記述が残っていない
  - (happy) entry 1 を読む → 前段が残した物で埋めると書かれている
  - (happy) 末尾の持ち分を読む → entry と決定だけがこのスキルの持ち分で、research と trial は入っていない
  - (error) `## Cycle` を読む → owner がサイクルを宣言する記述が残っていない
  - (error) entry 3 を読む → 前段の外で案を出す記述が残っていない
  - (error) entry 4 を読む → `research` と `trial` のサブエージェントの指示が残っていない
  - (happy) `DEFINITION.md` の `adr` の行を読む → `調べ` が無く、ADR 022 の 03 の `Definition Change` と同じ文である
  - (boundary values) description を読む → サイクル開始の宣言が発火条件に含まれていない
  - _no case_: `references/format.md` — 触らないと決めたので、確かめない

## 2.統合: 3 つのスキルの入口が重ならないこと

### Types

なし

### Steps

1. `README.md`:
   - `adr` の 1 行から、調べることと試すことを外す。前段が担うようになったためである。

2. `README.ja.md`:
   - `adr` の 1 行から、調べることと試すことを外す。前段が担うようになったためである。

### Verify:

- read: `review` サブエージェントが `.pi/skills/brief/SKILL.md` と `.pi/skills/propose/SKILL.md` と `.pi/skills/adr/SKILL.md` の description、`git diff README.md README.ja.md` を読み、次の各ケースを報告する
  - (happy) 3 つの description を読む → 宣言は `brief`、次に何をするかの問いは `propose`、前段を経た問いは `adr` が受けると読める
  - (boundary values) `brief` の description を読む → サイクル開始の宣言が発火条件になっている
  - (error) `adr` の description を読む → サイクル開始の宣言が発火条件に含まれていない
  - (boundary values) `git diff README.md README.ja.md` を見る → 動いたのは `adr` の行だけで、調べることと試すことが外れ、他の行は同じ
  - _no case_: 実際の発火 — スキルの選択は実行時に決まり、ここでは文面だけを読む

## Notes

### Slice 1: `adr` の文面

- Findings: なし
- Unplanned: entry 1 の「talk が何のためにあるか」と末尾の「持ち分」の行も、同じ理由で前段を受ける形に直した。
- Commit: c32c035

### Slice 2: 統合: 3 つのスキルの入口が重ならないこと

- Findings: なし
- Unplanned: なし
- Commit: 21f63ac

## Review

### Round 1

- Stale:
  - `DEFINITION.md:37` が古くなった。「adr-skill: エージェントまたは owner が、決めるべきことを調べ、決めて記録できる」の`調べ`が、`.pi/skills/adr/SKILL.md:48-52` の狭めにより `adr` に残らない。`cycles/261018-022-feat-new-skill/adr.md:127` も`調べ`を外した形に決めている。Files に `DEFINITION.md` はなく Verify にも定義行の確認はない。
    - fixed: `Files` に `DEFINITION.md`（update）と slice 1 の step 2 を足し、`DEFINITION.md:37` を ADR 022 の 03 の `Definition Change` の文にした。確かめる case も足した。
- Unlisted: なし — `4e0c14e..HEAD` の製品差分 3 件(`.pi/skills/adr/SKILL.md`、`README.md:61`、`README.ja.md:61`)は `cycles/261018-022-feat-new-skill/plan/adr-front.md:5-11` の Files と一致し Files 外の製品変更はない。
- Gaps:
  - `.pi/skills/adr/SKILL.md:31,33` の entry 1 は Verify に対応する case がない。`cycles/261018-022-feat-new-skill/plan/adr-front.md:36-46` に entry 1 を読む case はなく、`cycles/261018-022-feat-new-skill/plan/adr-front.md:76` が Unplanned として直したと書くのみ。
    - fixed: entry 1 を読む case を足した。
  - `.pi/skills/adr/SKILL.md:80` の末尾持ち分は Verify に対応する case がない。同上。
    - fixed: 末尾の持ち分を読む case を足した。
- Unproven:
  - `cycles/261018-022-feat-new-skill/plan/adr-front.md:40` の entry 3 happy は、旧文が残っていても新文があるため緑のままになる。`.pi/skills/adr/SKILL.md:44` の新文だけを見て旧案出しの削除を確かめる error がない。
    - fixed: 前段の外で案を出す記述が残っていないことを見る error の case を足した。
  - `cycles/261018-022-feat-new-skill/plan/adr-front.md:41` の entry 4 happy は、旧指示が残っていても緑のままになる。`.pi/skills/adr/SKILL.md:48-52` の新文だけを見て旧指示の削除を確かめる error がない。
    - fixed: `research` と `trial` の指示が残っていないことを見る error の case を足した。
  - `cycles/261018-022-feat-new-skill/plan/adr-front.md:38` の Cycle happy は、旧「owner declares the cycle」が残っていても緑のままになる。旧文の削除を確かめる error がない。
    - fixed: owner がサイクルを宣言する記述が残っていないことを見る error の case を足した。
- Doubts:
  - `.pi/skills/adr/references/format.md:45` は新文面とずれて見えるが、`cycles/261018-022-feat-new-skill/plan/adr-front.md:32` が触らないと決め `cycles/261018-022-feat-new-skill/adr.md:114` も節名を変えないと決めたため指摘にしなかった。
  - `.pi/skills/adr/SKILL.md:40` の前段なし直接点は entry 2 error が押さえると読めるため Gap にしなかった。
  - `README.md:70` と `README.ja.md:70` の「どの段からでも書ける」は元から広いため指摘にしなかった。

### Round 2

- Stale:
  - fixed: `Files` に `DEFINITION.md`(update)、step 2 を追加。`DEFINITION.md:37` は「決めるべきことを決めて記録できる」で`調べ`なし、`adr.md:127` の `Definition Change` の文と同一。確認 case は `plan/adr-front.md:54` に足した。
- Unlisted: なし — Round 1 に指摘が無いため再確認しない。
- Gaps:
  - fixed: `plan/adr-front.md:49` に entry 1 の case を足した。`.pi/skills/adr/SKILL.md:31` と対応する。
  - fixed: `plan/adr-front.md:50` に末尾持ち分の case を足した。`.pi/skills/adr/SKILL.md:80` と対応する。
- Unproven:
  - fixed: `plan/adr-front.md:52` に entry 3 の error を足した。`.pi/skills/adr/SKILL.md:42-46` は前段由来のみで、前段の外で案を出す記述はない。
  - fixed: `plan/adr-front.md:53` に entry 4 の error を足した。`.pi/skills/adr/SKILL.md:48-52` に `research`/`trial` の指示はない。
  - fixed: `plan/adr-front.md:51` に Cycle の error を足した。`.pi/skills/adr/SKILL.md:21-25` に owner がサイクルを宣言する記述はない。
- Doubts:
  - `plan/adr-front.md:50` の「research と trial は入っていない」は、`.pi/skills/adr/SKILL.md:80` 単体には文言なく(`theirs` は直前的には design/plan/work を指す)。entry 4 の狭めと合わせ読めば趣旨は合うため、finding にせず Doubt とする。

## Acceptance

- Ran: slice 1 の `read`（15 ケース）と slice 2 の `read`（4 ケース）、`pnpm typecheck`、`pnpm test:run`（41 files、699 tests）である。壊して確かめたのは 3 つで、`## Cycle` の宣言、entry 3 の案出し、entry 4 のサブエージェント指示を戻すと、どれも赤になって戻した。ケース 1 は「1 つ目の項目」だけを見る形では緑のままだったので、「`## Cycle` 全体」に直し、赤くなることを確かめた。
- Findings: なし。review の 6 件は `fixed` で、Round 2 が確かめている。
- Doubts: なし。
