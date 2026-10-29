# PLAN `adr-scaffold`

- No: 03

## Files

```text
.pi/
  skills/
    adr/
      scripts/
        scaffold.mjs           update
        scaffold.test.ts       update
```

## Slices

## 1.entry-number

### Types

```ts
// .pi/skills/adr/scripts/scaffold.mjs（JSDoc。tsconfig は checkJs を持たないので、値の保証は下の Steps と Verify のチェックが持つ）
export function entrySkeleton(nnn: number): string;
export function lastEntryNumber(markdown: string): number | null;
export function appendEntry(markdown: string, nnn: number): string;
```

### Steps

1. `.pi/skills/adr/scripts/scaffold.mjs`:
   - `entrySkeleton(nnn)` を追加し、`adrSkeleton(nnn)` を `# ADR NNN` と `entrySkeleton(1)` から組み立てます。スケルトンの見出しは `adr/references/format.md` のエントリーのスケルトン（`## NN:`、`### Context`、`### Scope`、`### Research & Trial`、`### Decision`、`### Definition`）に合わせます。
   - `lastEntryNumber(markdown)` を追加します。`## NN:` の最大値を返し、`## ` で始まる見出しが `## NN:` と一致しなければ理由付きのエラーをスローし、該当する見出しが1つもなければ `null` を返します。
   - `appendEntry(markdown, nnn)` を追加します。末尾の改行を調整して `entrySkeleton(nnn)` を追加し、`# ADR NNN` を重複させません。
2. `.pi/skills/adr/scripts/scaffold.test.ts`:
   - (happy) `## 01:` を持つ `markdown` → `lastEntryNumber` は1を返し、`appendEntry` は `## 02:` を追加し、`# ADR` は1つのままである。
   - (happy) `## 02:` を持つ `markdown` → `lastEntryNumber` は2を返し、`appendEntry` は `## 03:` を追加する。
   - (empty) エントリーのない `markdown` → `lastEntryNumber` は `null` を返し、`appendEntry(markdown, 1)` は `## 01:` を追加する。
   - (error) `## 1:` または `## 01` の見出し → `lastEntryNumber` が理由付きのエラーをスローする。

### Verify

- Always:
  - `既定の 5 つ`。
- Added:
  - other — `pnpm test:related .pi/skills/adr/scripts/scaffold.test.ts` で、`appendEntry` 後の `markdown` の `# ADR NNN` が1つであり、最後の見出しが `## NN:` であること。
  - other — `pnpm test:related .pi/skills/adr/scripts/scaffold.test.ts` で、壊れた見出しに対する `lastEntryNumber` が理由付きのエラーをスローすること。
  - other — `pnpm test:related .pi/skills/adr/scripts/scaffold.test.ts` で、`entrySkeleton` の見出しが `adr/references/format.md` のエントリーのスケルトンと一致すること。

## 2.open-cycle

### Types

```ts
// .pi/skills/adr/scripts/scaffold.mjs（JSDoc）
export function openCycleDir(cyclesDir: string): string | null;
```

### Steps

1. `.pi/skills/adr/scripts/scaffold.mjs`:
   - `openCycleDir(cyclesDir)` を追加します。`cycles/` 直下で `adr.md` を持ち `close.md` を持たないディレクトリのうち、名前の `NNN` が最大のものを返し、なければ `null` を返します。
   - CLI を、`openCycleDir` がディレクトリを返せばその `adr.md` に `appendEntry` の結果を書き込み、返さなければ現在の挙動どおりに新しいサイクルを作る形にします。開いたサイクルがあるときに `<nnn>` を渡されたら、理由付きのエラーをスローして止めます。
2. `.pi/skills/adr/scripts/scaffold.test.ts`:
   - (happy) `adr.md` を持ち `close.md` を持たないサイクルが1つ → `openCycleDir` がそのディレクトリを返す。
   - (empty) `adr.md` を持つサイクルがなければ → `null` を返す。
   - (empty) `close.md` を持つサイクルだけしかなければ → `null` を返し、CLI は新しいサイクルを作る。
   - (boundary) 開いたサイクルが2つ → `openCycleDir` は `NNN` の大きい方を返す。
   - (error) 開いたサイクルがあるときに `<nnn>` を渡す → CLI が理由付きのエラーをスローして止まる。

### Verify

- Always:
  - `既定の 5 つ`。
- Added:
  - other — `pnpm test:related .pi/skills/adr/scripts/scaffold.test.ts` で、CLI を一時的な `--root` で実行し、開いたサイクルでは `adr.md` に `## NN:` が1つ増え、閉じたサイクルとサイクルが無い場合では新しいディレクトリができること。
  - other — `pnpm test:related .pi/skills/adr/scripts/scaffold.test.ts` で、閉じたサイクルの `adr.md` が変わらないこと。
  - other — `pnpm test:related .pi/skills/adr/scripts/scaffold.test.ts` で、開いたサイクルがあるときに `<nnn>` を渡すと CLI が止まること。

## Notes

### Slice 1: entry-number

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: open-cycle

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
