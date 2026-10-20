# Close 025

## Collected

### harness-tooling (ADR 01, 02, 03 / Scope `Unit.harness-copy`)

1. 325 / Slice 5 (統合: ハーネスの形) / `pnpm harness:pull -- --root <dir>`（`push` も同じ）が `unknown argument: --` で exit 1 になる / left: `parseArgs` が素の `--` を終端子として無視せず、Slice 5 の Steps が変えない指定のため直さなかった。`--` 無しの `pnpm harness:pull --root <dir>` では `same: <dir>`・exit 0 を確認済み
   - Doing: Slice 5 で `pnpm harness:pull` / `push` の `same` を確かめていた。Verify の `pnpm harness:pull -- --root <dir>` の形で打った。
   - Left: `parseArgs` が素の `--` を終端子として扱わない。Slice 5 の Steps はコードを変えない指定だった。`--root` だけなら `same:` と exit 0 を確かめた。
   - Cost: plan の Verify に `--` 付きの形が残り、次に読む人が同じ形を打つと `unknown argument: --` で止まる。README も `scripts/harness/index.mjs` の使い方も `--root` を教えていないので、実際の利用では踏まない。
2. 353 / Review Round 1 / Slice 5 の `pnpm harness:pull -- --root <dir>` が `unknown argument: --` で exit 1 になる件 (`cycles/261020-025-dev/plan/harness-tooling.md:286` 対 `scripts/harness/index.mjs:63-64`)。Notes の通り `--` 無しでは `same:`・exit 0 を確認済みで、Steps が変えない指定のため直さなかった。Verify の `--` が pnpm の渡し方の書き誤りか、素の `--` を終端子として無視すべき仕様かのどちらかが plan だけでは決まらない。finding ではなく doubt とする。 / left: `--` 対応は CLI 契約の変更で plan の Types/Steps 外のため、Round 1 では直さず Slice 5 の finding として残す。
   - Doing: review が、Verify の `--` と `parseArgs` の差を見た。
   - Left: 素の `--` を終端子にするかは CLI の契約で、plan の Types / Steps の外なので finding ではなく doubt にした。
   - Cost: `--` を受けるかどうかの仕様が決まらないまま、plan の 1 行が動かない例として残る。
3. 369 / Acceptance / plan の Slice 5 の Verify は `pnpm harness:pull -- --root <dir>` と書くが、素の `--` で exit 1 になる。`--root` だけなら `same:` で通る。Notes の Slice 5 に `left:` として残した。
   - Doing: acceptance で `pnpm harness:pull --root <self>` と `push` を打ち、`same:` を確かめた。
   - Left: Verify の文面は直さず、Notes の `left:` に残した。
   - Cost: 同じ。plan を読む人にだけ残る。
4. 370 / Acceptance / このサイクルより前のプロダクトは、`scripts/harness.local.json` の値を `scripts/harness/starter.json` へ手で移す必要がある。`starter.json` は `skip` なので pull では作られない。README の移行の行に書いた。
   - Doing: `starter.json` を skip にして commit し、`legacy` で旧ファイルを pull が消す形にした。README に移行の 1 行を書いた。
   - Left: `starter.json` は skip なので pull では作られない。前のプロダクトの値は `harness.local.json` にあり、移すのは手作業にした。
   - Cost: README の移行の行は平置きの 6 件しか書いておらず、`harness.local.json` の値を `starter.json` へ移すことを書いていない。前のプロダクトは最初の pull が `no such file: .../starter.json` で止まる。エラーは古い道を名指すが、README の手順どおりには進めない。
5. 366 / Acceptance / Slice 4 の Verify（`read`）が acceptance で走っていない。`Ran` は CLI の checks だけで、doc の移行の行を確かめていない
   - Doing: acceptance で `pnpm test:run`、`pnpm exec vitest run`、`typecheck`、`lint`、`format:check`、`harness:pull/push`、`product:ready` を回した。壊し確認は 3 つ。
   - Left: Slice 4 の Verify は `read` で、サブエージェントを要する。acceptance はそれを回さず、CLI の checks だけで済ませた。
   - Cost: doc の移行の行が不完全なことに気づけず、`Acceptance` の `Doubts` が「README の移行の行に書いた」と、実際より強く書いてしまった。前のプロダクトの利用者が最初の pull で止まる。

### ex-harness-root (ADR 01 / Scope `Unit.harness-copy`)

6. 115 / Review Round 1 / `scripts/harness/index.mjs:98` の三項は両枝同一の残骸に見えるが、コードの冗長であり Stale（文書・コメント・テスト）の定義外なので finding にしない
7. 116 / Review Round 1 / `cycles/261020-025-dev/plan/harness-tooling.md:286` の `--root` 付き例は今は通らないが、過去 cycle の記録であり現行文書ではないので finding にしない
8. 117 / Review Round 1 / push の表示テスト（`scripts/harness/index.test.ts:218`）は同内容で label のみ見るが、向き違いの実写は --run テスト（`scripts/harness/index.test.ts:368`）が賄うので finding にしない

### ex-migration-doc (ADR 01 / Scope `Unit.harness-copy`)

9. 61 / Review Round 1 / `mode` の部分一致は README.md:29 の `models`・README.md:53/README.ja.md:53 の `harness.mode.json` に当たるが否定文ではないため empty は文単位で判定する前提とし finding としない
10. 62 / Review Round 1 / JA の `2 か所` (cycles/261020-025-dev/plan/ex-migration-doc.md:35) と Steps の `3 か所` の数え方の差は empty が Checks 等を覆うため finding としない
11. 63 / Review Round 1 / test/README.md は Files に update とあるが Steps で clean なら据え置きと決められており (cycles/261020-025-dev/plan/ex-migration-doc.md:27-28)、無変更は finding としない
12. 64 / Review Round 1 / 結論: diff は plan を閉じられる

### close (ADR 01 / Scope `Unit.harness-copy`)

13. — / close / consult の稼働中の音が止まらない。`consult-4` の開始行と終了行が両方記録にあり、`runningRuns` が subagent ごとに畳まないため、開始行の pid 2502 が WebKit に再利用されて「走っている」と判定され続ける

- Doing: close の最後で、サブエージェントが全部終わった後に 5 秒ごとに音が鳴り続けるのを見つけた。
- Left: 記録の開始行に `ended` を付けて止めた（応急）。`runningRuns` は subagent ごとに最後の行へ畳んでいない。
- Cost: 終了した subagent の開始行の pid が再利用されると音が鳴り続ける。worktree の busy 判定も同じ述語を読む。

## Triage

- 1: done 21853f9 (ADR 01 / `Unit.harness-copy`): `ex-harness-root` が `--root` を消し、ルートは cwd だけになった。plan の `-- --root` の例は過去の記録として残る。
- 2: done 21853f9 (ADR 01 / `Unit.harness-copy`): 1 と同じ。
- 3: done 21853f9 (ADR 01 / `Unit.harness-copy`): 1 と同じ。
- 4: done 76d418e (ADR 01 / `Unit.harness-copy`): `ex-migration-doc` が README の移行の行に、`harness.local.json` の値を `starter.json` へ移す順序を足した。
- 5: done 76d418e (ADR 01 / `Unit.harness-copy`): `ex-migration-doc` が Slice 4 の `read` を回し、3 つの doc を確かめた。
- 6: proposed (ADR 01 / `Unit.harness-copy`): `scripts/harness/index.mjs:98` の両枝同一の三項と `93-97` の重複した `~` の枝を、重複の削除として消す。振る舞いは変えない。次のサイクルで。
- 7: dropped (ADR 01 / `Unit.harness-copy`): 過去 cycle の plan md の `--root` の例は記録で、現行の文書ではない。
- 8: dropped (ADR 01 / `Unit.harness-copy`): push の向きは `--run` のテストが実写で賄っている。
- 9: dropped (ADR 01 / `Unit.harness-copy`): `mode` の部分一致は否定文ではなく、empty は文単位で判定した。
- 10: dropped (ADR 01 / `Unit.harness-copy`): JA の `2 か所` と Steps の `3 か所` の数え方の差は、`read` が Checks も覆っている。
- 11: dropped (ADR 01 / `Unit.harness-copy`): `test/README.md` は Steps が据え置きを許しており、無変更は finding ではない。
- 12: dropped (ADR 01 / `Unit.harness-copy`): 結論で、leftover ではない。
- 13: proposed (ADR 01 / `Unit.harness-copy`): 6 と併せて次のサイクルで直す。
