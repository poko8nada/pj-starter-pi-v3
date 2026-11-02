# Close 045

## Collected

### adr-merge (ADR 03, 05)

1. 134 / Review Round 1 / `ROADMAP.md:18-21` の `002,003,004,005` の `todo→wip` は `Steps` に明示がない。ただし `Files` が `ROADMAP.md` を名指し、`Unlisted` の定義（`Files` が名指さない変更）に当てはまらず、`cycles/261029-045-dev/adr.md:7,81,153,292` が 4 件をすでに `wip` と記録し、新 `SKILL.md:39` が該当項目を `wip` にする手順のため、「plan か ADR が決めた値」に当たり finding にしない。
   - Doing: review が `ROADMAP.md` の状態変更と `Steps` の対応を確かめていたことです。
   - Left: `Files` の名指しと ADR の記録と新 `SKILL.md` の手順があるため finding にしないと判断したことです。
   - Cost: `Steps` に明示が無いままなので、後から読む人が状態変更の置き場所を探すことです。
2. 135 / Review Round 1 / `SKILL.md:121` の proofread 一文は英語（`edit only the named files, and only this entry's lines`）で、plan の日本語逐語（「名指したファイルだけを編集する」「現在のエントリの行だけ」）と文字一致しない。スキル本文が英語のため意味同等と判断し finding にしない。最終の文面判断は `base` のオーナー確認に委ねる。
   - Doing: review が proofread の一文と plan の日本語の対応を確かめていたことです。
   - Left: スキル本文が英語であり意味が同じため finding にしないと判断したことです。
   - Cost: 文字が一致しないままなので、後から読む人が訳の正しさを確かめることです。
3. 136 / Review Round 1 / `SKILL.md:48,55` は追記動作を書くが、現 `scaffold.mjs` は追記を持たない（`design.md:142,172-184` が `adr-scaffold` の担当と明記）。plan と ADR が決めた順序のため finding にしない。
   - Doing: review が `SKILL.md` の追記記述と現行スクリプトの差を確かめていたことです。
   - Left: plan と ADR が順序を決めているため finding にしないと判断したことです。
   - Cost: 文書が先に追記を書くため、実装まで一時的に不一致が残ることです。

### adr-scaffold (ADR 03)

4. 121 / Review Round 1 / `entrySkeleton(100)` は `## 100:`（`.pi/skills/adr/scripts/scaffold.mjs:17` の `padStart(2, '0')`）になるが、`lastEntryNumber` の正規表現（`.pi/skills/adr/scripts/scaffold.mjs:74` の `\d{2}`）は2桁だけを受け、3桁は「壊れた見出し」として投げる。100 entry は現実的でなく plan も2桁を前提にするため finding にしないが、close で前提として残すため。
   - Doing: review が 3 桁番号の扱いを確かめていたことです。
   - Left: 現実的でなく plan が 2 桁を前提にするため finding にしないと判断したことです。
   - Cost: 100 件を超えると壊れた見出しとして止まることです。
5. 122 / Review Round 1 / 開いた cycle の `adr.md` が壊れていると CLI は `lastEntryNumber` の throw で非0終了する（`.pi/skills/adr/scripts/scaffold.mjs:274-276`、write の前に投げるため file は無変更）。plan はこの経路を定めず、現状の「大きな音で止まる」は妥当なため finding にしないが、close で残すため。
   - Doing: review が壊れた `adr.md` に対する CLI の振る舞いを確かめていたことです。
   - Left: 書き込み前に止まり安全なため finding にしないと判断したことです。
   - Cost: 壊れた見出しの直し方が文書に無いことです。
6. 123 / Review Round 1 / `appendEntry('', n)` は `# ADR` 無しの entry を返す（`.pi/skills/adr/scripts/scaffold.mjs:93`）。CLI からは0バイトの `adr.md` でだけ起き、plan は空 file を定めないため finding にしないが、close で残すため。
   - Doing: review が空文字への追記結果を確かめていたことです。
   - Left: 0 バイトの場合だけに起きるため finding にしないと判断したことです。
   - Cost: 空の `adr.md` では見出しだけの記録ができることです。
7. 127 / Review Round 2 / Scope:
   - Doing: review が Round 2 の対象範囲を確かめていたことです。
   - Left: Round 1 の `fixed:` に限ると明記したため残したことです。
   - Cost: 対象外の差分は見ないため見落としが残ることです。
8. 128 / Review Round 2 / Round 1 の `fixed:` 3件のみを `git diff f15e1a1..HEAD` で確認した（他の diff は対象外）。
   - Doing: review が差分の対象を絞っていたことです。
   - Left: Round 1 の指摘だけを見る規則のため残したことです。
   - Cost: 他の差分の変化はここでは確かめないことです。
9. 129 / Review Round 2 / テスト実行は未実施 — `pnpm test:related` が環境 guard で禁止されたため、diff＋現行 file の exact read＋grep による静的確認のみで判断した。
   - Doing: review が実行環境の制限を記録していたことです。
   - Left: 静的確認で判断できる範囲だったため残したことです。
   - Cost: 実行時の振る舞いは acceptance に委ねることです。
10. 130 / Review Round 2 / Gaps（fixed 1件の再確認）:
    - Doing: review が Gaps の再確認の方針を示していたことです。
    - Left: 11 行目の解消記録に委ねるため残したことです。
    - Cost: 単独では判断材料にならないことです。
11. 131 / Review Round 2 / 解消 — `scaffold.test.ts:270-275`「dir はあるが `adr.md` がなければ → `null`」が diff にあり、`scaffold.mjs:252` の `existsSync(adr.md)` を直接 exercise しているため。`cycles` 自体が無い場合（`:265-268`）と分け、`close.md` 無し・NNN 正常の条件で `adr.md` の有無だけを変えているため、存在条件の取りこぼしは埋まった。`existsSync` を外せば当該 test は dir を返して落ちる構造のため、有効である。
    - Doing: review が `adr.md` の有無の検査を確かめていたことです。
    - Left: 条件分岐を直接動かす検査があるため残したことです。
    - Cost: 記録が長いため後から読む時間がかかることです。
12. 132 / Review Round 2 / Unproven（fixed 2件の再確認）:
    - Doing: review が Unproven の再確認の方針を示していたことです。
    - Left: 13 行目と 14 行目の解消記録に委ねるため残したことです。
    - Cost: 単独では判断材料にならないことです。
13. 133 / Review Round 2 / 解消（改行） — `scaffold.test.ts:230,240,250` の `toContain('\n\n## 0N: <問い>')` 3件が diff にあり、`scaffold.mjs:94-96` の `sep` を assert しているため。3件とも入力が単一 `\n` 終わり（`adrSkeleton(7)`、`appendEntry(...,2)`、`'# ADR 007\n'`）で `sep='\n'` が必須になり、`sep` を常に `''` にすれば落ちる構造のため。CLI 側の `:330` も同 assert で補強されているため。
    - Doing: review が追記の空行区切りの検査を確かめていたことです。
    - Left: 区切りを壊すと落ちる構造のため残したことです。
    - Cost: 記録が長いため後から読む時間がかかることです。
14. 134 / Review Round 2 / 解消（次番号） — `scaffold.test.ts:319-333`「`## 02:` を持つ開いたサイクルでは `## 03:` が増える」が diff にあり、`scaffold.mjs:275` の `(lastEntryNumber(current) ?? 0) + 1` を exercise しているため。`toContain('\n\n## 03:')`・`lastEntryNumber(after)` が3・`# ADR` 1件・dir 数不変を同時に assert し、`next` を `2` 固定にすれば `03` 不出現＋`lastEntryNumber` 2止まりで落ちる構造のため。既存の `01 → 02`（`:303-317`）と重複せず一段進めた点も妥当である。
    - Doing: review が CLI の次番号計算の検査を確かめていたことです。
    - Left: 番号を固定すると落ちる構造のため残したことです。
    - Cost: 記録が長いため後から読む時間がかかることです。

### base-commit (ADR 04)

15. 61 / Review Round 1 / ADR 04 の Context（cycles/261029-045-dev/adr.md:231）が旧文「same message」を引用するが、決定前の事実記録であり陳腐化ではない。plan の Steps（cycles/261029-045-dev/plan/base-commit.md:30）の「same message」も作業指示であり残存でよい。diff は .pi/skills/work/SKILL.md:46,62,75 の 3 行のみで、consult( は SKILL.md:75（worktree の acceptance）のみに残り、tasks.md:10,64 は不変、base( の 3 メッセージは ADR 04 Adopted（adr.md:274-275）と一致する。doc 変更のため Test cases はなく、追加テストもない。
    - Doing: review が旧文の引用と現行差分の対応を確かめていたことです。
    - Left: 決定前の記録と作業指示であり直す対象でないため残したことです。
    - Cost: 旧文が残るため後から読む人が履歴をたどることです。

### goal-format (ADR 02, 05)

16. 156 / Review Round 1 / `.pi/skills/close/SKILL.md:64` — `git status` で未コミットの proofread 定型更新あり。Files 外・コミット外のため finding とせず。別途処置 (取込または破棄) が必要。
    - Doing: review が作業範囲外の変更の有無を確かめていたことです。
    - Left: 本 plan の変更でないため finding にしないと判断したことです。
    - Cost: 別 plan の変更が混ざると履歴が読みにくいことです。
17. 157 / Review Round 1 / `.pi/skills/plan/SKILL.md:63-64` と `.pi/skills/plan/references/format.md:155-161` — SKILL の Added 要約に proofread の明記なし。SKILL の `or another check` が proofread を含む解釈で矛盾なしと判断し finding とせず。気になるなら close 時に文言統一を検討。
    - Doing: review が `Added` の要約と詳細の対応を確かめていたことです。
    - Left: 含む解釈で矛盾が無いため finding にしないと判断したことです。
    - Cost: 要約だけを読むと proofread が見えないことです。
18. 158 / Review Round 1 / `.pi/skills/design/SKILL.md:80` — proofread の対象表記が短形 (`design.md`) で plan/close の長形 (`cycles/...`) と異なる。指示ファイルの特定は可能と判断し finding とせず。
    - Doing: review が proofread の対象表記の差を確かめていたことです。
    - Left: 特定ができるため finding にしないと判断したことです。
    - Cost: 表記が揃わないため後から読む人が迷うことです。

### sound-notify-settings (ADR 01)

19. 156 / Slice 3 (readme) / Verify の `config.json` の grep は移行の 1 行に触れる。Steps が既存の `config.json` の手動移行を書くよう求めるため残し、「コミットしない」と `not committed` は消した。
    - Doing: 作業が README の移行文と検査の対応を確かめていたことです。
    - Left: 手動移行の説明に必要な 1 行のため残したことです。
    - Cost: `config.json` の語が残るため検索に当たることです。
20. 186 / Review Round 2 / Scope: Round 1 の `fixed:` 2 件に対応する差分だけを見た（`git diff 8139c5f..HEAD` のうち既定 export の `dir` 引数、`index.test.ts` の助っ人と `sound-notify.default-export` 3 件、`read.test.ts` の happy の非既定化）。それ以外の差分は再審査していない。
    - Doing: review が Round 2 の対象範囲を確かめていたことです。
    - Left: `fixed:` に限ると明記したため残したことです。
    - Cost: 対象外の差分は見ないため見落としが残ることです。
21. 190 / Review Round 2 / Round 1 Gaps の fixed は解消 — `index.ts:170` が `export default function (pi: EntryPiPort, dir: string = EXTENSION_DIR)` で既定を `EXTENSION_DIR` にし、pi の呼び方（引数 1 個）は不変のため起動時の動きは変わらない。`index.test.ts:91-119` の助っ人 `entryWithFile` が一時実ファイルで既定 export を走らせ、`171-207` の 3 件が結線を確かめる。非既定（`186-190`：`commit: 'Basso'` を書いてその音を期待）は読まずに既定を返せば `Pop` になって赤になる。破損時（`192-197`：`'{"enabled":'` を書いて既定の `commit` 音と `calls` 空を期待）は読み込み時の余計な通知があれば `calls` に残るため黙った継続が赤で分かる。登録後の書換え（`199-207`：`Basso` で登録後に `Funk` へ書き換えて旧音を期待）は毎回読む実装なら `Funk` になって赤になるため 1 回読みが分かる。
    - Doing: review が既定 export の結線検査を確かめていたことです。
    - Left: 壊すと赤になる構造のため残したことです。
    - Cost: 記録が長いため後から読む時間がかかることです。
22. 192 / Review Round 2 / Round 1 Unproven の fixed は解消 — `read.test.ts:9-18` の happy が `enabled: false` と `commit: 'Basso'` の非既定値を書いて `toEqual({ kind: 'ok', settings })` で比べる。読まずに既定を返す実装では `enabled: true`・`commit: 'Pop'` とずれて赤になるため、読みを証明できる。
    - Doing: review が読み取り検査の非既定化を確かめていたことです。
    - Left: 壊すと赤になる構造のため残したことです。
    - Cost: 記録が長いため後から読む時間がかかることです。

## Triage

- 1: dropped (ADR 03, `Unit.adr-skill`): 記録と手順があるため直す物がありません。
- 2: dropped (ADR 03, `Unit.adr-skill`): 意味が同じため直す物がありません。
- 3: dropped (ADR 03, `Unit.adr-skill`): 順序は決定済みのため直す物がありません。
- 4: dropped (ADR 03, `Unit.adr-skill`): 2 桁前提のため直す物がありません。
- 5: dropped (ADR 03, `Unit.adr-skill`): 書き込み前に止まるため直す物がありません。
- 6: dropped (ADR 03, `Unit.adr-skill`): 0 バイトの場合だけのため直す物がありません。
- 7: dropped (ADR 03, `Unit.adr-skill`): 対象範囲の記録のため直す物がありません。
- 8: dropped (ADR 03, `Unit.adr-skill`): 対象を絞った記録のため直す物がありません。
- 9: dropped (ADR 03, `Unit.adr-skill`): 実行制限の記録のため直す物がありません。
- 10: dropped (ADR 03, `Unit.adr-skill`): 方針の記録のため直す物がありません。
- 11: dropped (ADR 03, `Unit.adr-skill`): 検査が残るため直す物がありません。
- 12: dropped (ADR 03, `Unit.adr-skill`): 方針の記録のため直す物がありません。
- 13: dropped (ADR 03, `Unit.adr-skill`): 検査が残るため直す物がありません。
- 14: dropped (ADR 03, `Unit.adr-skill`): 検査が残るため直す物がありません。
- 15: dropped (ADR 04, `Unit.work-skill`): 決定前の記録のため直す物がありません。
- 16: dropped (ADR 05, `Unit.close-skill`): 別 plan で対応済みのため直す物がありません。
- 17: dropped (ADR 05, `Unit.plan-skill`): 含む解釈で矛盾が無いため直す物がありません。
- 18: dropped (ADR 05, `Unit.design-skill`): 長形に直したため残る物がありません。
- 19: dropped (ADR 01, `sound-notify`): 移行に必要な 1 行のため残します。
- 20: dropped (ADR 01, `sound-notify`): 対象範囲の記録のため直す物がありません。
- 21: dropped (ADR 01, `sound-notify`): 検査が残るため直す物がありません。
- 22: dropped (ADR 01, `sound-notify`): 検査が残るため直す物がありません。

## Verified

### Unit.sound-notify

- Plans:
  - `sound-notify-settings`
- Result: しない — オーナーが確認しないと判断したため

### Unit.usage-readme

- Plans:
  - `sound-notify-settings`
  - `adr-merge`
  - `adr-scaffold`
- Result: しない — オーナーが確認しないと判断したため

### Unit.harness-copy

- Plans:
  - `sound-notify-settings`
  - `adr-merge`
  - `adr-scaffold`
- Result: しない — オーナーが確認しないと判断したため

### Unit.design-skill

- Plans:
  - `adr-merge`
  - `goal-format`
  - `close-proofread`
- Result: しない — オーナーが確認しないと判断したため

### Unit.plan-skill

- Plans:
  - `adr-merge`
  - `goal-format`
  - `close-proofread`
- Result: しない — オーナーが確認しないと判断したため

### Unit.yolo-skill

- Plans:
  - `goal-format`
- Result: しない — オーナーが確認しないと判断したため

### Unit.brief-skill

- Plans:
  - `adr-merge`
  - `adr-scaffold`
- Result: しない — オーナーが確認しないと判断したため

### Unit.adr-skill

- Plans:
  - `adr-merge`
  - `adr-scaffold`
  - `goal-format`
  - `close-proofread`
- Result: しない — オーナーが確認しないと判断したため

### Unit.agent-rules

- Plans:
  - `adr-merge`
  - `adr-scaffold`
- Result: しない — オーナーが確認しないと判断したため

### Unit.work-skill

- Plans:
  - `base-commit`
- Result: しない — オーナーが確認しないと判断したため

### Unit.close-skill

- Plans:
  - `adr-merge`
  - `goal-format`
  - `close-proofread`
- Result: しない — オーナーが確認しないと判断したため
