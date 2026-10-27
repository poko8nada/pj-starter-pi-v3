# PLAN `ex-settings-read-comment`

## Files

```text
.pi/
  extensions/
    thinking-scrub/
      settings/
        read.ts                update
        read.test.ts
      index.ts
```

## Slices

## 1.comment-clarify

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/thinking-scrub/settings/read.ts`:
   - 先頭のコメントを、`readSettings` は呼ばれたときにその都度ファイルを読むことと、配線がスキャン時と `message_end` に読むことを分けて書く形に直します。

### Verify

- Always:
  - `pnpm test:related <このスライスで変えたファイル>`。関連が無ければ `pnpm test:run`。
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `入口は毎回読み直す` を、変えたファイルで大小無視して探し、残っていないこと。
- Added: なし

## Notes

### Slice 1: comment-clarify

- Findings: なし
- Unplanned: なし
- Commit: 061a293 consult(ex-settings-read-comment): clarify readSettings comment
- Stopped:

## Review

### Round 1

- Stale:
  - なし — 旧句「入口は毎回読み直す」は thinking-scrub 配下から消え（grep 0 件）、新文言の `.pi/extensions/thinking-scrub/settings/read.ts:4` は `.pi/extensions/thinking-scrub/index.ts:5` と整合し他文書を陳腐化しない。
- Unlisted:
  - なし — `git diff 16ef38c..HEAD --stat` の変更は `settings/read.ts` の 1 行のみで Files の `update` と一致する。
- Gaps:
  - なし — 注釈のみの変更で Added はなしのため振る舞いの穴はなく、Verify の旧句 grep が旧文言の除去を直接確かめる。
- Unproven:
  - なし — Steps に test 段がなく名指す振る舞いがないため、壊しても緑に残る test は存在しない。
- Noise:
  - なし — Steps に test 件がなく、形式の Test cases で裁く魔法数・固定文字列・型済み前提の断定はない。
- Doubts:
  - なし — 配線の他読所（初期化・`agent_end`・命令時）と他拡張の同句残存は本計画の対象外であり、残すほどの疑義はない。

## Acceptance

- Ran: `pnpm test:related .pi/extensions/thinking-scrub/settings/read.ts`（39 件）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`入口は毎回読み直す` の grep（0 件）。文書だけの変更のため、読んだ内容の確認が検査になる。
- Findings: なし
- Doubts: なし
