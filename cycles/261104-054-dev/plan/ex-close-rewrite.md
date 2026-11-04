# PLAN `ex-close-rewrite`

- Place: base
- Boundary Plans: なし（`close` のスキル本文と `references/format.md`、`collect.test.ts` の題名の範囲で閉じる）

## Files

```text
.pi/skills/close/SKILL.md                     update
.pi/skills/close/references/format.md         update
.pi/skills/close/scripts/collect.test.ts      update
```

## Slices

## 1.`close` のスキル本文の書き直し

このサイクルでは、エージェントが `close` の手順 9 を 2 回続けて読み違えた。いずれも、1 つの文が複数のステージを「3 から 5」と数字でまとめて指していたため、再実行のときに数字の範囲から外れたステージ（4 の消すこと、8 の判断）が抜けた。

書き直しでは、手順を 2 つの並びに分ける。

- **残務の並び**: 1 件の残務がたどる状態の移り変わり。集めた、片付けた（消した）、提案した、オーナーが判断した、`ex-` のプランをマージした、閉じた（`done`／`dropped`／`_proposed_`）。`ex-` をマージしたら、残務が集めるに戻って同じ移り変わりをたどる。
- **サイクルの並び**: 残務の並びの外にあるステージ。始める、読む、`close.md` を完成させる、校正する、確認する、ロードマップを書く、残務を片付ける、コミットする、掃除する。各ステージは、残務のどの状態を受けて、どの状態へ渡すかを定める。

手順は、この 2 つの並びに沿ってステージを順に並べたものにする。各ステージは、入る状態、すること、出る状態、決める人を示す。決める人は決める人の表の 1 か所にだけ書き、手順からは「表の決める人」として呼ぶ。手順では数字で他のステージを指さない。

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/close/SKILL.md`:
   - update: 冒頭に「決める人」の表を置く。決める人には、エージェントの読み、オーナーの言葉、マージの 3 つがある。どのステージの決める人がどれかを、表の 1 か所にだけ書く。手順と `close.md` のセクションは、表への参照だけにする。
   - update: 冒頭に「残務の状態」の表を置く。状態 6 つと状態を動かすステージを書く。`ex-` をマージしたら残務が集めるに戻ることを、表の行に書く。
   - update: 手順を、残務の並びのステージと、サイクルの並びのステージとして書き直す。各ステージに、入る状態、すること、出る状態、決める人（表への参照）を示す。14 のステージの内容は変えずに、順番と、各ステージが受け取る状態と出す状態を書く。
   - update: 数字で他のステージを指す文を消す。「手順 3 から 5 をもう一度走らせる」を、残務の状態の表の行「`ex-` をマージしたら、集めるに戻り、同じ移り変わりを同じ決める人でたどる」に換える。`ex-` のあとの 4 つのステージ（集める、消す、提案する、オーナーが 1 件ずつ判断する）は、残務の並びのステージとして書く。
   - update: `close.md` のセクションをステージとそろえる。`## Collected` は「集めた」の保存場所、`## Triage` は「提案し、判断した」の保存場所、`## Verified` は「確認した」の保存場所とし、セクションごとに、書くステージと閉じる決める人を表への参照として示す。
   - update: `## How not to do this` の各項がどのステージの言い換えか確かめ、ステージですでに言っている項は消す。
2. `.pi/skills/close/references/format.md`:
   - update: `## Collected`、`## Triage`、`## Verified` を、新しいステージと同じ順番・名前にし、セクションごとに、書く人と決める人を表への参照として示す。
   - update: 規則の正本を 1 か所にまとめる。Triage の 3 つの宛先と `done` の形、Collected の見出しの 2 つの形、並びを表す文は `format.md` にだけ置き、`SKILL.md` からはセクションの名前で呼ぶ。
3. `.pi/skills/close/scripts/collect.test.ts`:
   - update: 題名の「手順 9 を再実行する」から数字を消す。「`ex-` の見出しを持つ close.md を集め直す」に変える。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - grep ツールで `.pi/skills/close` から `steps 3 to 5` を検索し、0 件であることを確かめる
  - `SKILL.md` を読み、あるステージが別のステージを数字で指していないことを確かめる。`work step 8` のように別のスキルのステージを指す文は残っていることを確かめる
  - `SKILL.md` を読み、決める人の表が 1 か所だけで、手順とセクションがその表を参照していることを確かめる
  - `SKILL.md` を読み、14 のステージのすべてが、残務の状態の表の 6 つの状態のどれかに入るか、サイクルの並びのステージとして並んでいることを確かめる
  - `SKILL.md` を読み、`ex-` をマージしたあとの 4 つのステージ（集める、消す、提案する、オーナーが 1 件ずつ判断する）が、残務の状態の表の行から読めることを確かめる
  - `close.md` の 3 つのセクション（`## Collected`、`## Triage`、`## Verified`）を読み、それぞれが、残務の状態の表のどの状態の保存場所かを、セクションの文が名指ししていることを確かめる
  - 変更した 3 ファイルを、変更前と並べて読み、矛盾、循環、重複、不足、不自然な流れがないか確かめる
- Added: base — オーナーが差分を読んで OK を出す

## Notes

### Slice 1: `close` のスキル本文の書き直し

- Findings: なし
- Unplanned: 手順 11 と 12 を入れ替え、作業ツリーの片付けをロードマップの前にした。第三者レビューの指摘で、作業ツリーの後戻りがロードマップの後ろに来るのを避けるためである。手順 14 に `git status` の確認も足した。第三者の指摘で、手順 9 に毎回の未マージ件数、手順 8 に初回のみの全体読み、手順 12 に `status` を聞くこと、手順 7 に空の `## Verified` を埋めないことを足した。
- Commit: `6ccb672`
- Stopped: なし

## Work Review

### Round 1

- Stale: なし。理由: 手順 3・5・10 の規則文を `references/format.md` を呼ぶ形に変えた（`fixed:`）。
  - fixed: 手順 3 の `未特定`、手順 5 の `ex-` の名前、手順 10 の Units を、`references/format.md` を呼ぶ形にした。
- Unlisted: なし。理由: 11/12 の入れ替えと `git status` は `Unplanned` に記録し、第三者の指摘による追加も `Unplanned` に書き足した。
- Gaps: なし。理由: 導入文の「steps 3, 4, 5, 8 and 9」を、段の名前の列挙に変えた（`fixed:`）。
  - fixed: 導入文を「the collect, the exclusion, the proposal, the owner's judgement and the `ex-` plans」に変えた。数字で他の段を指す文はもう無い。
- Unproven: なし。理由: 数字参照の禁止と表の単一性は、自動の試験ではなく、`Verify` の読みで確かめる。文書だけの変更で、コードのテストが触れない。
- Noise: なし。理由: 「表が唯一の場所」と「The gate is ...」の重複を、表の導入文で「表は名前と決めることを書き、手順は名前を呼ぶだけ」と書き分けた（`fixed:`）。
  - fixed: 表の導入文を「The table names them and says what each decides; a step that says “the gate is ...” names one of the three, and does not restate it.」に変えた。
- Doubts: なし。理由: 数字の列挙は名前にし、追加した行為は `Unplanned` に記録した。

### Round 2

- Stale: なし。理由: `fixed:` の3件を `.pi/skills/close/SKILL.md` で確認した。手順3は71〜72行目が `references/format.md` を呼ぶ形（見出し・ plan id・行の形、未特定の埋め方、`ex-` の `No` の読み方）になっている。手順5は90行目と93行目が順番・形と `ex-` の命名を `references/format.md` を呼ぶ形になっている。手順10は150行目が Units の定義を `references/format.md` を呼ぶ形になっている。
- Unlisted: なし。理由: Round 1 に `fixed:` がなく、今回の対象外のため見ない。
- Gaps: なし。理由: `fixed:` を `.pi/skills/close/SKILL.md` の45行目で確認した。導入文は「the collect, the exclusion, the proposal, the owner's judgement and the `ex-` plans」という名前の列挙になっている。内部の数字参照はなく、残る数字は `work` step 8（51行目）と `work` step 2（181行目）の別スキルの参照だけで、残してよいもののため問題ない。
- Unproven: なし。理由: Round 1 に `fixed:` がなく、今回の対象外のため見ない。
- Noise: なし。理由: `fixed:` を `.pi/skills/close/SKILL.md` の20行目で確認した。表の導入文が「The table names them and says what each decides; a step that says “the gate is ...” names one of the three, and does not restate it.」になっており、表が名前と決めることを書き、手順は名前を呼ぶだけという書き分けになっている。
- Doubts: なし。理由: Round 1 の `fixed:` 3件はいずれも本文に反映されており、開き直す点がない。`left:` はなく、開き直さない。

## Acceptance

- Ran: `pnpm test:run`（63 ファイル、756 件）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`ja-check`（2 ファイル、error 0、warn 0）、`steps 3 to 5` の grep が 0 件、`SKILL.md` の読み（決める人の表が 1 か所、14 の手順が 2 つの並びにすべて入る、`ex-` のあとの 4 つが表の行から読める、`close.md` の 3 つのセクションが状態の置き場所を名指ししている）、`git diff ca86538..HEAD` の通読。
- Findings: なし
- Doubts: なし
