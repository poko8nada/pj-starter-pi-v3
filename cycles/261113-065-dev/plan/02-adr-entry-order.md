# PLAN `adr-entry-order`

- No: 02
- Place: worktree
- Boundary Plans: なし

## Goal

adr の分割の提示が、エントリの順番とその理由を示し、先に決めた結果が後のエントリに影響するものが先に並ぶようになる

## Design

- Inside:
  - Modules: なし（`adr/SKILL.md` の `### 3. Entries` を書き換えるだけで、ファイルやモジュールの統合・分割はない）
  - Dirs: なし（ディレクトリの統合・分割・移動はない）
- Outside:
  - Extract: なし（ほかの文書と共有する新しいモジュールはない）
  - Colocate: なし（コロケーションに変えるモジュールはない）

## Files

```text
.pi/
  skills/
    adr/
      SKILL.md                 update
    close/
      SKILL.md
    yolo/
      SKILL.md
ROADMAP.md
```

## Slices

## 1.分割の提示に順番と理由を足す

分割の提示に、エントリの順番とその理由、順番を決める条件を足す。

### Types

なし

### Steps

1. `.pi/skills/adr/SKILL.md`
   1. update: `### 3. Entries` の Step 3 を、順番とその理由も示す形にする。

      ```md
      3. Show the owner the split, each entry's intent, each entry's `Type`, and the order of the entries with its reason.
      ```

   2. update: `### 3. Entries` の Step 4 に、順番だけを却下された場合は、分割を保ち、順番を直して示し直す、と足す。

      ```md
      4. Rewrite a rejected split, and show it again. When only a `Type` is rejected, keep the split, and write the owner's `Type` for that entry. When only the order is rejected, keep the split and write the order again.
      ```

   3. add: `### 3. Entries` の Notes の末尾に、順番の条件を2本足す。

      ```md
      - Basically, an entry whose decision influences a later entry comes first.
      - An order the condition does not cover is allowed.
      ```

### Policy

- Allowed:
  - 順番の理由を、分割、意図、`Type` と同じ提示に含める
  - 条件に当てはまらない並びを許す
- Forbidden:
  - オーナーの承認なしに順番を決めない - 分割と順番を決めるのはオーナーである
  - 分割の単位（1 エントリ 1 `Main`、`Sub` の条件）を変えない - このエントリは順番だけを扱う
  - `close` と `yolo` に順番の条件を写さない - どちらも adr の分割の順を使う
  - `plan` に順番の条件を写さない - plan はエントリの順番に依存せず、cut の順を使う

### Verify

- Always:
  - 関連テスト（`pnpm test:related .pi/skills/adr/SKILL.md`。関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## Notes

### Slice 1: 分割の提示に順番と理由を足す

- Findings: なし
- Unplanned: なし
- Commit: f20ff4c
- Stopped:

### Cleanup: なし

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - `.pi/skills/adr/SKILL.md:81` — `The owner's answer decides the split.` は、この変更の前は分割だけが提示物だったため足りていた。変更後は Step 4 が「順番だけの却下」を扱い、ADR C7 と計画の `Policy` が「分割と順番はオーナーが決める」と定めるのに、Note は分割しか名指さない。同じ文書が Step 4 で `split` と `order` を別物として扱っているため、この1文だけを読むと順番はエージェントが決めてよいと読め、`Policy` の Forbidden（オーナーの承認なしに順番を決めない）と食い違う。`The owner's answer decides the split and the order.` へ広げる必要がある。
    fixed: `.pi/skills/adr/SKILL.md` の Note を `The owner's answer decides the split and the order.` に広げた。
- Unlisted: なし — 差分の2ファイルのうち `.pi/skills/adr/SKILL.md` は `Files` で `update`、計画 md は作業の記録そのもので、`Files` が名指す `close`、`yolo`、`ROADMAP.md` には変更がないため。
- Gaps: なし — 変更は文書の文面だけで、ADR の `Scope` の `failure: 検査を足さない（順番の理由は読んで確かめる）` と `Verify` の `Added: なし` が検査を足さないことを決めており、Step 3、Step 4、Note 2本は `Steps` の文面と一致しているため。
- Policy: なし — Allowed の2件（順番の理由を同じ提示に含める、条件に当てはまらない並びを許す）は Step 3 と Note 2本で満たし、Forbidden の4件（順番の独断、分割単位の変更、`close`／`yolo` への写し、`plan` への写し）はいずれも差分に触れていないため。
- Unproven: なし — テストを足しておらず（`Added: なし`）、`SKILL.md` の文面を検査するテストはこの変更の前から無いため、緑のまま残るテストは増えていない。
- Noise: なし — テストの追加がないため、型・スキーマ・DB 制約が決めるケースや、マジックナンバー・固定文字列を含むケースもない。
- Doubts:
  - `.pi/skills/adr/SKILL.md:61` — `When only the order is rejected, keep the split and write the order again.` は、どこへ書くのか（エントリは Step 5 で初めて書かれる）と、Step 3 の「理由つきで示す」をやり直すのかを示さない。計画の `Steps` がこの文面を指定しているため差分は正しいが、`show the order again with its reason` とすべきかはオーナーの判断。

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal:
- Ran:
- Findings:
- Doubts:
