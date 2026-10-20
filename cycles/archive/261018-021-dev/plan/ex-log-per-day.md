# PLAN `ex-log-per-day`

## Files

```text
.pi/extensions/intent-router/
  record/
    log.ts                   add
    log.test.ts              add
    recent.ts                drop
    recent.test.ts           drop
  settings/
    schema.ts                update
    schema.test.ts
  settings.json              update
  command/
    intent.ts                update
    intent.test.ts
  index.ts                   update
  index.test.ts
  README.md                  update
README.md                    update
README.ja.md                 update
```

## Slices

## 1.記録を日ごとの JSONL にする

### Types

```ts
/** record/log.ts — 日ごとの 1 ファイル。中身の欄は今のまま */
export interface IntentRecord {
  readonly at: string;
  readonly hook: 'route' | 'judge';
  readonly owner_now: string;
  readonly agent_prev: string | null;
  readonly choice: Choice | null;
  readonly confidence: number | null;
  readonly threshold: number | null;
  readonly guide: string | null;
  readonly verdicts: { readonly related: Verdict; readonly answerable: Verdict } | null;
  readonly unrelated: number | null;
  readonly nudge: string | null;
  readonly fired: boolean;
  readonly state_chars: number;
  readonly truncated: boolean;
}

/** `logs/<YYYY-MM-DD>.jsonl`。日付は `record.at` の現地時間（JST）から取る */
export function logPath(dir: string, at: Date): string;

/** その日のファイルの末尾に 1 行足す。切り詰めない。ディレクトリが無ければ作る */
export function append(record: IntentRecord, dir: string): void;

/** `YYYY-MM-DD.jsonl` の名前だけを見て、`keepDays` より古い日付のファイルを消す。消した数を返す */
export function prune(dir: string, keepDays: number, at: Date): number;
```

### Steps

1. `.pi/extensions/intent-router/record/log.ts`:
   - 上の 3 つを書く。`append` は `appendFileSync` で 1 行足す（旧実装の「読んで書き戻す」より単純に。書くのはこのモジュールだけなので、行末の改行は自分が保証する）。`prune` は日付の名前だけを見て、他の名前には触らない
2. `.pi/extensions/intent-router/record/log.test.ts`:
   - ファイルと日付の規則のケースを書く（既存の `record/recent.test.ts` のやり方に合わせる）
3. `.pi/extensions/intent-router/record/recent.ts` と `.pi/extensions/intent-router/record/recent.test.ts`:
   - 消す。読んでいた所（`index.ts`、`route/hook.ts`、`judge/hook.ts`、`command/intent.ts` とそれぞれのテスト）は新しい名前に移す（中身の変更は slice 2 と 3）

### Verify:

- `test`: `.pi/extensions/intent-router/record/log.test.ts`、`pnpm vitest run .pi/extensions/intent-router/record` と `pnpm vitest run .pi/extensions/intent-router`（移し漏れが赤になる）
  - (happy) `append` を 2 回 → その日のファイルが 2 行になり、1 行目は消えていない（切り詰めない）
  - (happy) 各行が JSON として読めて、記録の 14 の欄を持つ
  - (boundary values) 協定時と日付がずれる時刻（地方時 2026-10-09 00:30）→ 名前が `2026-10-09.jsonl` になる（地方時で決めている）
  - (empty) ファイルが無い → `append` がディレクトリごと作る
  - (boundary values) `prune(dir, 14, 2026-10-20)` → 2026-10-05 のファイルは消え、2026-10-06 のファイルは残る
  - (happy) `prune` が消した数を返す（2 消えたら 2、消えなければ 0）
  - (empty) `prune` に日付の名前でないファイル（`keep.txt`、`2026-10-01.json`）を置く → 消さない
  - (empty) ディレクトリが無い → `prune` は 0 を返す

## 2.設定と配線を日ごとのファイルに合わせる

### Types

```ts
/** settings/schema.ts — `record.recent` を置き換える */
readonly log: {
  readonly keepDays: number;   // 14
};

/** index.ts の配線 */
// 記録の置き場はコードで決める（.pi/extensions/intent-router/logs）
// セッションの始まりに 1 回 prune する
```

### Steps

1. `.pi/extensions/intent-router/settings/schema.ts`:
   - `record` を `log` に置き換え、`keepDays`（既定 14、1 以上）を持つ。`record.recent` は消す
2. `.pi/extensions/intent-router/settings.json`:
   - `log.keepDays` を書く
3. `.pi/extensions/intent-router/settings/schema.test.ts`:
   - `log.keepDays` のケースに置き換える
4. `.pi/extensions/intent-router/index.ts`:
   - 記録の書き込みを `append(record, logDir)` にし、`session_start` で `prune(logDir, settings.log.keepDays, new Date())` を 1 回呼ぶ
5. `.pi/extensions/intent-router/index.test.ts`:
   - `session_start` で古い日付のファイルが消えることを見るケースを足す（既存のやり方に合わせる）
6. `.pi/extensions/intent-router/README.md`:
   - 設定の表（`record.recent` → `log.keepDays`）と `Record` のセクションを、日ごとの JSONL に合わせる
7. `README.md` と `README.ja.md`:
   - 記録の説明を日ごとの JSONL に合わせる

### Verify:

- `test`: `.pi/extensions/intent-router/settings/schema.test.ts` と `.pi/extensions/intent-router/index.test.ts`、`pnpm vitest run .pi/extensions/intent-router/settings .pi/extensions/intent-router/index.test.ts`
  - (happy) 既定の `log.keepDays` が 14
  - (happy) `log` を書かない → 既定の 14 のまま
  - (happy) `log.keepDays` が 1 → 通る
  - (error) `log.keepDays` が 0 → 投げる
  - (error) 旧い `record` を書く → 投げる
  - (happy) `log.keepDays` を 1 にして `prune` → 1 日より古い物だけが消える（設定から読んでいる）
  - (happy) セッションの始まりで、`keepDays` より古い日付のファイルだけが消える
  - (happy) 往復のあと、その日のファイルに 1 行増える

## 3.`/intent last` を消す

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/intent-router/command/intent.ts`:
   - `last` の枝と `tail` の依存を消す。下位コマンドは、引数なし（今の状態）/ `on` / `off` / `set` の 4 つになる。使い方の文からも `last` の行を消す
2. `.pi/extensions/intent-router/command/intent.test.ts`:
   - `last` のケースを消し、`last` が使い方の文を返すことを見るケースを足す
3. `.pi/extensions/intent-router/README.md`:
   - コマンドの表から `last` を消す

### Verify:

- `test`: `.pi/extensions/intent-router/command/intent.test.ts`、`pnpm vitest run .pi/extensions/intent-router/command`
  - (happy) `/intent` は今の状態を返す
  - (happy) `/intent on` と `/intent off` でモードが変わる
  - (happy) `/intent set` が設定を書く
  - (boundary values) `/intent last` と `/intent last 3` → 使い方の文を返し、その文に `last` の行が無い（古い文面のままでは緑にならない）
  - _no case_: `last` の数を読む道 — 消えるので、ケースにならない

## 4.統合: 1 日は 1 ファイルに足されていき、古い日付だけが消える

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/intent-router/index.test.ts`:
   - 1 本の配線で、往復 2 回が同じ日付のファイルに 2 行として足されることを見るケースを足す

### Verify:

- `test`: `.pi/extensions/intent-router/index.test.ts`、`pnpm vitest run .pi/extensions/intent-router`
  - (happy) 往復 2 回 → その日のファイルが 2 行になり、1 行目の内容が変わっていない
  - (happy) 日付をまたぐ 2 件 → 2 つのファイルに分かれる
  - (happy) 古い日付で `append` したファイルが、セッションの始まりの `prune` で消える
  - (empty) 道具を使わない往復 → 行が増えない
  - (error) ask が失敗した往復 → 1 行残る

## 5.テストの棚卸し

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/intent-router/` のテストを読む:
   - この変更で要らなくなった検査（1 ファイル・直近の窓・`/intent last`・`record.recent` を前提にした物）を消す。消した物と理由を `## Notes` に書く
   - 同じ趣旨の検査が 2 つある所があれば、片方に寄せる

### Verify:

- `test`: `pnpm vitest run .pi/extensions/intent-router` と `pnpm test:run`
  - (happy) 全件が緑
  - (empty) 消した名前（`recent`、`intent last`、`record.recent`）への参照が 0 件（`git grep -n "recent\|intent last" -- .pi/extensions/intent-router`）
  - _no case_: 消した検査の数 — 数の増減そのものは振る舞いではない

## Notes

### Slice 1: 記録を日ごとの JSONL にする

- Findings: なし
- Unplanned:
  - `index.ts` とテストに一時的な `tail` 互換を置いた（slice 3 で消える物）
  - `route/hook.ts` / `judge/hook.ts` / `command/intent.ts` の型の輸入先を `record/log.ts` に移した
- Commit: f57ae0d

### Slice 2: 設定と配線を日ごとのファイルに合わせる

- Findings: なし
- Unplanned:
  - `parseIntent('last')` の既定値を `settings.log.keepDays` に付け替えた（`last` 自体の削除は slice 3。`record` が消えて型が通らなくなるため）
- Commit: f461945

### Slice 3: `/intent last` を消す

- Findings: なし
- Unplanned:
  - slice 1 で置いた一時的な `tail` 互換（`index.ts` の `tailLog` とテストの `readAllRecords` など）を消した
  - Record セクションに残っていた `/intent last` の 1 文も消した
- Commit: cf46cf4

### Slice 4: 統合: 1 日は 1 ファイルに足されていき、古い日付だけが消える

- Findings: なし
- Unplanned:
  - 追加の 4 件で `describe` が行数制限に触れたため、`register daily logs` に分けた
- Commit: f8057f4

### Slice 5: テストの棚卸し

- Findings: なし
- Unplanned:
  - 棚卸しで消した物と理由:
    - `schema.test.ts` の「旧い record を書く → 投げる」を消した。未知キー拒否は「知らないキー → 投げる」が既に見るため趣旨が重なり、文字どおりの `recent` 参照が残るため
    - `intent.test.ts` の `last` 系 2 件を 1 件に寄せ、題名から `intent last` の並びを消した。parse と応答の両段で同じ趣旨（`last` は使い方文・文に `last` 行なし）を見るため
    - `index.test.ts` の変数 `recentFile` を `keptFile` に改名した。`recent` 参照を残さないため（振る舞いは同じ）
- Commit: 46b94f9

## Review

### Round 1

- Stale: なし — 古い記録の呼び名や last への言及が残っていないことを確かめた。extension の README の設定表と Record セクション、入口の説明、使い方の文を確認した。対象として .pi/extensions/intent-router/README.md:54 と同:58 と同 index.ts:6 と同 command/intent.ts:54 を見た。
- Unlisted: なし — Files に名前が無い変更は route と judge の輸入先の付け替えと検証補助の読み替えだけで、slice 1 の手順で指示済みのため指摘にしない。対象として .pi/extensions/intent-router/route/hook.ts:11 と同 judge/hook.ts:12 と計画の cycles/261018-021-dev/plan/ex-log-per-day.md:68 を見た。
- Gaps: なし — 各 slice の検査と検証の対応を確認した。slice 1 は .pi/extensions/intent-router/record/log.test.ts:51 と同:63 と同:38 と同:125 と同:148 で満たす。slice 2 は .pi/extensions/intent-router/settings/schema.test.ts:36 と同:114 と同:120 と同:125 と同 index.test.ts:380 で満たす。slice 3 は .pi/extensions/intent-router/command/intent.test.ts:98 と同:147 で満たす。slice 4 は .pi/extensions/intent-router/index.test.ts:406 と同:421 と同:456 と同:471 で満たす。旧い record の検査の削除は slice 5 の棚卸しと Notes の理由付けの範囲のため指摘にしない。
- Unproven: なし — 代表的な壊し方を当てはめても検証が赤くなることを確かめた。日付を協定時にすると .pi/extensions/intent-router/record/log.test.ts:38 が赤くなる。境界を等号に変えると同:125 が赤くなる。使い方の文に last の行を残すと .pi/extensions/intent-router/command/intent.test.ts:106 が赤くなる。始まりの掃除を止めると .pi/extensions/intent-router/index.test.ts:380 が赤くなる。
- Doubts:
  - 始まりの掃除の失敗を握りつぶす点 .pi/extensions/intent-router/index.ts:232 は計画に指示が無く、通常の動きを変えないため指摘にしない。失敗が見えなくなる点は心に留める。
  - 日付として読めない名前の扱い .pi/extensions/intent-router/record/log.ts:64 は計画が正常な日付名だけを想定し、実害が無いため指摘にしない。

## Acceptance

- Ran:
  - plan の検査: slice 1〜5 の `Verify` を含む `pnpm vitest run .pi/extensions/intent-router` → 12 ファイル / 208 件が緑
  - `pnpm test:run` → 41 ファイル / 706 件が緑
  - `pnpm typecheck` → ルートと `.pi` とも ok
  - `pnpm lint` → 緑
  - `git grep -n "recent" -- .pi/extensions/intent-router` と `git grep -n "intent last" -- .pi/extensions/intent-router` → どちらも 0 件
  - 壊して赤を確かめた 3 件（同時に入れた）:
    - `record/log.ts` の JST のずれを 0 にする（協定時で日付を取る）→ `logPath` の JST の 2 件と、`append` の日の 1 件が赤
    - `append` を切り詰めに（`writeFileSync`）→ 2 回書いて 2 行になる筋と、日付で分かれる筋が赤（記録を読む hook と index の検査を含む）
    - `prune` の境を 1 日ずらす（`>=`）→ `prune` の境の 1 件と、`session_start` の 1 件が赤
    - 3 件で合わせて 18 件が赤になり、戻すと緑に復帰
- Findings:
  - なし
- Doubts:
  - なし
