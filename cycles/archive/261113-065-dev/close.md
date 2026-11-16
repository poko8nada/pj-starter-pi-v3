# Close 065

## Collected

### 01 adr-scope-and-details (ADR 01, 03)

1. 178 / Work Review Round 1 / `.pi/skills/adr/references/adr.format.md:115-117` — `In:` が `answers yes` を、`Out:` が `answers no` を受ける形になったため、`:117` の When a kind is `Out`, carry its reason. は `:116` の `（理由）` と同じことを言う行として残る（ただし重複自体は変更前からあり、この差分が作ったものではないので記録のみ）。 / left: `When a kind is Out, carry its reason.` は Slice 1 の Policy が「以降の3本は変えない」と決めており、この修正では触れられない。重複は変更前からある。
2. 188 / Work Review Round 1 / `.pi/skills/adr/references/adr.format.md:111` の `all 14 kinds` は表から導出できる数。表の kind を増減したときにこの行だけ古くなる。plan が文言を決めた行なので finding にはしない。
3. 204 / Work Review Round 2 / 本 plan の Slice 1 step 3 のフェンスを「031 の in/out の意味に合わせた」に広げている。Round 1 の Gaps は「plan が決めた範囲との衝突はオーナーの判断が要る」としていたので、この拡張にオーナーの承認があったかどうかは、修正の記録からは分からない。
4. 205 / Work Review Round 2 / `:149` と `:150` はどちらも `#### Details` に何を置くかに触れる。`:149` はセクションの役割、`:150` は書く要素の列挙で役割が違うと読んだが、重なりが残ると読む余地がある。

### 02 adr-entry-order (ADR 02)

5. 114 / Work Review Round 1 / `.pi/skills/adr/SKILL.md:61` — `When only the order is rejected, keep the split and write the order again.` は、どこへ書くのか（エントリは Step 5 で初めて書かれる）と、Step 3 の「理由つきで示す」をやり直すのかを示さない。計画の `Steps` がこの文面を指定しているため差分は正しいが、`show the order again with its reason` とすべきかはオーナーの判断。
6. 126 / Work Review Round 2 / `.pi/skills/adr/SKILL.md:81` — この Note の変更は Round 1 の指摘への修正として入ったが、ADR の `#### Details` と計画の `Steps` は Step 3 と Note 2 本しか名指さず、既存 Note の書き換えは記録されていない。読む者が計画 md とスキル本文を突き合わせると、`Steps` にない変更に見える。記録は Work Review の `fixed:` 行だけにある。

### 04 close-commit-and-fixed (ADR 05, 06)

7. 205 / Work Review Round 1 / wip で close した後に作業ツリーへ残る `ROADMAP.md` を、どのコミットが持つのかがどのスキルにも書かれていない。`### 9. Proposed` は「次サイクルのファイルはコミットしない」、adr の `### 2. Roadmap` と work の Step 1 も `ROADMAP.md` を名指さない（過去には `1dc4af8 update: roadmap` のように手作業でコミットしている）。wip のまま close したサイクルの `cycles` 追記が未コミットで残る運用でよいかは、オーナーの判断が要る。
8. 222 / Work Review Round 2 / `.pi/skills/close/references/format.md:47` の `## Shape` は `- Fixed: <変更内容を簡潔に説明> (<commit>)` のままで `なし` を示さない。Fields（`:149`）が `なし` を明記しているため誤読はしないが、`Result` / `Change` が Shape に選択肢を並べているのとは形が揃っていない。規則の矛盾ではないので finding にはしない。

## Triage

- 1: _ex-change_ (ADR 01, `Unit.adr-skill`): done cff348f
  - Fact: `:116` の `（理由）` と `:117` の `When a kind is Out, carry its reason.` が同じことを言う。
  - Why: `Scope` を読む者は同じ規則を2度読む。小さな文書の変更で、いま直せる。
  - Then: `When a kind is Out, carry its reason.` の行を消す。
- 5: _ex-change_ (ADR 02, `Unit.adr-skill`): done aca587f
  - Fact: `When only the order is rejected, keep the split and write the order again.` は、どこへ書くかと、理由つきで示し直すかを言わない。
  - Why: オーナーが順番だけを却下したときの動きが一意でない。小さな文書の変更で、いま直せる。
  - Then: `... write the order again with its reason.` に直す。
- 8: _ex-change_ (ADR 06, `Unit.close-skill`): done 4910b63
  - Fact: `## Shape` の `Fixed` の行が `なし` を示さない。`### Fields` は `なし` を明記している。
  - Why: `Result` と `Change` は Shape に選択肢を並べるが、`Fixed` の行だけ並ばない。体裁の不揃いであり、小さな文書の変更で直せる。
  - Then: `- Fixed: <変更内容を簡潔に説明> (<commit>) / なし` にする。
- 2: _ex-change_ (ADR 01, `Unit.adr-skill`): done 211aac8
  - Fact: `all 14 kinds` は表から導出できる数で、kind を増減すると古くなる。
  - Why: 数は表が決めるので、規則の文面で数を持つ必要がない。`every kind` にすれば、表だけが数を持つ。
  - Then: `all 14 kinds` を `every kind` に変える。
- 4: _ex-change_ (ADR 01, `Unit.adr-skill`): done aa6cb29
  - Fact: `:149` と `:150` はどちらも `#### Details` に何を置くかに触れ、重なって読める。
  - Why: `## Decision` の箇条書きは欄ごとに1本で欄の名前から始まる。`:149` に寄せれば、その形が崩れない。
  - Then: `:149` を「`#### Details` holds the concrete code and documents the discussion settled: the specific name, the logic, the method, the schema and the structure. One bullet is the title of one fence, and the fence follows it. A fence carries one item. A whole text or a whole logic is written when it is the decision. The plan concretizes what is not decided.」にし、`:150` を消す。
- 7: dropped (ADR 05, `Unit.close-skill`)
  - Fact: wip のまま close した後、作業ツリーに残る `ROADMAP.md` をどのコミットが持つかが、どのスキルにも書かれていない。
  - Why: `ROADMAP.md` はオーナーが更新管理しているため、この状況は起きない。
  - Then: なし
- 3: dropped (ADR 01, `Unit.adr-skill`)
  - Fact: 031 の in/out の意味を `In:`/`Out:` に足したことへの承認は、ADR に記録がない。
  - Why: 031 の ideas を C1 が数えており、C6 が ROADMAP を直さないと決めている。拡張は決定の範囲である。
  - Then: なし
- 6: dropped (ADR 02, `Unit.adr-skill`)
  - Fact: Note の書き換えは Work Review の `fixed:` にだけ記録され、plan の `Steps` にはない。
  - Why: 変更は `Files` が名指すファイルにあり、Work Review が記録している。plan の `Steps` は作業前の指示である。
  - Then: なし

## Verified

### adr-skill

- Plans:
  - `adr-scope-and-details`
  - `adr-entry-order`
- Result: OK
- Change: OK
- Fixed: なし

### plan-skill

- Plans:
  - `plan-opinion`
- Result: OK
- Change: OK
- Fixed: なし

### close-skill

- Plans:
  - `close-commit-and-fixed`
- Result: OK
- Change: OK
- Fixed: なし
