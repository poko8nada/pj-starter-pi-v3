# second-opinion

Another eye on the current conversation. A second model reads the recent messages and judges consistency, holes and alternatives — synchronously, in the same turn.

The child sees only the recent conversation (as text), never this project's files beyond reading them. It cannot write anything: it runs with read-only tools and no worktree.

## Tools

| Tool      | What it does                                                                     |
| --------- | -------------------------------------------------------------------------------- |
| `opinion` | Judges the recent conversation with another model. Returns the child text as-is. |

| Parameter  | Required | Meaning                                                            |
| ---------- | -------- | ------------------------------------------------------------------ |
| `focus`    | no       | What to ask about. Without it, consistency, holes and alternatives |
| `messages` | no       | How many recent messages to judge (default 20)                     |

```
opinion({ focus: "Is this plan consistent?" })
opinion({ messages: 5 })
```

## Commands

`/opinion` is the same judgment for the owner. A leading number is the message count, the rest is the question. The answer arrives as a message in the conversation.

```
/opinion
/opinion 10 Is this consistent?
```

## What comes back

The child's text, unedited, in this shape:

```
## Consistent
...
## Holes
...
## Alternative
...
## Cannot judge
...
## Read
...
```

A missing section reads `なし`.

## Settings

`types.json` sits next to this file and holds the single `opinion` role: another model's candidates, read-only tools (`read`, `ls`, `find`, `grep`, `web_search`, `fetch_content`), no isolation, and the spend limits (8 turns, 8000 output tokens). The window (default 20 messages, 4000 chars per message, 2000 per tool result) and the default question live in `tool/conversation.ts` and `tool/answer.ts`. The file is read on every call, so a change takes effect on the next opinion without reloading pi.

## The code

```
index.ts          the entry: registers the tool and the command, holds the conversation, and nothing else
policy/           what the role is: reading types.json, validating it, resolving the role
child/            the child pi: assembling its arguments, parsing its JSONL, the secret guard, the budget nudge
run/              running a child: the spawn, the record-free synchronous wait, and the report
tool/             the tool face: keeping the last N messages and rendering them as text, the default question and the prompt assembly
```
