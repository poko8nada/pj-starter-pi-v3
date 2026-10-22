# thinking-scrub

Looped thinking is accepted as it happened and rewritten after the message is finalized, so the broken reasoning is not carried into the next request. Only periodic runs (period 4–120 chars, 3+ repeats, 20+ chars) are removed; the rest of the text is left untouched.

## Commands

`/thinking-scrub` switches the scrub on/off, switches the end-of-run report on/off, and shows the session state. Only `on` / `off` / `show` / `hide` rewrite `settings.json`.

```
/thinking-scrub        show enabled, removed count, and last scrub time
/thinking-scrub on     scrub looped thinking
/thinking-scrub off    leave thinking untouched
/thinking-scrub show   report the scrub tally at the end of each run (default)
/thinking-scrub hide   hide the end-of-run report
```

Any other argument prints the usage instead of throwing.

## Settings

`settings.json` sits next to this file and holds `{ "enabled": true, "show": true }`. It is re-read on every `message_end`, so editing the file applies without a reload. When the file is missing, the scrub runs enabled and the report shows; when it is broken, the scrub runs with defaults.

## Target blocks

Only thinking blocks whose `thinkingSignature` is `reasoning_content`, `reasoning`, or `reasoning_text` are rewritten. Blocks without a signature, with a JSON signature, and `redacted` blocks are left alone. When a run is removed, the joint keeps newlines when the removed run contained them (`\n\n` wins over `\n`); otherwise one space is inserted only when both neighbors are non-space.

## End-of-run report

At the end of each run (`agent_end`), when `show` is on and something was scrubbed, one line is shown: `thinking-scrub: removed <runs> (<chars> chars)`. The tally resets after each report, so the next run only reports its own scrub.
