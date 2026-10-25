# PLAN `slim-skills`

- No: 01

## Files

```text
.pi/
  skills/
    adr/
      scripts/
        scaffold.test.ts   update
    close/
      scripts/
        collect.test.ts    update
test/
  close-fixture.ts         add
```

## Slices

## 1.書式と雛形

### Types

なし

### Steps

1. `test/close-fixture.ts`:
   - plan md の雛形を工場関数 `planDoc({ no, name, notes })` で作る。`- No:` を省いた形と、Triage 行を持つ close md も同じ工場で作る。
   - 文字列を組み立てるだけで、プロセスも FS も開かない。テストの外から読まれても、何も起きずに止まらない。
2. `.pi/skills/close/scripts/collect.test.ts`:
   - 雛形は工場から取り、期待する No は工場に渡した値から取る。断言に `'02'` や `'### alpha (ADR 02)'` を書かない。
   - (happy) 通常の plan → `- No:` の値を返す。
   - (happy) `ex-` plan → Triage 行の `ADR <NN>` の値を返す。
   - (empty) Triage 行が無い `ex-` plan → null。
   - (happy) `writeClose` → `## Collected` の見出しに Triage の No を付ける。
3. `.pi/skills/adr/scripts/scaffold.test.ts`:
   - 書式を持つ期待値は、入力と期待値を組にした表に 1 度だけ書き、断言は表の値から取る。
   - (happy) `adrSkeleton` は番号を 3 桁に 0 埋めした見出しで始まる。
   - (happy) `slugBranch` は main → main、develop → dev、feature/a/b → feat-a-b、fix/x → fix-x。
   - (happy) `slugBranch` は英大文字を小文字にし、英数以外を `-` にする。
   - (empty) `slugBranch` は空の枝名を no-branch にし、日本語を含む枝名からは英数を拾う。
   - (happy) `toYYMMDD` はローカル日付を YYMMDD にし、一桁の月日は 0 埋めする。
   - (happy) `nextNNN` は新しい形の `261010-015-main` を数値として拾い、合わない物を飛ばして最大 +1 を返す。
   - (empty) `nextNNN` は空の一覧 → 1。
   - (happy) `nextNNN` は旧形だけ（`001-2026-09-20` と `014-2026-10-09`）でも最大 +1 を返す。
   - (happy) `cycleDirName` は番号を 3 桁に 0 埋めして組み立てる。
   - (happy) `createLeafDir` は空の親に作り、その道を返す。
   - (error) `createLeafDir` は既存の dir に作らず投げる。
   - (happy) `dirNames` は両方のルートの dir 名を集め、`archive` も入れる。
   - (empty) `dirNames` は無いルートを空として扱う。
   - (happy) `parseArgs` は位置引数を番号にする。
   - (empty) `parseArgs` は引数無し → root は cwd、nnn は null。
   - (happy) `parseArgs` は `--root` を読む。
   - (error) `parseArgs` は数でない位置引数（`abc` と `1.5` と `0` の表）を投げる。
   - (error) `parseArgs` は知らない旗の後に数が来ても投げる。
   - (error) `parseArgs` は `--root` の値が欠けていても投げる。
   - (error) `parseArgs` は 2 つ目の位置引数を投げる。
   - 落とす: 「一桁月日は 0 埋めする」（`toYYMMDD` の 1 つのケースの表に畳む）。
   - 落とす: 「80 文字はそのまま」「`///` は no-branch」（起きにくく、壊れても誰も気づかない）。
   - 落とす: 「`--root=/tmp/x` の `=` の形」（知らない旗のケースと同じ仕様。旗を外しても数でない位置引数として投げる）。
   - 落とす: 「EEXIST で投げる」の errno の断言（Node の `mkdirSync` が返す errno で、製品の仕様ではない）。投げること自体は残す。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## Notes

### Slice 1: 書式と雛形

- Findings: なし
- Unplanned: なし
- Commit: c0061d1
- Stopped:

### Cleanup: createLeafDir の重複断定の整理

- Findings:
  - `.pi/skills/adr/scripts/scaffold.test.ts` の `createLeafDir` の成功確認から `statSync(leaf).isDirectory()` の断定を削り、`existsSync` と道の一致に寄せました（同じ作りの確認の重複であり、dir であることは Node の `mkdirSync` が決める前提のためです）。
  - 消えた振る舞いを確かめる試験は残っておらず、削る対象はありませんでした（`80文字`・`///`・`=` 形・`EEXIST` の errno は slice で除去済みです）。
  - 本計画が止めた分岐を踏む試験はなく、削る対象はありませんでした（製品の分岐は変えず、試験だけを整えたためです）。
  - 残りは型や schema が決める前提の再現ではなく、誰も気づかない振る舞いでもないため、保ちました。
  - 削除後は `pnpm test:related`・`pnpm typecheck`・`pnpm lint`・`pnpm format:check` が緑です。
- Unplanned: なし

## Review

### Plan review

- `scaffold.test.ts:56` の混ざった一覧は、旧形の分岐を外しても `015` から `16` になり、緑のままでした。
  - fixed: 新しい形のケースと、旧形だけのケースに分けた。旧形の裏付けは後者が持つ。
- `scaffold.test.ts:139-140` の `--bogus` と `--root=/tmp/x` は、旗の分岐を外しても数でない位置引数として投げるため、緑のままでした。
  - fixed: 知らない旗の後に数を置くケースと、`--root` の値が欠けるケースに分けた。`=` の形は落とした。
- `scaffold.test.ts:39` の `///` は、記号だけの枝名で、起きにくく壊れても誰も気づきません。
  - fixed: 落とすことにした。
- `scaffold.test.ts:133` の `1.5` は `abc` と同じ仕様の重複でした。
  - fixed: 1 つの表に畳んだ。
- `test/close-fixture.ts` の、テストの外で走らせたときの振る舞いが、どこにも書かれていませんでした。
  - fixed: 「文字列を組み立てるだけで、プロセスも FS も開かない。テストの外から読まれても、何も起きずに止まらない」と書き足した。

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
