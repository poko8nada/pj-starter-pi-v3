# AGENTS.md

## The cycle

- Work happens in cycles. One cycle is one definition, then stack, plan, tickets, work and close
- Each stage is a skill in `.pi/skills/`, and that skill says how to run it.

## Implementation Rules

### Functions

- Pass time, random numbers, and IDs as arg; do not generate them inside the func.
- Do not mix pure calc w/ side effects in the same func.
- Limit positional arg to 2. Do not use boolean arg.
- Use early returns for err handling. Limit nesting to a max of 3 levels.

### Errors

- The default approach is to `throw`. Throw an err including a `kind` prop.
- Catch err at the outermost layer or I/O, and convert them into logs or responses based on their `kind`.
- Catch err mid-process only when recovering or when re-throwing with added context.
- Empty `catch` blocks, suppressing err, and throwing raw strings are prohibited.
- Since input parsing, validation and etc. treat failures as part of the normal execution flow.
