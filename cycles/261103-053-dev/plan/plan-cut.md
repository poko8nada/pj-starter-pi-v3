# PLAN `plan-cut`

- No: 04, 05
- Place: base
- Boundary Plans: `design-removal` (01) は、同じ `work` と `close` の design の参照を先に消し、`work` が plan md の `Place` と `Boundary Plans` を、`close` が adr のエントリーと plan md の `No` と `Boundary Plans` を読む形にする。`adr-affected` (02) は、`affected.md` を先に書き、この plan の `Files` と `Verify` の出所になる。

## Files

```text
.pi/skills/plan/
  SKILL.md                update
  references/
    format.md             update
    tasks.md              update
    cut.md                add
```

## Slices

## 1. plan の手順を ADR と affected から組み直す

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/SKILL.md`:
   - update: 手順を8つに組み直す。1. ADR の採択エントリーを読む。2. `affected.md` を読む。3. カットし、`ADR`、`Place`、`Summary`、`Why`、`Order` で提示して合意する。4. plan md を `affected.md` から書く。5. 書けない行だけ `research` する。6. レビューする。7. 校正する。8. オーナーに見せる。
   - update: 手順3に、`affected.md` の path を `Files` の材料にし、`Role change` を `Steps` の要求にし、`Adjustment` の採否を決め、`Check` を `Verify` にし、`Generate` を成果物にすること、`Boundary Plans` を書くことを入れる。
   - update: 手順4に、`Files` は `affected.md` の `Code` の path と方向から作り、関係を歩き直さないことを入れる。
   - update: 手順4に、plan の `Files` に `add` も `drop` もない場合、更新する内容を既存にどう組み入れ、全体をどう再設計するかを `Steps` と `Why` に書くことを入れる。
   - update: 手順4の `Verify` の `Always` に、変更した全ファイルを通読し、今回の変更によるファイル内の矛盾、循環した流れ、重複、不足、不自然な流れがないかを確かめ、ダメなら直して `Unplanned` に書くことを入れる。
   - update: 手順6のレビューを、plan md の全ファイルの通読と、既存への組み入れと全体の再設計の観点を含む形に直す。
   - update: design への参照をすべて消す。
2. `.pi/skills/plan/references/cut.md`:
   - add: カットの規則を持つ。切る対象、同じ入力を読む作業を1つの plan にまとめること、分ける前の4問、`worktree` と `base` の既定と条件、yolo の扱い、提示の `ADR`、`Place`、`Summary`、`Why`、`Order`、`Why` にどの `Role change` と `Adjustment` をどの plan が受けるか。
3. `.pi/skills/plan/references/format.md`:
   - update: 形に `Place` と `Boundary Plans` を足し、`No` を ADR のエントリー番号にし、design の欄への参照を消す。
   - update: `## Slices` に、`Files` に `add` も `drop` もない plan は、更新を既存にどう組み入れ、全体をどう再設計するかを `Steps` と `Why` に書くことを入れる。
   - update: `## Verify` の `Always` に、変更した全ファイルの通読と、矛盾、循環、重複、不足、不自然な流れの確認と、直した場合の `Unplanned` を入れる。
4. `.pi/skills/plan/references/tasks.md`:
   - update: レビューの任務文に、plan md の全ファイルの通読、既存への組み入れと全体の再設計、矛盾、循環、重複、不足、不自然な流れの確認を入れる。`Goal` は ADR の `Adopted` と `Scope`。
   - update: リサーチの任務文の `Goal` と `Non-goal` を ADR の `Adopted` と `Scope` に直す。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -rni -w 'design' .pi/skills/plan`
  - `grep -n 'affected' .pi/skills/plan/SKILL.md`
  - `grep -in 'read through' .pi/skills/plan/SKILL.md .pi/skills/plan/references/format.md .pi/skills/plan/references/tasks.md`
  - `grep -n 'add' .pi/skills/plan/SKILL.md`
  - 変更した全ファイルを通読し、今回の変更によるファイル内の矛盾、循環した流れ、重複、不足、不自然な流れがないか確かめる。ダメなら直し、`Unplanned` に書く。
- Added: base の見た目: オーナーが `plan/SKILL.md`、`references/format.md`、`references/tasks.md`、`references/cut.md` の差分を読み、手順の流れ、既存への組み入れ、通読の検査が意図どおりであることを確かめる。オーナーの OK をもって閉じる。

## 2. ステップの接頭辞と書く前の読み直し

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/SKILL.md`:
   - update: 手順4に、ステップの説明行の先頭に `add:`、`update:`、`drop:` のどれかを付けること、テストの行を `<prefix>: (happy|error|empty|boundary) <given> → <result>` の形で書くこと、テストファイルを含む plan に関わるファイルを書く前に改めて読むことを足す。
2. `.pi/skills/plan/references/format.md`:
   - update: `## Shape` の見本と `## Slices` の形を `- <prefix>: <何をするか>` に直し、テストファイルの行は `- update: (happy) <given> → <result>` の形にする。
   - update: `## Shape` の見本の `Verify` を、実際の `Always` の6行（関連テスト、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、 stale の `grep`、全ファイルの通読）に直し、`<>` の保存場所を残さない。
   - update: `## Slices` に、ステップの接頭辞と `Files` のツリーのマーカーが同じ語であり、`Files` のツリーのマーカーはそのまま残すことを書く。
   - update: `## Test cases` に、ケースの前の接頭辞を足す。
3. `.pi/skills/plan/references/tasks.md`:
   - update: レビューの `Cases` を、ステップの接頭辞とケースの両方を読むように直す。
   - update: レビューとリサーチの手順に、plan に関わるファイルを書く前に改めて読むことを書く。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n 'add:' .pi/skills/plan/references/format.md`
  - `grep -n 'update:' .pi/skills/plan/references/format.md`
  - `grep -n 'drop:' .pi/skills/plan/references/format.md`
  - `grep -n 'add:' .pi/skills/plan/SKILL.md`
  - `grep -n 'read the file' .pi/skills/plan/SKILL.md .pi/skills/plan/references/tasks.md`
  - 変更した全ファイルを通読し、今回の変更によるファイル内の矛盾、循環した流れ、重複、不足、不自然な流れがないか確かめる。ダメなら直し、`Unplanned` に書く。
- Added: base の見た目: オーナーが `plan/SKILL.md`、`references/format.md`、`references/tasks.md` の差分を読み、ステップの接頭辞が意図どおりであることを確かめる。オーナーの OK をもって閉じる。

## Notes

### Slice 1: plan の手順を ADR と affected から組み直す

- Findings: なし
- Unplanned: 通読で6件を直した。`format.md` の `## Files` の `Walk the relations` を `affected` 基準に直した。`tasks.md` の回答形に `Integration` と `Flow` を足した。`plan-cut.md` の `Verify` の `design` の `grep` を `-w` にし、`通読` を `read through` の `-i` に直した。`format.md` の `## Work Review` の `Integration` と `Flow` は `work` の任務文と合わないため戻した。`plan-cut.md` の `Steps` の手順番号を手順7から手順4に直した。
- Commit:
- Stopped:

### Slice 2: ステップの接頭辞と書く前の読み直し

- Findings: なし
- Unplanned: 通読で3件を直した。`SKILL.md` と `tasks.md` の英語に合わせ、`Verify` の `改めて読む` を `read the file` に直した。`tasks.md` の `Cases` に接頭辞の見本（`add:`、`update:`、`drop:`）を足した。`format.md` の `## Shape` の見本の `Verify` を実際の `Always` の6行に直した。
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
