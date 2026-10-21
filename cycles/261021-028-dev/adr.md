# ADR 028

## 01: ループした thinking をどの時点で、どの形に書き換えるか

### Context

- `opencode-go/deepseek-v4.1-flash` の thinking が、短い並びの連呼に崩れることがある。崩れた reasoning は次のリクエストに `reasoning_content` として戻り、次のターンの thinking を引きずるという報告がある（HF `DeepSeek-V4-Flash-0731` discussions #39）。
- owner の求めは、ループを途中で止めることではない。ループは起きたものとして受け入れ、メッセージが確定した後に書き換えて、次のターンに壊れた reasoning を渡さないことである。
- 書き換えの口は 2 つある。`message_end` で差し替えを返す（保存物も表示も送信も変わる）と、`context` で送信直前だけ変換する（原本は残る）。
- 畳む対象は、閾値を超えて同じ周期が続いた区間だけにする。閾値未満は触らない。

### Decision

- Status: **accepted**
- Adopted:
  - `message_end` で差し替えたメッセージを返す。TUI、session の JSONL、次のリクエストが同じ内容になる。
  - 閾値を超えた周期区間だけを取り除く。跡に何を置くかは 02 が決める。
  - 閾値未満のメッセージは `undefined` を返し、1 文字も変えない。
  - ループを止めるための `ctx.abort()` は持たない。
- Options:
  - `context` で送信直前だけ畳む（原本が残るが、リクエストごとに走査が走り、画面には生の連呼が出るので壊れていても気づけない）。
  - `message_update` で `ctx.abort()` する（ループを止めるのが目的で、owner の intent と違う）。
  - ブロック全体をマーカー 1 行に置換する（loop-police の形。前方の有用な部分も消え、均一なマーカーは「空スタブが写される」という HF #39 の報告に近づく）。
  - 退化を検出した位置から尾を切る（前方は残るが、文が途中で終わり、周期の形も残らない）。
  - 別モデルで要約する（遅延とコストが増え、要約そのものが新しい in-context の例になる）。

### Research & Trial

- このモデルは thinking を `reasoning_content` として次のリクエストに戻し、戻るのは差し替えた後の `thinking` 文字列である（`pi-ai/dist/api/openai-completions.js:1005-1010`）。
- 差し替えは in-place で、次のターンは同じオブジェクトを読む（`pi-coding-agent/dist/core/agent-session.js:868-881, 920-936`、`pi-agent-core/dist/agent-loop.js:267, 307-320`）。
- ツール付きのリクエストでは `reasoning_content` の返却が必須で、返さないと 400 になる（`https://api-docs.deepseek.com/guides/thinking_mode`）。pi は無いとき `""` を入れる（`openai-completions.js:1049-1052`）。
- 周期を畳んでも本文は空にならないので、この必須要件を壊さない。
- 反復を縮めて残す拡張は既に無い。loop-police はブロックごとマーカーに置換して signature も落とし、antiloop は thinking を書かず、thinking-label-strip（decorated-pi）はタグの頭尾を剥がすだけである。
- 畳んだ結果が次のターンの連呼を減らすかは、誰も報告していない。自然にループが起きるのを待つ観察でしか分からない。
- 実ログでは、ループは「末尾に 1 本の長い帯」ではない。814 行は 63 個、828 行は 57 個の短い帯が散らばる形で、正常な文を挟んで何度も現れる。末尾を切る形は、正常な末尾を消して帯を残すことになる。
- 実ログの帯は両端が `。` や `.\n\n` に当たっている。区間の被覆率は 814 行が 70%、1124 行が 88% である。
- 実ログ 1,203 個の thinking（500 字以上）で、周期 4〜120 字・6 回以上・区間 60 字以上という条件のとき、正常 518 個での誤検出は 0 件、中間 1,004 個で 1 件、壊れ 147 個で 83 件だった。
- 16-gram の頻度だけでは判定できない。2026-10-17 のブロックは 16-gram が 1,186 回出るが、中身は行頭の 16 文字の空白で、周期検出では当たらない。
- 退化ループは狙って起こせない。trial で確かめられるのは、畳み込みが正しく動くことと、書き換えた本文が次のリクエストの `reasoning_content` になることまでである。

### Definition Change

- `Unit.thinking-scrub`(added): エージェントが、ループした thinking を取り除き、次のターンに持ち越さない

## 02: 畳んだ跡に何を残すか

### Context

- 01 で、閾値を超えた周期区間を取り除くと決めた。取り除いた跡に何を置くかが残っている。
- 跡に残した本文は次のリクエストに戻る。だから跡の形は表示の体裁ではなく、次のターンに渡る in-context の例そのものである。
- HF #39 は、空の thinking ブロックが溜まるとモデルがそれを写すこと、均一なフィラーで埋めると出力が平らに崩れることを報告している。
- 「周期を何回分残すか」を意味のある選択として扱っていたが、周期の中身はフィラーなので、残す回数に情報としての意味は無い。

### Decision

- Status: **accepted**
- Adopted:
  - 区間を消す。跡に何も足さない。
  - 消した境目の前後の文字がどちらも空白でないときだけ、空白 1 個を挟む。語の癒着を防ぐためである。
  - 句読点を補う、改行を足す、注記を挟む、周期を残す、のどれもしない。
- Options:
  - 周期の先頭 1〜2 回を残す（残るのはフィラーそのもので、情報を保たない。814 行の `p=5` では `the *the *` になるだけである）。
  - 周期の中身から作った注記を挟む（注記自体が in-context の例になり、モデルが真似する側に倒れうる。HF #39 の均一なフィラーの警告に近づく）。
  - 空にする（HF #39 の報告と正面から衝突し、`reasoning_content` の必須要件も空になる）。
  - 単語境界まで広げて消す（実測で悪化した。`I'll` を食って ` read the plan's` になり、文末の句点も食う）。
  - 改行 1 つで置き換える（実測で文末の `.` が宙に浮いて `session's \n.\n\n` になった）。

### Research & Trial

- 実ログの 2 ブロックに 4 案を当てた。区間を消すだけが最も短く（814 行 46,708 → 14,216 字で 70% 減、1124 行 20,561 → 2,409 字で 88% 減）、境目も `。` や `.\n\n` に当たって読める形で残った。
- 単語境界まで広げる案は、814 行で 14,134 字、1124 行で 2,288 字と短くなるが、`I'll` と文末の句点を巻き込んで消し、連結した文が読めなくなった。
- 改行 1 つで置き換える案は、814 行で 14,282 字、1124 行で 2,436 字。区間の外に残った `.` が改行の後に宙に浮いた。
- HF `DeepSeek-V4-Flash-0731` discussions #39: 空の `<think></think>` が 60 ターン溜まると 12/12 でループする。均一なスタブに潰すと出力が `flat 54 tokens` に崩れる。`Leaving gaps is better than filling them with uniform filler`。
- loop-police はマーカー 1 行に置換する形を採っており、この形が実物で動くことは確かめられている。ただし跡の形がモデルの挙動に与える影響は測られていない。

### Definition Change

- なし

## 03: どのブロックを書き換えの対象にするか

### Context

- thinking ブロックは、プロバイダと API によって replay のされ方が違う。書き換えてもモデルに届かない場合と、壊すと危険な場合がある。
- owner の求めは、意味のあるブロックかどうかを内部のロジックで判定し、意味の無いブロックには触らないことである。

### Decision

- Status: **accepted**
- Adopted:
  - `thinkingSignature` が `reasoning_content` / `reasoning` / `reasoning_text` のいずれかであるブロックだけを対象にする。
  - それ以外のブロックは読むだけで、書き換えない。
  - `redacted` のブロックは対象にしない。
- Options:
  - プロバイダ名（`opencode-go`）で判定する（同じプロバイダでも API の形が変われば外れる。他の deepseek 系プロバイダでは効かない）。
  - `ctx.model?.compat?.thinkingFormat === "deepseek"` で判定する（セッションのモデルに依存し、メッセージ自身が持つ根拠を見ない）。
  - すべての thinking を書き換える（届かないブロックを無駄に書き換え、実署名を持つブロックでは replay を壊す）。

### Research & Trial

- `openai-completions` では `thinkingSignature` は暗号署名ではなく、replay 先のフィールド名である（`pi-ai/dist/api/openai-completions.js:284-295, 400-407`）。
- 送信時は `assistantMsg[<その名前>] = 結合した thinking` になる（同 1005-1010）。名前が `reasoning_content` 系でなければ、本文は送られない。
- `reasoning_details` 経路では `thinkingSignature` に JSON が入り、replay されるのは本文ではなくその JSON である（同 416-425）。
- anthropic の実署名は中身と対応しており、本文だけを書き換えると署名と食い違う。

### Definition Change

- なし

## 04: 操作の口と Unit の `Who`

### Context

- owner は、この挙動をコマンドで on/off でき、状態（有効か、直近で畳んだか、何回畳んだか）を見られることを求めた。
- コマンドを使うのは owner だが、主たる機能はエージェントの側にある。どちらを `Who` に置くかで、01 の行の書き方が変わる。

### Decision

- Status: **accepted**
- Adopted:
  - `Who` は `agent` に置く。主たる機能は、エージェントの thinking が次のターンに持ち越されないことである。
  - コマンドで on/off と状態を見られるようにする。状態は、有効か、直近に畳んだか、畳んだ回数。
  - コマンドは新しい名詞を作らないので、`thinking-scrub` の中に入る。
- Options:
  - `settings.json` だけで切り替える（コマンドを持たない。状態が見えない）。
  - 常時 on にする（誤爆したときに逃げ場が無い）。
  - `Who` を `owner` に置く（切り替えと状態を見る行為が主になり、畳むという主たる機能が行に出ない。切り替えを主たる機能として見るなら、後で別の Unit として立てる）。

### Research & Trial

- 拡張のコマンドは `pi.registerCommand()` で登録する（`pi-coding-agent/docs/extensions.md`）。
- 設定は `.pi/extensions/<name>/settings.json` に置く形が既にこのリポジトリにある（`.pi/extensions/intent-router/settings.json`）。

### Definition Change

- なし（01 の `Unit.thinking-scrub` の行は、`Who` を `agent` に置いたまま確定する）
