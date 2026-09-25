# readme

Acceptance:

- 何が入っているか分かる
- 最初に何をすればいいか分かる
- 書いてあることと実物が食い違わない
  - 節の数
  - 各スキルの役割
  - 検査の数
- 拡張の一覧に `ref-cleanup` と `sound-notify` がある
- `close` の行がある

## Todo

- README
  - ルートの 2 枚
  - `.pi/extensions/consult/README.md` とは別
  - `README.md`
  - `README.ja.md`
  - 拡張の一覧を実物に合わせる
    - いまは `consult` と `quality-gate` しか無い
    - `ref-cleanup` を足す — ref を一覧・判定・削除する道具
    - `sound-notify` を足す — 音と通知
  - スキルの一覧を 6 つにする
    - `.pi/skills/` に `close` が増える
    - サイクルの表にも `close` の行を足す
  - 節の数を `format.md` の実物と一致させる
    - `definition` の 1 枚。数は step 6 の決定で決まる
  - 検査の数を実物と突き合わせる
    - verify に載る 2 つ — `lint` と `typecheck`
  - 各スキルの役割を `description` と突き合わせる（6 つ）
  - 名指しの規則の文はそのまま残す
    - 規則は「次のフェーズを名指ししない」
    - 実物が規則に追いついている
  - 正常系 → `Verify` の実演が担う (happy)
    - clone 直後のつもりで読む
  - null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行 → ケース無し
    - この step は文書の修正で、作るものが無い
  - 失敗の入力 → `Verify` の読み合わせが拾う (error)
    - 拡張が 1 つ抜けている → 4 つ
    - 節の数が古い → `format.md` の実物と一致
    - `close` の行が無い → 行がある
    - 検査の数が古い → 2 つ

## Verify

- clone 直後のつもりで README だけを読み、入っているものと最初の手順が言えるか見る
- README の表と `.pi/skills/*/SKILL.md` の `description` を突き合わせる
- README の拡張の一覧と `ls .pi/extensions/` を突き合わせる
- README の節の数と `format.md` の節の数を突き合わせる
- README の検査の数と quality-gate の verify の検査の数を突き合わせる
- 結果を `Notes` に書く

## Notes

### Findings

- **節の数** — `format.md` の実物と一致させた（決めた）
  - `format.md` の実物は 9（`## Carry over` を含む）
  - step 6 で 9 に決まった（`06-definition-skill` の `Notes` / `Remarks`）
  - README の列挙（英日 2 枚）を 9 に合わせた
- **拡張の一覧** — 実物の 4 つに合わせた（決めた）
  - 実物は 4 つ
    - `consult`
    - `quality-gate`
    - `ref-cleanup`
    - `sound-notify`
  - README の「Extensions」を 4 つに合わせた
  - `quality-gate` は Gates の行にも名前がある
  - `ref-cleanup` の説明は「`consult` が残した ref を一覧し、1 つ消す」（`index.ts` の `description` と一致）
  - 消せるのは `consult/` の ref だけ
- **検査の数** — verify の 2 つと一致、変更なし（決めた）
  - verify に載るのは 2 つ
    - `lint`
    - `typecheck`
  - README の記述と一致、変更なし
- **各スキルの役割** — `description` の 6 つとサイクルの表が一致（決めた）
  - `description` の 6 つとサイクルの表が一致
  - `01-work-skill` の穴「`work` の行に `the review` が無い」を受けて、`work` の行にレビューを足した
- **名指しの規則** — 文はそのまま残した（決めた）
  - 規則は「次のフェーズを名指ししない」
  - 実物が規則に追いついている
- **clone 直後の実演** — README だけを読んだ（決めた）
  - 入っているものが言える
    - 検査
    - ゲート
    - エージェントの規則
    - 6 skill
    - 4 拡張
    - `cycles/`
  - 最初の手順が言える
    - `pnpm install`
    - `cycles/` を消す
    - `types.json` を作る
    - `pi` を起動
- **子が要る実演は親の担当** — この子は子（`consult`）を起こさない（決めた）
  - この子は子（`consult`）を起こさない
- **実演の数え上げ** — 親が実物と突き合わせた（決めた）
  - `format.md` の `##` は 9 で README の列挙と一致
  - `.pi/skills/` は 6 つで README の表と一致
  - `.pi/extensions/` は 4 つで README と一致
  - verify の検査は 2 で README の検査の数と一致
- **親の読み（Step 8）** — 英日の README が同じ内容（決めた）
  - 英日の README が同じ内容
  - 実物と一致
    - 6 skill
    - 4 拡張
    - 9 節
    - 検査 2
- **README は gate の外** — 数え上げだけが実際の gate、次の 1 枚が受ける（次へ回す）
  - README 2 枚は `quality-gate` の lint と typecheck の対象外（マークダウン）
  - この実演の数え上げだけが実際の gate
  - 次の 1 枚が受ける

### Unplanned

なし

Commit: 5073c54（子）
