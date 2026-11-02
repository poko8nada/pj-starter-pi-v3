# PLAN `adr-merge`

- No: 03, 05

## Files

```text
.pi/
  skills/
    brief/
      SKILL.md                 drop
      references/
        tasks.md               drop
    adr/
      SKILL.md                 update
      references/
        format.md              update
        tasks.md               add
README.md                      update
README.ja.md                   update
AGENTS.md                      update
rules/
  roadmap.md                   update
DEFINITION.md                  update
ROADMAP.md                     update
```

## Slices

## 1.adr-skill

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/adr/SKILL.md`:
   - `## Cycle` を1. 意図、2. ロードマップ、3. エントリの分割と各エントリの意図の2段構成に書き直します。
   - `## One entry` をスコープ、調査、選択肢、決定、Definitionのエントリごとのループにします。
   - `## Proofread` は`adr.md`と`adr/references/format.md`を名指し、「the role's policy applies」、「名指したファイルだけを編集する」、「現在のエントリの行だけ」を書いた一文とパスにします。
   - `## Cycle`のscaffoldの行には、開いているcycleの`adr.md`に次のエントリのスケルトンを追記し、閉じているか存在しないcycleには新しいcycleを作ると書きます。
   - `## How not to write this` の「Do not decide」を残し、`description` をサイクルの入口の説明にします。
2. `.pi/skills/adr/references/format.md`:
   - 「the front」の3箇所をなくします。
   - `Scope` を「the list the owner agreed」にします。
   - `## Cycle` と `## One entry` の形を意図、ロードマップ、分割、エントリごとのループに合わせます。
3. `.pi/skills/adr/references/tasks.md`:
   - `brief/references/tasks.md` の「Look it up」と「Try it」をこのファイルに移します。

### Verify

- Always:
  - `既定の 5 つ`。
  - `the front` を `.pi/skills/adr/SKILL.md`、`.pi/skills/adr/references/format.md`、`.pi/skills/adr/references/tasks.md` で大文字・小文字を区別せずに探し、残っていないこと。
  - `brief` を上記の3ファイルで大文字・小文字を区別せずに探し、残っていないこと。
- Added:
  - other — `.pi/skills/adr/references/tasks.md` が「Look it up」と「Try it」を持つこと。
  - other — `.pi/skills/adr/SKILL.md` の `## Proofread` が `adr.md`、`.pi/skills/adr/references/format.md`、「the role's policy applies」、「名指したファイルだけを編集する」、「現在のエントリの行だけ」を持つこと。
  - other — `.pi/skills/adr/SKILL.md` の scaffold の行が、開いている cycle の `adr.md` への追記と新しい cycle の作成を書くこと。
  - base — オーナーが `.pi/skills/adr/SKILL.md` と `.pi/skills/adr/references/format.md` と `.pi/skills/adr/references/tasks.md` の文面を読み、OK を返すこと。

## 2.brief-removal

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/brief/SKILL.md`:
   - このファイルを削除します。
2. `.pi/skills/brief/references/tasks.md`:
   - このファイルを削除します。
3. `README.md`:
   - スキルの表を7行から6行にし、`brief`の行を消します。
   - `adr`の行を意図から決定までの手順の説明に書き換え、「サイクルは`adr`から始まる」と書きます。
   - proofreadの説明は変えません。
4. `README.ja.md`:
   - スキルの表を7行から6行にし、`brief`の行を消します。
   - `adr`の行を意図から決定までの手順の説明に書き換え、「サイクルは`adr`から始まる」と書きます。
   - proofreadの説明は変えません。
5. `AGENTS.md`:
   - サイクルの入口の記述を`adr`にします。
6. `rules/roadmap.md`:
   - 項目を選ぶのは`adr`の役割と書きます。
7. `DEFINITION.md`:
   - `Unit.brief-skill`の行を消し、`Unit.adr-skill`はそのまま残します。
8. `ROADMAP.md`:
   - 同ファイルの19行目、49行目、78行目の`brief`を`adr`にします。

### Verify

- Always:
  - `既定の 5 つ`。
  - `brief` を `cycles/` の外で大文字・小文字を区別せずに探し、残っていないこと（`ROADMAP.md` を含む）。
- Added:
  - other — `README.md` と `README.ja.md` のスキルの表が6行で、`brief`の行が無いこと。
  - other — `README.md` と `README.ja.md` のproofreadの説明が変わっていないこと。
  - other — `AGENTS.md` と `rules/roadmap.md` のサイクルの入口が`adr`で、その段落に`brief`が無いこと。
  - other — `DEFINITION.md` に `Unit.brief-skill` の行が無く、`Unit.adr-skill` の行が残っていること。
  - base — オーナーが `README.md`、`README.ja.md`、`AGENTS.md`、`rules/roadmap.md`、`DEFINITION.md`、`ROADMAP.md` の文面を読み、OK を返すこと。

## Notes

### Slice 1: adr-skill

- Findings: なし
- Unplanned: なし
- Commit: 7315d29
- Stopped: なし

### Slice 2: brief-removal

- Findings: なし
- Unplanned: なし
- Commit: f15e1a1
- Stopped: なし

## Review

### Round 1

- Stale: なし — `brief` は `cycles/` の外に残らない（`README.md:12,61,71`、`README.ja.md:12,61,71`、`AGENTS.md:3`、`rules/roadmap.md:19`、`DEFINITION.md:35` を目視、`grep brief` で 3 ファイルと上記に一致なし）。`the front` は `.pi/skills/adr/SKILL.md`、`.pi/skills/adr/references/format.md`、`.pi/skills/adr/references/tasks.md` に残らない（`SKILL.md:92` の `in front of` は UI の意味ではなく対象外）。`work/SKILL.md:69` の `front` は cmux の意味で別物（`adr.md:157` が明記）。`scaffold.mjs` と `scaffold.test.ts` に `brief`/`front` はない。スキルの数え直し（7→6）も `README.md:12`、`README.ja.md:12` に反映済み。
- Unlisted: なし — `git diff d5c4277..HEAD --name-status` の 10 件は `## Files` の 11 項目と一致する（`R100 .pi/skills/brief/references/tasks.md → .pi/skills/adr/references/tasks.md` の改名で drop＋add が 1 件になる）。`ROADMAP.md:18-21` の `todo→wip` 4 件は `Files` の中の差分であり、`Files` が名指さない別ファイルの変更はない。なお status の変更は手順に明示がないが、下の `Doubts` の理由で finding にしない。
- Gaps: なし — 本 plan に `## Test cases` はなく文書変更のみのため、検査の抜けを指摘する対象がない。`Added` の各項目は目視で確認した（`tasks.md:5,20` が「Look it up」「Try it」を持つ、`SKILL.md:121` が `adr.md` と `format.md` と `the role's policy applies` と命名限定・当該行限定を持つ、`SKILL.md:48` が開放中への追記と新規作成を持つ、`README.md:61-66` が 6 行で `brief` 行なし・proofread 説明不変、`AGENTS.md:3` と `rules/roadmap.md:19` の入口が `adr` で同段落に `brief` なし、`DEFINITION.md:35` に `Unit.brief-skill` なし・`Unit.adr-skill` あり、`ROADMAP.md:19,49,78` が `adr` で `brief` なし）。
- Unproven: なし — 対象のテストがなく、壊しても緑のままのテストはない（`scaffold.test.ts` は本 plan の `Files` 外で、別 plan `adr-scaffold` が担当）。
- Noise: なし — 型・スキーマ・DB が決める重複検査や、誰も気づかない検査、マジックナンバー・ハードコード文字列の追加はない。
- Doubts:
  - `ROADMAP.md:18-21` の `002,003,004,005` の `todo→wip` は `Steps` に明示がない。ただし `Files` が `ROADMAP.md` を名指し、`Unlisted` の定義（`Files` が名指さない変更）に当てはまらず、`cycles/261029-045-dev/adr.md:7,81,153,292` が 4 件をすでに `wip` と記録し、新 `SKILL.md:39` が該当項目を `wip` にする手順のため、「plan か ADR が決めた値」に当たり finding にしない。
  - `SKILL.md:121` の proofread 一文は英語（`edit only the named files, and only this entry's lines`）で、plan の日本語逐語（「名指したファイルだけを編集する」「現在のエントリの行だけ」）と文字一致しない。スキル本文が英語のため意味同等と判断し finding にしない。最終の文面判断は `base` のオーナー確認に委ねる。
  - `SKILL.md:48,55` は追記動作を書くが、現 `scaffold.mjs` は追記を持たない（`design.md:142,172-184` が `adr-scaffold` の担当と明記）。plan と ADR が決めた順序のため finding にしない。

## Acceptance

- Ran: `pnpm test:run`（57ファイル、770テスト）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`。plan の `Verify` の grep（`brief` は `cycles/` の外で 0 件、`the front` は `adr` の 3 ファイルで 0 件）、`tasks.md` の「Look it up」と「Try it」、`## Proofread` の 5 要素、scaffold の行を確認した。オーナーは 2 スライスに OK を返した。
- Findings: なし
- Doubts: なし
