# Close 047

## Collected

### procedure-rewrite (ADR 01, 02)

1. 116 / Work Review Round 1 / `.pi/skills/close/SKILL.md:90`・`.pi/skills/close/references/format.md:70` — Units が `Users can do` に限り `Product`/`What`/`Who`/`Stack` を除くことを確かめる grep も test も Added にないため、checks が実行されない。 / left: 文言範囲の限定であり実行可能な振る舞いがなく test では担保できない。両ファイルの精読は Added の校正 2 件が担うため、grep の追加は plan Verify の改訂として残す。

2. 137 / Work Review Round 2 / description の「after the owner's judgement asks the owner」は冗長だが意味は本文と一致し、finding にはしない。

3. 138 / Work Review Round 2 / `(rerun)` は `## Collected` の文脈保存と振り直しのみで `## Triage` 番号の手動付け替え（手順:85・:94）は対象外だが、fixed の文面の約束通りであり finding にはしない。

4. 60 / ADR 01 (Adopted) / `.pi/skills/close/references/format.md:60` の「the fix is code」が、Entry 01 の決めた判断軸と `.pi/skills/close/SKILL.md` の手順 5 に反している。

## Triage

- 1: dropped (ADR 01, `Unit.close-skill`): 記録に残るのは plan の `Verify` の穴であり、close の文書の穴ではない。
  - Fact: `.pi/skills/close/SKILL.md` の Unit のセクションも `.pi/skills/close/references/format.md` の `## Verified` も、`Users can do` の Unit に限り `Product` / `What` / `Who` / `Stack` を除くと正しく書かれている。欠けているのは plan の `Verify` の `other` の grep である。
  - Why: plan md はマージ後に書き換えないと決めており、`ex-` plan が直せるのは読まれる文書とコードである。文言そのものは Added の校正 2 件が精読して正しい。
  - Then: なし
- 2: ex-plan `ex-close-wordings` (ADR 01, `Unit.close-skill`): サイクル自身が書き換えた文言の重複であり、直しは 1 つの plan に収まる。
  - Fact: `.pi/skills/close/SKILL.md:3` の description の「after the owner's judgement asks the owner」は重複した表現だが、本文の順序 (提案 → 校正 → owner の判断 → Unit の確認) と一致している。
  - Why: 判断軸の第 1 分岐 (サイクルの関心ごと) に当たり、直しは 1 つの plan に収まる。
  - Then: `.pi/skills/close/SKILL.md:3` の description を、重複のない 1 文に書き換える。
- 3: dropped (ADR 02, `Unit.plan-skill`): `Triage` の番号の付け替えは手順の中の手作業であり、コードが回す振る舞いではない。
  - Fact: `(rerun)` のテストは `## Collected` の文脈の保持と番号の振り直しを確かめる。`## Triage` の番号を新しい `## Collected` に合わせるのはエージェントの手作業で、テストは触れていない。
  - Why: 手作業の手順はコードの振る舞いではないため、テストで確かめる対象にならない。記録は `## Work Review` が保持している。
  - Then: なし
- 4: ex-plan `ex-close-wordings` (ADR 01, `Unit.close-skill`): 「コードだけ」の理由だったゲートが消えており、判断軸が文書の穴に届かなくなる。
  - Fact: `.pi/skills/close/references/format.md:60` は「the fix is code」と言うが、Entry 01 はゲートを撤廃し、`.pi/skills/close/SKILL.md` の手順 5 はファイルの種類で `ex-` を限っていない。
  - Why: 判断軸の第 1 分岐と第 2 分岐が、このサイクルが扱った文書の穴に届かなくなる。直しは 1 つの plan に収まる。
  - Then: `.pi/skills/close/references/format.md:60` を「the cycle fixes it now, whatever files it changes: it is the cycle's own concern, or an obvious defect, and it fits one plan.」に書き換える。

## Verified
