# definition-skill.units

Acceptance:

- 前のサイクルのユニット一覧を引き継ぐ段が無い、が解ける: `definition/SKILL.md` が前の `What to build` と `What to keep` の一覧から始める
- 名前の増減の規則が無い、が解ける: 増えるのは `add` のときだけ、減るのは `drop` のときだけ。`update` は名前を変えず `ユニット名.機能`
- unit の定義が無い、が解ける: unit は実物（拡張・スキル・ゲート・文書）で、機能は unit にしない
- 007 の 3 つの機能名が unit として並んでいた、が解ける: `definition/references/format.md` の名前の規則がこの形に置き換わり、3 つは `Change: drop` として並ぶ

Owner: at the end

## Todo

- `.pi/skills/definition/SKILL.md`
  - `## Steps` の最初（`What to build` を書く段の前）— 前のサイクルの `What to build` と `What to keep` の一覧を読み、その名前から始める、という段を足す
  - `## Steps` — `add` 以外では名前を増やさない、`drop` 以外では減らさない、`update` は `ユニット名.機能`、という規則を足す
  - `## The review's checklist` — 「前の一覧の名前が引き継がれているか」「増減が `add` / `drop` に限られているか」を観点に足す
- `.pi/skills/definition/references/format.md`
  - `## Units` — unit は実物（拡張・スキル・ゲート・文書）で、機能は unit にしない、を足す
  - `## Units` — 名前の規則（two nouns, at most one hyphen）を、`ユニット名.機能` の形に置き換える
  - `## Markers` — 名前が減るのは `drop` のときだけ、を足す

## Verify

### read

- `review` の子に `.pi/skills/definition/SKILL.md` と `.pi/skills/definition/references/format.md`、それに 007 の定義を渡し、新しい規則で 008 の 19 項目が説明できるかを報告させる
- 合格: 引き継ぎの段、増減の規則、unit の定義、3 つの `drop` の扱いが、4 つの `Acceptance` 行に対応して書いてある（1〜4 行）

## Notes

### Findings

- 場所: `.pi/skills/definition/references/format.md` の `## Units`（`カートに入れる` is a unit などの granularity の例）と `.pi/skills/tickets/SKILL.md:11`
  - 状態: 関数（`カートに入れる`）を unit と呼ぶ古い例が残り、新しい「unit は実物、機能は unit にしない」（`ユニット名.機能`）と食い違って読める
  - 閉じるもの: unit / function の言い回しを granularity の例と全スキルで揃えるかを決める

### Unplanned

- `.pi/skills/definition/references/format.md` の `## Units`: 「A unit is a real thing」を、この製品の場合だと分かる形にし、上の `カートに入れる` の例が granularity の見方だと添えた。古い例と新しい規則が食い違って読めたため（チケットが名指ししたファイルの中なので、この step で直した）
- （影響読み `consult-23` の指摘と、親の修正）
  - 同じ `## Units` に unit の定義が 2 つ並び、`カートに入れる` の例が「unit だ」と言い続けていた → 例に「別の製品の物で granularity の見方」と前置きし、新しい定義を「この製品では実物（＝ `Who` が使える最小の物）」と書き直した
  - 動く unit の名前と、動かない unit の名前（`What to keep`）と、消える名前（`drop`）の関係が 1 行で読めなかった → 1 行にまとめた
  - `.pi/skills/tickets/SKILL.md:11` の「unit は `Who` が使える最小の物」が、新しい定義と食い違って読めた → この製品では実物だ、と 1 文足した（`tickets` の担当 step 4 が同じファイルを後で触るが、その前に置いた）
  - 未対応: `## The shape` のプレースホルダ（`<unit-id>`）はドット無しのまま。`keep` / `drop` の名前の扱いは上の 1 行で読めるようにした

Commit: e5b91b0 + 697628c + 2d57c1d（並列で走らせたので 1 つにまとめない。`squash.mjs` は `HEAD` が一覧の最後であることを要求するため、混ざった単位には使えない）
