# ADR 072

## 01: 割り込みメッセージの作り直し

Type: _Full_

### Context

- C1: いまの振る舞い: 生成中に文の周期を検出すると `ctx.abort()` で止め、`agent_settled` で `followUpText` を送る。文面は 3 文の指示と、ループした 3 文の見本（`live.sampleChars` で切る）。
- C2: 届き方: `pi.sendMessage` の `role: "custom"` は、pi がラベルのない `role: "user"` のテキストに変換する。モデルには、自分の思考が切れた直後に装飾のないユーザーメッセージが 1 通置かれたように見える。
- C3: 制約: 検出の条件（`live.minThinking`、`live.scanEvery`、`sentence`）と停止回数の上限（`live.maxAborts`）は変えない。変えるのは割り込みのメッセージに限る。
- C4: 意図: 割り込みメッセージが直後の thinking で無視される傾向を減らす。方向性（文面・見本・印・届き方）は、外部のエビデンスを集めてから議論して決める。

### Research & Trial

- F1: 否定例は、肯定の代替と対で示したときだけ有効で、単独では禁止した振る舞いを誘発しやすい。出所: https://github.com/buecking/incontext/blob/main/docs/patterns/negative-examples.md
- F2: 否定プロンプトは、モデルの規模を上げても zero-shot 性能が改善せず、逆スケーリングを示すタスクがある。出所: https://arxiv.org/abs/2209.12711
- F3: 否定ベンチマークの分析では、文脈・指示・単純な言い回しの追加が多くの場合で性能を下げる。出所: https://arxiv.org/html/2306.08189
- F4: Reflexion では、失敗を言語で要約して次の試行の文脈に与える方式であり、自己反省のフィードバックが意味的な勾配信号として働くと説明する。出所: https://arxiv.org/html/2303.11366v4
- F5: Reflexion の実装は、前回の reasoning trace を与える LAST_ATTEMPT と、前回への自己反省を与える REFLEXION を区別する。出所: https://github.com/noahshinn/reflexion/
- F6: thinking の割り込みで見本の再提示が無視率を下げるかを直接比較した論文・公式ドキュメントは、今回の範囲では見つからなかった。出所: 今回の research の調査範囲（Web 検索。該当なし）
- F7: Anthropic は、明確で直接的な指示と、求める出力を具体的に示すことを推奨する。出所: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- F8: OpenAI は、指示をプロンプトの先頭に置き、区切り文字で指示と文脈を分離することを推奨する。出所: https://help.openai.com/en/articles/6654000-best-practices-for-prompt-engineering-with-the-openai-api
- Anthropic は、長い入力を上に置き、クエリを末尾に置くと品質が最大 30% 改善することがあるとする。出所: https://www.anthropic.com/news/prompting-long-context
- F10: 重要指示は先頭か末尾に置くのが最も効果的であり、中間では注意が薄れる（lost in the middle）とまとめられている。出所: https://navyduck.com/anthropic/ccao-f/q078-long-context-best-practices、https://www.anthropiccertifications.com/courses/claude-certified-architect-foundations/conversation-context-management
- Pydantic AI の DetectLoops は、ループの種類と戦略変更を求める system prompt をループを検知したリクエストに付加する。出所: https://pydantic.dev/docs/ai/harness/detect-loops/
- F12: Pydantic の文例は「同じ引数の呼び出しは結果を変えない。方法を変えるか、何が妨げているかを説明せよ」と、次の行動を具体的に求める。出所: https://pydantic.dev/docs/ai/harness/detect-loops/
- F13: Mistral の例は、3 回目の同一呼び出しを block し、止めて答えよとモデルに伝える。出所: https://docs.mistral.ai/studio/agents/examples/cookbooks/loop-breaker
- DeerFlow は「You are repeating yourself — wrap up now」を、次のリクエストの先頭に system として注入する。出所: https://github.com/bytedance/deer-flow/issues/1055
- F15: OpenHands の nudge は、同じ呼び出しを繰り返しても結果は変わらないと述べ、引数を直すか別の方法を試すよう求める。出所: https://github.com/OpenHands/software-agent-sdk/blob/main/openhands-sdk/openhands/sdk/conversation/stuck_detector.py
- F16: Qwen Code 系の修正提案は、同一呼び出しが 3 回続けば remind し、5 回続けば stop し、モデルに既存の結果を使うか方法を変えるよう伝える。出所: https://github.com/itlackey/akm/pull/1282
- F17: maki-agent はモデルに「You are stuck in a loop. Break out and try a different approach.」と伝える。出所: https://github.com/tontinton/maki/blob/main/maki-agent/src/agent/tool_dispatch.rs
- F18: Berkeley の研究は、割り込みをハード（推論ブロックを閉じる、即時出力を強制する）とソフト（Please answer faster のような指示）に分ける。出所: https://arxiv.org/html/2510.11713v4
- F19: Berkeley の研究は、追従失敗として、思考を止めず回答領域で推論を続ける reasoning leakage、早期ハード割り込みでの最終回答が長くなること、panic、更新を疑って元の思考を続ける self-doubt を報告する。出所: https://arxiv.org/html/2510.11713v4
- NVIDIA の報告では、Thinking Intervention について、推論の開始直後の介入が最も有効で、介入が遅くなるほど効果が弱まるとしている。出所: https://arxiv.org/html/2503.24370v2
- F21: thinking の割り込みで、ラベルのない user テキスト、話者印のある文、system prompt の三者を比較した報告は、今回の範囲では見つからなかった。出所: 今回の research の調査範囲（Web 検索。該当なし）
- Pydantic と DeerFlow の nudge 文は、検知を名乗る文言を置かず、観測した事実から始まる。出所: https://pydantic.dev/docs/ai/harness/detect-loops/、https://github.com/bytedance/deer-flow/issues/1055

### Scope

- In:
  - result: 止めた直後のモデルの振る舞いが変わる（繰り返しを続けず、次の一歩に移る）
  - structure: 設定とスキーマから `live.sampleChars` を外し、`Guard.pending` と `takeFollowUp` の形を変え、`followUpText` を `FOLLOWUP_TEXT` の定数にする
  - logic: 文面を組み立てる規則（見本を載せない、固定文言にする、否定と肯定を対にする、理由を先頭、指示を末尾に置く）が変わる
  - downstream: 文面を参照するテストを整理し、README を修正する
  - expression: 文言が変わる
- Out:
  - safety: 秘密・権限・露出・個人データを扱わない（理由: すでに文脈にある思考を、同じモデルと同じ利用者に返すだけである）
  - failure: 送信の経路と例外の扱い、`maxAborts` の上限を変えない（理由: 文言だけを変える。届き方を変える場合は In に戻す）
  - upstream: 外部の依存を変えない（理由: 文言だけを変える）
  - existing: 保存されたデータや導入済みのバージョンを移行しない（理由: 直すのは現行の文面であり、それはこのエントリの変更そのものである）
  - cost: 割り込み 1 回あたりのトークン数は減るが、判断の対象にしない（理由: 見本を外すことによる削減量は小さく、目的はメッセージを無視されにくくすることである）
  - verification: 確認の手段を変えない（理由: 変更は既存のテストで確かめられ、テスト自体の変更は downstream で扱う）
  - observability: 記録や信号を変えない（理由: `removed N` の報告はそのままにし、画面に出る文面は expression で扱う）
  - release: 配布や適用の手順を変えない（理由: 変更は通常のサイクルのコミットに載る）
  - other: 上記の種類に漏れはない（理由: 扱うのは割り込みの文面だけである）

### Decision

- Status: **accepted**
- Main: 割り込みメッセージが、止めた理由と次の一歩を短く伝え、ループの続きを書かせない（C4）
  - Add:
    - 止めた理由を 1 文で述べる前置き（F13, F16, F17）
    - モデルに次の一歩を 1 文で書かせ、実行を求める肯定形の指示（F7, F12, F15）
  - Update:
    - 否定だけの指示を、否定と肯定の対に変える（F1, F2, F3）
    - 理由を先頭、指示を末尾に置く（F8, F10）
    - 届き方は変えず、ラベルのない user テキストのままにする（C2）
    - `followUpText` を `FOLLOWUP_TEXT` の定数にし、`takeFollowUp` は取った後の `Guard` を返す（C1）
  - Drop:
    - ループした文の見本（C1, F4, F5, F6）
    - 見本を渡すための設定と状態（`live.sampleChars`、`Guard.pending` の見本保持、`sampleOf`）（C1）
- Secondary: 見本を外したことに伴い、テスト、設定、README が新しい形に追従する（C1, F6）
  - Add: なし
  - Update:
    - `guard.test.ts`、`index.test.ts`、`settings/schema.test.ts`、`units.test.ts` を新しい引数と型に合わせ、`agentSettled` を 2 回渡しても送信が 1 回であることを確かめる（C1）
    - `README.md`、`README.ja.md` のフォローアップと `sampleChars` の記述を新しい文面に合わせる（C1）
  - Drop:
    - 見本を扱うテスト（`followUpText`、`sampleOf`）と、その期待値（`FOLLOWUP_REPEATING`、`FOLLOWUP_DO_NOT`、`FOLLOWUP_CONTINUE`）（C1）
- Policy:
  - Allowed:
    - 繰り返しの事実を 1 文で述べ、見本の代わりにする（F4, F5）
    - 文面を短く保つ（F7）
    - 止めた後は、ソフトな指示で次の一歩を求める（F18）
  - Forbidden:
    - 「Do not repeat」だけを置かない - 否定形は単独では禁止した振る舞いを誘発しやすい（F1, F2, F3）
    - ループした文をそのまま見本として載せない - ループの続きを書かせる危険があり、効果の直接の証拠がない（F6）
    - モデルに回答領域で思考の続きを書かせない - reasoning leakage を招く（F19）
    - 検出の条件と `maxAborts` を変えない - 文言だけを変える（C3）
    - 検知を名乗るヘッダーを置かない - 効果の直接の証拠がなく、検知への反論を招くおそれがある（F19, F21）
    - 使わない設定と関数を残さない - 見本を外すと `sampleChars` と `sampleOf` は使われない（C1）

#### Details

- 文面（見本を外し、固定文言にする）
  ```text
  Your thinking was repeating the same sentences, so this turn was stopped. Do not continue that repetition.

  Next: name the next concrete step in one sentence, then do it. If you are blocked, say what is blocking you in one sentence.
  ```

### Definition

- `Unit.thinking-scrub`(kept): 主機能は同じで、変わったのは停止後に送るメッセージであり、そのメッセージはルートである。
- `Unit.thinking-scrub_switch`(kept): 取り除く動作を止めたり戻したりする機能は変わらない。
- `Unit.thinking-scrub_status`(kept): 状態と取り除いた量を確かめる機能は変わらない。
