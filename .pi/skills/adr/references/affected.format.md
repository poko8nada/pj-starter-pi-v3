# Affected format

`cycles/<YYMMDD-NNN-slug>/affected.md`. One cycle has one affected.

The procedure is in `SKILL.md`. Section and field names are English; the content is Japanese.

## Shape

```md
# Affected <NNN>

## <NN>: <問い>

### Code

#### <パス>

- Search:
  - 01: <検索名（範囲を含む）> - <ヒット数/対象ファイル数>: <検索で見えていないもの>
- Adr: <ADR の事実との一致。一致しないときは何が違うか>
- Direction: _Read_ | _Read by_ | _Check_ | _Generate_
- Relation: <変更との関係。何をするか、何をされるか>
- Role: <構造の中で何か。自分の言葉で>
- Role change: **Change** | Not change
  - <変わる場合は、何がどのように変わるのか>
- Adjustment: **YES** | No
  - <新しい役割が要求する調整内容。plan が決める>

### External

#### <外のもの>

- Search:
  - 01: <検索名（範囲を含む）> - <ヒット数/対象ファイル数>: <検索で見えていないもの>
- Adr: <ADR の事実との一致。一致しないときは何が違うか>
- Relation: <変更との関係>
- Role: <外側で何か>
- Role change: **Change** | Not change
  - <変わる場合は、何がどのように変わるのか>
- Adjustment: **YES** | No
  - <新しい役割が要求する調整内容。plan が決める>
```

## Entries

- `## <NN>: <問い>` — one entry is one question, and the number is the ADR's.
- The entries are the cycle's split, and the order is the split's.
- `### Code` — the paths the change relates to, one heading per path.
- `### External` — what the change talks to outside the repository, one heading per thing: an `Env`, a `Contract`, `Data`, a `Path`, a `Limit`. A person, a chat or a process is not one. When there is nothing outside, the heading is `#### なし`, with the same bullets and no `Direction`.

## The heading

- The heading is the path, written from the project root.
- One path is one heading, whatever the direction.
- The bullets answer the questions in order: the search, the ADR, the direction, the relation, the role, the role change, the adjustment.

## The bullets

- `Search` — one search is one numbered line: the name with the range, the hit count and the file count, and what the search cannot see. A path lists every search that found it; do not write "same as above".
- `Adr` — one per path: whether the searches match the ADR's facts, and what differs when they do not.
- `Direction` — one of `Read` (a path the change depends on), `Read by` (a path that depends on the change, including the paths the change writes to, creates or deletes), `Check` (a path that checks the change), `Generate` (a build artifact the change generates). Write the chosen one in italics.
- `Relation` — what the hit does with the change, not a restatement of the change.
- `Role` — what the path is in the structure: shared or single-use, boundary or inside, public or internal, a subject, a rule, a flow, or whatever it is. Written in your own words.
- `Role change` — `**Change**` or `Not change`. When `**Change**`, a child bullet says what changes: the users' count, the boundary, the visibility, the subject, the rule, the flow. When `Not change`, no child bullet.
- `Adjustment` — `**YES**` or `No`. When `**YES**`, a child bullet says what the new role requires: move, inline, delete, merge, rename, re-scope. It is a recommendation: the research reports it, the plan decides. When `No`, no child bullet.

## Writing

- Do not write what the reader can look up.
- Do not write the plan: the files, the steps and the checks belong to the plan.
