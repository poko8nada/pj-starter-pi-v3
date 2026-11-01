# Close 048

## Collected

### design-research-merge (ADR 02)

1. 63 / Slice 1 (リサーチを 1 人に) / Verify の `grep -in "limit\|打ち切り\|stopped"` が 0 件にならず 1 件残る。`## Walk the change` 内の外側の例示 `a service, a contract, an environment, data, a limit` の `a limit` がヒットする（変更前からある文言の継承）。 / left: 外で話すものの観点を残すためと `SKILL.md` の `the outside` 列挙との整合のため `a limit` を残した。削って件数を合わせると観点・整合を壊す。Verify の意図（限界・打ち切りを求める行・打ち切りの新規定が無いこと）は満たすが、文字通りの 0 件は満たさない。
2. 85 / Work Review Round 1 / `Verify` の `grep -in "limit\|打ち切り\|stopped"` が文字通り0件にならず、`.pi/skills/design/references/tasks.md:18` の例示 `a limit`（および `.pi/skills/design/SKILL.md:32` の同例示）が1件残るが、`## Notes` の `Slice 1: Findings` に継承文言として `left` 理由付きで記録済みのため所見としない。

### plan-always-five (ADR 03)

3. 86 / Work Review Round 1 / `### Steps`の2.は`Added`を「5本」と書くが`### Verify`の`Added`の検査は「6つの組（DB、front、auth、base plan's look、proofread、other）」と書く。数え方の差異かどうか確かめきれなかった
4. 87 / Work Review Round 1 / `### Verify`の`Always`の`grep -in`は（`five viewpoints`は除く）とあるが除外の手続き（`-v`等）が書かれていない。現状は対象2本に`the five viewpoints`の行がなく素直な`grep`で0件になるため実害はない
5. 104 / Acceptance / 設計の `Goal` と plan の検査の「`cycles/` に差分が無い」は、このサイクルの plan md の記録を含むため文字通りには満たない。閉じたサイクルの plan md が変わっていないことは `git diff --name-only 45e4b06..HEAD` で確かめた。

### users-can-do-groups (ADR 01)

6. 121 / Work Review Round 1 / `cycles/261101-048-dev/plan/users-can-do-groups.md:55` と `rules/definition.rules.md:28` は種類の語に `command` を使うが、同 plan `:77` と `cycles/261101-048-dev/design.md:77` の grep は `script` を使う。`DEFINITION.md:22-58` の見出し5つは英字を含まないため両方0件で閉じることに影響しない。
7. 122 / Work Review Round 1 / `cycles/261101-048-dev/plan/users-can-do-groups.md:53,75` の「ほかの行が無い」は空行を数えない読みで運用している。差分の `DEFINITION.md:22-58` は内容行が `####` 5行と `- ` 23行だけで、空行は従来どおりのため findings にしない。
8. 24, 25, 42, 44, 46, 57, 58 / DEFINITION.md (Users can do の行) / `Who` の項目名は英語の `owner` のままでよく、説明の中では `オーナー` とカタカナで書く、とオーナーが決めた。いまの `Users can do` の 7 行は、説明の中で `owner` と書いている。
9. .pi/skills/plan/references/format.md、.pi/skills/plan/SKILL.md、.pi/skills/plan/references/tasks.md、.pi/skills/work/SKILL.md / 検査の規則 / 「赤にしかならない検査」をどの規則も名指しておらず、このサイクルで 3 回書かれた。
10. .pi/skills/close/SKILL.md、.pi/skills/close/references/format.md / verify の対象 / `format.md:72` が「`Users can do` に列挙された Unit ごと」、`SKILL.md:90` が「`Definition` が名指す Unit」と書き、食い違っていた。前者に従うと絵の 23 全部が対象になり、23 の同じセクションを書くことになった。

## Triage

- 1: dropped (ADR 02, なし)
  - Fact: plan `design-research-merge` の `Verify` の `grep -in "limit\|打ち切り\|stopped"` は 0 件を求めますが、変更前からある例示 `a limit` が 1 件当たり、書かれたままでは緑になりません。実際に走った検査と結果は `## Acceptance` の `Ran` にあり、`## Notes` の `left` が理由を持っています。正しい検査（`git diff 77f71a7..45e4b06 -- .pi/skills/design/references/tasks.md` の追加行に `limit`・`打ち切り`・`stopped` が 0 件）を走らせ、緑でした。
  - Why: この検査はスライスを閉じる検査そのもので、あとから書き換えると、実際に走った検査と記録が食い違います。記録は、書いた検査が走らなかったことをそのまま持つほうが正しいです。
  - Then: なし
- 2: dropped (ADR 02, なし)
  - Fact: 1 と同じ事実が、同じ plan の `## Work Review` `### Round 1` の `Doubts` にも書かれ、「所見としない」と記録されています。1 の正しい検査で緑でした。
  - Why: 1 と同じ理由です。記録はすでに事実を持っており、あとから書き換えると実際と食い違います。
  - Then: なし
- 3: dropped (ADR 03, なし)
  - Fact: plan `plan-always-five` の `Steps` は `Added` を「5 本」と書き、`Verify` は「6 つの組（DB、front、auth、base plan's look、proofread、other）」と書いています。
  - Why: 数え方の違いによるもので、指す対象は同じです（`Always` の 5 本と `Added` の 6 組）。製品にも次のサイクルにも影響しません。
  - Then: なし
- 4: dropped (ADR 03, なし)
  - Fact: `Verify` の `grep -in` は「`five viewpoints` は除く」と書きますが、除外の手続きを書いていません。
  - Why: 対象の 2 ファイルに `the five viewpoints` の行がなく、素直な `grep` で 0 件になるため、いまは実害がありません。
  - Then: なし
- 5: dropped (ADR 03, なし)
  - Fact: 設計の `Goal` と plan の検査の「`cycles/` に差分が無い」は、このサイクルの plan md の記録を含むため、文字通りには満たせません。`## Acceptance` の `Doubts` がその事実を持っています。正しい検査（`git diff --name-only 45e4b06..72829ef -- cycles/` が、このサイクルの plan md 1 つだけ）で緑でした。
  - Why: 設計と plan は書いたときの文書であり、あとから書き換えると、`## Acceptance` の `Doubts` と食い違います。
  - Then: なし
- 6: dropped (ADR 01, なし)
  - Fact: plan `users-can-do-groups` と `rules/definition.rules.md:28` は種類の語に `command` を使い、設計と plan の `grep` は `script` を使っています。
  - Why: `DEFINITION.md` の 5 つの見出しは英字を含まないため、どちらの語でも 0 件になり、製品の記述は正しいままです。
  - Then: なし
- 7: dropped (ADR 01, なし)
  - Fact: plan `users-can-do-groups` の「ほかの行が無い」は、空行を数えない読みで運用しています。
  - Why: 差分の `DEFINITION.md` は内容行が `####` 5 行と `- ` 23 行だけで、空行は従来どおりです。
  - Then: なし

- 8: ex-plan `ex-owner-wording` (ADR 01, `Users can do` の行): done 6112cbd
  - Fact: `DEFINITION.md` の `Who` の項目は `- owner:` と英語のままでよく、説明の中では `オーナー` とカタカナで書く、とオーナーが決めました。`Users can do` の `:24`、`:25`、`:42`、`:44`、`:46`、`:57`、`:58` は、説明の中で `owner` と書いています（`:29` はすでに `オーナー` です）。
  - Why: 同じ役割が説明の中で 2 つの語になっているので、`Who` の項目名と、説明の語を分けて揃えます。
  - Then: `ex-owner-wording` で、その 7 行の `owner` を `オーナー` に直し、`Who` の `- owner:` と `:13` の項目名は変えません。
- 9: ex-plan `ex-check-scope` (ADR 03, `Unit.plan-skill` の route): done 58d17df
  - Fact: 検査の規則は「走らせられない `Verify` は穴」「書いたとおりに走らない」「振る舞いを消しても緑」の 3 つだけを名指しており、このサイクルで 3 回書かれた「赤にしかならない検査」を名指していませんでした。
  - Why: 書き手だけを直すと、レビューと受け入れが古い基準のままで食い違うので、書く側（`format.md`）、判定する側（`plan/SKILL.md`、`plan/references/tasks.md`）、走らせる側（`work/SKILL.md`）の 6 か所を 1 組でそろえます。
  - Then: `ex-check-scope` で 6 か所をそろえました。plan md の検査の文言は書き換えていません。なお、`ex-check-scope` は `work-skill` の route（`work/SKILL.md` の受け入れのセクション）も触りましたが、ADR の `Definition` は `work-skill` を名指していませんでした。verify の対象には `work-skill` を足しています。
- 10: ex-plan `ex-verified-target` (ADR 01, なし): done 97f3232
  - Fact: `close/references/format.md:72` は「`Users can do` に列挙された Unit ごとに 1 つのセクション」、`close/SKILL.md:90` は「`accepted` エントリの `Definition` が名指す Unit」と書き、食い違っていました。前者は絵の 23 全部を指すので、このサイクルで 23 のセクションを書くことになりました。
  - Why: 対象は「`Definition` が名指す Unit のうち、このサイクルが触ったもの」です。触っていない Unit は、ADR の `(kept)` が担保しています。
  - Then: `ex-verified-target` で、`SKILL.md:90`、`format.md:72`、`:85` の 3 か所を「this cycle touched」に揃えました。

## Verified

### adr-skill

- Plans:
  - `users-can-do-groups`
- Result: しない — 機能自体は変わっていない（オーナーの判断）

### design-skill

- Plans:
  - `users-can-do-groups`
  - `design-research-merge`
- Result: しない — 機能自体は変わっていない（オーナーの判断）

### plan-skill

- Plans:
  - `users-can-do-groups`
  - `plan-always-five`
- Result: しない — 機能自体は変わっていない（オーナーの判断）

### work-skill

- Plans: なし（`ex-check-scope` が受け入れのセクションを組み直した）
- Result: しない — 機能自体は変わっていない（オーナーの判断）

### close-skill

- Plans:
  - `users-can-do-groups`
- Result: しない — 機能自体は変わっていない（オーナーの判断）

### definition-file

- Plans:
  - `users-can-do-groups`
- Result: しない — 機能自体は変わっていない（オーナーの判断）

### definition-rules

- Plans:
  - `users-can-do-groups`
- Result: しない — 機能自体は変わっていない（オーナーの判断）
