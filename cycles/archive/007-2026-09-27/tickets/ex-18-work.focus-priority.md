# work.focus-priority

Acceptance:

- 穴の仕分け（フォーカスの中 / 外）と優先度（high / low）が、スキルに**決められる基準として**書かれている。実装のあと、`Verify` とは別に「古くなった物」を `review` の子が調べ、その結果を同じ基準で仕分ける

## Todo

- `.pi/skills/work/SKILL.md`
  - step 8 を「diff をチケットと unit に当てて読む」から**影響を読む**に広げる: この変更が矛盾させる文書・コメント、古い振る舞いを主張したままのテスト、変わったのに覆われていない振る舞いを全部見る
  - step 8 のあとに段を 1 つ足す（影響の検査）: `consult` の `review` 子にチケットとこの step のコミット範囲を渡し、「この変更で古くなった物」を `file:line` で挙げさせる
  - step 9 に仕分けの基準を書く
    - **フォーカスの中**（次のどれかに当たる）: チケットの `Todo` か計画の `Files` が名指したファイル / `Acceptance` かユニットの `Then` の振る舞い / この変更が矛盾させる文書・コメント・テスト。**外**はどれにも当たらない物
    - 中はその場で直して `Unplanned`。外は `Findings`
    - **優先度**（放置したときの損で決める）: `high` = 次に読む物が間違った前提になる / 誰かの作業が壊れる / 戻せない危険 / owner に届く失敗。`low` = 損が後片付け・文言・網羅性で止まる
    - `Findings` の各行は「なぜ外か」1 行と `priority: high|low` とその理由 1 行を持つ
- `.pi/skills/tickets/references/format.md` — `### Findings` の形（外の理由、`priority`、その理由）を書く
- `.pi/skills/plan/SKILL.md` と `.pi/skills/plan/references/format.md` — 計画を立てるときに、関連する文書・コメント・テストと依存を調べ、`Files` と `What` に含める段を足す
- `.pi/skills/close/SKILL.md` と `.pi/skills/definition/references/format.md` — `Carry over` は全行を載せ（落とさない）、`high` / `low` でグルーピングして出す

## Verify

### read

- `review` の子に `.pi/skills/work/SKILL.md` を渡し、次の事例を仕分けさせる（基準の文言だけで決まるかを見る）
  - 例 1: チケットの `Todo` が触ったファイルの中で、そのファイルのコメントが古くなった → 中（その場で直す）
  - 例 2: 別のスキルの文書が、この変更で矛盾するようになった → 中（3 番目の基準）
  - 例 3: 関係の薄い機能のテストが薄いと気づいた → 外、`priority` を理由つきで
- `review` の子に `.pi/skills/plan/SKILL.md` と `.pi/skills/close/SKILL.md` を渡し、計画時の依存の調べ方と、`Carry over` の載せ方（全部載せて high / low でグルーピング）を報告させる

## Notes

### Findings

- `definition/references/format.md`: `Carry over` の規則（解決した行は載せない、穴でないと判断した行は載せない、コピーは短縮しない）は前からここの書いてあったのに、私は読んでおらず、「規則が無い」と言った
  - なぜ外か: この step が触ったファイルでも、`Acceptance` の振る舞いでもない（私の読み方の話）
  - priority: low — 損は次の `Retro` の組み立てで止まる。今日の `Carry over` を規則に照らして作り直せば、この行は踏まえたことになる

### Unplanned

- 子供に渡さず親が実装した（理由: 軸の設計が今日の会話から来ている。work の手順 2 の外れとして記録する）

Commit: 9f75ced（ex-18 の作業コミット。`read` 2 体（事例 3 つの仕分け・計画と close の読み）通過）
