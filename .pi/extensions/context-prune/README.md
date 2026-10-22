# context-prune

Keeps the context window open by pruning old tool results the summary no longer needs. When context usage passes a ratio of the model's window, the extension summarizes the recent messages in the background, asks the classifier (Jev, via pi's `modelRegistry`) which old tool results still matter, and drops the rest from the model context. The raw session entries stay on disk; only the sent context changes.

## How it moves

- Gate (`turn_end`): when `tokens / contextWindow` passes `ratio` (default `0.5`), starts one pass in the background without stopping the turn. Runs at most once until usage grows by `contextWindow * rearmRatio`.
- Pass: summarizes the recent messages with pi's `generateSummaryWithUsage` (in English), trims the summary to Goal / Progress / Next Steps, attaches the first and last 500 chars of each old tool result, asks one `keep_<id>` question per result in budget-sized batches, and drops the results the classifier rates below `threshold`. A missing answer keeps the result (fail-open).
- Apply (next `turn_end` or `agent_before_settle`, whichever comes first): returns `context_edit` entries that replace the dropped results with a one-line marker. Nothing is appended when there is nothing to drop, and the same boundary never returns the same drafts twice.
- Card: each finished pass is appended as a `custom` entry (`context-prune`) and drawn like the standard compaction card (`[prune]`, click to expand).

## Commands

`/prune` shows the status and switches the pruner. Only `on` / `off` rewrite `settings.json`; `now` runs one pass right away without waiting for the ratio.

```
/prune                      show status (enabled, ratio, last pass, dropped, failures)
/prune now                  run once now (skips the ratio and the cooldown)
/prune on                   enable
/prune off                  disable
```

Any other argument prints the usage instead of throwing.

## Settings

`settings.json` sits next to this file and holds a partial override: only the written fields apply, the rest stay at their defaults. Unknown keys, out-of-range numbers, and wrong types return `broken` instead of being silently ignored.

| Setting                | Default                                                                           |
| ---------------------- | --------------------------------------------------------------------------------- |
| `enabled`              | `true`                                                                            |
| `ratio`                | `0.5` (fires when `tokens / contextWindow` passes it, between 0.2–0.8)            |
| `recentTokens`         | `50000` (recent messages the summary covers)                                      |
| `threshold`            | `0.5` (a `yes` below this drops the result)                                       |
| `rearmRatio`           | `0.1` (usage must grow this much of the window before the next run)               |
| `marker`               | `古いツール結果（{chars} 文字）を省略` (`{chars}` becomes the count)              |
| `classifier.models`    | `opencode/jev-1.13-free`, `openrouter/~typesafe/jev-latest` (tried in this order) |
| `classifier.allowPaid` | `true` (`false` keeps only free models)                                           |

## The code

```
index.ts            the entry: reads the settings, runs passes in the background, wires turn_end → agent_before_settle → command → card
prune/collect.ts    splits the recent messages from the old tool results
prune/judge.ts      the keep_<id> questions, the batches, and the verdicts
prune/plan.ts       the gate (disabled/unknown/running/empty/ratio/cooling)
prune/run.ts        one pass: summarize, classify in batches, drop
prune/ports.ts      the production summarize (pi's generateSummaryWithUsage) and classify via the model registry
entry/data.ts       the prune pass record (custom entry, not sent to the model)
entry/render.ts     the [prune] card, drawn like the compaction card
apply/drafts.ts     the context_edit drafts and the marker text
command/prune.ts    /prune: status, on, off, now, usage
settings/schema.ts  the defaults and the partial override (unknown keys and out-of-range numbers are broken)
settings/read.ts    reads settings.json (fresh on every call)
settings.json       the override on top of the defaults
```
