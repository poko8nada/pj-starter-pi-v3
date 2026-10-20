# Close 022

## Collected

### adr-front (ADR 03 / Scope `Unit.adr-skill`)

1. 116 / Review Round 1 / `.pi/skills/adr/references/format.md:45` は新文面とずれて見えるが、`cycles/261018-022-feat-new-skill/plan/adr-front.md:32` が触らないと決め `cycles/261018-022-feat-new-skill/adr.md:114` もセクション名を変えないと決めたため指摘にしなかった。
   - Doing: entry 2・3・4 を前段から受ける形に直し、`references/format.md` は触らないと決めていた。
   - Left: ADR 03 がセクションの名前を変えないと決めたため、`format.md` の説明は前のままにした。
   - Cost: `format.md:45` の `Research & Trial` は「trials が走った」と書いたままで、試作を前段が持つ今の形と食い違う。次に ADR を書く者が、試作を ADR で走らせる。
2. 117 / Review Round 1 / `.pi/skills/adr/SKILL.md:40` の前段なし直接点は entry 2 error が押さえると読めるため Gap にしなかった。
   - Doing: entry 2 に「前段なしで来た点は、owner の言葉をそのまま書いて整理する」を入れた。
   - Left: その道で `Context` がどこまで埋まるかは、確かめていない。
   - Cost: 前段を通らない問いは、根拠が owner の言葉だけになる。前段の記録と比べて薄い `Context` が、決定の根拠を支えない。
3. 118 / Review Round 1 / `README.md:70` と `README.ja.md:70` の「どの段からでも書ける」は元から広いため指摘にしなかった。
   - Doing: README の `adr` の行から、調べることと試すことを外した。
   - Left: 同じセクションの「ADR はどの段からでも書ける」は、元から広い文なので残した。
   - Cost: 入口が 3 つに分かれた今、その一文だけを読むと ADR が何でも受けると読める。
4. 133 / Review Round 2 / `plan/adr-front.md:50` の「research と trial は入っていない」は、`.pi/skills/adr/SKILL.md:80` 単体には文言なく(`theirs` は直前的には design/plan/work を指す)。entry 4 の狭めと合わせ読めば趣旨は合うため、finding にせず Doubt とする。
   - Doing: 末尾の持ち分を「entry と決定」に狭めた。
   - Left: `theirs` が design / plan / work を指すことは書いていない。
   - Cost: `theirs` の指す先を取り違えると、entry 4 の狭めと合わせて読む必要があることに気づかない。

### brief-skill (ADR 01 / Scope `Unit.brief-skill`)

5. 154 / Review Round 1 / `README.md:60` と `README.ja.md:60` の `adr` 行が調査試作を残すことは `cycles/261018-022-feat-new-skill/plan/adr-front.md:56-60` が外す前提のため指摘にしなかった。
   - Doing: brief は skill と、README の数と 2 行を足すだけにした。
   - Left: `adr` の行を外すのは `adr-front` の担当にした。
   - Cost: なし（`21f63ac` で外れている）。
6. 155 / Review Round 1 / `cycles/261018-022-feat-new-skill/plan/propose-skill.md:63` の1行変更は本 plan の Files 外だが他 plan の文言揃えであり Unlisted にしなかった。
   - Doing: brief は自分の plan の範囲だけを書いた。
   - Left: 他の plan の文言揃えは、その plan の担当にした。
   - Cost: なし（記録の文言だけで、製品は変わらない）。
7. 161 / Acceptance / `tasks.md` の形が他のスキルの `references/tasks.md` と同じかどうかは、突き合わせていない。
   - Doing: brief の `references/tasks.md` を、plan と work のものと同じ形（前書き、セクションごとの囲み、その下の箇条）で書いた。
   - Left: 他のスキルの現物と 1 行ずつは突き合わせていない。
   - Cost: 形がずれていれば、サブエージェントに渡す文の書き方がスキルごとに揺れる。今は 3 つ（brief / propose / plan / work）が並んだだけで、揃っているかは誰も見ていない。

### propose-skill (ADR 02 / Scope `Unit.propose-skill`)

8. 136 / Review Round 1 / `.pi/skills/propose/SKILL.md:30` の「the tests and what runs」は Steps の「コードベースの探索」の詳述であり、`cycles/261018-022-feat-new-skill/plan/propose-skill.md:65` の手順最初の case で押さえられると読めるため指摘にしなかった。
   - Doing: 探索でコード、テスト、走っている物を読むと書いた。
   - Left: plan の Steps では「コードベースの探索」とだけ書いた。
   - Cost: なし（SKILL.md の方が詳しく、plan はそれを押さえている）。
9. 137 / Review Round 1 / `.pi/skills/propose/SKILL.md:8` の「one of the two fronts」の「two」は Steps にないが、`cycles/261018-022-feat-new-skill/adr.md:18` の前段 2 つと整合し、`cycles/261018-022-feat-new-skill/plan/propose-skill.md:59` の冒頭 case が前段性を押さえるため指摘にしなかった。
   - Doing: 冒頭で「ADR の 2 つの前段の一方」と書いた。
   - Left: 2 つが何かは本文で名指ししていない。
   - Cost: なし（ADR 022 の 01 が前段 2 つと書いている）。
10. 138 / Review Round 1 / `.pi/skills/propose/SKILL.md:48-50` の `4. Stop` は `cycles/261018-022-feat-new-skill/plan/propose-skill.md:44-46` の候補・owner 決定の繰り返しで新行為がなく、候補・収束点の case で押さえられると読めるため指摘にしなかった。
    - Doing: 手順の最後を `4. Stop` にして、owner がサイクルを起こし ADR が決めると書いた。
    - Left: 候補のセクション（3）と同じ規則をもう一度書いている。
    - Cost: 同じ規則が 2 か所にあると、片方だけ直されて食い違う。
11. 139 / Review Round 1 / `.pi/skills/propose/SKILL.md:68` の「and a plan writes」は Steps の「決めないこと」の補足で、`cycles/261018-022-feat-new-skill/plan/propose-skill.md:75` のそうしない case が `DEFINITION.md`・`cycles/`・決めないを押さえるため指摘にしなかった。
    - Doing: 「そうしない」のセクションで、`DEFINITION.md` と `cycles/` を書かないと書いた。
    - Left: 書くのが plan であることは補足でしか書いていない。
    - Cost: なし（決めるのが ADR であることは同じセクションに書いてある）。
12. 140 / Review Round 1 / `README.md:60-61` と `README.ja.md:60-61` の `adr` 行が調査・試作を残すことは `cycles/261018-022-feat-new-skill/plan/adr-front.md:56-60` が外す前提のため指摘にしなかった。
    - Doing: propose は skill と、README の数と 2 行を足すだけにした。
    - Left: `adr` の行を外すのは `adr-front` の担当にした。
    - Cost: なし（`21f63ac` で外れている）。

### ex-skill-text (ADR 03 / Scope `Unit.adr-skill`, ADR 01 / Scope `Unit.brief-skill`, ADR 02 / Scope `Unit.propose-skill`)

13. 87 / Review Round 1 / `.pi/skills/adr/references/format.md:28` と `.pi/skills/adr/scripts/scaffold.mjs:35` の試した事は事実の例示と読めるため Stale にしなかった。
    - Doing: `format.md:45` の `Research & Trial` の説明から試作を外した。
    - Left: `Shape` の例示（`format.md:28`）と、足場を作るスクリプト（`scaffold.mjs:35`）の「試した事」はセクションの説明ではないので触っていない。
    - Cost: 例示に「試した事」が残ると、次に ADR を書く者が `Research & Trial` に試作を書く。

14. 88 / Review Round 1 / `.pi/skills/brief/SKILL.md:72` の Stop の ADR 決定は `brief` と `propose` で技能が別で Files・Steps の対象外のため Stale にしなかった。
    - Doing: `propose` の Stop から重複を外した。
    - Left: `brief` の Stop は `brief` の持ち分で、`Files` の外なので触っていない。
    - Cost: `brief` の Stop が決定に触れるのは、前段が止まる所の説明として正しい。

15. 89 / Review Round 1 / `.pi/skills/brief/SKILL.md:36` のまとめた一文は `.pi/skills/brief/references/tasks.md:10-11` の要約として読めるため指摘にしなかった。
    - Doing: `brief` の型を、`tasks.md` で 1 行ずつに分けた。
    - Left: `SKILL.md:36` の 1 文は 3 つの型の要約なので、そのままにした。
    - Cost: まとめた 1 文と分けた 3 行が並ぶが、意味は同じ。

16. 90 / Review Round 1 / `.pi/skills/propose/SKILL.md:8,61,68` の ADR 決定の重なりは導入・収束点・補足で、`cycles/261018-022-feat-new-skill/plan/ex-skill-text.md:58` が収束点を含むため厳密な「だけ」の不一致としては指摘にしなかった。
    - Doing: `4. Stop` から決定の規則を外した。
    - Left: 導入（`:8`）・収束点（`:61`）・「そうしない」（`:68`）の 3 か所は役目が違うので残した。
    - Cost: 同じ語が 3 か所に出るが、置き場所の役目が違うので置換にはならない。

## Triage

- 1: ex-plan ex-skill-text (ADR 03 / `Unit.adr-skill`): `format.md:45` の `Research & Trial` から試作を外し、決定が乗る事実だけにした。done c1915c3
- 2: dropped (ADR 03 / `Unit.adr-skill`): 前段なしの道は entry 2 に書いてあり、`Context` が薄くなるのは前段を通さない選択の結果である。直すより、前段を通すのが筋。
- 3: dropped (ADR 03 / `Unit.adr-skill`): 「どの段からでも書ける」は今も正しく、3 つの入口はそれぞれの `description` が持っている。
- 4: dropped (ADR 03 / `Unit.adr-skill`): 読み方の注意で足りる。
- 5: dropped (ADR 01 / `Unit.brief-skill`): `adr-front` が `21f63ac` で外した。
- 6: dropped (ADR 01 / `Unit.brief-skill`): 記録の文言だけで、製品は変わらない。
- 7: ex-plan ex-skill-text (ADR 01 / `Unit.brief-skill`, ADR 02 / `Unit.propose-skill`): 4 つの `tasks.md` を突き合わせ、前書きと型の行を揃えた。done c1915c3
- 8: dropped (ADR 02 / `Unit.propose-skill`): SKILL.md の方が詳しく、plan の case が押さえている。
- 9: dropped (ADR 02 / `Unit.propose-skill`): ADR 022 の 01 が前段 2 つと書いている。
- 10: ex-plan ex-skill-text (ADR 02 / `Unit.propose-skill`): `4. Stop` が候補のセクションと同じ規則を繰り返していたので、片方に寄せた。done c1915c3
- 11: dropped (ADR 02 / `Unit.propose-skill`): 補足で足りている。
- 12: dropped (ADR 02 / `Unit.propose-skill`): `adr-front` が `21f63ac` で外した。
- 13: dropped (ADR 03 / `Unit.adr-skill`): `Shape` の例示と足場のスクリプトはセクションの説明ではなく、残しても食い違わない。
- 14: dropped (ADR 01 / `Unit.brief-skill`): `brief` の Stop は前段が止まる所の説明として正しく、`propose` の Stop とは役目が違う。
- 15: dropped (ADR 01 / `Unit.brief-skill`): 同じ意味なので、読む者を迷わせない。
- 16: dropped (ADR 02 / `Unit.propose-skill`): 3 か所の役目が違い、片方だけ直す所ではない。
