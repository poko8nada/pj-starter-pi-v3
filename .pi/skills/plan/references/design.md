# Plan design

The code rules the plan's `Files`, `Types`, `Steps` and `Verify` follow.

## Structure

Where a file lives.

- A file lives in the dir of the concern the feature needs.
- A test file sits beside the file it tests.
- The way in is one.
- A feature keeps its `index` at its root, and the rest of the project comes in there.
- A feature whose files are very few may stay flat at its root.
- A feature that outgrows its flat set uses dirs, one per concern.

## Doubles and fixtures

- A new double or fixture is a file.
- It sits at the root of the feature whose shape it holds.
- A fixture that holds a shape the feature does not own goes in `test/`, such as the host, the OS, or a format several units share.
- `test/` is shared, not the harness's own.
- A project may keep its own files there.
- Name a fixture `<name>.fixture.ts`, wherever it sits.
- A helper that is not a double keeps its own name.
- A file in `test/` that a carried test imports is named in `scripts/harness/harness.json`'s `copy` (the pull list).
- Say how a double or a fixture behaves when it is run outside its test: refuse, do not hang.

## Type rules

How a declaration is written.

- A state is a discriminated union, never a combination of optionals.
- A `switch` over a union is exhaustive.
- The last branch assigns to `never`.
- It has no `default`.
- Fields are `readonly`.
- Arrays are `readonly T[]`.
- An argument object is not written to.
- A constraint the compiler cannot check has one factory, and the check lives inside it, such as a brand, a template literal built from a runtime string, or a value that must be validated.
- A failure is a state or a throw, never a silent success.

## Test cases

The cases a test file carries, and what they must hold.

- A case is `<prefix>: (happy|error|empty|boundary) <given> → <result>`.
- Each `Add`, `Update` and `Drop` line's result is one of those cases.
- The cases are used where a test file's cases are decided.
- A step writes one, the reviewer reads one, and the work's cleanup drops one or fixes its premise.
- A case keeps its step's prefix.
- A `<given>` names a premise that can be built one way.
- It keeps the ADR's subject when the ADR names one.
- A premise the types, the spec, the schema or a DB constraint already guarantees is not reproduced in a test.
- An assertion carries neither a magic number nor a hardcoded string.
- A boundary value is not a test of its own.
- The test says the spec it belongs to is met.
- A behaviour that is unlikely to happen, and whose breakage nobody would notice, is not tested.
- A mock is made only where the outside gives the types of its input and its output.
- A mock whose shape is guessed is not made, and not tested.
- Dummy data comes from a factory function, not from a literal written at each test.
