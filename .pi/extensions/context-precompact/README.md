# context-precompact

The standard compaction waits until the context is full, then makes the agent wait while it summarizes. This extension does not replace the standard compaction. It prepares the same compaction in the background, starting just before the threshold, and slips it in at the boundary so the wait disappears.

## How it moves

When the usage ratio reaches `thresholdRatio - 0.05`, the extension copies Pi's `prepareCompaction` shape (`firstKeptEntryId`, `messagesToSummarize`, `turnPrefixMessages`, `previousSummary`, `fileOps`) and summarizes it with Pi's public `compact()` API. `tokensBefore` is the `getContextUsage()` value at preparation time.

The main path is `turn_end`: at or above `thresholdRatio` the ready draft is returned as one compaction entry. `session_before_compact` is the fallback path for when Pi compacts first: the prepared result is compared field by field and handed over only on a full match, with `tokensBefore` refreshed to the current usage. `agent_before_settle` applies a ready draft as well but never starts a new pass.

Before applying, the extension checks the session id, that the preparation-time leaf is still on the branch, that `firstKeptEntryId` is still there, and that no newer compaction landed. On failure, stale data, a comparison mismatch, or a missing `firstKeptEntryId`, it discards the preparation and lets the default compaction run.

The summary is capped at 300,000 ms (5 minutes); when it fails, the draft is discarded and the default compaction runs.

## Commands

`/precompact status|on|off|now`

- `/precompact` shows on/off, whether a draft is prepared, whether a pass is running, the last applied tokens, and the current `status:` line with the failure reason.
- `/precompact on` and `/precompact off` rewrite only `enabled` in `settings.json`.
- `/precompact now` starts one preparation pass in the background and returns immediately. The chat shows `precompact: preparing…` at the start, then `precompact: ready (X → Y)` or `precompact: applied (X → Y)`. When a pass cannot run it says `precompact: off` or `precompact: nothing to prepare`; when one is already running it says `precompact: running`.

## Status line

- `precompact: preparing…` while a pass runs.
- `precompact: ready (X → Y)` when a draft is ready (an estimate).
- `precompact: failed` when the pass failed; the warning that follows carries the reason and says the default compaction will run.
- `precompact: applied (X → Y)` when a draft was applied (an estimate).

The footer keeps the current state. In the transcript, a new `info` notice replaces the latest `info` notice, while `warning` and `error` notices stay. The extension never writes to `console`.

## Settings

| key                | default | what it does                                  |
| ------------------ | ------- | --------------------------------------------- |
| `enabled`          | `true`  | the extension prepares only when true         |
| `keepRecentTokens` | `20000` | recent tokens kept out of the summary         |
| `thresholdRatio`   | `0.8`   | usage ratio at which a ready draft is applied |

Both the extension's `enabled` and Pi's `compaction.enabled` must be true, otherwise nothing starts. A broken `settings.json` is reported once and nothing starts until it is fixed.
