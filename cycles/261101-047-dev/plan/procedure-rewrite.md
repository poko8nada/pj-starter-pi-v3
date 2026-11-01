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
  - other — `.pi/skills/close/SKILL.md` を `grep -n` して「cycle's own concern」「obvious bug」「`proposed`」「`dropped`」がこの順に並び、「resolved」「`Fact:`」「`Why:`」「`Then:`」「`## Verified`」が 1 件以上あることを確かめ、`.pi/skills/close/references/format.md` に `Doing` / `Left` / `Cost` が 0 件で `Fact:` / `Why:` / `Then:` が 1 件以上あることを確かめる。

## Notes

### Slice 1: 手順文書とセクション名の書き換え

- Findings: なし
- Unplanned: なし
- Commit: e4edb5c
- Stopped:

### Cleanup: collect.test.ts

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - `.pi/skills/close/SKILL.md:3` — frontmatter の description が「triages it with the owner」のままで、手順の書き換え（agent が提案→校正→owner 判断、本文:10 更新済み）と矛盾するため stale。
    - fixed: description を「proposes their triage in close.md, and after the owner's judgement asks the owner」に書き換えた。
- Unlisted: なし — `e1a8515..HEAD` の変更 10 件は Files の update 印と一致し、無印の関連ファイルに変更なし。
- Gaps:
  - `.pi/skills/close/SKILL.md:46` — 再実行のたびの再フィルタと `## Triage` 番号の振り直し（手順 3〜5 の rerun、手順:85・:94）を回す Added がなく、tests は writeClose 単発のみで checks が exercised しない。
    - fixed: `collect.test.ts` に `(rerun)` を足し、番号行の下に文脈を置いて plan を増やした後の再実行で文脈が残り連番になることを確かめるようにした。
  - `.pi/skills/close/SKILL.md:90`・`.pi/skills/close/references/format.md:70` — Units は `Users can do` に限り `Product`/`What`/`Who`/`Stack` を除く件を確かめる grep も test も Added になく、checks が exercised しない。
    - left: 文言範囲の限定であり実行可能な振る舞いがなく test では担保できない。両ファイルの精読は Added の校正 2 件が担うため、grep の追加は plan Verify の改訂として残す。
  - `.pi/skills/close/scripts/collect.test.ts:53` — happy が collectPlan 直呼びのみで、review 指摘が writeClose 経由で ADR 見出し付き番号行として `## Collected` に出る統合 path を checks が exercised しない（既存 writeClose test は review なし plan のみ）。
    - fixed: happy を collectPlan の主張に加えて writeClose 経由でも `### <plan> (ADR <NN>)` の見出しと `Work Review Round 1` の指摘が `## Collected` に出ることを確かめるようにした。
- Unproven: なし — happy は collect.mjs の `Work Review` 復帰破壊で赤になること、empty は `なし` フィルタ破壊で赤になることを確認。
- Noise: なし — 2 件とも仕様トークン（`Work Review Round 1`・`なし`）の主張で、型や DB が保証する前提の再掲や magic number／hardcoded string の持ち込みなし。
- Doubts:
  - 未コミットの plan md 差分（`## Notes`・`### Cleanup` 記入）は `### Cleanup` の note 通りの想定内で close 対象外。
  - `drop`（SKILL 手順:54・yolo:49）と `dropped`（format Shape・本文）の表記ゆれは改修前からの既存で今回作った stale ではないため finding にしない。
  - 旧 `## Review` を残す過去 plan md を新 collect.mjs（:189・:195）が無視して落とす backward compat は、閉じた cycle のみのため影響軽微とみて finding にしない。

### Round 2

- Stale:
  - なし — fixed 1件を確認。`.pi/skills/close/SKILL.md:3` が「proposes their triage in close.md, and after the owner's judgement asks the owner」に変わり、旧文言「triages it with the owner」は grep で0件。本文:10 と同じ順序（提案→校正→owner判断→Unit毎の確認）で矛盾なし。
- Unlisted: なし — fixed 指定なしのため対象外。
- Gaps:
  - なし — fixed 2件を確認。`(rerun)`（`collect.test.ts:92`）は番号行下に文脈を置き plan 追加後の再実行で文脈残存と `1.`/`2.` 連番と `second hole` を主張し、手順:46 の再実行保存に対応。happy（`collect.test.ts:53`）は collectPlan 主張に加え writeClose 経由で `### alpha (ADR 02)` 見出しと `Work Review Round 1` 指摘の `## Collected` 出現を主張し、統合 path に対応。
- Unproven: なし — fixed 3件はいずれも既存の赤確認済み仕様の拡張であり、新規の証明不要なし。
- Noise: なし — 追加主張は `kept context`・`second hole`・`Work Review Round 1`・`ADR 02` の仕様トークンで、前提の再掲や magic number なし。
- Doubts:
  - description の「after the owner's judgement asks the owner」は冗長だが意味は本文と一致し finding にしない。
  - `(rerun)` は `## Collected` の文脈保存と振り直しのみで `## Triage` 番号の手動付け替え（手順:85・:94）は対象外だが、fixed 文面の約束通りであり finding にしない。

## Acceptance

- Ran: `pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm test:run` (58 files / 796 tests)、`pnpm test:related .pi/skills/close/scripts/collect.mjs` (7 tests)、`Added` の `other` (`grep -n` で `.pi/skills/close/SKILL.md` の軸 4 語が順に並び、`解決済み` / `Fact:` / `Why:` / `Then:` / `## Verified` が 1 件以上、`.pi/skills/close/references/format.md` に `Doing` / `Left` / `Cost` が 0 件で `Fact:` / `Why:` / `Then:` が 1 件以上)、振る舞いを壊す確かめ (`collect.mjs` の `'Work Review'` を `'Review'` に戻すと `(happy)` が赤、戻すと 7 件緑)、`Added` の校正 2 件 (plan と close)
- Findings:
  - `.pi/skills/close/SKILL.md:44` — 「a 解決済みの leftover」と日本語が英語の本文に混ざっている (ほかの skill 文書は英語で書かれている)。
  - `.pi/skills/close/SKILL.md:51` から `:54` — 判断軸の 4 行が日本語のままである。
  - `.pi/skills/close/SKILL.md:58` — 「`Then:` for an `ex-` what policy the plan follows, for a `proposed` what to discuss next, for a `drop` なし」が英語として読めない。
  - `.pi/skills/close/SKILL.md:54`、`.pi/skills/close/references/format.md:58`、`.pi/skills/yolo/SKILL.md:49` — 行き先の語が `drop` と `dropped` で揺れ、worker が close.md にどちらを書くか分からない (形は format.md の `- <N>: dropped`)。
  - `.pi/skills/close/references/format.md:62` — 「`dropped` — rare, and the fix weighs more.」が新しい軸 (それ以外 → `dropped`) と矛盾したまま残っている。
  - `.pi/skills/yolo/SKILL.md:50` — 「`## Verified` is left out (empty at completion, and that is normal)」が「省く」と「空で残る」の両方を言っていて矛盾している。
- Doubts: なし
