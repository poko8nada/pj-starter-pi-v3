# readme

Acceptance: 何が入っているか分かる。最初に何をすればいいか分かる。書いてあることと実物が食い違わない（節の数 / 各スキルの役割 / 検査の数）。拡張の一覧に `ref-cleanup` と `sound-notify` がある。`close` の行がある

## Todo

- `README.md` / `README.ja.md`（ルート。`.pi/extensions/consult/README.md` とは別）
  - **拡張の一覧を実物に合わせる** — いまは `consult` と `quality-gate` しか無い。`ref-cleanup`（ref を一覧・判定・削除する道具）と `sound-notify`（音と通知）を足す
  - **スキルの一覧を 6 つにする** — `.pi/skills/` に `close` が増える（`definition` / `stack` / `plan` / `tickets` / `work` / `close`）。サイクルの表にも `close` の行を足す
  - **節の数** — `definition` の 1 枚の節の数は **step 6 の決定で決まる**（8 のままか、`Carry over` が増えて 9 か）。README の数は、いずれにせよ `format.md` の実物と一致させる
  - 検査の数（verify に載る 2 つ = `lint` / `typecheck`）を、実物と突き合わせる（`grep -c "phase: 'verify'" .pi/extensions/quality-gate/checks.ts`）
  - 各スキルの役割を `description` と突き合わせる（6 つ）
  - 名指しの規則（「次の段を名指ししない」）の文はそのまま残す（実物が規則に追いついている）
- 観点のうち、正常系（happy）→ `Verify` の実演が担う（clone 直後のつもりで読む）
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）→ この step は文書の修正で、作るものが無い — ケース無し
- 失敗の入力（拡張が 1 つ抜けている / 節の数が古い / `close` の行が無い / 検査の数が古い）→ `Verify` の読み合わせが拾う。期待する値: 拡張 4 つ / README の節数が `format.md` の実物と一致（英日で同じ）/ `close` の行がある / verify は 2 つ (error)

## Verify

- 実演: `pnpm install` / `pnpm test:run` / `pnpm lint` / `pnpm typecheck` / `pnpm format:check` を走らせる / `grep -h '^description:' .pi/skills/*/SKILL.md` と README の表を突き合わせる（6 つ一致）/ `ls .pi/extensions/` と拡張の一覧を突き合わせる（4 つ一致）/ `sed -n '/^```markdown/,/^```$/p' .pi/skills/definition/references/format.md | grep -c '^## '` で節を数える（実物の数）→ README の数と一致 / `grep -c "phase: 'verify'" .pi/extensions/quality-gate/checks.ts` で検査を数える（2）→ README の数と一致 / clone 直後のつもりで README だけを読み、何が入っているかと最初の手順が言える。結果を `Notes` に書く

## Notes

### Findings

なし

### Unplanned

なし

Commit:
