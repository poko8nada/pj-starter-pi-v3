# consult.folders

Acceptance: 子は type ごとに決まったモデル・ツール・環境・上限・役割で走る（agent が選べるのは type だけ）。入力ごとに 1 体走る（入力が 1 つなら 1 体）。`code` の子のコミットは ref で返り、agent が取り込むかを決める。`input` の全文が、子のプロンプトの先頭に payload として入る（子が読む文書ではない）。`consult` の `README` の表が、実際のツールと一致する。定義 1 枚のレビューが、出力上限に当たらずに終わる。agent が、直したいものがどのフォルダにあるか一目で分かる（`policy/` `child/` `run/` `tool/`。README と json は直下）。`index.ts` を開くと道具の登録だけがあり、進行も整形も見当たらない。import の向きが一方通行で、逆向きを探しても無い（`tool` は `run` を、`run` は `child` を、`child` は `policy` を知っている）。既存の検査が緑のまま（振る舞いは変えない）

## Todo

- `.pi/extensions/consult/`
  - `types.ts` → `policy/types.ts`、`spec.ts` → `child/spec.ts`、`child-guard.ts` → `child/guard.ts`、`run.ts` → `run/run.ts`（テスト 4 本も一緒に動かす）
  - 旧 4 ファイル（`types.ts` / `spec.ts` / `child-guard.ts` / `run.ts`）を降ろす
  - import を貼り替える — 辺は**下向きだけ**（`tool` → `run` / `tool` → `child` / `tool` → `policy` / `run` → `child` / `run` → `policy` / `child` → `policy`）。上向き・同じ層の中の辺を作らない
  - **`-e` のパスは文字列リテラル**（`child/spec.ts` の `new URL('./child-guard.ts', …)`）なので `'./guard.ts'` に貼り替える。`spec.test.ts` の期待値（`endsWith('child-guard.ts')` と長さの比較）も直す
  - `types.test.ts` は**隣の** `types.example.json` を読んでいる（json は `consult/` 直下に残す）→ `policy/` からは `../types.example.json` を指す
  - テスト 4 本の相対 import も貼り替える — `spec.test.ts` の `../tool/consult.ts` と `../policy/types.ts`、`run.test.ts` の `../child/spec.ts`、`guard.test.ts`（`child-guard.test.ts` から改名）の `./guard.ts`
  - **`tool/render.ts` の import も貼り替える**（`child/spec.ts` から引く）。プランの step 4 の `Files` には無いが、`03` が作ったこのファイルも触る
- `.pi/extensions/consult/README.md`
  - `-e child-guard.ts` を新しいパスに直す
  - テストの場所（`spec.test.ts` / `run.test.ts` 等）を新しいパスに直す
- `.pi/extensions/ref-cleanup/index.ts`
  - `gitEnv` の import 先を `../consult/run/run.ts` に直す（`ref-cleanup` の統合は 005。ここは 1 行だけ）
- 観点のうち、正常系（happy）→ `pnpm test:run` の 5 テスト（4 + `refs.test.ts`）を走らせる → 緑
- 想定エラー経路（外から借りている 1 行・`-e` の名前リテラル・`types.test.ts` の読み先）→ 赤。期待する値: `pnpm typecheck` の赤（消えた `run.ts` を指す。`refs.test.ts` は `index.ts` を読まないのでテストでは錆まない）/ 子の起動失敗 / `types.test.ts` のファイル無し (error)
- null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行 → ファイルの移動で、呼び出しの意味は変わらない — ケース無し

## Verify

- 実演: `pnpm test:run`（`refs.test.ts` を含めて緑）+ `pnpm typecheck` + `grep` で import を全部拾い、辺が下向き（`tool` → `run` / `tool` → `child` / `tool` → `policy` / `run` → `child` / `run` → `policy` / `child` → `policy`）だけであること（上向き・同じ層の中の辺が無い）+ `README` の `-e` とテストの場所が新しいパスを指している + 道具を 1 回呼び、子が起動して返る（`-e` が新しい `child/guard.ts` を指しているかを確かめる）

## Notes

### Findings

- プランの step 4 の `Files` に `tool/render.ts`（`child/spec.ts` から引くので import が変わる）と、移す・改名するテスト 4 本が無い。プランは凍結済みなので、ここに書く
- プランの step 4 の `Tests` と `05` の実演 ③ は、辺を 3 本（`tool` → `run` / `run` → `child` / `child` → `policy`）と書いているが、実物にはもう 3 本ある（`tool` → `child` / `tool` → `policy` / `run` → `policy`）。このチケットの 6 本が正しく、プラン側は凍結なので直さない
- （親が追記）**事故**: 子が step 4 をやり、`consult` がその作業をコミットするときにフックが落ちた（`run.test.ts` の実リポジトリのテストが、フックの `GIT_*` に負けて実リポジトリの config を書き換え、自分が壊した repo で失敗した）。ref が作られず worktree ごと消え、**子の作業は残っていない**。原因と対処（検査が自分の置き場を自分で決める）は別コミット（`25e1a04` / `81e0743` / `38b22f9`）と 1 枚の `Remarks` に記録
- （親が追記）**親がやり直した**（`work` skill の「子が ref を返さなかったとき」の経路）。移動・改名・import の貼り替え・README・`ref-cleanup` の 1 行。検査: `pnpm test:run` 167 / `pnpm typecheck` / `pnpm lint` / 実フック（どちらも `2baa672` の上で）
- （親が追記）**実演**: `consult` を 1 回呼んだ（`review` / 入力無し / `.env` を読ませる）→ 子が起動して「読めない: `.env` は秘密として扱う（child-guard）」を返した = `types.json` が読めている（`EXTENSION_DIR` が新しい位置から `consult/` を指す）＋ `-e` が新しい `child/guard.ts` を指している
- （親が追記）チケットの `Files` に無いもの: `git-env.ts`（検査が git の置き場を決めるヘルパー。事故の対処で直下に増えた）。`child/spec.test.ts` → `../tool/consult.ts` は上向きの辺（`PARAMETERS` のため、チケットが指定）、`tool/consult.ts` → `./render.ts` は同じ層の中の辺（step 3 が作った）

### Unplanned

なし

Commit: 2baa672
