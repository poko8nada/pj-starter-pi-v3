# PLAN `arg-cleanup`

- No: 01
- Place: worktree
- Boundary Plans: なし

## Goal

thinking-scrub の実装から読まれない引数が消える。

## Design

- Inside:
  - Modules: なし。`runCommand` と `resetOnUser` の署名だけを変え、モジュールの分割や統合はしない。
  - Dirs: なし。
- Outside:
  - Extract: なし。
  - Colocate: なし。

## Files

```text
.pi/
  extensions/
    thinking-scrub/
      command/
        scrub.test.ts        update
        scrub.ts             update
      live/
        guard.test.ts        update
        guard.ts             update
      index.ts               update
```

## Slices

## 1.読まれない引数の削除

`runCommand` の第 3 引数と `resetOnUser` の引数を削除し、呼び出し側を合わせる。

### Types

```ts
export function runCommand(port: CommandPort, command: ScrubCommand): readonly string[];

export function resetOnUser(): Guard;
```

### Steps

1. `.pi/extensions/thinking-scrub/command/scrub.ts`
   1. update: `runCommand` の第 3 引数 `at: number` を削除する。
   2. update: `void at;` を削除する。
2. `.pi/extensions/thinking-scrub/index.ts`
   1. update: `runCommand` の呼び出しから第 3 引数 `options.now()` を削除する。
   2. update: `resetOnUser(state.guard)` を `resetOnUser()` に直す。
3. `.pi/extensions/thinking-scrub/live/guard.ts`
   1. update: `resetOnUser` の引数 `guard: Guard` を削除する。
   2. update: `void guard;` を削除する。
4. `.pi/extensions/thinking-scrub/command/scrub.test.ts`
   1. update: `runCommand` の 11 の呼び出しから第 3 引数 `100` を削除する。
5. `.pi/extensions/thinking-scrub/live/guard.test.ts`
   1. update: `resetOnUser(second.guard)` を `resetOnUser()` に直す。

### Policy

- Allowed:
  - 振る舞いを変えない範囲で、引数の宣言と呼び出しを直す。
  - `cycleText` の `sep` を残す。
- Forbidden:
  - 型を満たすためだけの引数を削除する - 型が壊れる。
  - `cycleText` の `sep` を削除する - 実装が外側の `.join(sep)` で読んでおり、「読まれない引数」に当たらない。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/command/scrub.ts .pi/extensions/thinking-scrub/index.ts .pi/extensions/thinking-scrub/live/guard.ts .pi/extensions/thinking-scrub/command/scrub.test.ts .pi/extensions/thinking-scrub/live/guard.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## Notes

### Slice 1: 読まれない引数の削除

- Findings: なし
- Unplanned: なし
- Commit: 7e85eb42bbc49a40929823131fa1c15c331cf253
- Stopped:

### Cleanup: 重複テストの削除と前提の明示

- Findings: なし
- Unplanned:
  - `.pi/extensions/thinking-scrub/command/scrub.test.ts` の `lastAt が数値の状態ならその時刻の行になる` を削除 — `enabled が false の status なら...` が厳密な行一致で時刻行と回数行を確かめており、同じ振る舞いの弱い重複だったため。
  - 同ファイルの `broken 設定でも off は...` を削除 — `on と off は...` と同じ振る舞いで、set 分岐は settings を読まないため broken の前提は分岐を変えなかったため。
  - `.pi/extensions/thinking-scrub/live/guard.test.ts` の `19999 文字のランなら idle になる` を削除 — 既定 minThinking の −1 だけを確かめる境界値のテストで、design.md の `Test cases` が書かないもののため。
  - 同ファイルの `live.minThinking を 5000 にした設定で 5000 文字のランなら stop になる` を削除 — 既定閾値のテストと同じ振る舞い（閾値のラン → stop）で、分岐は変わらないため。
  - 同ファイルの既定閾値テストの `20_000` 直値 3 箇所を `tuning.live.minThinking` から組むよう直した — 閾値の前提は `defaultSettings` にあり、テストが隠していたため。
  - `command/scrub.test.ts` の既定設定テストの明示的な既定値指定を `fakePort()` に直した — 誰も変えない共有の前提をそのまま使うため。

## Work Review

### Round 1

- Stale:
  - なし: `runCommand` の `at`／`void at`、`resetOnUser` の `guard`／`void guard`、呼び出し側の `options.now()`／`state.guard` への参照残りはなく、コメント・ドキュメントの stale はない。題名の `20000` は magic として Noise で扱い重複させない。
- Unlisted:
  - なし: 差分（committed＋未 commit の test cleanup を含む）が触る `.pi/extensions/thinking-scrub/command/scrub.ts`・`index.ts`・`live/guard.ts`・`command/scrub.test.ts`・`live/guard.test.ts` はすべて `## Files` に列挙済みであり、Files 外の製品ファイルの変更はない（plan md 自体の Notes 追記は記録であり製品変更ではない）。
- Gaps:
  - `.pi/extensions/thinking-scrub/command/scrub.ts:50`／`.pi/extensions/thinking-scrub/live/guard.ts:27`: 新署名の arity を自動で固定する検査がない。`at?: number` や `guard?: Guard` の任意引数として残しても、更新済みの 2 引数／0 引数呼び出しのテストと `typecheck` は緑のままで、`Verify` の `Added: なし` はこれを補わない。Goal「読まれない引数が消える」の消滅自体を自動で確かめられず、手順の目視読みだけが頼りになる。
    - fixed: 両 test ファイルに `describe('signature')` を追加し、`Parameters<typeof runCommand>` と `Parameters<typeof resetOnUser>` の `toEqualTypeOf` で新署名を固定した。`at?` 復活で typecheck が落ちることを一時的復活で確かめた。
  - `.pi/extensions/thinking-scrub/live/guard.ts:60`／`.pi/extensions/thinking-scrub/live/guard.test.ts:51`: `thinking.length < live.minThinking` の短文 idle 分岐の直接の case が、`19999 文字...` 削除後にない。残る idle 系（`guard.test.ts:51` の `tail*2`、`61` の `minThinking*2` の素振り、`72` の `maxAborts: 0`、`84` の `minRunChars`、`96` の間隔未到来）はいずれも長さが閾値以上であり、短文で `scanned` を据え置く振る舞いを確かめない。`design.md` の「boundary は単独 test にしない」に従うとしても、`empty` 側の短文 idle が空席になる。
    - fixed: `describe('observe')` に閾値の半分（tuning 由来）の `empty` ケース「閾値より十分短い thinking なら idle で見た位置が進まない」を追加し、短文 idle 分岐の `scanned` 据え置きを直接確かめた。
- Policy:
  - なし: `Allowed`（振る舞いを変えない引数宣言・呼び出しの修正）の範囲であり、`cycleText` の `sep` は `.pi/extensions/thinking-scrub/scrub.fixture.ts:35` に残り、`Forbidden`（型合わせだけの引数削除、`sep` 削除）のいずれも行っていない。
- Unproven:
  - なし: 残る test は名指す振る舞いを反転させれば赤になる。例：`.pi/extensions/thinking-scrub/command/scrub.test.ts:57` の `off` 行を `on` に変えれば `toEqual([SCRUB_OFF_LINE])` が落ち、`.pi/extensions/thinking-scrub/live/guard.test.ts:127-128` の `reset` を空でなくせば `toEqual(emptyGuard())` が落ち、`96-111` の `scanEvery` 未満で `enabled` を呼ばせれば `calls` が `0` でなく落ちる。
- Noise:
  - `.pi/extensions/thinking-scrub/live/guard.test.ts:36`: 題名の `20000 文字` が magic number／hardcoded string として残る。本文は `38`・`39`・`48` 行目を `tuning.live.minThinking` 由来に直したのに題名だけ直値のままで、`defaultSettings`（`.pi/extensions/thinking-scrub/settings/schema.ts:50` の `minThinking: 20_000`）が変われば題名が嘘になる。Cleanup が「`20_000` 直値 3 箇所を直した」とする一方で 4 箇所目（題名）を見落としている。
    - fixed: 題名を「既定の live と閾値の長さのランなら stop で見本つきになる」に直し、直値を題名から除いた。
- Doubts:
  - `.pi/extensions/thinking-scrub/command/scrub.test.ts:91` の題名「3 グループの SettingsRead と status...」の「3 グループ」とは何を指すか。本文が `fakePort()` の既定（`ok`＋既定 status）に簡略化された後も題名が正しいか、所有者の判断が要る（直さず閉じるか、題名を実態に合わせるか）。
  - 短文 idle の空席（Gaps 2 件目）を `empty` の case として補うべきか、それとも現状の idle 系で十分とみなして閉じるか、所有者の判断が要る。

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal:
- Ran:
- Findings:
- Doubts:
