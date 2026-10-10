# ADR 015

## 01: definition-skill

### 01-1: .scaffold

1. Agenda:
   - Title: サイクルのフォルダ名を、どう決めるか
   - Proposal: フォルダ名を `cycles/<YYMMDD-NNN-<branch>>` に変える。`definition` スキルの scaffold スクリプトがフォルダの作成を引き受け、前回の definition も探して持ち越す。旧 14 フォルダは `cycles/archive/` に移す
   - `<YYMMDD>`: 開始日のローカル日付。先頭に置く。並び順の主キーになる
   - `<NNN>`: 3 桁（0 埋め）。リポジトリ内のサイクルフォルダ（`cycles/` と `cycles/archive/` の両方）の先頭 3 桁の最大値 + 1。一つも無ければ `001`。先頭には置かない。番号は並行時に全域順序ではないため、順序の主キーにはできない
   - `<branch>`: 開始時のブランチから作る slug。`main` は `main`、`develop` は `dev`、先頭セグメントが `feature` は `feat`（`feature/a/b` → `feat-a-b`）。定義外はサニタイズ（小文字化、英数以外を `-`、`-` の連続と端を除去）。slug が空になるブランチと detached HEAD は `no-branch`（`git branch --show-current` が空）
   - NNN の走査は 2 形状を受ける。旧形 `NNN-YYYY-MM-DD` と新形 `YYMMDD-NNN-<branch>`。archive に旧形が残る限り恒久的に要る（リネームはしない）
2. Highlight:
   - 現状: フォルダ名も `# Definition <NNN>` の番号も手打ち。`scaffold.mjs` は草案の中身だけを作り、フォルダは作らない
   - 衝突: サイクルは分岐ごとに始まるのにフォルダ名はグローバルなので、同じ日に別ブランチで 2 つのサイクルが始まると同名のフォルダになる。旧規則なら `015-2026-10-10` が二つになり、マージで衝突して片方が失われる
   - owner の指示: ワークツリーで並行作業をするので、同日でもフォルダ名が衝突しないようにしたい
   - owner の判断: 日付を先頭に置き、短く読める `YYMMDD` がよい。長さは `NNN-YYMMDD-<branch>` と変わらない
   - NNN を先頭に置けない理由: 番号は並行時に全域順序ではない。別ブランチが同じ max から同じ番号を取るので、同じ番号が二つ生まれる。順序の主キーにすると日付順を逆転させる（A が月曜に 017 を作り、B が火曜に 016 を作れば、NNN 順では火曜が先に来る）。日付は嘘をつかないので先頭は日付にし、NNN は同日中の副次キーと会話の呼び名にする
   - owner の判断: ブランチの短縮（`dev` / `feat`）は採る。ワークツリーは `feature/` 接頭辞で切る前提なので、文字列 `dev` や `feat-*` のブランチと同時に回ることは無い。衝突縁（`dev` と `develop`、`feat-*` と `feature/*`）は同日・同 NNN が重ならないと衝突しないため、そのまま採る
   - **NNN は live / archive を分けず一つの rule で数える。分けると「live が空の時だけ archive を見る」という境界が要り、archive の 999 の時に 001 へ戻すべきか 1000 にするべきかが争いになる。一つに潰せば境界そのものが消え、巻き戻り（過去を全部 archive に移した瞬間に番号が若返る）も起きない。新規に 001 から始めたい時は `product:ready` が `cycles/` ごと消すので、そこから 001 になる**
   - `findCycles` / `removeCycles` は `cycles/` 直下の全ディレクトリを recursive に消すので、`cycles/archive` はそのまま target になり `--run` で消える（dry run で確認）。`product-ready` に手は要らない。archive は保存庫としては扱わない: clone した人がスターターの過去 14 件を抱えないため
   - 落とし穴: scaffold の本質は前回 definition の持ち越し。過去を全部 archive に移すと、`cycles/` だけを見る実装は最初の 1 回だけテンプレートに落ちてプロダクト像が消える。両方を見て、使った src を印字する
   - 影響範囲の見落とし: consult README の例（`cycles/002-2026-09-22/definition.md`）は archive 移動で存在しなくなるので、新形に直す。定義の consult 行に update を付ける
   - 落とした案: `NNN-YYMMDD-<branch>`（並行時に NNN が日付順を逆転させる）／`YYYY-MM-DD` のままにする（短い方が読みやすい）／日付をやめてブランチだけにする（日にちが落ちると時系列が消える）／`main` と `develop` をどちらも `dev` に潰す（単射でなくなり衝突する）／同時 mkdir の衝突をロックやリトライで受ける（git は同一ブランチの 2 つ目の checkout を許さず、`mkdir` は `File exists` で落ちるので要らない）
3. Research: mechanism
   - 影響範囲: `cycles/<NNN-YYYY-MM-DD>` の記述は 6 スキル 12 ファイル 17 か所、README 2 ファイル 2 か所。`cycles/<NNN>/` の短い形は description 4 か所と `adr` SKILL.md の 1 か所、consult README の例 1 か所。**表記は 3 通り併存しているので、path を書く所は全て `cycles/<YYMMDD-NNN-<branch>>` に揃える**
   - ブランチの取得: detached HEAD で `git branch --show-current` は空、`git rev-parse --abbrev-ref HEAD` は `HEAD`（Trial D）。`show-current` が空の時を `no-branch` にする
   - NNN の抽出は 2 形状を数値で拾う。旧形 `001-2026-09-20` と新形 `261010-015-main` が混在しても拾える（Trial B）
   - サニタイズの縁: `日本語/x` は `-x` になり（先頭に `-`）、非 ASCII だけのブランチは空になる。slug が空なら `no-branch` に落とす。80 文字のブランチ名はそのまま通す（上限は設けない）
   - `.pi/` はルートの tsconfig が除外しているので、scaffold スクリプトとそのテストは `pnpm typecheck` の視野外（`.pi/extensions` のテストと同じ）。vitest の既定 include は拾う
4. Trial:
   - 写像とサニタイズの見本（`memo-015-slug.mjs`）: `main` → `main`、`develop` → `dev`、`feature/a/b` → `feat-a-b`、`fix/x` → `fix-x`、`Fix/X` → `fix-x`、`2-consult.retry` → `2-consult-retry`、`日本語/x` → `-x`、`""` → `no-branch`
   - NNN の計算を現物で: `cycles/` に旧形 `001-2026-09-20`〜`014-2026-10-09` と新形 `261010-015-main` が同居した状態で 1〜15 を拾い、次は `016`
   - 既にあるフォルダへの `mkdir` → `File exists`（落ちる。同時開始の衝突の受け口になる）
   - detached HEAD の一時 repo で 2 つのブランチ取得を確認
   - `product-ready` の dry run（archive がある写し）: `node scripts/product-ready/index.mjs --root <tmp>` → `cycles (2):` に live 1 件と `cycles/archive` 1 件
   - **read-only な計算と dry run だけで、インストールも設定も要らないので子は起こしていない**
5. Decision: **accepted**
