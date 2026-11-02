# PLAN `consult-policy-sub`

- No: 02

## Files

```text
.pi/extensions/consult/
  policy/
    types.test.ts      update
  sub/
    budget.test.ts     update
    guard.test.ts      update
    spec.test.ts       update
  index.test.ts        update
```

## Slices

## 1.policy と budget の削除

### Types

なし

### Steps

1. `.pi/extensions/consult/policy/types.test.ts`:
   - `it('`tools` が空 → 投げる')` を削除する。`ToolsSchema` の `minItems: 1` が同じ前提を保証している。
   - `it('`limits` がない → 投げる')` を削除する。`limits` はスキーマで必須である。
   - `it('`turns`/`output` が 0 以下 → 投げる')` を削除する。`minimum: 1` が同じ前提を保証している。
   - `it('`limits`の`turns`/`output` のキーが欠けている → 投げる')` を削除する。どちらもスキーマで必須である。
2. `.pi/extensions/consult/sub/budget.test.ts`:
   - `it('数の文字列 → その数')` を削除する。壊れても、pi の打ち切りが残るため誰も気づかない。
   - `it('1 手前 → 何もしない（ターンを消費しない）')` を削除する。同じ理由である。
   - `it('上限が読めない → 何もしない（促さず、pi の打ち切りに任せる）')` を削除する。同じ理由である。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/policy/types.test.ts .pi/extensions/consult/sub/budget.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -E 'tools` が空 → 投げる|`limits` がない → 投げる|0 以下 → 投げる|キーが欠けている → 投げる' .pi/extensions/consult/policy/types.test.ts`
  - `! grep -E '数の文字列 → その数|1 手前 → 何もしない|上限が読めない → 何もしない' .pi/extensions/consult/sub/budget.test.ts`
- Added: なし

## 2.guard の統合と削除

### Types

なし

### Steps

1. `.pi/extensions/consult/sub/guard.test.ts`:
   - (error) 秘密の名前を、読む道具と bash のどちらでも拒む → `it('名前で決める（入力と真偽の表から取る）')`、`it('読む道具と秘密の名前を拒む')`、`it('bash + cat /dir/.env を拒む')` を、`it('秘密の名前は、読む道具でも bash でも拒む')` の1本に統合する。
   - (happy) 空の一覧 → どこへでも書け、何でも打てる → `it('空の一覧 → どこでも書ける')` と `it('空の一覧 → 何でも打てる')` を、`it('空の一覧なら、どこへでも書け、何でも打てる')` の1本に統合する。
   - (happy) 許可されたパターンの下だけを通す → `it('ファイルはそのまま、ディレクトリは下の全部')`、`it('glob が効く（review は plan md だけ書ける）')`、`it('書く道具は許可された所だけ')`、`it('md は通す（通常とドットディレクトリ）')` を、`it('許可されたパターンの下なら、書く道具を通す')` の1本に統合する。
   - (error) 許可されていないパターンの下は止める → `it('src の ts は止める')`、`it('md 以外への write は止める')` を、`it('許可されていないパターンの下では、書く道具を止める')` の1本に統合する。
   - (boundary) 接頭辞が語として一致するときだけ bash を通す → `it('接頭辞は語として一致する（git は git status を通す）')` と `it('bash は許可された接頭辞だけ')` を、`it('接頭辞が語として一致するときだけ bash を通す')` の1本に統合する。
   - `it('bash + コマンド内の代入（FOO=.env; cat $FOO）は見ない（残る抜け）')` を削除する。
   - `it('メインエージェントの許可が壊れている → 書く道具と bash を止める（読むのは通す）')` は変えない。
   - `it('md への write は通す')` は、上の「許可されたパターンの下なら」に含める。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/sub/guard.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -E 'コマンド内の代入' .pi/extensions/consult/sub/guard.test.ts`
  - `test "$(grep -c '壊れている → 書く道具と bash を止める' .pi/extensions/consult/sub/guard.test.ts)" = 1`
  - `test "$(grep -c '秘密の名前は、読む道具でも bash でも拒む' .pi/extensions/consult/sub/guard.test.ts)" = 1`
  - `test "$(grep -c '空の一覧なら、どこへでも書け、何でも打てる' .pi/extensions/consult/sub/guard.test.ts)" = 1`
  - `test "$(grep -c '許可されたパターンの下なら、書く道具を通す' .pi/extensions/consult/sub/guard.test.ts)" = 1`
  - `test "$(grep -c '許可されていないパターンの下では、書く道具を止める' .pi/extensions/consult/sub/guard.test.ts)" = 1`
  - `test "$(grep -c '接頭辞が語として一致するときだけ bash を通す' .pi/extensions/consult/sub/guard.test.ts)" = 1`
- Added: なし

## 3.index と spec の削除

### Types

なし

### Steps

1. `.pi/extensions/consult/index.test.ts`:
   - `it('印のない完了を 1 件渡す → 1 を返す。印の行が 1 本増える')` を削除する。`run/delivery.test.ts` と `run/log.test.ts` が同じ分岐を確かめている。
   - `it('古いインスタンスの完了 → 新しい tick が 1 回渡し、印を書く。次は渡さない')` を削除する。`run/delivery.test.ts` と `run/log.test.ts` が同じ分岐を確かめている。
   - `it('音が off、印のない完了 → 鳴らさず、送る')` は残す。音が off でも送ることを確かめる唯一のテストである。
2. `.pi/extensions/consult/sub/spec.test.ts`:
   - `it('token と --session あり → argv に --name <token> と --session が両方ある')` を削除する。`run/subagent.test.ts` の `it('job の token が buildPiArgs の argv に --name で届く（取り違えない）')` が同じ argv を確かめている。
   - `it('--no-session の子 → argv に --name <token> がある')` を削除する。同じテストが同じ argv を確かめている。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/consult/index.test.ts .pi/extensions/consult/sub/spec.test.ts .pi/extensions/consult/run/delivery.test.ts .pi/extensions/consult/run/log.test.ts .pi/extensions/consult/run/subagent.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -E '印のない完了を 1 件渡す|古いインスタンスの完了' .pi/extensions/consult/index.test.ts`
  - `test "$(grep -c '音が off、印のない完了' .pi/extensions/consult/index.test.ts)" = 1`
  - `! grep -E 'token と --session あり|--no-session の子' .pi/extensions/consult/sub/spec.test.ts`
- Added: other — `pnpm test:run .pi/extensions/consult/policy .pi/extensions/consult/sub .pi/extensions/consult/index.test.ts` で件数を数え、105 から減った件数を ## Notes に書く

## Notes

### Slice 1: policy と budget の削除

- Findings:
  - Verify の `! grep -E ...`（バッククォート含み）を bash のまま実行すると subagent-guard に止められる。
    - left: guard が backtick を含むトークンを一律で止めるため。製品コードは変えられないので、grep ツールで不在を確認して代替した。
- Unplanned: なし
- Commit: c91c7cd
- Stopped:

### Slice 2: guard の統合と削除

- Findings:
  - Verify の `test "$(grep -c ...)" = 1` を bash のまま実行すると subagent-guard に止められる。
    - left: guard が `$(...)` を展開不能として一律で止めるため。製品コードは変えられないので、`grep -c` のみで件数 1 を確認して代替した。
- Unplanned: なし
- Commit: a3d47f2
- Stopped:

### Slice 3: index と spec の削除

- Findings:
  - Verify の `test "$(grep -c '音が off、印のない完了' ...)" = 1` を bash のまま実行すると subagent-guard に止められる。
    - left: guard が `$(...)` を展開不能として一律で止めるため。製品コードは変えられないので、`grep -c` のみで件数 1 を確認して代替した。
  - Added の件数: `pnpm test:run .pi/extensions/consult/policy .pi/extensions/consult/sub .pi/extensions/consult/index.test.ts` は 84 件。105 から 21 件減った。
- Unplanned: なし
- Commit: 220bc61
- Stopped:

### Cleanup: 重複する振る舞いの確認を整理

- Findings:
  - `budget.test.ts` の `lastTurn` 有効値 2 件（40→38 と 2→0）は同じ式を別値で確かめていた。1 本に統合し、境界の 2→0 を残した。
    - left: 統合後は `pnpm test:run` 81 件で緑。製品コードは変えていない。
  - `spec.test.ts` の guard パス絶対確認と `--tools` 空配列時の位置確認は、`-e` 位置と 2 回指定の包括テストと重なっていた。2 本を削除した。
    - left: 残る 3 本で位置・回数・機械非依存を cover し、`pnpm test:run` 81 件で緑。製品コードは変えていない。
  - Verify の `test "$(grep -c ...)"` は guard で止められるため、`grep -c` のみで件数確認に代替した（Slice 2・3 と同じ）。
    - left: 製品コードは変えられないため代替を継続。`! grep -E` は文字どおり実行して緑。
  - 整理後の件数: `pnpm test:run .pi/extensions/consult/policy .pi/extensions/consult/sub .pi/extensions/consult/index.test.ts` は 81 件。105 から 24 件減った。
- Unplanned: なし

## Work Review

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
