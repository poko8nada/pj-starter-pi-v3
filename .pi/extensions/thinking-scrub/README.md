# thinking-scrub

Looped thinking is accepted as it happened and rewritten after the message is finalized, so the broken reasoning is not carried into the next request. Only periodic runs (period 4–120 chars, 6+ repeats, 60+ chars) are removed; the rest of the text is left untouched.

## Commands

`/thinking-scrub` switches the scrub on/off and shows the session state. Only `on` / `off` rewrite `settings.json`.

```
/thinking-scrub        show enabled, removed count, and last scrub time
/thinking-scrub on     scrub looped thinking
/thinking-scrub off    leave thinking untouched
```

Any other argument prints the usage instead of throwing.

## Settings

`settings.json` sits next to this file and holds `{ "enabled": true }`. It is re-read on every `message_end`, so editing the file applies without a reload. When the file is missing, the scrub runs enabled; when it is broken, the scrub runs with defaults.

## Target blocks

Only thinking blocks whose `thinkingSignature` is `reasoning_content`, `reasoning`, or `reasoning_text` are rewritten. Blocks without a signature, with a JSON signature, and `redacted` blocks are left alone. When a run is removed, one space is inserted only when both neighbors are non-space.
