# ADR 010

## 01: Product

### 01-1: Who

1. Agenda:
   - Title: プロダクトのREADMEは、ownerとagentに当てはまらない。プロダクトのwhoの変更が必要ではないか。
   - Proposal: Whoに、READMEの対象を加える。visitorはどうか。
2. Highlight:
   - Who に visitor（clone する前にリポジトリを見に来た人）を足すかを検討した。
   - 読者は物ごとに違ってよいが、Who は製品の登場人物。readme の読み手は owner で足りている
   - visitor が持てる単位は現状 readme だけ。**1 単位しか持たない Who は登場人物ではなく「読み手」**
   - 将来、owner にならない読者（ランディングページ、docs サイト）が現れたら、その時に足す
   - サイクルごとに 1 枚作る。だから「動かさない」も、この 1 行として残る
3. Research: なし
4. Trial: なし
5. Decision: **rejected**

## 02: consult

### 02-1: .worktree

1. Agenda:
   - Title: 実体の無い worktree の登録と、取り込み済みのブランチが残る。片付けが自然に終わらない
   - Proposal: `remove` の中で掃除する。実体の無い登録を `git worktree prune` で落とし、どの作業場にも checkout されていない `consult/*` のうち HEAD に取り込み済みの物を消す。未マージは消さずに列挙する。黙って消さず、消した物を返す。`list` は読むだけのまま。同じ掃除を、セッションの開始時にも 1 回、静かに走らせる
2. Highlight:
   - `/tmp` が掃除された後や、手で `git worktree prune` を打った後に、git の登録だけが残る（`prunable`）。
   - `git worktree list --porcelain` はその行も返すので、`consult_worktree list` がゴーストを並べる。いまの `parseWorktrees` はパスの存在を見ない
   - `remove` は `git worktree remove --force <path>` を打つが、パスが無いので登録は落ちない（`prune` が要る）。成否を見ていないので、成功したように見える
   - worktree を持たない `consult/*`（実体が消えた後）は `git worktree list` に出ない。一覧にも片付けにも乗らず、**ツリーだけが残る**
   - 検討した案: (a) `prune` という action を足す / (b) `remove` の中で掃除する / (c) 何もしない
   - → (b)。口を増やさない。`list` は読むだけのまま
   - セッションの開始時にも 1 回走らせる。冪等（prune は no-op、remove は missing、枝は列挙してから消す）。worktree を持つ枝（走っている子）と未マージの枝は触らないので、前のセッションの子が走っていても安全
3. Research:
   - 独立の報告 5 件以上。git のメーリングリスト（2019 の 2 つのパッチ、Eric Sunshine のレビュー）、git-switchboard #14、viwo #113、agent-orchestrator #2045、git-worktree-runner #182、desktop #22605
   - 手当て: `git for-each-ref --format='%(worktreepath)'`（git 2.23+）で「どの worktree にも checkout されていない枝」を列挙できる（git 自身のテスト t6302 が同じ使い方）
   - `prune` の後は「元 worktree があった枝」と「最初から無い枝」の区別が消える。残る手掛かりは命名規約 `consult/*` だけ
4. Trial: なし
5. Decision: **accepted**

### 02-2: .docs

1. Agenda:
   - Title: `consult/README.md` が、`remove` の後始末（実体の無い登録・取り込み済みの枝）を書いていない
   - Proposal: `consult_worktree` の説明に、`remove` が何を消し、何を残すか（未マージは残す）と、消した物を返すことを足す
2. Highlight:
   - README の `consult_worktree` の表は `new` / `list` / `remove` と `force` を書いている。後始末には触れていない
   - 振る舞いが変わって説明が変わらないと、**README が現物と食い違う**（このリポジトリで何度も起きた形）
   - ADR は definition に書き、definition は一覧。README はその下の説明なので、同じサイクルで動かす
3. Research: なし
4. Trial: なし
5. Decision: **accepted**

## 03: Stack

### 03-1: Formatter

1. Agenda:
   - Title: oxfmt を prettier に替える。よりメジャーな formatter の方が良いのでは
   - Proposal: `Checks` の `Formatter` を prettier に替える。`.oxfmtrc.json` を捨て、`package.json` の `format` / `format:check` と `lefthook.yaml` の `format` を prettier に合わせる
2. Highlight:
   - いまは `oxfmt`。設定は `.oxfmtrc.json`、走る所は `package.json` の `format` / `format:check`、commit 時の `lefthook.yaml`、`quality-gate` の fix 段
   - prettier はより広く使われ、plugin（md / yaml / astro など）とエディタ対応が厚い
   - oxfmt は速く、oxlint と同じ家なので `lint:fix` → `format` の順が素直
   - 分岐: (a) prettier にする / (b) oxfmt のまま / (c) 両方（しない）
   - **費用が見合わない**: md と表は生き延びるが、設定で変えられない 2 ファイルの差（短い union の折り方）と、`quality-gate` が毎ターン全リポジトリを整形してしまう地雷が付く。速さも 1.8 倍。oxfmt が既に全部満たしているので、置き換える理由が無い
3. Research: なし
4. Trial: prettier 3.9.9 を実際に入れて走らせた（worktree `3-stack.formatter`、43 ターン、$0.05）
   - 入った物: `prettier 3.9.9`、`.prettierrc.json`（printWidth 100 / tabWidth 2 / singleQuote / semi / trailingComma all）、`.prettierignore`
   - `.prettierignore` が必須だった: oxfmt は `pnpm-lock.yaml` と tsconfig を既定で飛ばすが、prettier は飛ばさない。無いと lockfile が 1,944 行変わる
   - md は生き延びる: `proseWrap` の既定が `preserve` なので、1 文 1 行は折り返されない（1547 字の 1 行もそのまま）。表は正規化されるが、いまの 144 ファイルは全部一致
   - 本物の差が 2 ファイル: oxfmt は短い union を `|` 先頭で折ったままにするが、prettier は 1 行に畳む（`run/run.ts` / `tool/consult.ts`）。設定で変えられない
   - **地雷**: `quality-gate` の `format` は `pnpm run format <paths>` を叩く。prettier にすると `format` が `prettier --write .` になり、毎ターン全リポジトリを整形する（`checks.ts` の `--no-error-on-unmatched-pattern` も oxfmt 専用）
   - 速さ: oxfmt 559ms / prettier 1.4s（199 ファイル、単一スレッド）
5. Decision: **rejected**
