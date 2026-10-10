# secret-guard

Acceptance:

- guard の判断が、変数が未定義でも、別のキー名で来ても同じ形になる

## Todo

- 決めたこと（この step の前提。owner と合意する）
  - キー名: pi の道具がパスを渡す名前は実測で `path`（`read` / `edit` / `write` / `ls` / `grep` / `find`。`node_modules/@earendil-works/pi-coding-agent/dist/core/tools/*.js` の schema）。`bash` は `command`。候補を推測で並べない
  - 展開: `$VAR` / `${VAR}` を `process.env` から展開する（未定義は空。bash と同じ）。展開できないもの（`$(...)`、`$((...))`、backtick）を含むトークンは止める（fail-closed）。展開後に、いままでどおり解決後の basename で判定する
  - 残る穴: コマンド内で代入した変数（`FOO=.env; cat $FOO`）は guard の環境からは分からない。コメントに残す。本当の境界はホストの権限設定（`pi-permission-system`）と OS 側である、と書く
- `.pi/extensions/consult/child/guard.ts`
  - `PATH_KEYS` — `path` だけにする
  - 展開の関数を足す（`unquote` の隣）。`$VAR` / `${VAR}` は環境から、`$(...)` / backtick は「解決不能」として印を付ける
  - 「解決不能」を含むトークンは拒む。理由をコメントに書く（偶然ではなく規則）
  - `guard.test.ts`
    - `cat $HOME/.env` を拒む（新規）
    - `cat $UNSET/.env` を拒む（新規）
    - `cat .e${X}nv` を拒む（新規）
    - `cat $(echo .env)` を拒む（新規）
    - `echo $PATH` を通す（新規）
    - `read` の入力が `file_path` だけ → 通す（新規）

## Verify

### test

- `pnpm test:run .pi/extensions/consult/child`
  - `.env` を絶対パスで → 拒む（happy、既存）
  - まだ作られていない `.env` → 拒む（happy、既存）
  - `cat /dir/.env` → 拒む（error、既存）
  - `cat $HOME/.env` → 展開後の basename が `.env` → 拒む（error、新規）
  - `cat $UNSET/.env` → 未定義は空に展開 → `/.env` の basename が `.env` → 拒む（error、新規）
  - `cat .e${X}nv` → 展開後 `.env` → 拒む（error、新規）
  - `cat $(echo .env)` → 解決不能な展開 → 拒む（error、新規）
  - `echo $PATH` → 展開後の basename はパス一覧で、秘密の名前ではない → 通す（happy、新規）
  - `read` の入力が `file_path` だけ → 通す（boundary、新規。pi は `path` を渡すので見ない）
  - `read` の入力が `path: '.env'` → 拒む（happy、既存）
  - 引数が空 / オブジェクトでない → 落ちない（boundary、既存）
  - コマンド内の代入（`FOO=.env; cat $FOO`）→ 見ない（guard の環境からは分からない。理由をコメントに書く）
  - 権限 / 2 回目 / 並行 → 見ない（判定は純関数で、状態を持たない）

### read

- `review` の子に `.pi/extensions/consult/child/guard.ts` だけを渡す
  - 展開が絡むトークンの扱いを、コメントから一意に読めるか報告させる
  - その扱いが偶然ではなく規則として書いてあるか報告させる
  - 残る穴（同じコマンド内の代入）が書いてあるか報告させる

## Notes

### Findings

- `child/guard.ts`: 空白での分割はシェルの単語分割ではない。`cat${IFS}.env` は `${IFS}` が未定義なら `cat.env` になり通る（bash では `cat .env` になる）。閉じるには: 分割をシェルに寄せるか、この穴を受けて境界の説明を強めるかを決める
- `child/guard.ts`: `;` `|` `<` `>` が語に接着した形（`cat .env;ls`、`cat <.env`）は basename が一致しないので通る。閉じるには: 演算子でも切るか、受け入れるかを決める
- `child/guard.ts`: `read` / `edit` などの `path` は展開しない。pi 側は `~` を展開する（`normalizePath`）ので、見方がずれうる。閉じるには: 非 bash のパスも展開するかを決める

### Unplanned

- `child/guard.ts`: 「展開しても `$` が残るトークンは止める」まで広げた（`${X:-.env}` と `$'...'` が素通りするのを `read` の検証が見つけた）。あわせて `expandVars` を先、`unquote` を後に変えた（逆順だと `$'\x2eenv'` が `$x2eenv` という変数名になる）
- `child/guard.ts`: `tool_call` のキー名（`toolName` / `input`）を pi の `types.d.ts` で確かめ、出所をコメントに残した（`PATH_KEYS` の `path` も同じ出所）

Commit: 21369e5
