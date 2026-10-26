# Close 037

## Collected

### sentence-loop-stop (ADR 01, 02, 03)

1. 374 / Review Round 1 / `MIN_THINKING` 未満の試験は abort しないことのみを見ており、設定読みより先に戻る順序を壊しても緑のままです。
   - Doing: Slice 4（wiring）で `message_update` の早期 return を入れ、その順序を試験で確かめようとしていました。
   - Left: 順序は性能のための早期 return で振る舞いに差が出ず、順序を観測する試験は実装に結合して脆くなるため、fixing subagent が `left` にしました。
   - Cost: `MIN_THINKING` 未満で設定を読む実装に戻っても abort の有無は同じで、テストは緑のままです。性能の退行は検出できません。
2. 382 / Review Round 1 / `units.ts:248` の窓照合キーに NUL 文字が含まれ、git が binary 扱いになる点が気になりましたが、振る舞いには影響しないため所見としません。
   - Doing: センテンス検出の見本（最頻の 3 文窓）を、単位の並びを NUL で区切ったキーで集計していました。
   - Left: 衝突避けの意図で、振る舞いには影響しないと判断し、fixing subagent が `left` にしました。
   - Cost: `units.ts` は git で binary 扱いになり、差分・レビュー・blame が見えません。マージの diff でも `Bin 0 -> 8275 bytes` と出ました。

### ex-nul-separator (ADR 03)

3. 45 / Slice 1 (escape-separator) / 旧 blob の NUL により、移行の `git diff --stat` が `Bin 8275 -> 8280` と表示され、行差分になりません。
   - Doing: `sampleOf` のキーの区切りを、生の NUL から 6 文字のエスケープに直しました。
   - Left: 旧 blob の NUL は歴史に残り、歴史の書き換えなしには消えません。作業ツリーと今後の差分はテキストです。
   - Cost: `ex-nul-separator` のマージのその箇所だけがバイナリに見え、行の変更がディフに出ません。
4. 76 / Review Round 1 / 旧 blob 側の生 NUL により範囲差分が `Bin` と表示される点は、歴史の書き換えなしには解消できません。
   - Doing: レビューは作業ツリーの NUL と `git diff --text` の 1 行で変更を確認しました。
   - Left: 範囲差分の `Bin` は旧 blob の性質で、レビューの所見ではなく `Doubts` としました。
   - Cost: レビューの画面でも、そのマージの行差分だけは見えません。
5. 89 / Acceptance / `git diff --stat` の `Bin` 表示は旧 blob 側の生 NUL によるもので、歴史の書き換えなしには解消できません。
   - Doing: acceptance は `git diff --text` の 1 行で変更を確認しました。
   - Left: 旧 blob の NUL は歴史に残るため、受け入れの `Doubts` として残しました。
   - Cost: 受け入れの記録のその箇所だけがバイナリのままです。

## Triage

- 1: done 0341ccd (ADR 01, Unit thinking-scrub): 設定の読み込みをポートにし、20,000 文字未満で読まないことを偽のポートの呼び出し回数で確かめる。
- 2: done 82b2961 (ADR 03, Unit thinking-scrub): 見本のキーの生の NUL をエスケープに直し、ソースをテキストに戻した。
- 3: dropped (ADR 03, Unit thinking-scrub): 旧 blob の NUL による `git diff --stat` の `Bin` は、歴史の書き換えなしには消えない。書き換えの重みが利得を超える。
- 4: dropped (ADR 03, Unit thinking-scrub): 3 と同じ。レビューの `Doubts` の箇所。
- 5: dropped (ADR 03, Unit thinking-scrub): 3 と同じ。受け入れの `Doubts` の箇所。

## Verified

### thinking-scrub

- Plans:
  - `sentence-loop-stop`
  - `ex-settings-read-order`
  - `ex-nul-separator`
- Result: しない — 実際のセッションでループを起こせない。代わりに 649 の thinking に merged の `scrubThinking` を当て、連続した 4 つの周期（最大 11,442 単位・44 周期）を除去した。252,679 文字（48.8%）が消え、`The close. The owner. The cycle.` は 2,243 回から 1,180 回になった。残る 1,180 回は、ADR の scope で out にした分散・言い換えのループ。
