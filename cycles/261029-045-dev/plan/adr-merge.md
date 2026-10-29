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

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: brief-removal

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
