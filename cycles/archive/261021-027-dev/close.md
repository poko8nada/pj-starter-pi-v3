# Close 027

## Collected

### liveness-start-token (ADR 01 / Scope `Unit.subagent-consult`)

1. 212 / Slice 3 (読み手を startToken に通す) / Verify の 3 ファイル 78 件が通った。beginRun の startSound と controlSubagent の check の配線は state.check/defaultCheck 経由で既に startToken 側だったため、配線の変更は要らなかった
   - Doing: 一覧・worktree の busy・停止・音の述語を、`startToken` と `lstart` を見る `defaultCheck` に通した。
   - Left: `beginRun` の配線は 026 で `state.check` を通る形になっており、`defaultCheck` を差し替えるだけで `startToken` 側になった。
   - Cost: 配線のためのコードを足さずに済んでいる。放っておいて困ることはない。
2. 222 / Slice 4 (説明を合わせる) / README の走っているかの記述を startToken と `ps -p <pid> -o lstart=` の一致に直し、読めないときは走っている側・`--name <token>` は表示名と書いた（一覧・worktree・停止・音の節）
   - Doing: README の一覧・worktree・停止・音の節を新しい規則に合わせた。
   - Left: 音の節だけ `unknown` の規則に触れていなかったので、read の指摘で 1 文足した。
   - Cost: 記述と実装が同じ規則を指している。放っておいて困ることはない。
3. 230 / Slice 5 (統合: consult の生存判定) / Steps は読みのみで変えず: `ps` の引数は `['-p', <pid>, '-o', 'lstart=']` で `-ww` なし、`test`/`test:run`/`test:related` は `--config vitest.starter.config.ts`
   - Doing: `ps` の引数と test の入口が plan の前提どおりかを読んだ。
   - Left: 読みのみで、変えるものがなかった。
   - Cost: 前提が崩れたら plan の Verify が落ちる。放っておいて困ることはない。
4. 231 / Slice 5 (統合: consult の生存判定) / Verify の cli 4 件が通った: `test:run` exit 0（43 ファイル 777 件、consult を含む）、`typecheck` exit 0（root: ok、.pi: ok）、`lint` exit 0、`format:check` exit 0。落ちた行なし
   - Doing: 統合の 4 つの検査を走らせた。
   - Left: すべて緑で、直すものがなかった。
   - Cost: 検査の結果は acceptance に残っている。放っておいて困ることはない。
5. 277 / Acceptance / `index.ts` の `announceRunningSubagents` は `check` を渡さないため、新しい任意引数がテスト専用に見える。reload 時の告知は `defaultCheck` に依存する。
   - Doing: `announceRunningSubagents` に `check` の任意引数を足し、告知の一覧も `startToken` 側で読むようにした。
   - Left: 本番の配線は `check` を渡さない。告知は `defaultCheck` の実 `ps` に任せている。
   - Cost: reload 後の告知が実 `ps` に依存する。`ps` が読めない環境では告知が running 側に残る。
6. 278 / Acceptance / 起動時の `readStartToken` 失敗は `pidAlive` に弱く後退し、そのことが記録にも表示にも残らない。
   - Doing: 起動時に `ps -p <pid> -o lstart=` を読み、開始行に `startToken` を書く。
   - Left: `readStartToken` が `undefined` のときは `startToken` を書かず、`pidAlive` の照合に落ちる。後退したことは記録に残らない。
   - Cost: 起動直後に `ps` が読めないと、その実行は pid の再利用で偽陽性になりうる。
7. 279 / Acceptance / `lstart` の完全一致は開始時と判定時のロケールが同じことを前提にする。
   - Doing: 開始時に読んだ `lstart` の文字列を残し、判定時に読んだ文字列と完全一致で比べる。
   - Left: `lstart` は `%c` のロケール表記で、開始時と判定時で環境が変わると一致しない。
   - Cost: ロケールをまたぐと一致せず、走っている実行が `lost` に見える。

## Triage

- 1: dropped (Unit.subagent-consult): 配線は 026 の `state.check` 経由で足りており、次に書くコードが無い
- 2: dropped (Unit.subagent-consult): README は 027 で直し切っており、次に書くコードが無い
- 3: dropped (Unit.subagent-consult): 読みのみで変える物が無い
- 4: dropped (Unit.subagent-consult): 4 つの検査は緑で、直す物が無い
- 5: dropped (Unit.subagent-consult): `announceRunningSubagents` の `check` は本番で渡さない設計で、`defaultCheck` が実 `ps` を見る。渡すコードを足すと 026 の「一覧は既定照合が正しい」を崩す
- 6: dropped (Unit.subagent-consult): `readStartToken` の失敗は起動直後の `ps` の失敗で、記録に残すには開始行の形を増やす。2 日窓で消える行に欄を足す重さが勝つ
- 7: dropped (Unit.subagent-consult): `lstart` のロケール依存は A を選んだ時点の既知の限界で、ロケールを固定するコードを足すと plan の境界を越える
