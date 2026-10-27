# thinking-scrub

日本語: [README.ja.md](README.ja.md)

Looped thinking is stopped while it is generated at 20,000 chars with a sentence run, and folded at `message_end`, so the broken reasoning is not carried into the next request. Sentence runs need 3 cycles, 400 chars or more, and period 1〜64 units; char runs need period 4〜120 chars, 3 repeats, and 20 chars or more. The rest of the text is left untouched.

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

`settings.json` sits next to this file and holds `enabled`, `show`, and the `live`, `sentence`, `char` tuning groups. Hand edits apply at the next scan; `message_end` and commands re-read immediately. When the file is missing, the scrub runs enabled and the report shows; when it is broken, the scrub runs with defaults.

```json
{
  "enabled": true,
  "show": true,
  "live": {
    "minThinking": 20000,
    "scanEvery": 2000,
    "tail": 20000,
    "maxAborts": 2,
    "sampleChars": 200
  },
  "sentence": { "minCycles": 3, "minRunChars": 400, "maxPeriodUnits": 64 },
  "char": { "minPeriod": 4, "maxPeriod": 120, "minRepeats": 3, "minLength": 20 }
}
```

Missing keys fall back to the defaults above. A wrong type, an out-of-range value, `scanEvery` above `tail`, `minPeriod` above `maxPeriod`, or `minRepeats` below 2 makes the settings broken.

### `live`: stopping while generating

| Key           | Description                                  | Default | If raised                                         | If lowered                                         | Notes                                                     |
| ------------- | -------------------------------------------- | ------- | ------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------- |
| `minThinking` | Thinking length below which no scan happens. | `20000` | Later reaction, fewer reads.                      | Earlier reaction, more reads.                      | Hand edits apply at the next scan.                        |
| `scanEvery`   | Minimum new chars between two scans.         | `2000`  | Fewer reads, reaction lags up to this many chars. | Faster reaction, more reads.                       | Must stay at or below `tail`.                             |
| `tail`        | Trailing window examined by each scan.       | `20000` | Catches widely spread runs, each scan costs more. | Cheaper scans, runs outside the window are missed. | A run fully outside the window reads as `idle`.           |
| `maxAborts`   | Stops per user turn.                         | `2`     | More interruptions before giving up.              | Fewer interruptions; `0` disables live stopping.   | Past the limit, `scanned` still advances without reading. |
| `sampleChars` | Follow-up sample truncation length.          | `200`   | Longer repeating sample in the follow-up.         | Shorter sample.                                    | Also bounds the stored pending sample.                    |

### `sentence`: sentence-period runs (stop and fold)

| Key              | Description                                      | Default | If raised                             | If lowered                                             | Notes                                                 |
| ---------------- | ------------------------------------------------ | ------- | ------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| `minCycles`      | Repeats of one sentence period needed for a run. | `3`     | Fewer detections.                     | More detections.                                       | Minimum is `2`.                                       |
| `minRunChars`    | Shortest char length of a sentence run.          | `400`   | Fewer detections.                     | More detections, short repetitions may false-positive. | The fold keeps the first period and removes the rest. |
| `maxPeriodUnits` | Widest sentence period examined, in units.       | `64`    | Wider coverage, each scan costs more. | Cheaper scans, long-period loops are missed.           | Overlapping runs keep the smaller period.             |

### `char`: char-period runs (fold only)

| Key          | Description                                  | Default | If raised                            | If lowered                                         | Notes                                                                               |
| ------------ | -------------------------------------------- | ------- | ------------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `minPeriod`  | Shortest char period counted, in chars.      | `4`     | Short-period loops are ignored.      | More detections, short repeats may false-positive. | Also the boundary that excludes shorter periods; must stay at or below `maxPeriod`. |
| `maxPeriod`  | Widest char period scanned, in chars.        | `120`   | Wider coverage, the fold costs more. | Cheaper folds, long-period loops are missed.       | The scan ceiling for char periods.                                                  |
| `minRepeats` | Repeats of one char period needed for a run. | `3`     | Stricter, fewer detections.          | More detections.                                   | Minimum is `2`.                                                                     |
| `minLength`  | Shortest char length of a char run.          | `20`    | Stricter, fewer detections.          | More detections, short repeats may false-positive. | Runs below this length are left alone.                                              |

### Combinations

- Earlier reaction without changing what counts as a loop: lower `live.minThinking` and `live.scanEvery` together (for example `8000` / `1000`), and keep `sentence` and `char` as they are.
- Quieter scrub that only catches long runs: raise `sentence.minRunChars` (for example, from `350` to a higher value) and `char.minLength` together.
- Cheaper scans: lower `live.tail`, `sentence.maxPeriodUnits`, and `char.maxPeriod` together; each narrows what one scan examines.
- Do not raise `live.scanEvery` above `live.tail`, and do not raise `char.minPeriod` above `char.maxPeriod`; both make the settings broken.

### Tuning example: `8000` / `1000` / `350`

The first adjustment after extracting the settings keeps the loop definition and reacts earlier:

```json
{
  "live": { "minThinking": 8000, "scanEvery": 1000 },
  "sentence": { "minRunChars": 350 }
}
```

- `live.minThinking: 8000` — scans start at 8,000 chars instead of 20,000.
- `live.scanEvery: 1000` — once started, scans run every 1,000 new chars; hand edits still apply at the next scan.
- `sentence.minRunChars: 350` — sentence runs count from 350 chars, so slightly shorter loops fold while `minCycles` still demands 3 periods.

## Target blocks

The live detection reads the streaming thinking without requiring a signature. The fold at `message_end` keeps the existing signature rule: only thinking blocks whose `thinkingSignature` is `reasoning_content`, `reasoning`, or `reasoning_text` are rewritten. Blocks without a signature, with a JSON signature, and `redacted` blocks are left alone. When a run is removed, the joint keeps newlines when the removed run contained them (`\n\n` wins over `\n`); otherwise one space is inserted only when both neighbors are non-space.

## Follow-up

At `agent_settled`, a custom message is sent with the most frequent 3-sentence sample, then the next run starts.

## End-of-run report

At the end of each run (`agent_end`), when `show` is on and something was scrubbed, one line is shown: `thinking-scrub: removed <runs> (<chars> chars)`. The tally resets after each report, so the next run only reports its own scrub.
