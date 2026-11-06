# ADR 056

## 01: proofreader は ja-check をどう実行し、warn と error をゼロ件にする義務をどう定めるか

### Context

- C1: `proofreader` ロールは `tools` に `bash` を持たず、`bash` の許可は空配列である（`.pi/extensions/consult/types.json:50-53`）。
- C2: `bash` の許可が空配列のとき、サブエージェントのガードはすべてのコマンドを許可する（`.pi/extensions/consult/sub/guard.ts:210-216`、`.pi/extensions/consult/policy/types.test.ts:48-52`）。
- C3: ガードによる許可の判定は、実行するコマンドの文字列が許可の接頭辞と一致するかどうかだけを見る（`.pi/extensions/consult/sub/guard.ts:209-216`）。
- C4: `ja-check` は、引数に渡したファイルごとに `error` と `warn` の語を検出して件数を出力し、`error` が 1 件以上なら終了コード 1 で終了する（`scripts/checks/ja-check.mjs:165-210`）。
- C5: `ja-check` は、引用符で囲まれた部分に語だけがある場合は報告しないため、引用文の校正は機械検査では求められない（`scripts/checks/ja-check.mjs:140-157`）。
- C6: proofreader のロール文はすでに、引用文であっても不自然なら報告しつつ校正することを認めている（`.pi/extensions/consult/types.json:56`）。
- C7: proofreader の書き込み先は `**/*.md` に限られ、proofreader は `scripts/checks/ja-check.json` を編集できない（`.pi/extensions/consult/types.json:52`、`.pi/extensions/consult/sub/guard.ts:194-207`）。
- C8: オーナーは、proofreader に ja-check の利用を義務づけて warn と error をともにゼロ件にすることを決め、proofreader は exception を編集できないため本文の書き換えでゼロ件を達成する。
- C9: オーナーは、許可の仕組みを変更しないこと、`&&` で続くコマンドを考慮しないことを決めた。
- C10: オーナーは、ja-check が指摘を出さずに終了コード 1 で終了した場合は、検査を実行できなかったことを報告に残すことを決めた。
- C11: オーナーは、proofreader と同じ設定が必要な箇所が他にあるかを、リポジトリ内で調べることを決めた。
- C12: オーナーは、ゼロ件にする義務を proofreader だけに課し、review と code には課さないことを決めた。
- C13: オーナーは、このエントリで決める対象を proofreader による ja-check の利用に限り、`close.md` と work の記録欄の言語、yolo の plan の proofread の省略を扱わないことを決めた。
- C14: オーナーは、proofread の対象外に残った error を pre-commit が止め、そのときにメインエージェントが直すことを決めた。
- C15: オーナーは、proofreader のロール文を、C16 の文面のとおりに書くことを決めた。
- C16: `proofreader.role` は以下のとおり。

```text
あなたは日本語の校正者です。対象について日本語として自然に読めるよう、積極的に校正してください。文書の形が `format.md` で定められている場合は、それを読んで形を保ちます。

校正は、ja-check と下の観点を組み合わせて行います。ja-check は日本語として不自然な単語を機械検査し報告します。bashで`node scripts/checks/ja-check.mjs <対象ファイル>`として使います。

1. 対象の文書に ja-check を実行します。
2. 指摘を直します。`scripts/checks/ja-check.json` の `exception` と `exclude` は編集できません。
3. 指摘に当たらない箇所を、次の観点で校正します。
   - 主語の欠落
   - 係り受けの破綻
   - 指示語の参照先の不明
   - 語彙の不統一
   - 冗長・曖昧・重複
   - 接続詞・副詞・形容動詞・補助動詞などの漢字は”ひらく”
4. ja-check を再度実行し、warn と error が共にゼロになったことを確かめます。

ja-check が指摘を出さずに終了コード 1 で終わった場合は、検査が実行できなかったことを報告してください。

内容の妥当性はあなたの管轄外ですが、文脈が足りない場合のみ補うことは許可します。引用文も校正の対象です。ja-check は引用符の中に語だけがある場合を報告しませんが、不自然であれば報告しつつ校正してください。

書き直しはファイルを編集して行います。`quick_edit`、`target_edit`、`write` を使ってください。

報告は、次の形で返します。
- fixed: `<file>:<line>` — 何を直したか
- kept: `<file>:<line>` — 観点に当たるが、意味を変えずに直せなかった箇所

終わらなければ、どこまでやったかと止まった理由を報告してから終了してください
```

- C17: オーナーは、README のロールの書き方を他のロールの慣例に合わせ、ロールごとの注記を置かないことを決めた。

### Scope

- 変更:
  - behaviour: in — proofreader は対象文書を校正する前に ja-check を実行し、warn と error がともにゼロ件になるまで直す。引用文も校正の対象にする。
  - prose: in — `types.json` の `proofreader.role` に ja-check の義務、ゼロ件の条件、引用文の扱い、実行できなかった場合の報告を書き、`.pi/extensions/consult/README.md` の proofreader の行の Tools に `bash` を加える。
  - dependency: in — proofreader に `bash` を加え、proofreader の許可を `node scripts/checks/ja-check.mjs` で始まるコマンドだけに限定する。
  - naming: out — ロール名 `proofreader` と報告の語（`fixed:`、`kept:`）は変えない（理由: スキルの3箇所と利用者の読み方がこの名前に依存する。深さ: out）。
  - format: out — 報告の形は変えない（理由: 形の見直しは 022 スキル文体の見直しの範囲である。深さ: out for now）。
  - refactor: out — `guard.ts` などのコードと `guard.test.ts:184-193` の写しは変えない（理由: 許可は接頭辞の一致で判定でき、`types.json` の値だけで足りる。テストは書き込みの許可だけを検査し、`bash` の値に依存しない。深さ: out for this cycle）。
  - compatibility: out — 過去のサイクルの記録は校正し直さない（理由: 記録はサイクルごとのもので、読み手はそのサイクルの関係者に限られる。深さ: out）。
- 品質:
  - errors: in — proofreader は、ja-check が指摘を出さずに終了コード 1 で終了した場合は、検査を実行できなかったことを報告に残す。
  - security: in — proofreader が実行できるコマンドを ja-check の起動だけに限定し、許可の仕組みは変えず、`&&` は考慮しない。
  - speed: out — 校正の所要時間は目標にしない（再検討条件: `turns: 60` で ja-check と校正が終わらない例が続いたら、上限を別の項目で扱う。深さ: out for now）。
- 運用:
  - deploy: out — 今回の変更は配布物ではない（深さ: out）。
  - migration: out — 既存の記録を新しい義務に合わせて校正し直さない（深さ: out）。
  - logs and monitoring: out — 監視は設けない（理由: 結果はサブエージェントの報告と `git diff` に残る。深さ: out）。

### Research & Trial

- F1 (C1): `review` ロールは `cycles/*/plan/*.md` を書き、plan md の内容は日本語であり、`**/affected.md` だけが除外されるため、ja-check の対象になる（`.pi/extensions/consult/types.json:35-38`、`.pi/skills/plan/references/format.md:5`、`scripts/checks/ja-check.json:71`）。
- F2 (C1): `research` ロールが書くのは `cycles/*/affected.md` だけで、`**/affected.md` は ja-check の除外に含まれる（`.pi/extensions/consult/types.json:23`、`scripts/checks/ja-check.json:71`）。
- F3 (C1): `code` ロールがワークツリー内で plan md の `## Notes` と `## Work Review` に書いた応答は、work の最後に base へマージされる（`.pi/skills/work/SKILL.md:40-41`、`.pi/skills/work/SKILL.md:95`、`.pi/skills/work/references/tasks.md:7-13`）。
- F4 (C1): `trial` ロールの書き込みはワークツリー内に限られ、base のステージ対象ではない（`.pi/skills/adr/SKILL.md:108`、`.pi/skills/adr/references/tasks.md:61`、`.pi/extensions/consult/README.md:82-88`）。
- F5 (C4): ja-check を呼ぶ既存の箇所は lefthook の pre-commit だけであり、`node scripts/checks/ja-check.mjs {staged_files}` を実行し、pre-push にはなく、quality-gate は ja-check を呼ばない（`lefthook.yaml:24-27`、`lefthook.yaml:29-37`、`.pi/extensions/quality-gate/checks.ts:31-56`、`.pi/extensions/quality-gate/README.md:17-22`）。
- F6 (C4): ja-check は warn だけなら終了コード 0 で終了し、error が 1 件以上なら 1 で終了する（`scripts/checks/ja-check.mjs:12-14`、`scripts/checks/ja-check.mjs:209-210`）。
- F7 (C8): メインエージェントが書く `adr.md`、plan md、`close.md` も ja-check の対象になり得る（`.pi/skills/adr/SKILL.md:161`、`.pi/skills/plan/SKILL.md:84`、`.pi/skills/close/SKILL.md:112`、`scripts/checks/ja-check.json:71`）。
- F8 (C11): `close.md` と work の記録欄（`## Notes`、`## Work Review`）の内容が日本語であることを明示する文が `close/references/format.md` と `plan/references/format.md` に見つからなかったため、それらの欄を ja-check の「日本語の文書」に含めるかは本文の根拠だけでは決められない。
- F9 (C11): `consult_commit` はリポジトリの hook を実行すると書かれている（`.pi/extensions/consult/README.md:113-116`）が、ワークツリーのステージ対象に lefthook の ja-check が掛かるかは、`.pi/extensions/quality-gate/checks.ts:31-56`、`.pi/extensions/quality-gate/targets.ts:1-36`、`lefthook.yaml:1-27` を読んだ範囲では確定できなかった。
- F10 (C11): yolo は plan の proofread をスキップすると定めている（`.pi/skills/yolo/SKILL.md:27`）。

### Decision

- Status: **accepted**
- Adopted:
  - A: `types.json` の `proofreader` に `bash` と ja-check の接頭辞だけを加え、ロール文を C16 の文面にし、README の Tools に `bash` を加える（C1, C2, C17）
    - Add:
      - `proofreader.tools` の末尾に `bash`（C9, C12）
    - Update:
      - `proofreader.bash` を `["node scripts/checks/ja-check.mjs"]` にする（C3, C13）
      - `proofreader.role` を C16 の文面にする（C4, C5, C6, C7, C8, C10, C15, C16）
      - `.pi/extensions/consult/README.md` の proofreader の行の Tools を `read, ls, find, grep, edit, quick_edit, target_edit, write, bash` にする（C11, F1, F2, F3, F4, F7, F8, F9, F10）
    - Drop:
      - なし（C14）
    - Keep:
      - 他の4つのロール、`paths`、`models`、`limits`、`isolated`、`guard.ts`、`guard.test.ts`、`lefthook.yaml`、`quality-gate` を変えない（C9, C12, C13, C14）
      - proofread の対象外に残った error を pre-commit が止める運用を変えない（C14, F5, F6）
    - Cost:
      - README にロールごとの注記を置く形より低く、README の変更が 1 箇所で済む（C17, F5）
- Options:
  - B: README の `paths` と `bash` の段落に注記を足す - C17 の慣例に反するため。
  - C: Tools の括弧に注記を足す - C17 の慣例に反するため。

### Definition

- `Unit.japanese-check`(kept): エージェントが日本語の語の指摘を受け取れるという主な機能は変わらず、変わるのは proofreader がその指摘を受け取り、warn と error をゼロ件にする経路である。
- `Unit.subagent-consult`(kept): エージェントがサブエージェントを走らせ、そのワークツリーと結果を扱えるという主な機能は変わらず、変わるのは proofreader の道具と `bash` の許可である。

## 02: スキル側の proofread は何を残し、何をロールに返すか

### Context

- C1: adr の proofread では、`proofreader` に `adr.md` を渡し、`adr.format.md` を読ませ、形を保つ目的をタスク側に書くと定めている（`.pi/skills/adr/SKILL.md:161`）。
- C2: plan の proofread では、plan md ごとに `proofreader` を走らせ、`plan/references/format.md` を読ませると定めている（`.pi/skills/plan/SKILL.md:84`）。
- C3: close の proofread では、`close.md` を渡し、`close/references/format.md` を読ませると定めている（`.pi/skills/close/SKILL.md:112`）。
- C4: yolo は plan の proofread をスキップし、close の proofread を走らせる（`.pi/skills/yolo/SKILL.md:27`、`.pi/skills/yolo/SKILL.md:43`、`.pi/skills/yolo/SKILL.md:45`）。
- C5: エントリ 01 の決定により、`proofreader` のロール文は、文書の形が `format.md` で定められている場合に、それを読んで形を保つことを含んでいる（`cycles/261106-056-dev/adr.md:25`）。
- C6: 3つの `SKILL.md` の戻す規則は、意味が変わった場合に `format.md` の形に戻すと定めている（`.pi/skills/adr/SKILL.md:164`、`.pi/skills/plan/SKILL.md:87`、`.pi/skills/close/SKILL.md:115`）。
- C7: `proofreader` のロール文は、引用文であっても報告しつつ校正することを認めている（`.pi/extensions/consult/types.json:56`）。
- C8: `close/references/format.md:92` は、校正について `the proofread` とだけ書いている。
- C9: `plan/references/format.md:184` は、校正について `the Japanese document` と書いている。
- C10: オーナーは、エントリ 02 で、タスク側の重複を削り、日本語の校正であることを明記することを決めた。
- C11: オーナーは、`close/references/format.md:92` を対象に含めることを決めた。
- C12: オーナーは、`plan/references/format.md:184` を対象に含めないことを決めた。
- C13: adr の proofread のセクションでは、実行の時期と並行実行を定めている（`.pi/skills/adr/SKILL.md:152`、`.pi/skills/adr/SKILL.md:170`）。
- C14: proofread に言及するだけの文が、adr、close、yolo の各 SKILL.md にある（`.pi/skills/adr/SKILL.md:12`、`.pi/skills/adr/SKILL.md:148`、`.pi/skills/close/SKILL.md:75`、`.pi/skills/yolo/SKILL.md:45`）。
- C15: `ROADMAP.md:68` は、スキル内の proofread を棚卸しし、日本語の校正であることを明記することを求める。
- C16: オーナーは、見出し3つ（`.pi/skills/adr/SKILL.md:161`、`.pi/skills/plan/SKILL.md:82`、`.pi/skills/close/SKILL.md:108`）、手順3つ（`.pi/skills/adr/SKILL.md:163`、`.pi/skills/plan/SKILL.md:84`、`.pi/skills/close/SKILL.md:112`）、`.pi/skills/adr/SKILL.md:153` の案内、`.pi/skills/yolo/SKILL.md:27`、`.pi/skills/yolo/SKILL.md:43`、`.pi/skills/close/references/format.md:92`、戻す規則3つ（`.pi/skills/adr/SKILL.md:165-169`、`.pi/skills/plan/SKILL.md:86-89`、`.pi/skills/close/SKILL.md:113-117`）を変えることを決めた。
- C17: オーナーは、同じファイルの見出しがセクションを指すことと、変えると英語として通らなくなるため、`.pi/skills/adr/SKILL.md:12`、`.pi/skills/adr/SKILL.md:148`、`.pi/skills/adr/SKILL.md:152`、`.pi/skills/adr/SKILL.md:170`、`.pi/skills/close/SKILL.md:75`、`.pi/skills/yolo/SKILL.md:45`、`.pi/skills/adr/SKILL.md:150` を変えないことを決めた。

### Scope

- 変更:
  - prose: in — 見出し（`.pi/skills/adr/SKILL.md:161`、`.pi/skills/plan/SKILL.md:82`、`.pi/skills/close/SKILL.md:108`）を `Japanese Proofread` にし、手順（`.pi/skills/adr/SKILL.md:163`、`.pi/skills/plan/SKILL.md:84`、`.pi/skills/close/SKILL.md:112`）を `the Japanese proofread of <対象ファイル>` にして `for the shape` を削り、`.pi/skills/adr/SKILL.md:153` の案内を `the Japanese proofread is in `## Japanese Proofread`` にし、`.pi/skills/yolo/SKILL.md:27`、`.pi/skills/yolo/SKILL.md:43`、`.pi/skills/close/references/format.md:92` を `the Japanese proofread` にする。
  - behaviour: in — 戻す規則（`.pi/skills/adr/SKILL.md:165-169`、`.pi/skills/plan/SKILL.md:86-89`、`.pi/skills/close/SKILL.md:113-117`）に、引用文の校正を意味の変更として戻さない例外を足す。
  - refactor: out — スキルのスクリプト（`scripts/`）は変えない（理由: 対象は手順の文だけである。深さ: out）。
  - naming: in — 見出しの名前を `Japanese Proofread` にする。
  - format: out — 手順の順序は変えない（理由: エントリの問いは文面の重複と引用文の扱いだけである。深さ: out）。
  - dependency: out — 依存は増えない（深さ: out）。
  - compatibility: out — 過去のサイクルの記録は校正し直さない（深さ: out）。
- 品質:
  - errors: out — 失敗の扱いは、エントリ 01 のロール文にある（深さ: out）。
  - speed: out — 速さは目標にしない（深さ: out）。
  - security: out — 秘密情報を扱わない（深さ: out）。
- 運用:
  - deploy: out — 配布物ではない（深さ: out）。
  - migration: out — 既存の記録を移行しない（深さ: out）。
  - logs and monitoring: out — 監視は設けない（深さ: out）。

### Research & Trial

- F1 (C1): 3つの手順文は同じ形であり、`run one proofreader subagent with <対象ファイル>; have it read <各スキルの references/format.md> for the shape; the role's policy applies; edit only <対象>` である（`.pi/skills/adr/SKILL.md:163`、`.pi/skills/plan/SKILL.md:84`、`.pi/skills/close/SKILL.md:112`）。
- F2 (C6): 戻す規則は3箇所にあり、意味が変わった場合に `format.md` の形に戻すと定めている（`.pi/skills/adr/SKILL.md:165-170`、`.pi/skills/plan/SKILL.md:86-89`、`.pi/skills/close/SKILL.md:113-117`）。
- F3 (C13): adr の proofread のセクションでは、確認の後に校正と affected の調査を走らせ、次の entry のセクションを並行させ、次の entry は報告の後に `adr.md` に書くと定めている（`.pi/skills/adr/SKILL.md:152`、`.pi/skills/adr/SKILL.md:170`）。
- F4 (C4): yolo は plan の proofread をスキップし（`.pi/skills/yolo/SKILL.md:27`）、close の proofread を走らせる（`.pi/skills/yolo/SKILL.md:43`）。
- F5 (C14): proofread に言及するだけの文は、adr の 12、148 行と、close の 75 行と、yolo の 45 行にある。
- F6 (C8): `close/references/format.md:92` は `the proofread` とだけ書いていて、`Japanese` の語を持たない。
- F7 (C9): `plan/references/format.md:184` は `the Japanese document` と書いている。
- F8 (C5): 3つの手順文の `the role's policy applies` は、`.pi/extensions/consult/types.json:56` のロール文を指す。
- F9 (C15): `ROADMAP.md:68` は、スキル内の proofread を棚卸しし、日本語の校正であることを明記することを求める。
- F10 (C1): `.pi` と `scripts/` を `proofread` で検索した結果、含むのは上の箇所だけで、`work` と `upgrade` には無い。

### Decision

- Status: **accepted**
- Adopted:
  - B: 戻す規則の直後に例外を独立した1文として置く（C6, C7, C17）
    - Add:
      - なし（C16）
    - Update:
      - 見出し3つ（`.pi/skills/adr/SKILL.md:161`、`.pi/skills/plan/SKILL.md:82`、`.pi/skills/close/SKILL.md:108`）を `Japanese Proofread` にする（C16, F9）
      - 手順3つ（`.pi/skills/adr/SKILL.md:163`、`.pi/skills/plan/SKILL.md:84`、`.pi/skills/close/SKILL.md:112`）を「`the Japanese proofread of <対象ファイル>`」にし、`for the shape` を削り、`format.md` のパスは残す（C1, C2, C3, C5, C10, C15, F1, F8, F9）
      - `.pi/skills/adr/SKILL.md:153` の案内を `the Japanese proofread is in `## Japanese Proofread`` にする（C13, C16, F3）
      - `.pi/skills/yolo/SKILL.md:27` と `.pi/skills/yolo/SKILL.md:43` を `the Japanese proofread` にする（C4, C16, F4）
      - `.pi/skills/close/references/format.md:92` を `the Japanese proofread` にする（C8, C11, C16, F6）
      - 戻す規則3つ（`.pi/skills/adr/SKILL.md:165-169`、`.pi/skills/plan/SKILL.md:86-89`、`.pi/skills/close/SKILL.md:113-117`）の直後に、`- the wording of a quoted passage is not a change of meaning: keep that correction` を足す（C6, C7, C16, F2）
    - Drop:
      - なし（C16）
    - Keep:
      - `.pi/skills/adr/SKILL.md:12`、`.pi/skills/adr/SKILL.md:148`、`.pi/skills/adr/SKILL.md:152`、`.pi/skills/adr/SKILL.md:170`、`.pi/skills/close/SKILL.md:75`、`.pi/skills/yolo/SKILL.md:45`、`.pi/skills/adr/SKILL.md:150` を変えない（C13, C14, C17, F3, F5）
      - `.pi/skills/plan/references/format.md:184` を変えない（C9, C12, F7）
      - `work` と `upgrade` を変えない（F10）
      - `types.json` のロール文を変えない（C5, F8）
    - Cost:
      - 条件の中に括弧で例外を書く形より高いが、規則と例外が分かれて読みやすい（C6, C17, F2）
- Options:
  - A: 条件の中に括弧で例外を書く - 長い条件がさらに長くなり、読み飛ばされやすいため。
  - C: 例外を proofreader の校正に限る - メインエージェントが引用文の校正を戻す余地が残るため。

### Definition

- `Unit.adr-skill`(kept): オーナーが決めてエージェントが記録できるという主な機能は変わらない。変わるのは、校正の呼び名と、戻す規則の引用文の扱いである。
- `Unit.plan-skill`(kept): エージェントが作業の形と順序を決めて書けるという主な機能は変わらない。変わるのは、校正の呼び名と、戻す規則の引用文の扱いである。
- `Unit.close-skill`(kept): エージェントがサイクル終了後にクロージングできるという主な機能は変わらない。変わるのは、校正の呼び名と、戻す規則の引用文の扱いである。
- `Unit.yolo-skill`(kept): エージェントがオーナーの確認を挟まずにクローズのトリアージまで進めることができるという主な機能は変わらない。変わるのは、plan の省略と close の校正の呼び名である。
