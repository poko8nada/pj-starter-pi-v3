# AGENTS.md

**Work happens in "cycles". One cycle is ADR, definition, design, plan, work and close**

## Functions

- Do not mix pure calc w/ side effects in the same func.
- Limit positional arg to 2. Do not use boolean arg.
- Use early returns for err handling. Limit nesting to a max of 3 levels.

## Errors

- The default approach is to `throw`. Throw an err including a `kind` prop.
- Catch err at the outer layer or I/O, and convert them into logs or responses based on their `kind`.
- Catch err mid-process only when recovering or when re-throwing with added context.
- Empty `catch` blocks, suppressing err, and throwing raw are prohibited.
- Since input parsing, validation etc. Treat failures as part of the normal flow.

## Tests

- Tests do NOT touch the real thing: create mock such as a DB, an external API, credentials, a daemon.
- With no faithful mock, stop at the adapter boundary; cover the wiring w/ `look` / `use`.
