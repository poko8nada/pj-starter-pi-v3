# Close 042

## Collected

### proofreader-role (ADR 02)

1. 116 / Slice 2 (文面と検査) / マージ直後のベースでの `proofreader` 実行を確かめていません。 / left: マージ後にベースで 1 回行う検査のため、ワークツリーの段階では行えません。受け入れまたはマージ直後に行う必要があります。
   - Doing: Slice 2 の `Verify` の `Added` に、マージの直後にベースで `proofreader` を 1 回走らせる検査を置きました。
   - Left: ワークツリーの段階では、ベースの `types.json` に `proofreader` がまだ無いため、走らせられません。
   - Cost: 校正の効き目を、次の文書で初めて見ることになります。
2. 137 / Review Round 1 / マージ直後のベースでの `proofreader` 実行は未了で、受け入れまたはマージ直後に行います（`Notes` の `Slice 2` の `left` どおり）。これを除けば、差分で計画を閉じられます。
   - Doing: レビューは、5 つの観点で所見が無いことを確かめ、残る未了を `Doubts` に書きました。
   - Left: 1 と同じ理由です。レビューの時点では、マージがまだでした。
   - Cost: 1 と同じく、校正の効き目を、次の文書で初めて見ることになります。所見の無い差分が、そのままマージされました。
3. 142 / Acceptance / `Added` の 1 つ（マージの直後にベースで、`cycles/261026-041-dev/adr.md` の写しに `proofreader` を当てて差分を読む）は、ワークツリーの段階では走らせられません。 / left: マージの直後にベースで 1 回行います。
   - Doing: 受け入れは、既定の 5 つと、`types.json` の読みを済ませ、残る 1 つを `Findings` に `left` として残しました。
   - Left: マージの前に、ベースで `proofreader` を走らせられません。
   - Cost: 受け入れの記録に、閉じていない検査が 1 つ残りました。
4. `cycles/261026-042-dev/plan/proofreader-role.md:142` / マージ後の検査の結果 / 校正により決定の文が弱まった箇所が 3 か所と、用語のずれが 1 か所です。
   - Doing: マージの直後に、`cycles/261026-041-dev/adr.md` の写し（252 行）を `proofreader` に当て、元の `md` との差分を読みました。
   - Left: 直した所は約 70 か所で、`Status`、セクション名、数値は変わりませんでした。一方で、entry 04 の `Adopted` の「穴として止め」が「穴として残し」に、「書き分けます」が「修正します」に、「空振りのリサーチが常態になります」が「空振りが増えることです」に変わりました。また、4 種類を「作法」と呼ぶ文書の中で、例の 1 行だけ「使い方」になりました。役割の文面はオーナーが確定しているため、変えないと決めています。
   - Cost: 校正のたびに、決定の文が少しずつ弱まる危険が残ります。メインの確認と整理で受け止めます。

## Triage

- 1: dropped (ADR 02, `Unit.subagent-consult`): マージの直後に `proofreader` を 1 回実行して、すでに閉じました。
- 2: dropped (ADR 02, `Unit.subagent-consult`): 1 と同じく、マージの直後に `proofreader` を 1 回実行して、すでに閉じました。
- 3: dropped (ADR 02, `Unit.subagent-consult`): 1 と同じく、マージの直後に `proofreader` を 1 回実行して、すでに閉じました。
- 4: dropped (ADR 02, `Unit.subagent-consult`): 役割の文面はオーナーが確定しているため、直す物ではありません。決定の文の弱まりは、メインの確認と整理で受け止めます。

## Verified

### adr-skill

- Plans:
  - `cycle-proofread-step`
- Result: しない — このサイクルの `adr.md` は、校正のステップが入る前に書いた。

### design-skill

- Plans:
  - `cycle-proofread-step`
- Result: しない — このサイクルの `design.md` も、校正のステップが入る前に書いた。

### plan-skill

- Plans:
  - `cycle-proofread-step`
- Result: しない — このサイクルのプランの md も、校正のステップが入る前に書いた。

### close-skill

- Plans:
  - `cycle-proofread-step`
- Result: OK — この `close.md` で、校正のステップを実際に歩いた。`proofreader` が書き換え、メインが差分を読んで意図を確かめた。

### yolo-skill

- Plans:
  - `cycle-proofread-step`
- Result: しない — このサイクルは `yolo` で歩いていない。

### subagent-consult

- Plans:
  - `proofreader-role`
- Result: OK — `proofreader` を 2 回走らせ（`cycles/261026-041-dev/adr.md` の写しと `close.md`）、md が書き換わることを確かめた。
