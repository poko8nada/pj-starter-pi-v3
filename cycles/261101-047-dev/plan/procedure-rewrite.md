# PLAN `procedure-rewrite`

- No: 01, 02

## Files

```text
.oxfmtrc.json
.oxlintrc.json
lefthook.yaml
package.json
.pi/
  tsconfig.json
  skills/
    close/
      SKILL.md                    update
      references/
        format.md                 update
      scripts/
        collect.mjs               update
        collect.test.ts           update
        collect.fixture.ts        update
    plan/
      SKILL.md                    update
      references/
        format.md                 update
        tasks.md
    work/
      SKILL.md                    update
      references/
        tasks.md                  update
    yolo/
      SKILL.md                    update
scripts/
  checks/
    scopes.json
    typecheck.mjs
    typecheck-staged.mjs
  harness/
    harness.json
```

## Slices

## 1.手順文書とセクション名の書き換え

### Types

```ts
export type PlanDocOptions = {
  readonly name: string;
  readonly no?: string | null;
  readonly notes: string;
  readonly review?: readonly string[];
};
```

### Steps

1. `.pi/skills/close/SKILL.md`:
   - ADR 047 の Entry 01 の `Adopted` に従って `## Procedure` を「コレクト → 解決済みの除外 → トリアージ提案 → close.md の完成 → 校正 → owner の判断 → `ex-` の実行とマージ → verify」の順に組み替え、コレクトのステージから `Doing` / `Left` / `Cost` を書く指示を消して目録だけにし、解決済みの項目はエージェントが文面から判断して除外し、collect.mjs の再実行のたびに再フィルタすると書き、トリアージのステージに「現サイクルの関心ごと → `ex-`、明らかなバグや脆弱性や古い実装 → `ex-`、大きい、または調査が要る → `proposed`、それ以外 → `drop`」の軸をこの順に書き、close.md の完成時点で `## Verified` が空であることが正常だと書き、verify で動かない Unit があれば `ex-` plan を作ってマージ後にその Unit を verify し直すと書き、`## How not to do this` をこの手順に合わせ、plan md の `## Review` を指す箇所を `## Work Review` に直す。
2. `.pi/skills/close/references/format.md`:
   - `## Collected` から `Doing` / `Left` / `Cost` を消して `<line> / <place> / <穴>` の目録だけにし、`## Triage` の各バレットの配下に `Fact` / `Why` / `Then` を足し、`## Verified` は close.md の完成時点で空であり、対象は `Users can do` の Unit に限り、`Product` / `What` / `Who` / `Stack` は除くと書き、`## Closing` の順序を close.md の完成 → 校正 → owner の判断 → `ex-` → verify に直し、例示の `Review Round 1` を `Work Review Round 1` に直す。
3. `.pi/skills/yolo/SKILL.md`:
   - `### close` を、close.md の完成までを担い校正までを済ませ、トリアージへの owner の判断の前で止まる形に書き直し、`drop` の停止規則を消し、スキップの一覧と `## When it stops early` をこの形に合わせる。
4. `.pi/skills/plan/SKILL.md`:
   - `## Procedure` の 9 から 12 を、1 ファイルを書き終えるたびにレビューに出し、レビュー中に次を書き、全 plan の完成後に重複検出を行い、全レビューの終了後に全ファイルを並列で校正する形に組み替え、記録のセクションの `## Review` を `## Work Review` に直す。
5. `.pi/skills/plan/references/format.md`:
   - 2 つの `## Review` の見出しと `### Round 1` / `### Round 2` の記述を `## Work Review` に直し、`## Shape` の該当行も同じ名前にする。
6. `.pi/skills/work/SKILL.md`:
   - `## File` と `### 6. Review` にある `## Review` を `## Work Review` に直す。
7. `.pi/skills/work/references/tasks.md`:
   - plan md の `## Review` を指す 2 箇所を `## Work Review` に直す。
8. `.pi/skills/close/scripts/collect.mjs`:
   - `collectPlan` の `section.name === 'Review'` を `'Work Review'` に、`Review Round ${named[1]}` を `Work Review Round ${named[1]}` に、関数のコメントの `## Review` を `## Work Review` に直す。
9. `.pi/skills/close/scripts/collect.fixture.ts`:
   - `PlanDocOptions` に `readonly review?: readonly string[]` を足し、`planDoc` が `review` を渡されたときに `## Work Review` と `### Round 1` と各指摘のバレットを書き出すようにする。
10. `.pi/skills/close/scripts/collect.test.ts`:
    - `(happy) planDoc に review で指摘を 1 つ渡す → ## Collected にその指摘が残り物として出る`
    - `(empty) planDoc に review で なし を渡す → ## Collected が なし になる`

### Verify

- Always:
  - 既定の 5 つ
- Added:
  - a proofread — the plan md と `.pi/skills/plan/references/format.md` を、`.pi/skills/plan/SKILL.md` の校正の文で回す
  - a proofread — the plan md と `.pi/skills/close/references/format.md` を、`.pi/skills/close/SKILL.md` の校正の文で回す
  - other — `.pi/skills/close/SKILL.md` を `grep -n` して「現サイクルの関心ごと」「明らかなバグ」「`proposed`」「`drop`」がこの順に並び、「解決済み」「`Fact:`」「`Why:`」「`Then:`」「`## Verified`」が 1 件以上あることを確かめ、`.pi/skills/close/references/format.md` に `Doing` / `Left` / `Cost` が 0 件で `Fact:` / `Why:` / `Then:` が 1 件以上あることを確かめる。

## Notes

### Slice 1: 手順文書とセクション名の書き換え

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
