# DESIGN 022

## `brief-skill`

### ADR & Where

- No: 01
- Why: `brief` の手順だけを決めた entry なので、他の plan を待たずに書ける。
- Where: base（owner が書かれた SKILL.md を読む）

### Scope

- `Unit.brief-skill`: 新しいスキルとして足す。

### Boundary

- Plans: なし
- External:
  - `@earendil-works/pi-coding-agent`: スキルの置き場と frontmatter の形
    - Version: ^1.0.3

## `propose-skill`

### ADR & Where

- No: 02
- Why: 収束点が `brief` と同じなので、共通部分を `brief` の完成した文面から転記する。`brief-skill` の後に置く。
- Where: base（owner が書かれた SKILL.md を読む）

### Scope

- `Unit.propose-skill`: 新しいスキルとして足す。

### Boundary

- Plans:
  - `brief-skill`: 共通部分を転記する。
- External:
  - `@earendil-works/pi-coding-agent`: スキルの置き場と frontmatter の形
    - Version: ^1.0.3

## `adr-front`

### ADR & Where

- No: 03
- Why: `adr` の文面を、`brief` と `propose` の両方が作る前段に合わせる。2 つに依存するので、どちらの後でもなく、両方の後になる。
- Where: base（owner が書かれた SKILL.md を読む）

### Scope

- `Unit.adr-skill`: description、entry 2、`Research & Trial` を狭める。

### Boundary

- Plans:
  - `brief-skill`: 前段の終わりを受け取る。
  - `propose-skill`: 前段の終わりを受け取る。
- External:
  - `@earendil-works/pi-coding-agent`: スキルの置き場と frontmatter の形
    - Version: ^1.0.3
