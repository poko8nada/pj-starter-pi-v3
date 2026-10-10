# PLAN 006

## Steps

### step 0: prepare

- Install: なし
- Cleanup: なし

### step 1: tickets-skill

- What:
  - `Commit: なし` の置き場が `tickets/references/format.md` に無い → 変更の無い step の閉じ方（`Commit: なし` とその理由）が `format.md` にある
- Depends: なし
- Action: build
- Files: `.pi/skills/tickets/references/format.md`
- Verify: read

### step 2: work-skill

- What:
  - `read` / `use` の検証で、子をどう起こすかが `work/SKILL.md` に無い → step 7 に、`consult` の子を 1 体走らせ、チケットが名指しした type に文書を `input` で渡し、返ってきたテキストを証拠にする、と書いてある
- Depends: なし
- Action: build
- Files: `.pi/skills/work/SKILL.md`
- Verify: read, use

### step 3: consult.policy-source

- What:
  - 型の定義（`types.json`）をどう配るかが決まらず、clone にも子の worktree にも渡らない → `types.json` がコミットされ、clone した人にも `HEAD` から作る子の worktree にも、同じものがそのまま渡る
  - `consult` の README が、`types.json` を「git 管理外の個人の設定」として説明している → `types.json` はリポジトリにあるものとして説明してある（例を写す手順が消え、変え方が書いてある）
- Depends: なし
- Action: build
- Files: `.pi/extensions/consult/.gitignore`, `.pi/extensions/consult/types.json`, `.pi/extensions/consult/types.example.json`, `.pi/extensions/consult/policy/types.ts`, `.pi/extensions/consult/README.md`
- Verify: form, read, test

### step 4: consult.ref-content

- What:
  - 子が残した作業ファイル（`.flat` など）が、成果と一緒に ref のコミットに入る → ref のコミットに、子の成果だけが入る
- Depends: step 3
- Action: build
- Files: `.pi/extensions/consult/run/run.ts`
- Verify: test, look

### step 5: consult.check

- What: 単位の `Then` を全部、1 回で確かめる
- Depends: step 4
- Action: verify
- Files: なし
- Verify: cli, look

### step 6: secret-guard

- What:
  - guard で `$VAR` が未定義のときの動きが偶然に頼っている → 展開が絡むトークンの扱いが決まり、偶然ではなく規則として書いてある
  - guard が読む `read` のキー名が確かめられていない → pi が実際に渡すキー名（`read` は `path`）で判定している
- Depends: なし
- Action: build
- Files: `.pi/extensions/consult/child/guard.ts`
- Verify: test, read

### step 7: ref-cleanup

- What:
  - `ref-cleanup` が `consult` とは別の拡張として `.pi/extensions/` に並んでいる → 拡張は `consult` 1 つで、道具の面は `tool/refs.ts`、ref の論理は `run/refs.ts` にあり、`consult` と同じ `index.ts` から 2 つが登録される
  - `consult/git-env.ts` が `policy/` `child/` `run/` `tool/` のどれでもない所にある → `run/` にあり、git を起動する側（今は `run.test.ts`）がそこから読む
  - `consult` の README が、1 つの道具と 4 つの層を説明している → README が、2 つの道具（`consult` / `ref_cleanup`）と、実装の木（`policy/` `child/` `run/` `tool/`）を説明している
- Depends: step 4
- Action: build
- Files: `.pi/extensions/consult/index.ts`, `.pi/extensions/consult/git-env.ts`, `.pi/extensions/consult/run/git-env.ts`, `.pi/extensions/consult/run/refs.ts`, `.pi/extensions/consult/tool/refs.ts`, `.pi/extensions/ref-cleanup/index.ts`, `.pi/extensions/ref-cleanup/refs.ts`, `.pi/extensions/consult/README.md`
- Verify: test, look, form

### step 8: readme

- What:
  - README が `ref-cleanup` を独立した拡張として数えている → 拡張の行が `consult` / `quality-gate` / `sound-notify` の 3 つを並べている
  - README が、`consult` の道具に触れていない → `consult` が 2 つの道具（`consult` / `ref_cleanup`）を持つと書いてある
  - README が、`types.json` を「例を写して自分のモデルを入れるもの」と書いている → 「使い始める」から例を写す手順が消え、`types.json` はリポジトリにあるものとして書いてある
- Depends: step 3, step 7
- Action: build
- Files: `README.md`, `README.ja.md`
- Verify: form, read

## Structure

```text
.pi/
  extensions/
    consult/
      index.ts            update
      README.md           update
      .gitignore          drop
      types.json          add
      types.example.json  drop
      child/
        guard.ts          update
      policy/
        types.ts          update
      run/
        git-env.ts        add
        refs.ts           add
        run.ts            update
      tool/
        refs.ts           add
      git-env.ts          drop
    ref-cleanup/
      index.ts            drop
      refs.ts             drop
  skills/
    tickets/
      references/
        format.md         update
    work/
      SKILL.md            update
README.md                 update
README.ja.md              update
```

## What to keep

- なし
