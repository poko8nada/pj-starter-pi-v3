# PLAN `roadmap-docs`

- No: 01, 02, 03, 04

## Files

```text
rules/
  roadmap.md              add
  definition.format.md    update
  definition.rules.md     update
.pi/
  skills/
    adr/
      SKILL.md            update
    brief/
      SKILL.md            update
    close/
      SKILL.md            update
    propose/
      SKILL.md            drop
      references/
        tasks.md          drop
ROADMAP.md                update
DEFINITION.md             update
README.md                 update
README.ja.md              update
AGENTS.md                 update
lefthook.yaml
.oxfmtrc.json
package.json
scripts/
  harness/
    index.mjs
```

## Slices

## 1.rules-layer

### Types

```ts
なし;
```

### Steps

1. `rules/roadmap.md`:
   - ロードマップの形と規則を 1 枚に書く。
     - 形は、表が 2 つ（`1.x.x` と `0.x.x`）で、各表の列が 6 つ（`No` / `Ver` / `status` / `cycles` / `priority` / `title`）であり、表の下に `### <Ver> <No>` のセクションが並び、各セクションが `description` と `ideas` を持つものとする。
     - 規則は、`status` の値が `todo` / `wip` / `done` の 3 つであること、`cycles` は複数のサイクルナンバーを許し、番号が入っているだけでは完了と読まないこと、`priority` は `high` / `mid` / `low` の 3 語であること、`No` はバージョンごとに 001 から振ること、`Ver` は `git tag` にも `package.json` の `version` にも紐づけないこと、`ROADMAP.md` は `DEFINITION.md` の外のレイヤーであり、Unit ではないことである。
     - 末尾に `## Skeleton` の見出しを置き、その下の `md` のフェンス付きブロックに、6 列の空の表 2 つと値の説明 1 行を書く。`product:ready` はこの見出しの直後にある最初のフェンス付きブロックを読む。
2. `rules/definition.format.md`:
   - `71` 行目の `definition/rules.md` を `rules/definition.rules.md` に直し、`61` 行目の近くに、ロードマップはこのファイルの外のレイヤーであり、形と規則は `rules/roadmap.md` にある、と 1 行足す。
3. `rules/definition.rules.md`:
   - `5` 行目の `definition/format.md` を `rules/definition.format.md` に直す。
4. `ROADMAP.md`:
   - 2 つの表の見出しに `status` の列を入れ、`cycles` の列を複数の番号を許す形に直し、`0.x.x` の 6 行と `1.x.x` の 1 行に `todo` を入れ、`15` 行目の `prpduct` を `product` に直し、`54` 行目の「cycleが空が未着手という解釈で良い」を落とす。

### Verify

- Always:
  - この slice に関係するテスト（この slice が書くものも含む）を `pnpm test:related <変えたファイル>` で走らせ、関係するものがなければ `pnpm test:run` を走らせる。
  - `pnpm typecheck` を走らせる。
  - `pnpm lint` を走らせる。
  - `pnpm format:check` を走らせる。
  - `prpduct` を、大文字小文字を区別せずに `grep` でリポジトリ全体（`cycles/` と `node_modules/` を除く）から探してヒットが 0 件であり、`rules/` の中で `definition/rules.md` と `definition/format.md` を探してもヒットが 0 件であること。
- Added: base — オーナーがこの slice の変更を読み、OK を返す。

## 2.drop-propose

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/propose/SKILL.md`:
   - ファイルを削除する。
2. `.pi/skills/propose/references/tasks.md`:
   - ファイルを削除する。
3. `.pi/skills/adr/SKILL.md`:
   - `3` 行目の `description` にある propose の語を外し、`21` 行目の brief と propose の併記を brief だけに直し、`16` 行目の `definition/rules.md` を `rules/definition.rules.md` に、`17` 行目の `definition/format.md` を `rules/definition.format.md` に直す。
4. `DEFINITION.md`:
   - `35` 行目の `propose-skill` を落とす。
5. `README.md`:
   - `12` 行目の eight skills を seven skills に直し、同文から `propose` を外し、`61` 行目の propose を落とし、`73` 行目の `brief` or `propose` を `brief` に直す。
6. `README.ja.md`:
   - `12` 行目の 8 つを 7 つに直し、同文から `propose` を外し、`61` 行目の propose を落とし、`73` 行目の `brief` か `propose` を `brief` に直す。
7. `AGENTS.md`:
   - `3` 行目の `brief or propose` を `brief` に直す。

### Verify

- Always:
  - この slice に関係するテスト（この slice が書くものも含む）を `pnpm test:related <変えたファイル>` で走らせ、関係するものがなければ `pnpm test:run` を走らせる。
  - `pnpm typecheck` を走らせる。
  - `pnpm lint` を走らせる。
  - `pnpm format:check` を走らせる。
  - `propose-skill`、`.pi/skills/propose`、`brief` or `propose`、`definition/rules.md`、`definition/format.md` を、大文字小文字を区別せずに `grep` でリポジトリ全体（`cycles/` と `node_modules/` を除く）から探して、ヒットが 0 件であること。
- Added: base — オーナーがこの slice の変更を読み、OK を返す。

## 3.brief-and-close

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/brief/SKILL.md`:
   - `3` 行目の `description` にロードマップの確認を足し、第 1 ステージの後に、`status` が `todo` か `wip` である項目のうち当てはまるものをオーナーに尋ね、選んだ項目の `status` を `wip` にし、当てはまるものがなければ内容を提示してオーナーの合意を得て追記する、という独立したステージを設ける。
2. `.pi/skills/close/SKILL.md`:
   - 第 7 ステージの後に、`cycles` のセルに番号を追記し、`status` をオーナーの確認を経て `done` か `wip` にする独立したステージを設け、`85` 行目の commit を、`ex-` の plan とその仕事はマージした時点で個別にコミットし、`close.md` と `ROADMAP.md` は最後に 1 つにまとめてコミットする、という文に直す。

### Verify

- Always:
  - この slice に関係するテスト（この slice が書くものも含む）を `pnpm test:related <変えたファイル>` で走らせ、関係するものがなければ `pnpm test:run` を走らせる。
  - `pnpm typecheck` を走らせる。
  - `pnpm lint` を走らせる。
  - `pnpm format:check` を走らせる。
  - 「plans, in one commit」を、大文字小文字を区別せずに `grep` でリポジトリ全体（`cycles/` と `node_modules/` を除く）から探して、ヒットが 0 件であること。
- Added: base — オーナーがこの slice の変更を読み、OK を返す。

## Notes

### Slice 1: rules-layer

- Findings: なし
- Unplanned: `ROADMAP.md:58` の `などのの予定` を `などの予定` に直した。タイポで、同じ節の行を同じ commit で直すのが最短だった。
- Commit: 6a219e9
- Stopped: なし

### Slice 2: drop-propose

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 3: brief-and-close

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Review

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
