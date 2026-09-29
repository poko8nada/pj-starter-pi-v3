# ex-11-consult.workspace.levels

`close` が切った穴（unit 2 の `Then` が 2 つとも守られていない）。サイクルはこの仕事を待つ。

Acceptance:

- `remove` が消すのは **unit のディレクトリ**（`<runRoot>/<unit-id>`）だけ。同じ実行の根に別の unit があれば、その `log.jsonl` と `session` は巻き添えにならず残る
- 子が動いている worktree の `remove` は **拒む**（`busy`）。判定は「その unit で走っている子」で行い、記録（`log.jsonl` の終わりの無い行 + 生きている pid）から導く
- `list` の行も、走っている子の居る unit に印を付ける（いまは `rowLine(row, false)` で固定されている）
- **同じフィールド名が 2 つの段を指さない**: `unitDir` は unit のディレクトリ（③）、`runRoot` は実行の根（②）、`path` は worktree（④）

## いまの状態（根拠）

- `run/worktree.ts:185` の `createWorktree` は `root: join(root, id)` を返し、`Worktree.root` は **unit のディレクトリ**
- `run/worktree.ts:148` の `parseWorktrees` は `root: dirname(dirname(path))` を返し、`WorktreeRow.root` は **実行の根**（同じ型の中で意味が割れている。step 7b で片方だけ直したため）
- `run/worktree.ts:210` の `removeWorktree` は `rmSync(found.root, …)` を実行し、`found` は `parseWorktrees` の行なので、消しているのは **実行の根**（同じ実行の別 unit の記録とセッションも消える）
- `tool/worktree.ts:129` は `removeWorktree(cwd, action.id, { force: action.force })` で **`busy` を渡していない**（`busy` はどこからも真にならず、「子が動いていたら拒む」が実装されていない）
- `tool/worktree.ts` の一覧も `rowLine(row, false)` で busy を固定 false にしている

## Todo

- `.pi/extensions/consult/run/worktree.ts`
  - `Worktree` の `root` を `unitDir` に改名（`sessionFile` の呼び先も追随）
  - `WorktreeRow` に `runRoot` を足し（実行の根）、`unitDir` は `dirname(path)` とする
  - `createWorktree` の戻りを `unitDir` にし、ローカル変数 `root` を `runRoot` に改名
  - `removeWorktree` の削除対象を `found.unitDir` にする（**実行の根を消さない**）
  - `rootFor` の doc に「返すのは実行の根（②）。unit のディレクトリは `unitDir`」と書く（関数名は変えない。呼び手が多い）
  - runRoot の中で走っている子を数える小さな関数（記録の行 + `pidAlive` を `run/log.ts` から使う）
- `.pi/extensions/consult/tool/worktree.ts`
  - `remove` の前に busy を判定して `removeWorktree` に渡す
  - `list` の各行で busy を判定する（固定 false をやめる）
  - `remove` の文言に、busy の時に何が起きているかを出す
- テスト: `.pi/extensions/consult/run/worktree.test.ts`, `.pi/extensions/consult/tool/worktree.test.ts`

## Verify

### test

- `pnpm test:run consult/run/worktree consult/tool/worktree`（6 ケース）
  - 同じ実行の根に 2 unit → 1 つを remove → **もう 1 つの unitDir と `log.jsonl` が残る**（happy）— 1 行目を決める
  - remove の後、`runRoot` は残っている（実行の根を消さない）（happy）— 1 行目を決める
  - その unit で走っている記録（終わりの無い行 + 生きている pid）→ **busy で断り、何も消さない**（error）— 2 行目を決める
  - 記録の pid が死んでいる → 走っていない扱いで消える（error）— 2 行目を決める
  - `list` が、走っている子の居る unit の行に busy の印を付ける（happy）— 3 行目を決める
  - 型の意味: `unitDir` = `<runRoot>/<id>`、`path` = `<unitDir>/wt`、`runRoot` = unitDir の親（happy）— 4 行目を決める
  - 権限: 該当なし（理由: `/tmp` と自分のリポジトリの中だけ）
  - 同時実行: 該当なし（理由: unit 内は直列で、同じ worktree に同時に書かない）

## Notes

### Findings

- 「子が走っている」の判定は**記録**（`log.jsonl`）から取った。親の記憶（runtime の Map）ではなく
  - なぜ: `tool/worktree.ts` は runtime を持たない独立した `execute`。記録なら、その unit の行（`worktree` が一致し、終わりの行が無く、pid が生きている）だけで判定でき、reload をまたいだ子にも効く
  - 実装: `tool/worktree.ts` の `runningIn(runRoot, id, alive = pidAlive)`（export。検査が alive を差し替えられる）
  - この環境の条件: 記録の「走っている行」は step 6 の `onStarted` が spawn 直後に書くので、走っている間は必ず存在する
- 検査の `WorktreeRow.root` の期待値（「root は unit の入れ物」と書いていたコメント）が、実は**1 段ずれを固定していた**
  - 7b で `parseWorktrees` だけを直した時に、この検査を「実行の根」に合わせて書き換えた（今回の修正で `runRoot` に改名）
- 命名: `unitRoot(cwd, id)` は `<runRoot>/<id>` を返し、`Worktree.unitDir` と同じ物。**本体では使われていない**（呼び手は検査だけ）
  - 今は残した（道具は `rootFor` を直接使う）。要らなければ次のサイクルで落とせる

### Unplanned

- `.pi/extensions/consult/run/child.ts`: `sessionFile` を `worktree.unitDir` に合わせた（`Files` に無かったが、型の改名に追随する必要があった）
  - なぜ: `Worktree.root` を消したため（コンパイルが通らない）
- `.pi/extensions/consult/run/worktree.ts`: `Worktree` のコメント、`rootFor` の doc、「実体のパスに揃える」の位置を整えた
  - なぜ: `runRoot` と `unitDir` を導入したので、何を返す関数かを書く必要があった
- `.pi/extensions/consult/run/child.test.ts`: 検査の `WORKTREE` 固定値を `unitDir` に合わせた
  - なぜ: 同じ改名のため

Commit: 1ade68a
