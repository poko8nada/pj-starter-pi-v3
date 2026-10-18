# intent-router

Keeps the agent moving the way the owner meant. Before the agent starts, it classifies the owner's message into one of three intents (`reply` / `approve` / `other`). Mid-turn, after a tool-using round trip, it asks two questions (`related` / `answerable`) in one request and nudges the agent when the investigation stalls. A classifier (Jev, via pi's `modelRegistry`) answers; in `shadow` mode the router only records what it _would_ have done, in `live` mode it injects the text once.

## How it moves

- Head (`before_agent_start`): one question (`expect`). `reply` at 0.8 or `approve` at 0.8 acts and injects the guide once; `other` stays idle. Prompts starting with `/` are never classified. When the ask fails, nothing is injected (fail-open) and the failure is logged.
- Middle (`turn_end`): two questions (`related`, `answerable`) in a single request. When the round trip is unrelated twice in total, or when the accumulated findings can answer the owner message, it injects the nudge once (up to `maxNudges` per prompt).
- Both hooks re-read `settings.json` on every ask, so `/intent set` applies to the next ask without a reload.

## Commands

`/intent` switches and inspects the router for this session. Only `set` rewrites `settings.json`; `on` / `off` drop the armed run.

```
/intent                      show the current mode
/intent on                   switch to live
/intent off                  switch to shadow
/intent set <path> <value>   update settings.json (e.g. route.thresholds.approve 0.9)
/intent last [count]         show the recent records (says so when there are none)
```

Any other argument prints the usage instead of throwing.

## Settings

`settings.json` sits next to this file and holds a partial override: only the written fields apply, the rest stay at their defaults. Unknown keys, out-of-range numbers, and wrong types throw instead of being silently ignored.

| Setting                      | Default                                                                                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `classifier.models`          | `opencode/jev-1.13-free`, `openrouter/~typesafe/jev-latest` (tried in this order)                                                                                                           |
| `classifier.allowPaid`       | `true` (`false` keeps only free models; the first paid answer is notified once per session)                                                                                                 |
| `route.shadow`               | `true`                                                                                                                                                                                      |
| `route.question`             | instructions + criteria for `reply` / `approve` / `other` (see `settings.json`)                                                                                                             |
| `route.thresholds.reply`     | `0.8`                                                                                                                                                                                       |
| `route.thresholds.approve`   | `0.8`                                                                                                                                                                                       |
| `route.guides.reply`         | reply guide text (see `settings.json`)                                                                                                                                                      |
| `route.guides.approve`       | approve guide text (see `settings.json`)                                                                                                                                                    |
| `judge.shadow`               | `true`                                                                                                                                                                                      |
| `judge.minTurns`             | `2`                                                                                                                                                                                         |
| `judge.everyNTurns`          | `1`                                                                                                                                                                                         |
| `judge.maxJudgements`        | `12`                                                                                                                                                                                        |
| `judge.threshold`            | `0.8`                                                                                                                                                                                       |
| `judge.questions.related`    | instructions + criteria for `yes` / `no` (see `settings.json`)                                                                                                                              |
| `judge.questions.answerable` | instructions + criteria for `yes` / `no` (see `settings.json`)                                                                                                                              |
| `judge.stop.unrelated`       | `2`                                                                                                                                                                                         |
| `judge.stop.maxNudges`       | `1`                                                                                                                                                                                         |
| `judge.stop.nudge`           | nudge text (see `settings.json`)                                                                                                                                                            |
| `state.textChars`            | `4000`                                                                                                                                                                                      |
| `state.assistantChars`       | `1000`                                                                                                                                                                                      |
| `state.resultChars`          | `300`                                                                                                                                                                                       |
| `state.maxActions`           | `12`                                                                                                                                                                                        |
| `state.maxStateChars`        | `24000`                                                                                                                                                                                     |
| `state.includeTools`         | `read`, `write`, `quick_edit`, `target_edit`, `bash`, `grep`, `web_search`, `fetch_content`, `source_check`, `get_search_content`, `codemode`, `consult_run`, `consult_subagents` (default) |
| `log.keepDays`               | `14`                                                                                                                                                                                        |

## Record

Every ask is appended to `logs/<YYYY-MM-DD>.jsonl` as JSONL (one line per entry, never cut short; the date follows JST). One entry carries the hook (`route` / `judge`), `owner_now`, `agent_prev`, the `choice`, its `confidence` and the `threshold` in force, the `guide` (route only), the `verdicts` (`related` / `answerable`, judge only), the `unrelated`, the `nudge`, whether it was injected (`fired`), the `state_chars` (the passed state as JSON length, after cutting), and whether the state was cut (`truncated`). At `session_start` the router deletes files older than `log.keepDays` days (by file name). `/intent last` reads it back.

## The code

```
index.ts            the entry: reads the settings, owns the run and the mode, registers route → judge → command
ask/ask.ts          tries the classifier candidates in order: one question (Ask), two questions in one request (BatchAsk)
ask/questions.ts    the question ids (expect / related, answerable) and the criteria keys
route/decide.ts     the three-way decision and the guide text
route/hook.ts       before_agent_start: asks expect, injects the guide once when live
judge/decide.ts     the two-question decision and the nudge text
judge/hook.ts       turn_end: asks related/answerable at once, injects the nudge once when stalled
state/run.ts        one prompt's run: armed/idle, read/related actions, unrelated, nudges
state/payload.ts    builds the classifier state (owner_text, agent_text, read/related)
command/intent.ts   /intent: show, on, off, set, last
record/log.ts       one JSONL file per day in logs/<YYYY-MM-DD>.jsonl
settings/schema.ts  the defaults and the partial override (unknown keys and out-of-range numbers throw)
settings/read.ts    reads settings.json (fresh on every call)
settings.json       the override on top of the defaults
```
