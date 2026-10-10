# Close 015

## Integration

なし

## Collected

### path-and-archive (ADR 01-1 / Scope adr-skill, design-skill, plan-skill, work-skill, close-skill, readme, consult)

1. Review Round 3 / `.pi/skills/definition/SKILL.md:3` の `cycles/<NNN>/definition.md` と `:16` の `cycles/<NNN-YYYY-MM-DD>/definition.md` が旧形のまま新 rule と矛盾する（grep で確認）。この plan の `## Files` は definition を含まず、scaffold-script plan の Steps/Verify が名指すのは手順1の呼び出しと `format.md` の path 行だけなので、この2行はどちらの plan も名指さない / left: `scaffold-script` plan が吸収する（同じ SKILL.md を既に触っているため。`consult-10` が作業中）。この plan の guard（definition untouched）は保つ

### scaffold-script (ADR 01-1 / Scope definition-skill)

2. Slice 2 (CLI と手順) / `exists:` の事前 mkdir 再現が衝突に落ちない: 期待 dir `016` を事前に作ると max が `016` になり次は `017` を作るため、葉の EEXIST に当たらない。並行 2 実行も直列化され `016`/`017` ができ `exists:` は出ない / left: max+1 の算出では事前作成が次番号を押し上げるため、単純な事前 mkdir では再現できない。同時通過の競合を決定的に起こす手順が無い
3. Review Round 3 / CLI の EEXIST → `exists:` + exit 1 写像を起こす check が無い。`scaffold.mjs:250-258`（親 recursive＋葉 `createLeafDir`、catch EEXIST で `exists:`）に対し、slice 2 Verify の事前 mkdir 手順は Notes Slice 2 Findings の `left:` 通り max+1 が `016` → `017` に逃げて葉に当たらない。単体 `createLeafDir` EEXIST（`scaffold.test.ts:104-114`）は葉の throw だけを見て CLI の catch 写像を見ない / left: CLI 通しの再現は不可。葉の EEXIST は単体テスト済みで catch は読みで正しい

## Triage

owner 確認済み。

- 1: dropped (definition `definition-skill`): SKILL.md の :3 と :16 を scaffold 側で直した（`1593ca7`）。`left:` はそこで閉じた
- 2, 3: dropped (definition `definition-skill` の `.scaffold`): 決定的な通し再現ハーネスの重さが残余リスクを上回る。葉の EEXIST は単体テスト済み、catch は読みで正しい
