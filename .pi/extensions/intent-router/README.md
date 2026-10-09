# intent-router

Routes the owner's message before the agent starts, and stops over-investigation mid-turn. A classifier (Jev, via pi's `modelRegistry`) labels each prompt; question-like prompts get a one-time "answer, don't edit" guide, and once enough has been investigated the agent is told to stop and answer.

While `route.shadow` / `judge.shadow` are on, nothing is injected: the router only logs what it _would_ have done. Read `logs/` to tune the thresholds, then go live.

## Hooks

| Hook                 | What it does                                                                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before_agent_start` | Labels the prompt (`question` / `design` / `verify` / `permission` / `chat` / `unknown`). On `question` / `design` / `verify` above `routeConfidence`, arms the run and injects the guide once |
| `turn_end`           | After a tool-using round trip, scores the investigation. When `score` and `confidence` are both above threshold, injects the stop message once per prompt                                      |

Prompts starting with `/` are never classified. When the ask fails, the hooks stay quiet (fail-open) and log the failure.

## Commands

`/intent` switches the router for this session only. `settings.json` is never rewritten: the next session starts from the file again.

```
/intent
/intent on
/intent off
```

`off` also drops the armed run. The switch is logged (`hook: "command"`).

## Settings

`settings.json` sits next to this file and holds a partial override: only the written fields apply, the rest stay at their defaults. Unknown keys, out-of-range numbers, and wrong types throw instead of being silently ignored. The file is read on every prompt, so a change takes effect on the next prompt without reloading pi.

| Setting                         | Default                                                                                                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `classifier.models`             | `opencode/jev-1.13-free`, `openrouter/~typesafe/jev-latest` (tried in this order)                                                                                            |
| `classifier.allowPaid`          | `true` (`false` keeps only free models; the first paid answer is notified once per session)                                                                                  |
| `budget.maxJudgementsPerPrompt` | `12`                                                                                                                                                                         |
| `budget.maxStateChars`          | `12000`                                                                                                                                                                      |
| `budget.minIntervalMs`          | `400`                                                                                                                                                                        |
| `budget.timeoutMs`              | `1500`                                                                                                                                                                       |
| `thresholds.routeConfidence`    | `0.5`                                                                                                                                                                        |
| `thresholds.judgeConfidence`    | `0.5`                                                                                                                                                                        |
| `thresholds.judgeScore`         | `1.5`                                                                                                                                                                        |
| `route.enabled`                 | `true`                                                                                                                                                                       |
| `route.shadow`                  | `true`                                                                                                                                                                       |
| `route.actOn`                   | `question`, `design`, `verify`                                                                                                                                               |
| `route.idleOn`                  | `permission`, `chat`, `unknown`                                                                                                                                              |
| `judge.enabled`                 | `true`                                                                                                                                                                       |
| `judge.shadow`                  | `true`                                                                                                                                                                       |
| `judge.minTurns`                | `2`                                                                                                                                                                          |
| `judge.everyNTurns`             | `1`                                                                                                                                                                          |
| `judge.maxFires`                | `1`                                                                                                                                                                          |
| `guide.enabled`                 | `true`                                                                                                                                                                       |
| `guide.display`                 | `true`                                                                                                                                                                       |
| `guide.text`                    | `Re: {prompt} — kind: {label}. The owner wants an answer, not an edit. Do not edit, write, delete, or commit anything. Investigate only what the answer needs, then answer.` |
| `stop.enabled`                  | `true`                                                                                                                                                                       |
| `stop.display`                  | `true`                                                                                                                                                                       |
| `stop.text`                     | `Enough has been investigated to answer. Stop investigating: no new tool calls. Answer the owner from what you have, and name anything you could not confirm.`               |
| `state.maxActions`              | `12`                                                                                                                                                                         |
| `state.actionChars`             | `300`                                                                                                                                                                        |
| `state.assistantChars`          | `500`                                                                                                                                                                        |
| `state.includeTools`            | `read`, `bash`, `grep`, `find`, `ls`, `write`, `edit`, `web_search`, `consult_run`                                                                                           |
| `log.dir`                       | `.pi/extensions/intent-router/logs`                                                                                                                                          |
| `log.keepDays`                  | `14`                                                                                                                                                                         |

## Log

Every ask lands in `logs/<YYYY-MM-DD>.jsonl`, one JSON object per line: the hook (`route` / `judge` / `command`), the label, the confidence / probabilities / score, the thresholds in force, the decision, what was injected (`fired` / `would` / `none`), the answering classifier and model, the usage, and whether the state was truncated. Files older than `keepDays` are pruned on session start.

## The code

```
index.ts          the entry: reads the settings, owns the run and the flags, registers route → judge → command
settings.ts       the defaults and the partial override (unknown keys and out-of-range numbers throw)
questions.ts      the labels and the two classifier questions
state.ts          one prompt's run: arming, actions, turns, judgements, fires, and the classifier state
classifier.ts     trying the candidates in order, the paid notice, timeout vs abort
hook/route.ts     before_agent_start: labelling and the one-time guide
hook/judge.ts     turn_end: the readiness score and the one-time stop
command.ts        /intent on|off for this session
log.ts            the daily JSONL and the pruning
```
