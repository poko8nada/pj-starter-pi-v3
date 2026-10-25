# sound-notify

Plays a system sound and sends a cmux notification when pi needs your attention,
when a `git commit` lands, or when compaction finishes.

## Install

Nothing to do in this repository: `.pi/extensions/sound-notify/` is auto-discovered
project-locally. To use it in a project that does not contain it, install it
globally:

```bash
mkdir -p ~/.pi/agent/extensions/sound-notify
cp .pi/extensions/sound-notify/index.ts ~/.pi/agent/extensions/sound-notify/
```

Do not keep both. The global and project-local locations are discovered
independently, so two copies make every event fire twice: two sounds and two
notifications.

## Notifications

| Trigger           | pi hook                                                     | Sound | cmux subtitle |
| ----------------- | ----------------------------------------------------------- | ----- | ------------- |
| Permission prompt | `ui_prompt_start` (title matches /permission/i)             | Blow  | Permission    |
| Any other dialog  | `ui_prompt_start`                                           | Ping  | Question      |
| Turn complete     | `agent_settled`                                             | Glass | Done          |
| Commit            | `tool_execution_end` (bash output has `[main abc1234] ...`) | Pop   | -             |
| Compact           | `session_compact`                                           | Ping  | -             |

- `agent_settled` fires once per turn, after retries, auto-compaction, and queued
  follow-ups have all finished. It does not fire per `agent_end`.
- `ui_prompt_start` fires around `ctx.ui.select/confirm/input/editor/custom`.
  Nested prompts are coalesced; sequential dialogs fire separately.
- `tool_execution_end` plays the commit sound only for the `bash` tool when the
  result contains git's commit summary line (`[main abc1234] subject`, matched
  as `[<ref> <hash>]`). Failed commands and other tools stay silent.
- `session_compact` plays one sound when compaction finishes. It is not per turn,
  it sends no cmux notification, and `session_compact_failed` stays silent.
- Sounds are skipped when `ctx.hasUI` is false (print / JSON mode) to avoid
  noise in CI and piped runs.
- The cmux title is `pi`; the subtitle and body say which kind it is. The commit
  and compact sounds send no cmux notification.
- Notifications need the `cmux` command on `PATH`. Without it the sound still
  plays and the notification is skipped, with no error.

## Configuration

Nothing is needed to use the defaults above. To change them, create `config.json`
in this directory (it is not committed):

```json
{
  "enabled": true,
  "notifications": true,
  "sounds": {
    "permission": "Blow",
    "question": "Ping",
    "done": "Glass",
    "commit": "Pop",
    "compact": "Ping"
  }
}
```

To change only the commit sound, put just that key (the rest keep their
defaults):

```json
{
  "sounds": { "commit": "Basso" }
}
```

| Key              | Meaning                                                                      |
| ---------------- | ---------------------------------------------------------------------------- |
| `enabled`        | `false` stops the sound and the notification                                 |
| `notifications`  | `false` keeps the sound and drops the cmux notification                      |
| `sounds`         | System sound name per kind, resolved as `/System/Library/Sounds/<name>.aiff` |
| `sounds.commit`  | Sound for a `git commit` (default `Pop`)                                     |
| `sounds.compact` | Sound for compaction finish (default `Ping`)                                 |

The file is read once when the extension loads, so run `/reload` after editing
it. It sits next to the loaded copy: this directory for a project-local install,
`~/.pi/agent/extensions/sound-notify/config.json` for a global one.
A missing or invalid `config.json` falls back to the defaults above.
