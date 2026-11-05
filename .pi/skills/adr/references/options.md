# Options

The chat presents the options; `references/adr.format.md` holds how they are written to the ADR.

One option is a way the entry's intent is met: two to four of them, named A, B, C in order.

## Option <A>

<what this option does, in one sentence>

### Add

- <what grows: a file, a heading, a value. `なし` when nothing>（C1, F2）

### Update

- <what changes: what becomes what>（C1）

### Drop

- <what disappears>（F1）

### Keep

- <what is not touched, and why. `なし` when nothing>（C2）

### Cost

- <the relative cost against the other options: what is higher, what is lower>（F3）

## Rules

- One option is one block. The name runs A, B, C in order.
- An option satisfies every `C`, every `F` and the `Scope`; an option that does not is not written.
- A line says what becomes what, not what to do about it.
- Each line carries the items it settles, in parentheses: `（C1, F2）`.
- `Add` is what grows, `Update` what changes, `Drop` what disappears, `Keep` what is not touched (with the reason), and `Cost` the relative cost against the other options.
- A field holds one bullet or more; a field with nothing in it is `なし`. Do not leave it out.
- The trial, when one is run, is written where the option's holding point is a fact nobody has.
