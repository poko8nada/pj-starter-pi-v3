# PLAN `ex-plan-cut`

- Place: base
- Boundary Plans: なし（`close-names` のマージ後に `cut.md` の 2 行だけを直す）

## Files

```text
.pi/skills/plan/references/cut.md         update
```

## Slices

## 1.Cut と Present の Why

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/references/cut.md`:
   - update: 3 番目の項目を「do the two touch the same path? then they are one plan — the paths are in the affected's `### Code`. Order the two only when one reads the output of the other; whether a file exists, and its shape, is the plan's」に変える（同じパスなら 1 つのプランとし、順番は片方がもう片方の出力を読むときだけ付け、ファイルの有無と形は計画が決めるという 3 文にし、うしろの 2 文は今の文面のままとする）。
   - update: Present の `- Why:` を「read the `Role change` and the `Adjustment` in the affected, and write what those say and why they make these entries one plan; do not list the field names alone」に変える。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - grep ツールで `.pi/skills/plan/references/cut.md` 内の `then keep them together — the paths are in the affected's` を検索し、0 件なのを確かめる
  - grep ツールで `.pi/skills/plan/references/cut.md` 内の `then they are one plan` を検索し、1 件なのを確かめる
  - grep ツールで `.pi/skills/plan/references/cut.md` 内の「which `Role change` and which `Adjustment`」を検索し、0 件なのを確かめる
  - 変更した 1 ファイルを変更前と並べて読み、矛盾、循環、重複、不足、不自然な流れがないか確かめる
- Added: base — オーナーが差分を読んで承認したら閉じる

## Notes

### Slice 1: Cut と Present の Why

- Findings: なし
- Unplanned: なし
- Commit: `221193a`
- Stopped: なし

## Work Review

### Round 1

- Stale: `.pi/skills/plan/SKILL.md:28` が古くなった — 理由: `cut.md` の Why を「欄の名前だけを並べない」形に変えたのに、同行は依然として「The `Why` says which `Role change` and which `Adjustment` each plan takes.」と旧来の欄名列挙で説明しており、Verify が 0 件を求める旧文面と同文だからである。読む人が旧式の Why を書く恐れがある。
  - fixed: `.pi/skills/plan/SKILL.md:28` の `Why` の説明を、`Role change` と `Adjustment` が何を言っているかと、なぜ 1 つのプランかを書く形に直した。計画の `Files` は `cut.md` だけだったが、同じ説明を持つ 1 行なのでこの作業で吸収した。
- Unlisted: なし — 理由: 差分は `cut.md` の 2 行と計画 md 自身の Notes 記入（`Findings`・`Unplanned`・`Stopped` の「なし」埋め）のみで、後者は作業記録であり製品変更ではない。製品変更の 2 行はいずれも Steps が命名どおりである。
- Gaps: なし — 理由: 残件 14 の `Then`（同じパスは 1 プラン、順番は片方がもう片方の出力を読む場合だけ）と残件 17 の `Then`（`Role change`・`Adjustment` が何を言っているかと、なぜ 1 プランかを書く。欄名だけを並べない）はいずれも Steps どおり英文で運ばれている。ADR 07 の `Adopted`・`Scope` は `NN-` ファイル名の件で `close-names` の所掌であり、このプランの `Files`（`cut.md` のみ）の範囲外のため、運ばれないのは欠落ではない。
- Unproven: Verify に新 Why 文の肯定確認がなく、Why 行を消しても緑のままである — 理由: 「which `Role change` and which `Adjustment`」0 件だけでは、Why 行の削除や無関係文への置換でも通る。Steps の新文（例: `do not list the field names alone` の 1 件確認）がないため、後半の変更が除去されても検出できない。前半は `then they are one plan` の 1 件確認があり検出できるのと対照的である。
  - left: 文書だけの変更で、検証は `git diff` を読んで変えた行を変える前と並べることと、受理の通読が担う。新しい文を grep で数えると、言い換えで緑のままになる。
- Noise: なし — 理由: 新しい 3 番文と Why 文に重複・新設名・不要分岐はなく、em ダッシュ挿入や `those` の指示も文意を崩さない。`## Where` 末文との見かけの重なりは役割が異なり重複ではない。
- Doubts: `.pi/skills/plan/SKILL.md:28` の旧 Why 説明を直すか・別の ex-plan にするかはオーナーの判断が要る — 理由: このプランの `Files` は `cut.md` のみで範囲外のためこの場で直せず、放置すれば旧式 Why の再発の恐れがあるため、対応要否の判断が要る。
  - fixed: `.pi/skills/plan/SKILL.md:28` を直した。別のプランにはしない。

### Round 2

- Stale: なし — 理由: fixed 行の直しが SKILL.md の 28 行で確認できたため。現行 28 行後段は Role change と Adjustment が何を意味し、なぜ 1 プランかを書くという趣旨であり、cut.md の Present の Why と同旨である。旧文面の系統は grep で 0 件であり、旧式 Why の再発の恐れは解消している。
- Unlisted: なし — 理由: fixed 行を持たないため今回の照合対象外であり、対象の fixed 2 行はいずれも Stale と Doubts で扱う同一箇所の直しだからである。
- Gaps: なし — 理由: fixed 行を持たないため今回の照合対象外であり、cut.md 側の再確認は指示の範囲外だからである。
- Unproven: なし — 理由: left 行は回答済みで再開しないという指示のため、再検証しないからである。
- Noise: なし — 理由: fixed 行を持たないため今回の照合対象外であり、直した 1 行に重複・新設名・不要分岐は見られないからである。
- Doubts: なし — 理由: fixed 行の対応（SKILL.md の 28 行を直し、別の ex-plan にしない）が確認できたため。plan 配下に当該直しのための新規プラン md はなく、28 行の直し自体は Stale のとおり済んでいる。

## Acceptance

- Ran: `pnpm test:run`（63 ファイル、756 件）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、grep で `then they are one plan` を `cut.md` から 1 件、`then keep them together` と `which `Role change` and which` を 0 件、2 ファイルの読み、`git diff 89e447c..HEAD` の通読。
- Findings: なし
- Doubts: なし
