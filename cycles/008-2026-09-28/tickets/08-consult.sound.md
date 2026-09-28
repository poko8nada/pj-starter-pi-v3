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

### Unplanned

- `.pi/extensions/consult/README.md` の code 節にあった「the two commands」が、`/consult-sound` で 3 つになったのに合わせて古くなっていたので、「the commands」に直した

Commit:
