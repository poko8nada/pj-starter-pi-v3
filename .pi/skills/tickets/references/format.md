# The ticket's format

Section and field names are English. They are the type: the same in every ticket, and fixed.

**The content is Japanese.** The owner reads these tickets, and the project's rule is that documents a person reads are written in Japanese. So the placeholders below are in Japanese on purpose.

## The shape

```md
# <step 名>

Acceptance:

- <何が満たされていれば閉じられるか>
- <基準は 1 行ずつ。単位の step なら、定義の `Then` を 1 行ずつ写す>

## Todo

- <ファイル>
  - <その中の単位> — 一言（文書 = 見出し / コード = 関数）
  - <テストファイル>
    - <入力> → <結果>（happy / error）

## Verify

- どう確かめるか（その step を閉じる時点で走る形）

## Notes

### Findings

- 作業中に気づいたこと（無ければ `なし`）

### Unplanned

- その場で対処した想定外のこと（無ければ `なし`）

Commit: <hash>
```

## Names

- One ticket per step, named `NN-<step-name>.md` with the step's number: `01-consult.types.md`, `08-stack-skill.md`. The files live in `cycles/<NNN-DATE>/tickets/`, next to the plan. Numbered, the tickets read in the order the work happens
- The heading is the step's name: the unit's id, or `<unit-id>.<part>` when the unit was split. The dot stays in the file name (`01-consult.types.md`)
- A `step 0` whose answers are all なし gets no ticket: there is nothing to make

## Todo

- Sorted by artifact: a file, then the units inside it, then its tests
- Documents split by heading, code by function, tests by case. The test is whether a reader, looking at the commit, wants to see this as a separate line
- Each line is one phrase. Several things in one line is several lines
- Every file in the step's `Files` appears here, and every input the artifact can fail on
- Tests are cases of `input → result`, each marked `(happy)` or `(error)`. The error paths live here and nowhere else: the definition deliberately leaves them out
- The cases come from the definition, not from the implementation. A test written next to the code it tests asserts what the code does, not what the sheet says it does
- Walk these categories and, for each one, write either the case or the reason it does not apply. Skipping one silently is the same as forgetting it: the happy path / null, undefined, missing / empty / boundary values / invalid input / the expected error path / permission / a second call / concurrency. The reason sits as a bullet under the artifact it belongs to, in the same list as the cases
- A step with no files (a `.check`) writes なし in `Todo` and says why; its `Verify` is the demonstration
- The result is a concrete value, an error type or a state. A test that would still pass if the code returned the wrong value is too weak: write the value, not the absence of an exception
- No check marks. One ticket is one commit, so the `Commit:` hash says whether it is done

## Verify

- One per ticket, and it is what the step is judged by
- It must run the moment the step closes: a `Verify` that waits for a later step leaves nothing to judge the step by
- Write what to observe, not what is expected to happen
- What was observed goes in `Notes`, not back into the `Verify`
- Write the observation in one line. Do not list the commands that were run, and do not list counts: green is `緑`, and a number appears only when the number is the observation

## Notes

- Two parts, both heading 3: `### Findings` is what was noticed, `### Unplanned` is what was handled that the `Todo` did not mention. Write なし when there is nothing
- **One item is one line**: `- **<主題>** — <中身>（<状態>）`
  - the subject is a short name a reader can scan for; it is also what the cycle's `Carry over` shows, so a line without one is a line nobody finds later
  - the state is one of `決めた` / `次へ回す` / `未解決`. It decides whether the item leaves the ticket: `決めた` stays here, the other two are carried
- `Notes` are written from what was seen and checked, not from what was claimed

## 何を書くか（`Findings` / `Unplanned`）

- Write what moves the next reader: a hole, a decision, a mismatch, a surprise. `Unplanned` is what was handled that the `Todo` did not name
- **A line has to earn its place.** Ask what the reader loses if the line is gone. If the answer is nothing — the code, the commit, or another line already says it — do not write it. A heading whose children are only more names is the same failure: write the content, or drop the line
- Everything written here is copied into the cycle's `Carry over`, so noise does not stay here: it goes into the next cycle

## Commit

- The last line of the file, always, so `tail -1` reads it
- Empty until the step is done. A ticket with an empty `Commit:` is agreed and not implemented
- The hash is one per ticket, not one per part of the work
- A commit that carries several tickets gets written into each of them

## Writing

- **One line carries one thing.** A line holding two events is split into a short line plus 2-space sub-lines under it. A sub-line must say something the line above does not: a sub-line that only repeats the stem means the line was a list, and a list stays on one line. A list of values is one thing — `null / 空 / 境界`, the names of tools, the markers `add / update / drop`
- **Do not chain events with `/`, nested parentheses or `→`.** `→` is for a landing place, and `input → result` cases keep theirs. Swapping a separator for `、` is not a split; it is the same crammed line
- **Do not write what the reader can look up.** Not the commands that were run, not that the checks were green (a `## Verify` observation is one line: `緑`), not what the code, the diff or the commit already shows
- **Do not wrap a sentence across lines, and do not use structures that grow sideways.** One paragraph is one line. Tables break with long text
- `Todo` and `Verify` are fixed once agreed. What actually happened goes in `Notes`
