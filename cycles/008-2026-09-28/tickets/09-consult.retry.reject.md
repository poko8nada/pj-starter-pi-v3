# consult.retry.reject

Acceptance:

- フックに拒否されると `ref` が作られず、`finally` が worktree を消すので子の作業が消える、が解ける: 拒否されたら同じ worktree で `--continue` の子がもう 1 回走る（フックの出力が渡る）。通れば `ref` ができる
- 2 回目も通ったとき以外の道が無い、が解ける: 通らなければ worktree が残り、親に理由（落ちた検査の出力、変えたファイル、子の最後の本文、走った回数、時刻、worktree の id）が届く
- 2 回目にも中断の口が渡らない、が解ける: 同じ `AbortController` が渡る

Owner: at the end

## Todo

- `.pi/extensions/consult/tool/consult.ts`
  - `runOneChild` — 拒否されたときの分岐（同じ worktree で `--continue` の子をもう 1 回、上限 1 回）と、2 回目も通らなかったときに `removeWorktree` を呼ばない条件
  - 結果の組み立て — 拒否の理由、`git status --porcelain` から作る変えたファイルの一覧、子の最後の本文、走った回数、時刻、worktree の id
- `.pi/extensions/consult/run/run.ts`
  - `runPi` — 追加の引数（`--continue`）を渡せるようにする
- `.pi/extensions/consult/run/stopped.ts`（add）
  - `writeStopped(worktree, record)` / `readStopped(worktree)` — 記録（理由、変えたファイル、回数、時刻）を worktree の**外**（親ディレクトリ）に置く。子には書かせない
- `.pi/extensions/consult/tool/consult.ts`
  - `commitWorktree` の `failed` を、親への結果（本文）に組み込む
- `.pi/extensions/consult/README.md`
  - 拒否されたときの説明（いまは「worktree は消される」と書いてある）を、残る形に直す

## Verify

### test

- `pnpm test consult`（5 ケース。1・2 行）
  - 1 回目だけ拒否する pre-commit フック → 2 回目が走り、`ref` ができる（happy）
  - 2 回とも拒否するフック → worktree が残り、結果に理由（落ちた検査の出力）・変えたファイル・子の最後の本文・回数・時刻・id が入る（error）
  - 中断（`cancel`）→ 2 回目も止まる（error）
  - worktree が残ったあと → `git worktree list` にその 1 行がある（error のあと）
  - 子が 0 体のまま `--continue` が失敗する → 新しい会話で走る（error からの回復）

### read

- `review` の子に `.pi/extensions/consult/README.md` を渡す
- 合格: 拒否されたときの流れ（同じ worktree でもう 1 回、通らなければ残る）が書いてある（1・2 行）

## Notes

### Findings

- なし
- （この step は子がターン上限で止まり、コミットもフックに拒否されて ref が作られなかった。親がやり直した）
  - 子は `consult.ts` が 494 行（上限 480）になって lint に落ちた。親は `run/child.ts` を切り出して 491 行（コードは 480 以下）に戻した
  - 子が書いた `run/retry.ts` / `run/stopped.ts` 相当はやり直しで書き直した
  - 未対応: `readStopped` を読む道（`consult_resume` の `list`）は step 12 で作るので、いまは書いた記録を読む利用者がいない

- （`read` の検証 `consult-8` の指摘と、親の修正）
  - blocking（直した）: 2 回目の再走が中断を見ない。`runPi` は「既に aborted な signal」のとき子を殺さないので、1 回目を中断→拒否→2 回目は最後まで走り得る。`run/run.ts:373` で spawn 済みの子を殺し、`attemptAndCommit` は中断済みなら再走しない（`signal` を渡す）。テストも足した
  - （直した）`Verify` の `test` の 1・2 行目に assertion を足した（子の最後の本文、時刻、`ref` が本当に在ること）
  - 未対応: `Verify` の 4 行目（残った worktree が `git worktree list` に出る）— このテストのリポジトリは `git init` 直下で worktree ではないので、確かめるには本物の `git worktree add` が要る
  - 未対応（送り）: `Verify` の 5 行目（子が 0 体のまま `--continue` が失敗する → 新しい会話で走る）は step 12（`consult.resume`）が持つフォールバックの話なので、step 09 の `Verify` からは外したい
  - 未対応: `Verify` の `test` の 3 行目（`consult.test.ts` の cancel）は 2 回目の再走を見ていない。`retry.test.ts` の「中断されていれば再走しない」が新しい

- （影響読み `consult-9` の指摘と、親の修正）
  - blocking（直した）: `README.md:53` が「拒否されたら作業は残らない」のままだった → 121 行と同じ（1 回だけ再走、2 回目で残す）に直した
  - blocking（直した）: `retry.test.ts` が `mkdtempSync(join(tmpdir(), …))` と環境を継承した `execFileSync('git')` を使っていた（step 01 の規則に反する）→ 共有 helper `test/tmp.ts` の `tmpDir()` と `run.ts` の `gitEnv()` に直した
  - 直した: `stopped.ts` の `JSON.parse` を try/catch で包んだ（途中で切れた記録で親を止めない、というコメントどおりに）
  - 直した: `README.md:121` の「worktree を消しても記録は残る」は誤り（`removeWorktree` は親ごと消す）→ 「worktree が在る間は残る」に直した
  - blocking（owner の判断: 008 はこのまま進め、定義の `Carry over` 5 本目に送った）: `child/spec.ts:64` の `--no-session` のせいで、pi は `--continue` を見ずに新しい会話で走る（`docs/sessions.md:52`）。つまり 2 回目の子が引き継ぐのはペイロード＋task＋フック出力だけ。「同じ worktree で `--continue`」は字面どおりで、step 12 が前提にしている「直前の会話を引き継ぐ」は成立しない。`--no-session` を外すか、会話の引き継ぎを諦めるかは決めていない
  - 直した: `README.md:149`（`run/` の説明）に再走・記録・`child` を入れた（`:161` の Tests の列挙は step 10 が直していた）
  - 未対応: `work/SKILL.md:107`（「子の記録は ref で戻る」）は ref 無し・worktree 残りで返る道を知らない（step 14 の担当）。`close/SKILL.md:34` の「残り物は finding」も同じ（step 15 の担当）
  - 未対応: 親への本文の組み立て（`consult.ts:315-321` の `worktree kept:` 以下）を確かめるテストが無い。`kept` は id ではなくパス（step 12 の id の定義待ち）

### Unplanned

- `run/child.ts` を新しく作った（`prepare` と `runOneChild` を `tool/consult.ts` から移した）。`consult.ts` の行数上限のため。動きは変えていない
- `run/stopped.ts` の `readStopped` は、記録の形を自前で確かめて組み立てる（壊れた記録で親を止めない）

Commit: 5220f3a + 0414b98 + 7c86017 + 7280adb（5220f3a = 親がやり直した実装、0414b98 = README、7c86017 = 検証の blocking（中断なら再走しない）、7280adb = 影響読みの blocking（README と共有 helper））
