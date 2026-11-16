# ADR 070

## 01: サブの定義と書き方

Type: _Full_

### Context

- C1: 前提: `DEFINITION.md` の `Users can do` は 1 行 1 ユニットで、行は `Who` を主語にした主機能だけを書く。`rules/definition.rules.md` は形を `<Who> が、xxx する` とし、経路と検査は書かないと定める。
- C2: 前提: `rules/definition.rules.md` は「1 つの名詞が 1 ユニット。名詞が変われば別のユニット。同じ名詞に動詞が増えても中に収める」とし、`One loss` で「取り去ると `Who` ができなくなることが 1 つ」なら 1 ユニットと定める。
- C3: 制約: サブの名は、親のユニット名とアンダースコアでつなぐ（`subagent-consult_status`）。オーナーの決定である。
- C4: 意図: ユニットの下にサブを書けるようにする。サブは 0個でもいくつでもよい。サブの主語は、親の主機能の主語と変わってよい。
- C5: 制約: サブは、親のユニットがないと存在し得ないものに限る。オーナーの決定である。
- C6: 意図: サブの定義は親と同じ形で書く。`Who` を主語にし、その `Who` の役割がそのサブでできることを書く。使うことで `Who` に見えるものが変わることは、サブにも Unit と同じように適用する。
- C7: 前提: 機能は原則として独立なので、同じ機能がサブにも別のユニットにも現れてよい。consult の音がサブにあり、`sound-notify` があることは問題にしない。オーナーの決定である。
- C8: 前提: `Users can do` は `####` 見出しでグループ化でき、見出しの階層は最大 2 と決まっている（`rules/definition.rules.md`）。サブは行の入れ子なので、上限の数え方は、このエントリで決める。
- 問い: サブとは何か、いつサブにしてよいか（いつ独立したユニットにするか、いつ書かないか）、名前と定義の書き方をどう規則に書くか。

### Research & Trial

なし

### Scope

- In:
  - result: `rules/definition.rules.md` と `rules/definition.format.md` を書き換え、読者が受け取る内容を変える。サブを持つユニットの行を定義書に書けるようにする。
  - logic: 「サブとは何か」「いつサブにしてよいか」「いつ独立したユニットにするか」「いつ書かないか」「名前と定義の書き方」の規則を決めて書く。
  - structure: `Users can do` のユニットの行の下に入れ子の行を足し、`rules/definition.format.md` の `Sections` の説明をその形に合わせる。
  - expression: サブの名を `<unit>_<sub>` と書く規則にし、規則の文面をその形にそろえる。
  - downstream: `adr` の `Definition`、`close` の `Verified`、`product-ready` が読む骨組み、`README`がサブの行をどう扱うかを確かめる。変更そのものは 03 が持つ。
  - failure: Unit の条件（`One loss`、名詞による分割）とサブの条件（親がないと存在し得ないこと）を規則に残し、読者が迷う余地を残さない。
- Out:
  - upstream: 外部の依存を足さない、変えない、消さない。（理由: 規則はこのリポジトリの中で閉じる）
  - existing: 既存のユニットの行を移さない、直さない。（理由: 定義書の行の更新は 02 が持つ）
  - cost: 速度、メモリ、API、トークンの上限に触れない。（理由: 規則の文が数十行増えるだけで、手順は増えない）
  - safety: 秘密、権限、露出、個人データに触れない。（理由: 文書の規則だけを扱う）
  - verification: 規則の正しさを機械で確かめる手段を足さない。（理由: いま定義書を検査する手段はなく、このサイクルの範囲でもない）
  - observability: 記録や信号を変えない。（理由: 定義書は記録を持たない）
  - release: 配布や適用の手順を変えない。（理由: 骨組みの内容を変えず、`product-ready` の動きも変えない）
  - other: 上の種類で足りない心配はない。（理由: 扱うのは定義書の規則と形だけである）

### Decision

- Status: **accepted**
- Main: ルールがサブを持てるようになり、定義書ではユニットの行の下に、そのユニットがないと存在し得ない機能を 1 行ずつ書ける。
  - Add:
    - `What may be a Sub` のセクション。サブの条件（ユニットなしでは存在し得ない、Unit と同じ形、Result、One loss、名の形、経路と検査を含めない、0 個以上）（C3, C4, C5, C6, C7）
    - サブの名の形 `<unit>_<sub>`（C3）
  - Update:
    - `One loss` を、ユニットの行は主機能 1つを、サブの行はそのサブ 1つを数える形にする（C2）
    - `The noun decides the split` を、サブがユニットの名詞を保ち、自分の名を後ろに足す形にする（C2, C3）
    - `Each field` に、サブの行がユニットと同じ形で書かれ、`Who` が親と変わってよいことを足す（C6）
    - `Naming` に、サブの名の綴りを足す（C3）
    - `How the list is grouped` に、階層の上限は見出しで数え、サブは行であることを足す（C8）
  - Drop:
    - なし
- Sub: `rules/definition.format.md` がサブの行の形を受け入れる。
  - Add:
    - `Sections` に、`Users can do` のサブの行の説明（C3, C6）
  - Update:
    - `Writing` の「1 行は 1 ユニット」を、サブの行を含む形にする（C3）
  - Drop:
    - `Sections` の「The name is the thing's name」と「a heading is not a Unit」の 2 文。`Each field` と `How the list is grouped` が同じことを持つ（C1, C8）
- Policy:
  - Allowed:
    - ユニットはサブを 0個でもいくつでも持てる（C4）
    - サブの `Who` は、親の主機能の `Who` と違ってよい（C4）
    - 同じ機能が、あるユニットのサブにも、別のユニットにも現れてよい（C7）
  - Forbidden:
    - ユニットなしで存在し得るものをサブにしない - それはユニットである（C5）
    - 経路（実装、手順、コマンド、設定、ファイルの配置）と検査をサブにしない - ユニットの行と同じ理由である（C1）
    - サブの名をユニットの名で始めない - 親が名で分からなくなる（C3）

#### Details

- 冒頭の 1 文

  ```md
  What may be a Unit or a Sub of `DEFINITION.md`, and how the Units, the Subs, the `Who` and the `Stack` are named and written.
  ```

- `What may be a Sub` のセクション

  ```md
  ## What may be a Sub

  A Sub is one thing the `Who` can do with a Unit, below the Unit's main function. It is held to `Result` and `One loss` as a Unit is, and to these:

  1. **No life without the Unit** — taking the Unit away takes the Sub with it. A thing that stands without the Unit is a Unit, not a Sub.
  2. **Not the route, not a check** — the route to a function (the implementation, the steps, the command, the settings, the file layout) and the checks that hold it up do not become Subs.
  3. **Any number** — a Unit has no Sub, one Sub, or more. A Unit without Subs is written with its line alone.
  ```

- `One loss` と `The noun decides the split` の書き換え

  ```md
  4. **One loss** — taking the Unit's line away removes exactly one thing the `Who` could do: its main function. Two losses at the same level: two Units. No loss: it is not a Unit. A thing that cannot exist without the Unit is a Sub, and its own line carries its one loss.

  5. **The noun decides the split** — one noun is one Unit; a new noun that stands on its own is another Unit. More verbs on the same noun stay inside it, on its line or on a Sub's line. A Sub keeps the Unit's noun and adds its own word after an underscore: it is not a new Unit.
  ```

- `How the list is grouped` の書き換え

  ```md
  - `Users can do` may stay flat, or be grouped under `####` headings. The hierarchy is at most 2: `### Users can do` and `####`. The limit counts the headings; a Sub is an indented line, not a heading.
  - A line under a heading is one Unit; a Sub is one more line under its Unit.
  ```

- `Each field` の書き換え

  ```md
  - A Unit's line — written from the `Who`'s side: `<Who> が、xxx する`. The name is the thing's name; the description is not. A Sub's line takes the same form, and its `Who` may be a role other than the Unit's.
  - A line is the function it carries: a Unit's line is its main function, a Sub's line is its own. The route to that function — the implementation, the steps, the command, the settings, the file layout — does not go in it.
  - The checks that hold the function up — whatever runs to prove it — do not go in it either.
  - So a line moves only when the function it carries changes. A change to the route or to a check leaves the line as it is.
  ```

- `Naming` の書き換え

  ```md
  - A Unit's name is two or more words joined with hyphens. Two shapes:
    - a thing and its kind: `lefthook-gate`, `adr-skill`, `agent-rules`
    - an object and its work: `sound-notify`
  - A Sub's name is the Unit's name, an underscore, and the Sub's own name: `subagent-consult_status`. The underscore appears once, and only in a Sub's name.
  - A Sub's own name is one word, or words joined with hyphens. One word is allowed: the Unit's name already makes the whole name two or more words.
  - A bare word is not written: `lint`, `test`, `consult`, `readme`.
  ```

- `definition.format.md` の `Sections` と `Writing`（重複する 2 文を落とす）
  ```md
  - `Users can do` — one line per Unit, and one line per Sub under its Unit: what the `Who` can do with it.
  - One line is one Unit, or one Sub under its Unit.
  ```

### Definition

- `Unit.definition-rules`(kept): 主機能は同じで、変わったのは規則の内容と形である。

## 02: 全ユニットのサブの割り当てと定義書

Type: _Full_

### Context

- C1: 前提: `DEFINITION.md` の `Users can do` は、いま 5 つの `####` 見出しの下に 23 行のユニットを持つ。どの行も主機能 1 文である。
- C2: 意図: 全ユニットをどう書くべきかをこのサイクルで扱い、`DEFINITION.md` の更新まで行う。対応が必要なものすべてに追従する（ROADMAP 033）。
- C3: 制約: サブにするのは、親のユニットがないと存在し得ない機能だけにする。書き方は 01 の規則に従う。
- C4: 制約: サブを持たないユニットは、持たないと決めて書かない。サブの数は 0 でもよい。
- 問い: 各ユニットに、どのサブを書くか。書かないユニットはどれか。

### Research & Trial

- F1: `adr-skill` の `Who` が名指しで呼ぶ入口は、`node .pi/skills/adr/scripts/index.mjs` の `--add`、`--delete`、`--set`、`--check` である。出所: `.pi/skills/adr/SKILL.md:68-70,210`
- F2: `plan-skill` の入口は `node .pi/skills/plan/scripts/index.mjs <plan id> --order <NN> (--place <worktree|base> | -w | -b) --entries <NN[,NN...]>` である。出所: `.pi/skills/plan/SKILL.md:42`
- F3: `work-skill` は `SKILL.md` と `references/` だけで、専用のスクリプトを持たない。出所: `.pi/skills/work/`
- F4: `close-skill` の入口は `node .pi/skills/close/scripts/collect.mjs <cycle-dir>` である。出所: `.pi/skills/close/SKILL.md:16`、`.pi/skills/close/scripts/collect.mjs:2`
- F5: `yolo-skill` は `SKILL.md` だけで、専用のスクリプトを持たない。出所: `.pi/skills/yolo/`
- F6: `quality-gate` は tool も command も登録せず、`agent_start`、`agent_end`、`tool_result`、`input`、`session_start` で自動で走る。`Who` が名指しで呼ぶ入口はない。出所: `.pi/extensions/quality-gate/index.ts:268-306`
- F7: `lefthook-gate` の入口は `lefthook.yaml` の `pre-commit`（`format`、`lint`、`typecheck`、`test`、`ja-check`）と `pre-push`（`typecheck`、`test`）、`package.json` の `prepare` である。出所: `lefthook.yaml:1-36`、`package.json:19`
- F8: `format-check` の入口は `pnpm format` と `pnpm format:check` である。出所: `package.json:15-16`
- F9: `lint-check` の入口は `pnpm lint` と `pnpm lint:fix` である。出所: `package.json:13-14`
- F10: `type-check` の入口は `pnpm typecheck` と `pnpm typecheck:staged` である。出所: `package.json:17-18`
- F11: `test-run` の入口は `pnpm test`、`pnpm test:run`、`pnpm test:related` である。出所: `package.json:10-12`
- F12: `japanese-check` の入口は `node scripts/checks/ja-check.mjs <file...>` で、設定は `scripts/checks/ja-check.json` の `error`、`warn`、`exception`、`exclude` である。出所: `scripts/checks/ja-check.mjs:1-94`、`scripts/checks/ja-check.json:1-79`
- F13: `definition-file` の入口は `DEFINITION.md` そのものである。出所: `DEFINITION.md:1`、`rules/definition.format.md:3`
- F14: `definition-rules` の入口は `rules/definition.rules.md` と `rules/definition.format.md` である。出所: `rules/definition.rules.md:1`、`rules/definition.format.md:1`
- F15: `sound-notify` は tool も command も登録せず、`ui_prompt_start`、`agent_settled`、`tool_execution_end`、`session_compact` で自動で知らせる。設定は `settings.json` の `enabled`、`notifications`、`sounds.*` である。出所: `.pi/extensions/sound-notify/index.ts:149-166`、`.pi/extensions/sound-notify/README.md:77-86`
- F16: `agent-rules` の入口は `AGENTS.md` である。出所: `AGENTS.md:1`
- F17: `usage-readme` の入口は `README.md` と `README.ja.md` である。出所: `README.md:1`、`README.ja.md:1`
- F18: `subagent-consult` の入口は、tool の `consult_run`、`consult_subagents`、`consult_worktree`、`consult_commit` と、command の `/consult-status`、`/consult-cancel <id>`、`/consult-sound on|off` である。出所: `.pi/extensions/consult/index.ts:201-343`、`.pi/extensions/consult/README.md:13-16`
- F19: `thinking-scrub` の入口は command の `/thinking-scrub` で、引数は無引数、`on`、`off`、`show`、`hide` である。出所: `.pi/extensions/thinking-scrub/index.ts:345-351`、`.pi/extensions/thinking-scrub/command/scrub.ts:17-34`
- F20: `context-precompact` の入口は command の `/precompact` で、引数は `status`、`on`、`off`、`now` である。出所: `.pi/extensions/context-precompact/index.ts:528-531`、`.pi/extensions/context-precompact/command/precompact.ts:24-42`
- F21: `upgrade-skill` の入口は `pnpm outdated --json`、`pnpm update`、`pnpm update --latest <package>`、`pnpm audit --audit-level low`、`pnpm audit --fix=update` である。出所: `.pi/skills/upgrade/SKILL.md:24-139`
- F22: `product-ready` の入口は `pnpm product:ready` で、引数 `--run`、`--only`、`--only=<label>` を取る。出所: `package.json:9`、`scripts/product-ready/cli.mjs:12-38`
- F23: `harness-sync` の入口は `pnpm harness-sync:pull` と `pnpm harness-sync:push` で、`node scripts/harness-sync/index.mjs pull|push [--run]` である。出所: `package.json:7-8`、`scripts/harness-sync/index.mjs:2`

### Scope

- In:
  - result: `DEFINITION.md` の `Users can do` を書き換え、読者が受け取る行を変える。23 のユニットのうち、サブを持つものは、その行の下にサブの行を足す。
  - logic: 各ユニットにどのサブを割り当てるか、どのユニットはサブを持たないかを、01 の規則で 1 つずつ決める。
  - structure: `####` の見出しの下のユニットの行に、インデントしたサブの行を並べる。
  - expression: サブの行の名を `<unit>_<sub>` と書き、`Who` を主語にした文にする。
  - existing: 既存の 23 のユニットの行を、サブを足す形に直す。サブを持たないユニットの行は動かさない。
- Out:
  - upstream: 外部の依存を足さない、変えない、消さない。（理由: 行の書き換えだけを扱う）
  - downstream: `adr` の `Definition`、`close` の `Verified`、`plan` の写し、`product-ready` と `README` の追従をしない。（理由: 読者の規則は 03 が持つ）
  - cost: 速度、メモリ、API、トークンの上限に触れない。（理由: 定義書が数十行増えるだけで、手順は増えない）
  - safety: 秘密、権限、露出、個人データに触れない。（理由: 定義書の行だけを扱う）
  - failure: 失敗時の扱いを変えない。（理由: サブの可否の制約は 01 の規則が持ち、02 はそれを適用する）
  - verification: 定義書を機械で検査する手段を足さない。（理由: いまその手段はなく、このサイクルの範囲でもない）
  - observability: 記録や信号を変えない。（理由: 定義書は記録を持たない）
  - release: 配布や適用の手順を変えない。（理由: 骨組みを変えず、`product-ready` の動きも変えない）
  - other: 上の種類で足りない心配はない。（理由: 扱うのは定義書の行だけである）

### Decision

- Status: **accepted**
- Main: この決定では、23 のユニットを 01 の規則で見直し、`subagent-consult` に 3 つ、`thinking-scrub` に 2 つ、`context-precompact` に 3 つのサブを足す。ほかの 20 のユニットはサブを持たないと決める（C2）。
  - Add:
    - `subagent-consult` の下の `_status`、`_cancel`、`_notify` の 3 行（F18）
    - `thinking-scrub` の下の `_switch`、`_status` の 2 行（F19）
    - `context-precompact` の下の `_now`、`_switch`、`_status` の 3 行（F20）
  - Update:
    - なし
  - Drop:
    - なし
- Sub: サブを持たない 20 のユニットは、その行を動かさない（C1, F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12, F13, F14, F15, F16, F17, F21, F22, F23）。
  - Add:
    - なし
  - Update:
    - なし
  - Drop:
    - なし
- Policy:
  - Allowed:
    - ユニットはサブを 0 個でも、いくつでも持てる（C4）
    - サブの `Who` は、親の主機能の `Who` と違ってよい（C4）
    - 同じ機能が、あるユニットのサブにも、別のユニットにも現れてよい（C3）
  - Forbidden:
    - 経路（コマンド、スクリプト、設定）をサブにしない - それは機能への経路である（C3）
    - 検査をサブにしない - それは機能を確かめる手段である（C3）
    - 主機能の行がすでに名指ししている機能をサブにしない - 同じことを 2 回書くことになる（C3）

#### Details

- `subagent-consult` の行
  ```md
  - subagent-consult: エージェントが、サブエージェントのコンサルを走らせ、そのワークツリーと結果を扱える
    - subagent-consult_status: オーナーまたはエージェントが、走っているサブエージェントとその進み具合を見られる
    - subagent-consult_cancel: オーナーまたはエージェントが、走っているサブエージェントを 1 つ止められる
    - subagent-consult_notify: オーナーが、コンサルの稼働と終了を音で気づける
  ```
- `thinking-scrub` の行
  ```md
  - thinking-scrub: エージェントが、ループした thinking を取り除き、次のターンに持ち越さない
    - thinking-scrub_switch: オーナーが、ループした thinking を取り除く動作を止めたり戻したりできる
    - thinking-scrub_status: オーナーが、いまの状態と、取り除いた量を確かめられる
  ```
- `context-precompact` の行
  ```md
  - context-precompact: エージェントが、コンパクションを待たずに、コンテキストを空けられる
    - context-precompact_now: オーナーが、しきい値を待たずに、コンパクションの準備を始められる
    - context-precompact_switch: オーナーが、コンパクションの準備を止めたり戻したりできる
    - context-precompact_status: オーナーが、準備の状態と最後に適用した量を確かめられる
  ```

### Definition

- `Unit.adr-skill`(kept): 主機能の行は同じで、スクリプトの操作は記録への経路であり、`--check` は検査である。
- `Unit.plan-skill`(kept): 主機能の行は同じで、スクリプトは順序と場所の計算の補助である。
- `Unit.work-skill`(kept): 主機能の行は同じで、専用の入口がなく、手順が経路である。
- `Unit.close-skill`(kept): 主機能の行は同じで、`collect.mjs` は経路で、収集・検証・トリアージはクロージングの手順である。
- `Unit.yolo-skill`(kept): 主機能の行は同じで、専用の入口がなく、手順が経路である。
- `Unit.quality-gate`(kept): 主機能の行は同じで、検査は自動で走り、名指しで呼ぶ機能がない。
- `Unit.lefthook-gate`(kept): 主機能の行は同じで、commit と push は行が名指ししている。
- `Unit.format-check`(kept): 主機能の行は同じで、`format` と `format:check` は揃えることの 2 つの経路である。
- `Unit.lint-check`(kept): 主機能の行は同じで、`lint` と `lint:fix` は検査と修正の 2 つの経路である。
- `Unit.type-check`(kept): 主機能の行は同じで、`typecheck` と `typecheck:staged` は同じ機能への経路である。
- `Unit.test-run`(kept): 主機能の行は同じで、`test`、`test:run`、`test:related` は同じ機能への経路である。
- `Unit.japanese-check`(kept): 主機能の行は同じで、スクリプトは経路で、設定は設定である。
- `Unit.definition-file`(kept): 主機能の行は同じで、文書 1 つにサブになる機能がない。
- `Unit.definition-rules`(kept): 主機能の行は同じで、規則 2 つで 1 つの機能である。
- `Unit.sound-notify`(kept): 主機能の行は同じで、通知の種類は設定とトリガーである。
- `Unit.agent-rules`(kept): 主機能の行は同じで、文書 1 つにサブになる機能がない。
- `Unit.usage-readme`(kept): 主機能の行は同じで、文書 2 つで 1 つの機能である。
- `Unit.subagent-consult`(kept): 主機能の行は同じで、下にサブの行が増える。
- `Unit.subagent-consult_status`(added): subagent-consult_status: オーナーまたはエージェントが、走っているサブエージェントとその進み具合を見られる
- `Unit.subagent-consult_cancel`(added): subagent-consult_cancel: オーナーまたはエージェントが、走っているサブエージェントを 1 つ止められる
- `Unit.subagent-consult_notify`(added): subagent-consult_notify: オーナーが、コンサルの稼働と終了を音で気づける
- `Unit.thinking-scrub`(kept): 主機能の行は同じで、下にサブの行が増える。
- `Unit.thinking-scrub_switch`(added): thinking-scrub_switch: オーナーが、ループした thinking を取り除く動作を止めたり戻したりできる
- `Unit.thinking-scrub_status`(added): thinking-scrub_status: オーナーが、いまの状態と、取り除いた量を確かめられる
- `Unit.context-precompact`(kept): 主機能の行は同じで、下にサブの行が増える。
- `Unit.context-precompact_now`(added): context-precompact_now: オーナーが、しきい値を待たずに、コンパクションの準備を始められる
- `Unit.context-precompact_switch`(added): context-precompact_switch: オーナーが、コンパクションの準備を止めたり戻したりできる
- `Unit.context-precompact_status`(added): context-precompact_status: オーナーが、準備の状態と最後に適用した量を確かめられる
- `Unit.upgrade-skill`(kept): 主機能の行は同じで、更新と監査は行が名指ししている。
- `Unit.product-ready`(kept): 主機能の行は同じで、置換・削除・除外は切り替えの手順である。
- `Unit.harness-sync`(kept): 主機能の行は同じで、取り込みと戻すは行が名指ししている。

## 03: サブを読む側の追従

Type: _Full_

### Context

- C1: 前提: `adr` の `Definition` は、`DEFINITION.md` の行を `Unit.<name>` で名指し、操作を `(added)`、`(updated)`、`(dropped)`、`(kept)` の 1 つで書く（`.pi/skills/adr/references/adr.format.md`）。
- C2: 前提: `close` の `Verified` は、このサイクルが触れたユニットごとに `### <Unit>` を作り、その行の機能と、計画が変えたものを確かめる（`.pi/skills/close/references/format.md`）。
- C3: 意図: サブが増えることで意味が変わる読者は、すべて追従する（ROADMAP 033）。
- C4: 制約: `product-ready` は `rules/definition.format.md` の `## Skeleton` を差し替えるだけで、`Users can do` の行を解析しない。骨組みは 01 で扱う。
- 問い: サブの行を、`adr` と `close` はどう名指し、どう確かめるか。ほかに追従が必要な読者はいるか。

### Research & Trial

- F1: `adr` の `Definition` は、`DEFINITION.md` の行を `<name>(<operation>): <value>` の 1 名 1 行で書き、操作は `(added)`、`(updated)`、`(kept)`、`(dropped)` の 4 つである。出所: `.pi/skills/adr/references/adr.format.md:127-140`
- F2: `adr` の `Definition` のテンプレートは `Unit.<name>(updated)` と `Unit.<name>(kept)` の 2 行だけで、サブの行をどう名指すかは書かれていない。出所: `.pi/skills/adr/references/adr.format.md:63-66`
- F3: `adr` の `--check` は `Type:`、`Scope`、`#### Details`、`C<n>/F<n>` だけを検証し、`### Definition` の行も `DEFINITION.md` のセクションも検証しない。出所: `.pi/skills/adr/scripts/adr.mjs:202-250`
- F4: `close` の `Verified` は、このサイクルが触れた Unit ごとに `### <Unit>` を作り、名は `Users can do` の行から写す。出所: `.pi/skills/close/references/format.md:117-119`
- F5: `close` は `####` 見出しを Unit ではないと明示するが、インデントされた子の行には触れていない。出所: `.pi/skills/close/references/format.md:118`
- F6: `close` の `Verified` の `Plans`、`Result`、`Change`、`Fixed` は Unit ごとに 1 つで、サブを別のセクションにするか親のセクションに含めるかは書かれていない。出所: `.pi/skills/close/references/format.md:122-129`
- F7: `plan` は `Definition` の行を、`(added)`、`(updated)`、`(dropped)` は仕事、`(kept)` は文脈として扱う。出所: `.pi/skills/plan/SKILL.md:79-82`
- F8: `product-ready` は `## Product` と `### What` の見出し一致で範囲を置換するだけで、`Users can do` の行を数えない。出所: `scripts/product-ready/targets.mjs:63-71`、`scripts/product-ready/index.mjs:18-37`
- F9: `product-ready` のテストは `Users can do` の行の包含だけを見て、行数も入れ子も見ない。出所: `scripts/product-ready/index.test.ts:271-283`
- F10: リポジトリに、`DEFINITION.md` の `Users can do` を構文解析するコードやテストはない。出所: リポジトリ全体の検索（`cycles/`、`node_modules`、生成物を除く）
- F11: `README.md` と `README.ja.md` は Unit 名と同じ文字列を持つが、Unit として数えも検証もしない。出所: `README.md:24-36`、`README.ja.md:24-36`
- F12: `close` の `collect.mjs` は `DEFINITION.md` を開かない。出所: `.pi/skills/close/scripts/collect.mjs:186-218`
- F13: 子の行を独立した Unit として数えるか親の一部として数えるかは、`rules/definition.rules.md` と `rules/definition.format.md` のどちらにも書かれていない。出所: `rules/definition.rules.md:27`、`rules/definition.format.md:76`

### Scope

- In:
  - result: `adr` の `Definition` と `close` の `Verified` を書き換え、読者が受け取る記録を変える。サブの行を名指しし、確かめられるようにする。
  - logic: `Definition` でサブをどう名指すか、`Verified` でサブを親と同じセクションで確かめるか別のセクションにするか、`Plans`、`Result`、`Change` をどう当てるかを決める。
  - structure: `adr.format.md` の `Definition` のセクションと、`close/references/format.md` の `Unit` のセクションに、サブの扱いを足す。
  - expression: 「`Users can do` の行は 1 つ」という言い方を、親の行とサブの行に分割した言い方に変える。
  - downstream: `adr` の `SKILL.md`、`close` の `SKILL.md`、`plan` の `Definition` の写しが、サブの扱いと矛盾しないかを確かめる。
  - verification: `close` の `Verified` が、サブの機能と、サブに触れた計画の変更を確かめる手段になるようにする。
- Out:
  - upstream: 外部の依存を足さない、変えない、消さない。（理由: 文書の規則だけを扱う）
  - existing: 既存の `close.md` や過去のサイクルの記録を直さない。（理由: 過去の記録はそのまま残す）
  - cost: 速度、メモリ、API、トークンの上限に触れない。（理由: 検証の行が少し増えるだけで、手順は増えない）
  - safety: 秘密、権限、露出、個人データに触れない。（理由: 文書の規則だけを扱う）
  - failure: 失敗時の扱いを変えない。（理由: `adr` の `--check` は `Definition` を検証せず、新たな検査も足さない）
  - release: 配布や適用の手順を変えない。（理由: `product-ready` は `Definition` の行を解析しない）
  - observability: 記録や信号を新しく足さない。（理由: `close.md` の `Verified` の書き方の変更は `result`、`structure`、`verification` が扱う）
  - other: 上の種類で足りない心配はない。（理由: 扱うのは読者の文書だけである）

### Decision

- Status: **accepted**
- Main: `adr` の `Definition` と `close` の `Verified` が、サブを 1 つの名として扱い、親と同じように記録し、確かめる（C3）。
  - Add:
    - `adr.format.md` の `Definition` に、サブの名は `Unit.<unit>_<sub>` で、親の行は `(kept)` とする規則（C1, F1, F2）
    - `close/references/format.md` に、触れた Unit はかならず、変更が触れたサブは 1 つの名として 1つのセクションを作る規則（C2, F4, F5, F6）
  - Update:
    - `adr/SKILL.md` の `Related Definition` の部分の一覧に `Sub` を足す（C3, F1, F2）
    - `close/SKILL.md` の `Verify` を、触れた Unit と、変更が触れたサブを 1 つずつ見る形にする（C2, F4, F5, F6）
    - `close/references/format.md` の `Unit` のセクションを、Unit とサブの名のセクションにする（C2, F4, F5, F6）
  - Drop:
    - なし
- Sub: なし
- Policy:
  - Allowed:
    - `plan` は `Definition` のサブの行を 1 つの仕事として読む。いまの扱いのままでよい（F7）
    - `product-ready`、`README`、`close` の `collect.mjs` は `Users can do` の行を数えないので、変更しない（C4, F8, F9, F10, F11, F12）
    - 変更が触れたサブは、`Verified` で親とは別のセクションを持つ（C2, F6）
  - Forbidden:
    - サブを Unit として数えない - 01 の規則が Unit と Sub を分ける（C1, F13）
    - `adr` の `--check` に `Definition` の検査を足さない - いま検証していない（F3）
    - サブを親の `Definition` の行にまとめない - 名が分からなくなる（C1, F2）

#### Details

- `adr.format.md` の `Definition` に足す規則
  ```md
  - A Sub is a name of its own: `Unit.<unit>_<sub>`. The parent's line stands when only the Sub's line moves.
  ```
- `adr/SKILL.md` の `Related Definition`
  ```md
  2. Name the parts of `DEFINITION.md` the entry relates to: `Unit`, `Sub`, `Who`, `Stack`, `What`.

  - A Unit or a Sub that `rules/definition.rules.md` does not allow is not a part.
  ```
- `close/references/format.md` の `Verified`
  ```md
  The Units the cycle touched, the Subs the change touched, and what the owner answered for each.

  ### Name

  - `### <name>` holds one section per Unit this cycle touched, and per Sub the change touched, among the names listed in `Users can do`.
  - A Unit is a top-level line under `Users can do`; a Sub is an indented line under its Unit. A `####` heading is neither.
  - The name is copied as it is.
  - `Product` / `What` / `Who` / `Stack` are not names and are not verified.

  ### Fields

  - `Plans` holds one bullet per plan that cuts an entry that names it, taken from the plan md's `No`.
  ```
- `close/SKILL.md` の `Verify`
  ```md
  ### 6. Verify, by Unit and Sub

  1. Take one Unit the cycle touched, and one Sub the change touched, at a time:

  2. Move to the next Unit or Sub.

  | the name                            | the check                                    |
  | ----------------------------------- | -------------------------------------------- |
  | a Unit or a Sub under its Unit      | its function, and the change that plans made |
  | a `Product`, `What`, `Who`, `Stack` | not a name                                   |

  - The Units and Subs are as `references/format.md` says.
  ```

### Definition

- `Unit.adr-skill`(kept): 主機能は同じで、変わったのは `Definition` がサブを名指す書き方である。
- `Unit.close-skill`(kept): 主機能は同じで、変わったのは `Verified` がサブを確かめる書き方である。
