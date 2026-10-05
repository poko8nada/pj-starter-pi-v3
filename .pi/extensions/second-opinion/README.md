# second-opinion

Another eye on the current proposal. A second model reads the recent messages and points out holes — synchronously, in the same turn.

The child sees only the recent conversation (as text), never this project's files beyond reading them. It cannot write anything: it runs with read-only tools and no worktree.

## Tools

| Tool             | What it does                                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `second_opinion` | Points out holes in the recent proposal or opinion with another model. Returns the child text (plus a cut-off note when the child did not finish cleanly). |

| Parameter  | Required | Meaning                                              |
| ---------- | -------- | ---------------------------------------------------- |
| `focus`    | no       | What to ask about. Without it, holes in the proposal |
| `messages` | no       | How many recent messages to judge (default 8)        |

```
second_opinion({ focus: "Where does this plan break?" })
second_opinion({ messages: 5 })
```

## Commands

`/second_opinion` is the same hole-probing for the owner. A leading number is the message count, the rest is the question. The answer arrives as a message in the conversation.

```
/second_opinion
/second_opinion 10 Is this consistent?
```

## What comes back

The child's text, unedited, in this shape:

```
## Holes
...
## Overlooked
...
```

A missing section reads `なし`.

When the child was cut off (turn limit, error, abort) after writing its answer, the answer still comes back with a note appended on a blank line: `(打ち切られました: <reason>)`.

## Settings

`types.json` sits next to this file and holds the single `opinion` role: another model's candidates, read-only tools (`read`, `ls`, `find`, `grep`, `web_search`, `fetch_content`), no isolation, and the spend limits (10 turns, 4000 output tokens). The window (default 8 messages, 4000 chars per message, 2000 per tool result) and the default question live in `tool/conversation.ts` and `tool/answer.ts`. The file is read on every call, so a change takes effect on the next opinion without reloading pi.

## The code

```
index.ts          the entry: registers the tool and the command, holds the conversation, and nothing else
policy/           what the role is: reading types.json, validating it, resolving the role
child/            the child pi: assembling its arguments, parsing its JSONL, the secret guard, the budget nudge
run/              running a child: the spawn, the synchronous wait, the run record, and the report
tool/             the tool face: keeping the last N messages and rendering them as text, the default question and the prompt assembly
```
