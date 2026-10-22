# ADR 023

## 01: custom の走り出しで route が落ちるのを、どこで直すか

### Context

- `consult` の届け物（`.pi/extensions/consult/tool/consult.ts:215`）と `quality-gate` の知らせ（`.pi/extensions/quality-gate/index.ts:137`）は、`pi.sendMessage(..., { triggerTurn: true })` で走り出しを作る。
- その走り出しでは、`before_agent_start` に `prompt` が無い。pi の型では、イベントは `messageType: "user"` と `"custom"` の 2 つの枝を持つ（`dist/core/extensions/types.d.ts:720-742`）。
- `.pi/extensions/intent-router/route/hook.ts:194` は `event.prompt.startsWith('/')` を無条件に読むので、`custom` の時に落ちる。スタックは `sendCustomMessage → _startRun → _prepareRun → emitBeforeAgentStart` である。
- 落ちると、その走り出しでは route の判定と guide の差し込みが飛び、エラー表示が出る。セッションは続く。
- この穴を持つのは `intent-router` だけである。`before_agent_start` を登録しているのは `route/hook.ts:193` だけで、`quality-gate` は `input` と `agent_start`、`consult` は `session_start` と `turn_end` を使う。
- 原因は、port が pi の union を単一の形に狭めたことである。`route/hook.ts:23-40` の `RoutePiPort` は `prompt: string`（必須）と書くので、`custom` の枝が型から消え、テストの足場も `prompt` を必ず渡す。
- この欠陥は `4196c86`（`consult(intent-questions): split files by stage`）で入り、develop にも同じコードがある。022 の作業でもマージでもない。

### Decision

- Status: **accepted**
- Adopted:
  - `RoutePiPort` のイベントを、pi の union に合わせる。`messageType: 'user'` の枝は `prompt` を持ち、`messageType: 'custom'` の枝はそれを持たない。
  - `registerRoute` の入口で `messageType !== 'user'` を素通りさせる。`ask` も記録も残さず、`undefined` を返す。
  - `index.ts` の包みは、pi 側の枝を見てから port の形を組み立てる。`ev.prompt` は `messageType === 'user'` の枝でしか読めないので、分岐を書かないと型が通らない。
  - `index.ts` の `cell.hold(ctx)` と `refresh()` は、`custom` の時も今までどおり走らせる。セッションの文脈を持つ所で、route が見ないこととは別である。
  - テストの足場に `messageType: 'user'` を足し、`custom` のケースを 1 つ足す。
- Options:
  - `input` に移す（guide を差し込む口が無く、`pi.sendMessage` を別に打つことになる。`agentPrev` が入力時点で取れるかも別の問題になる）
  - 実行時だけ `prompt` の有無で外す（型は `prompt: string` のままで、次の改修で同じ穴が戻る）

### Research & Trial

- `BeforeAgentStartEvent` は `messageType: "user"`（`prompt` と `images?`）と `messageType: "custom"`（`message`）の union である（`dist/core/extensions/types.d.ts:720-742`）。その戻り値は `{ message?, systemPrompt? }` で、guide の差し込みはこの `message` が担う（`:1125`）。
- `InputEvent` は `source: "interactive" | "rpc" | "extension"` を持ち、戻り値は `continue` / `transform`（本文の書き換え）/ `handled` の 3 つである（`:908-930`）。別のメッセージを差し込む口は無い。
- pi の docs も、`messageType` を見て custom の走り出しを外せと書いている（`docs/extensions.md:104`）。

### Definition Change

- `Unit.intent-router`(updated): 値は書かない（行は動かない）。例外として名指しする理由は、あの行が実際には成り立っていなかったのを、この cycle が直すからである。
