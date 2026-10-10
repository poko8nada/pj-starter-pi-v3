# consult.sound

Owner: in the loop

Acceptance:

- 子が走っている間は無音で、始まるときと終わるときにだけ `Tink` が鳴る、が解ける: 子が 1 体以上走っている間、5 秒ごとに 1 音（何体でも 1 音、タイマーも 1 本）。0 体で止まる。始まりと終わりの音は無い
- 音を止める口が無い、が解ける: `/consult-sound on|off`（既定 on、セッション限り）
- テストで鳴る、が解ける: 鳴らす所が差し替えられ、テストでは鳴らない
- `consult/README.md` が追随している

止まり方: 子を 1 体走らせて、5 秒ごとに 1 音、子が終わって止まるのを owner が聞く。`/consult-sound off` で止まることも聞く。何をもって終わりか: owner が「残す」と言う（直すなら、その場で直して、また聞く）

## Todo

- `.pi/extensions/consult/tool/sound.ts`（add）
  - `startSound()` / `stopSound()` / `setSoundEnabled(on)` — `setInterval` を 1 本だけ持ち、`Tink` を `afplay` で鳴らす。`afplay` の起動は差し替えられる形にする（テストでは鳴らさない）
  - `enabled` の状態（既定 on）と、`/consult-sound` から読む口
- `.pi/extensions/consult/tool/consult.ts`
  - 子の増減（`state.children`）— 0 から 1 になったら `startSound()`、1 から 0 になったら `stopSound()`
  - `playSound()` の呼び出し（いま子を起こす前と全部終わった後の 2 か所）— 消す
  - `commands` — `sound` を足す（`on` / `off` / 引数なしは現在の状態）
- `.pi/extensions/consult/index.ts`
  - `pi.registerCommand('consult-sound', …)` を足す（handler は `tool/consult.ts` の `commands`）
- `.pi/extensions/consult/tool/render.ts`
  - `playSound` — 鳴らす所を `sound.ts` に移す（外部から使われていなければ消す）
- `.pi/extensions/consult/README.md`
  - 音の説明と `/consult-sound` を書く
- `.pi/extensions/consult/tool/sound.test.ts`（add）と `.pi/extensions/consult/tool/consult.test.ts`（update）
  - 差し替えた鳴らす関数で、鳴る・鳴らないと、タイマーが 1 本であることを確かめる

## Verify

### test

- `pnpm test consult`（4 ケース）
  - 子を 2 体走らせる → 音は 1 本のタイマーで、5 秒ごとに 1 回（happy）
  - 子が 0 体になる → タイマーが止まる（happy）
  - `setSoundEnabled(false)` → 鳴らない（happy）
  - 子が 0 体のまま 5 秒経つ → 鳴らない（error 相当）
  - テストの実行中は鳴らす関数が差し替わっている → 一度も鳴らない（happy）

### look

- owner が実際に聞く
  - 子を 1 体走らせて、5 秒ごとに 1 音、終わりで止まること
  - `/consult-sound off` → 鳴らなくなること

### read

- `review` の子に `.pi/extensions/consult/README.md` を渡す
- 合格: 5 秒ごとの音と `/consult-sound on|off` と既定 on が書いてある（2・4 行）

## Notes

### Findings

- なし
- （この step の実行中に起きた、別の穴）: 親プロセスが crash した。`work/SKILL.md` の指示で reload したあと、走っていた `review` の子（この step の影響読み）の完了通知で `deliver`（`tool/consult.ts:471`）が古い `pi` を使い、「This extension ctx is stale after session replacement or reload」で uncaughtException。未コミットの子の create の作業は worktree ごと宙に浮いた（`git worktree list` に `consult-ZH2ntR/wt` が残る）。詳細と直しの方向は定義の `Carry over` 4 本目に書いた。この step の変更（音）自体は、`test`・`read`・owner の `look` の 3 つとも通った

- （影響読み `consult-2` の指摘と、親の修正）
  - blocking（直した）: タイマーを止める口が子の `finally`（`size === 0`）の 1 か所だけで、`session_shutdown` が無かった → reload / セッション差し替えで古いインスタンスの timer が鳴り続ける。`index.ts` に `pi.on('session_shutdown', () => stopSound())` を足した
  - 直した: `README.md:112` の「two faces for stopping」を「stopping a child」にし、停止の表から `/consult-sound` を外した（音の制御は停止ではない。Sound の節にある）
  - 直した: `sound.test.ts:5` のコメント（「既定へ戻す」は `player` には当たらない）を正確にした
  - 未対応: チケットの `Verify` の「4 ケース」は実際は 10 件（`sound.test.ts` 5 + `consult.test.ts` の音 5）。`sound.test.ts` の追加も `Unplanned` に無い
  - 未対応: timer はモジュールに 1 本、子の数は runtime ごとの `state.children`。runtime が 2 つあると、先に 0 体になった側が止める（production は 1 つなので実害は薄い）
  - 未対応: cancel は `controller.abort()` だけで `stopSound()` を呼ばない（runner が settle するまで鳴る）。この経路のテストは無い。`startSound` は 0→1 の遷移でしか呼ばれない

### Unplanned

- `.pi/extensions/consult/README.md` の code 節にあった「the two commands」が、`/consult-sound` で 3 つになったのに合わせて古くなっていたので、「the commands」に直した

Commit: 90270b5 + fee7efd（90270b5 = 子の実装、fee7efd = 影響読みの blocking（`session_shutdown` でタイマーを閉じる）と README の修正）
