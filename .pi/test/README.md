# Testing extensions against the pi core

Unit tests stop at the adapter boundary. The other side — the spawned `pi`
child, `renderCall` / `renderResult`, the input loop and its queues — has no
faithful double, so mock-based tests there only prove the mock.

Covered by unit tests:

- pure shaping (`windowFrom`, `toRequest`, `bodyOf`, arg parsing)
- the adapter mapping itself (`messagesFrom`, `portOf`) with hand-built entries
- secret guard and budget arithmetic with real files in `tmpDir()`

Not covered by unit tests (cover with `look` / `use` instead):

- child spawn, signal and run record (`runPi`)
- tool rendering while running (stuck spinners live here)
- queue behavior during execution (`Steering:` vs invisible wait)

Say in the plan what is not covered. Do not add cases that stay green
when the behavior is removed.
