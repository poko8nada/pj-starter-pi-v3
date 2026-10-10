# DESIGN 011

## `consult-run-watchdog`

consult の run に手を入れる。読むのは consult のソースだけで、音の plan とは重ならないので並列にできる。

- ADR: 01-1
- Where: worktree
- Scope:
  - consult.run: 報告を書いた後に終わらない子を、検出して配達し、止める
- Boundary:
  - Plans: なし
  - External:
    - `pi`: 子が stdout に JSONL でイベントを出し、ループの終わりに `agent_end` を出す
      - Contract: `--mode json` のイベントに `agent_end` がある（0.87.1 で確認）

## `sound-notify-compact`

sound-notify だけを読む。consult の plan とは重ならないので並列にできる。

- ADR: 03-1
- Where: worktree
- Scope:
  - sound-notify.compact: 圧縮が終わった時に、ターン終了と同じ音を鳴らす
- Boundary:
  - Plans: なし
  - External:
    - `pi`: 拡張のイベントとして圧縮の終わりを知らせる
      - Contract: `session_compact`（型は `SessionCompactEvent`）

## `second-opinion`

consult の一部を写して新しい拡張にする。写しに consult の run の変更を含めたいので、その plan の後ろに置く。

- ADR: 04-1
- Where: worktree
- Scope:
  - second-opinion.opinion: 直近の会話を材料に、判定を同期で返す新しい拡張
- Boundary:
  - Plans: `consult-run-watchdog`。consult の run を写して持つので、その変更を含んだ写しから始める
  - External:
    - `pi`: 会話を拡張に見せ、子を 1 体起動できる
      - Contract: 拡張イベント（`message_end` / `input`）と CLI（`--mode json` / `--tools` / `--no-session`）
