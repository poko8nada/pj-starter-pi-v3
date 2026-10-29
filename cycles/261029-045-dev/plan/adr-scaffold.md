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

- Findings: なし
- Unplanned:
  - `scaffold.mjs` の `Adopted:` 直下に `  - <採った形>` を足し、`format.md` の Shape に合わせた。見出しだけでは `adrSkeleton` の stale が残るため、ここで直した。
- Commit: 305ee68
- Stopped:

### Slice 2: open-cycle

- Findings: なし
- Unplanned: なし
- Commit: 90af6c8
- Stopped:

### Cleanup: scaffold.test.ts

- Findings: なし — 重複・gone・到達不能分岐・Test cases 違反なし。`openCycleDir` の null 2件は plan の Steps が分けた empty 2条件で、unit と CLI は Verify が求める別層のため残した。
- Unplanned: なし

## Review

### Round 1

- Stale:
  - なし — `SKILL.md:48,55` は追記動作を既に述べており、`scaffold.mjs:1-5` の header は短いが誤りではなく、旧 `adrSkeleton` の test（`scaffold.test.ts:22-32`）も prefix のまま通ることを確かめたため。
- Unlisted:
  - なし — diff の変更は `Files` の2件（`scaffold.mjs`・`scaffold.test.ts`）だけで、他 file の変更はないため。
- Gaps:
  - `openCycleDir` の `adr.md` 存在条件が exercised されていない（`.pi/skills/adr/scripts/scaffold.mjs:252`）。plan の empty 条件「`adr.md` を持つサイクルがなければ」は test では cycles 自体が無い場合（`.pi/skills/adr/scripts/scaffold.test.ts:262-265`）だけで確かめ、dir はあるが `adr.md` が無い場合の test がないため。
    - fixed: `scaffold.test.ts` の `openCycleDir` に「dir はあるが `adr.md` がなければ → `null`」を追加し、存在条件を直接確かめた。
- Unproven:
  - `appendEntry` の改行調整（`.pi/skills/adr/scripts/scaffold.mjs:94-96`）を壊しても test が緑のまま。`.pi/skills/adr/scripts/scaffold.test.ts:225-250` は `toContain('## 0N:')` と最終見出しと `# ADR` の個数だけを見て空行の区切り（`\n\n## NN:`）を assert しないため、sep を常に `''` にしても通るため。
    - fixed: `appendEntry` の3件に `toContain('\n\n## 0N: <問い>')` を足し、空行区切りを assert した。sep を `''` にすると落ちることを確かめた。
  - CLI の次番号の計算（`.pi/skills/adr/scripts/scaffold.mjs:275`）を壊しても test が緑のまま。`.pi/skills/adr/scripts/scaffold.test.ts:293-307` は `01 → 02` の追記だけを確かめ、`02` を持つ `adr.md` からの CLI 追記（`03` になること）がなく、`next` を `2` に固定しても通るため。
    - fixed: CLI に「`## 02:` を持つ開いたサイクルでは `## 03:` が増える」を足し、`lastEntryNumber` が3・`# ADR` が1つを assert した。`next` 固定では落ちることを確かめた。
- Noise:
  - なし — 新 test の値は plan の Steps・Verify が決めたもの（`## 01/02/03`、`## NN:` の throw、`format.md` の見出し6件）で、独自の magic number や hardcoded string の assert はなく、`15/16・261010・main` は `cycleDirName` という factory の入力のため。
- Doubts:
  - `entrySkeleton(100)` は `## 100:`（`.pi/skills/adr/scripts/scaffold.mjs:17` の `padStart(2, '0')`）になるが、`lastEntryNumber` の正規表現（`.pi/skills/adr/scripts/scaffold.mjs:74` の `\d{2}`）は2桁だけを受け、3桁は「壊れた見出し」として投げる。100 entry は現実的でなく plan も2桁を前提にするため finding にしないが、close で前提として残すため。
  - 開いた cycle の `adr.md` が壊れていると CLI は `lastEntryNumber` の throw で非0終了する（`.pi/skills/adr/scripts/scaffold.mjs:274-276`、write の前に投げるため file は無変更）。plan はこの経路を定めず、現状の「大きな音で止まる」は妥当なため finding にしないが、close で残すため。
  - `appendEntry('', n)` は `# ADR` 無しの entry を返す（`.pi/skills/adr/scripts/scaffold.mjs:93`）。CLI からは0バイトの `adr.md` でだけ起き、plan は空 file を定めないため finding にしないが、close で残すため。

## Acceptance

- Ran:
- Findings:
- Doubts:
