# Affected format

`cycles/<YYMMDD-NNN-slug>/affected.md`. One cycle has one affected.

The procedure is in `SKILL.md`. Section and field names are English; the content is Japanese.

## Shape

```md
# Affected <NNN>

## <NN>: <問い>

### Code

- Read: <path> — <何をするか>
- Check: <path> — <何をするか>
- Generate: <path> — <何をするか>

### External

- <外のもの> — <何をするか>
```

## Entries

- `## <NN>: <問い>` — one entry is one question, and the number is the ADR's.
- The entries are the cycle's split, and the order is the split's.
- `### Code` — the files the change reads, checks and generates. One line is one path, with one thing to do.
- `### External` — what is outside the repository, and what is done with it.
- The prefix is `Read:`, `Check:` or `Generate:`: a file the change reads, a file it checks, a file it generates.
- The line is `<prefix>: <path> — <何をするか>`.
- An `### External` line is `<外のもの> — <何をするか>`.
- `なし` when there is none.

## Writing

- Do not write what the reader can look up.
- Do not write the plan: the files, the steps and the checks belong to the plan.
