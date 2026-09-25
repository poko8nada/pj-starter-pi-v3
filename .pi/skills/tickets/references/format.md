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

- Two parts. `Findings` is what was noticed; `Unplanned` is what was handled that the `Todo` did not mention. Write なし when there is nothing
- Both feed the cycle's `Retro`, and `Retro`'s carry-over is read when the next sheet is written
- `Notes` are written from what was seen and checked, not from what was claimed

## 何を書くか

- 書く: 次に読む人が動けること（穴 / 決めたこと / 食い違い / 驚いたこと）
- 書かない: 走らせたコマンドと緑だったこと（実演の観察に 1 行「緑」で足りる）/ コードや差分から導けること / 見出しだけで中身の無い一覧
- 3 つ問う: 居合わせなかった人が読んで次に何かできるか / コードや commit から導けるか（導けるなら書かない）/ 見出しだけで中身が無いか（無いなら中身を書くか、消す）
- ここに書いた行は全部 `Carry over` に写り、次の 1 枚が会計する。**雑音を書くと、雑音が次のサイクルに残る**

## Commit

- The last line of the file, always, so `tail -1` reads it
- Empty until the step is done. A ticket with an empty `Commit:` is agreed and not implemented
- The hash is one per ticket, not one per part of the work
- A commit that carries several tickets gets written into each of them

## Writing

- **A line carrying two facts is split, not shortened.** Splitting is the fix: a crammed line becomes a short line plus 2-space sub-lines under it. The tell is a `/`-chain, a nested parenthesis or a third `→` — but swapping a separator for `、` is not the fix, it is the same crammed line. The one-line rule (`Do not wrap lines mid-sentence`) is there so a re-flow never touches a line you did not change, not so that a line holds everything
- Do not chain facts with `/`. Do not nest parentheses. `→` is for a landing place only (`input → result` cases keep theirs)
- Do not write what can be derived from the code. Write decisions
- Do not wrap lines mid-sentence. One paragraph is one line
- Do not use structures that grow sideways. Tables break with long text
- `Todo` and `Verify` are fixed once agreed. What actually happened goes in `Notes`
