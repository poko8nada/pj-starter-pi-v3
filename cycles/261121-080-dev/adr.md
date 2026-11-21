# ADR 080

## 01: 複数パスの受け渡し

Type: _Simple_

### Context

- C1: いまの CLI は `resolveTargets` で `options.paths` を順に処理し、相対パスを `process.cwd()` から解決し、存在しないパスを飛ばし、存在するディレクトリを誤りとして扱う（`scripts/checks/suppression-check.mjs:370-387`）。
- C2: CLI のテストは 1 パスずつの実行だけで、複数パスを 1 回で渡すテストがない（`scripts/checks/suppression-check.test.ts:362-405`）。
- C3: このサイクルは、作成済みのチェッカーを `quality-gate` と `lefthook` の pre-commit に加えることを目的とする（`ROADMAP.md:97-101`、オーナーの合意）。両方の入口は、複数のファイルを 1 回の呼び出しで渡す（`.pi/extensions/quality-gate/gate/checks.ts:115`、`lefthook.yaml:9,14,18,22,26`）。
- C4: 検出ロジック、ホワイトリスト、`Reason` の規則を変えない（078-d の決定、オーナーの合意）。

### Research & Trial

- F1: `run` は `options.paths` を `resolveTargets` で受けて順に読み、`findSuppressions` の結果をファイル名と行で並べ替え、`rels.length` を件数として表示し、違反があれば 1 を返す。出所: `scripts/checks/suppression-check.mjs:400-429`
- F2: 2 つのコードファイル、対象外の `.md`、存在しないパスを 1 回で渡すと、違反の行 2 件と `2 files, 2 violations, 0 allowed.` を出し、exit 1 で終わる。`.md` と存在しないパスは件数に入らない。出所: `node v24.22.3` で `node scripts/checks/suppression-check.mjs a.ts b.ts c.md missing.ts` を実行した結果
- F3: パスの順を逆にしても表示は `a.ts`、`b.ts` の順で変わらない。絶対パスも受け付け、`1 files, 1 violations, 0 allowed.` を出す。出所: `node v24.22.3` で `node scripts/checks/suppression-check.mjs b.ts a.ts` と絶対パスの実行をした結果
- `--report` は許可済みも表示する切り替えであり、許可が 0 件のこの試行では通常の表示と同じである。出所: `scripts/checks/suppression-check.mjs:418`、`node v24.22.3` で `--report` を付けて実行した結果

### Scope

_omission_

### Decision

- Status: **accepted**
- Main: 複数パスの受け渡しの固定。CLI が複数のパスを 1 回で受け取れることを、テストで保つ。
  - Add:
    - 2 つのコードファイルと対象外のパスを 1 回で渡す CLI のテストを加える（C1, C2, C3, F2, F3）
  - Update:
    - なし
  - Drop:
    - なし
- Secondary: なし
- Policy:
  - Allowed:
    - 変更は `scripts/checks/suppression-check.test.ts` に限る（C4）
    - 既存の `runCli` と一時ディレクトリの前提を使う（C2）
    - 期待値には、2 件の行、`2 files, 2 violations, 0 allowed.`、exit 1 を書く（F2）
    - 入力の順を逆にしたときも表示がファイル名の順であることを確かめる（F3）
  - Forbidden:
    - スクリプトの `resolveTargets`、`run`、`formatRecord` を変えない - 複数パスはすでに正しく動いており、変える理由がないため（F1, F2, F3）
    - `.md` と存在しないパスが件数に入らないことを、新しい外部の契約として書き足さない - 既存の `resolveTargets` の振る舞いであり、このエントリーの主題ではないため（C1, F2）
    - 単一パスのテストを書き換えない - 既存の契約を保つため（C2）

#### Details

_omission_

### Definition

- `Unit.suppression-check`(kept): 指摘を受け取る機能は変わらない。変わるのは、複数のパスを 1 回で受け取る経路をテストで固定することである。

## 02: quality-gate への登録

Type: _Full_

### Context

- C1: ROADMAP 039 の残りは、作成済みのチェッカーを `quality-gate` と `lefthook` の pre-commit に加えることである（`ROADMAP.md:99-101`、オーナーの合意）。
- C2: 078-d は検出器、ホワイトリスト、判定、CLI、`package.json` への登録を作り、`quality-gate` と `lefthook` への登録を次のサイクルに渡した（`cycles/261120-078-dev/adr.md:269-338`）。検出と判定は決着済みである。
- C3: `quality-gate` は、そのターンで変わったファイルを集め、`CHECK_SPECS` を配列順に実行し、verify フェーズの失敗をエージェントへ返す（`.pi/extensions/quality-gate/gate/checks.ts:31-56,130-151`）。
- C4: `CheckSpec.kind` は `'format' | 'lint' | 'typecheck'` であり、対象の絞り込みと「対象が 0 件ならスキップする」判定に使う（`checks.ts:17,109-113`、`targets.ts:33-36`）。
- C5: 対象の拡張子の絞り込みは、スクリプトの中でも行う（078-d ADR 03 の Policy、`cycles/261120-078-dev/adr.md:313`）。`quality-gate` の入口で絞るかどうかは、既存の検査の扱いに合わせて決める。
- C6: 既存の抑制は 6 件すべて許可済みであり、いまの `pnpm suppression-check` は `162 files, 0 violations, 6 allowed.` で通る（実行結果）。登録した直後に既存のコミットやターンを止めない。

### Research & Trial

- F1: `CheckSpec.kind` は `'format' | 'lint' | 'typecheck'` と定義され、分岐は `runCheck` の 1 か所だけで使う。4 つ目の値を足すと、`filterByExtensions(checked, spec.kind)` の引数の型が合わなくなる。出所: `.pi/extensions/quality-gate/gate/checks.ts:17,109-110`、`gate/targets.ts:33`
- F2: `filterByExtensions` は `kind === 'format'` 以外をすべて `LINTABLE_EXTENSIONS` として扱う。新しい `kind` を足しても、`targets.ts` を変えなければ lint と同じ絞り込みになる。出所: `.pi/extensions/quality-gate/gate/targets.ts:33-35`
- F3: `label` は、レポートの見出し（`### <label>: <status>`）、1 行目の失敗一覧、`state.lastFailed`、成功時の通知、打ち切り時と未解決時の通知に出る。出所: `.pi/extensions/quality-gate/gate/report.ts:52-57,79-86`、`.pi/extensions/quality-gate/index.ts:115,143,165-166,206`
- F4: `CHECK_SPECS` の並びや本数を直接固定するテストはない。ただし、`png` だけを渡したときの `script` 名の完全一致 `['typecheck:staged']` と `label` の完全一致 `['typecheck']` がある。`suppression` は `targets: 'lint'` で対象が 0 件ならスキップするため、この期待値は変わらない。出所: `.pi/extensions/quality-gate/gate/checks.test.ts:143-149`
- F5: エージェント向けの文面は `pnpm format / pnpm lint / pnpm typecheck:staged <files>` を固定で持ち、その直後に `Do not weaken, disable, or reconfigure the checks themselves.` と続く。検査を足すと、この一覧の追従が要る。出所: `.pi/extensions/quality-gate/gate/report.ts:90-95`
- F6: README は検査の一覧を表に持ち、本文でも検査名を列挙する。出所: `.pi/extensions/quality-gate/README.md:3,17-22,50-52`
- F7: verify フェーズの `outcomes` は `runChecks` が返し、失敗時は `buildGateMessage` を `followUp` でエージェントへ送り、成功時は `ctx.ui.notify` で知らせる。出所: `.pi/extensions/quality-gate/gate/checks.ts:145-150`、`.pi/extensions/quality-gate/index.ts:114-138,161-172`
- F8: `checks.fixture.ts` は script 名や本数を固定せず、`args[1]` を script 名として記録するだけである。出所: `.pi/extensions/quality-gate/gate/checks.fixture.ts:56-57,71-75`

### Scope

- In:
  - failure: 検査を 1 つ加えることが失敗の経路を変える。抑制があればターンの終わりにその結果をエージェントへ返し、設定の破損は検査の失敗として扱う。この経路を決める必要がある。
  - result: verify の結果に `suppression-check` の outcome が加わり、エージェントへのメッセージにセクションが 1 つ増える。
  - structure: `CheckSpec.kind` の union、`filterByExtensions` の扱い、`CHECK_SPECS` の並びが変わる。
  - logic: 対象が 0 件ならスキップする条件と、拡張子の絞り込みの分岐に新しい種類が加わる。
  - downstream: README の表と本文、エージェント向けの固定文面、テストの期待値が `CHECK_SPECS` を参照する。
  - cost: ターンの終わりに、対象のコードファイルをすべて読む検査が 1 つ増える。
  - values & expression: `kind` の値、`label` の文字列、README とメッセージの文が決まる。
  - verification: `quality-gate` のテスト（script 名と label の完全一致、拡張子の絞り込み）が増える・変わる。
- Out:
  - safety: 読むのは抑制コメントだけで、権限も秘密も増やさない。
  - upstream: 新しいパッケージや外部契約を加えない。`package.json` の script はすでにある。
  - existing data: 保存データ、インストール済みのバージョン、配布済みの文書、過去の記録を動かさない。
  - observability: ログ、メトリクス、監査記録は増やさない。`ctx.ui.notify` の表示は result と values & expression で扱う。
  - release: 配布と適用の経路は変わらない。拡張はディレクトリから自動で見つかり、ロールバックは git で戻せる。
  - other: 上のどれにも当たらない関心はない。

### Decision

- Status: **accepted**
- Main: `quality-gate` の検証に `suppression-check` を加える。あわせて、`CheckSpec.kind` を「対象の選び方」を表す `targets` に改め、検査の身元は `label` が持つようにする。
  - Add:
    - `CHECK_SPECS` に `suppression-check` の検証を加える（C3, F7）
    - `filterByExtensions` に `'all'` を加え、`targets` が `'all'` のときは絞らない（F1, F2）
    - `quality-gate` のテストに、`suppression` の実行と label を確かめるものを加える（F4, F8）
  - Update:
    - `CheckSpec.kind` を `targets` に改名し、値を `'format' | 'lint' | 'all'` にする（C4, F1）
    - `runCheck` の絞り込みとスキップの条件を `targets` で書く（C4, F1, F2）
    - `report.ts` のエージェント向け固定文面の検査一覧に `pnpm suppression-check <files>` を加える（F5）
    - `README.md` の検査の表と本文に `suppression-check` を加える（F6）
  - Drop:
    - `kind` という名前（`targets` に置き換わる）（F1）
- Secondary: なし
- Policy:
  - Allowed:
    - verify フェーズだけで実行する（C3）
    - `--report` を付けない（違反だけを返す）
    - `flags` を空にする（固定のフラグは要らない）
    - `label` を `suppression` とする（`### suppression: FAILED` のように短く出す）（F3）
    - `targets` に `'lint'` を割り当て、lint と同じ拡張子に絞る。スクリプトも同じ拡張子で絞るため、二重になることは害にならない。読む量は既存の lint と同じである（C5, F2）
    - 対象が 0 件のときは、既存のスキップ規則に従う（C4）
    - `png` だけのターンでは、既存の `typecheck` だけが走る期待値を変えない（F4）
    - 設定の破損は、スクリプトの exit 1 を検査の失敗として扱う（C1, F7）
  - Forbidden:
    - 新しいスクリプトやパッケージを加えない - `package.json` の script はすでにある（C1）
    - `lefthook.yaml` を変えない - 03 のエントリで扱う
    - 検出と判定のロジックを変えない - 078-d で決着済みであり、既存の 6 件は許可済みのまま通る（C2, C6）
    - fix フェーズに置かない - 直す手段がない（C3）
    - `targets` に `'all'` を使わない - `md` だけのターンでも検査を起動してしまうため（F2）

#### Details

- `CheckSpec` の型
  ```ts
  interface CheckSpec {
    readonly phase: Phase;
    readonly label: string;
    readonly script: string;
    readonly flags: readonly string[];
    /** 対象を選ぶ拡張子の種類である。`all` は絞らない。 */
    readonly targets: 'format' | 'lint' | 'all';
  }
  ```
- `CHECK_SPECS`
  ```ts
  const CHECK_SPECS: readonly CheckSpec[] = [
    {
      phase: 'fix',
      label: 'lint:fix',
      script: 'lint:fix',
      flags: ['--no-error-on-unmatched-pattern'],
      targets: 'lint',
    },
    {
      phase: 'fix',
      label: 'format',
      script: 'format',
      flags: ['--no-error-on-unmatched-pattern'],
      targets: 'format',
    },
    {
      phase: 'verify',
      label: 'lint',
      script: 'lint',
      flags: ['--no-error-on-unmatched-pattern'],
      targets: 'lint',
    },
    {
      phase: 'verify',
      label: 'suppression',
      script: 'suppression-check',
      flags: [],
      targets: 'lint',
    },
    { phase: 'verify', label: 'typecheck', script: 'typecheck:staged', flags: [], targets: 'all' },
  ];
  ```
- `filterByExtensions`
  ```ts
  export function filterByExtensions(
    paths: readonly string[],
    targets: 'format' | 'lint' | 'all',
  ): string[] {
    if (targets === 'all') {
      return [...paths];
    }
    const allowed = targets === 'format' ? FORMATTABLE_EXTENSIONS : LINTABLE_EXTENSIONS;
    return paths.filter((path) => allowed.has(extname(path).toLowerCase()));
  }
  ```
- `runCheck` の対象とスキップ
  ```ts
  const paths = filterByExtensions(checked, spec.targets);
  if (spec.targets !== 'all' && paths.length === 0) {
    return undefined;
  }
  ```
- `report.ts` の固定文面
  ```ts
  '  pnpm format / pnpm lint / pnpm suppression-check / pnpm typecheck:staged <files>',
  ```

### Definition

- `Unit.quality-gate`(kept): 検査の一覧に 1 つ加わるが、そのターンの変更分に対する検査結果を受け取る機能は変わらない。
- `Unit.suppression-check`(kept): 指摘を受け取る機能は変わらない。変わるのは、指摘を届ける経路がターンの終わりの検査に加わることである。

## 03: lefthook の pre-commit への登録

Type: _Simple_

### Context

- C1: `lefthook.yaml` の pre-commit は `checks` の group に format、lint、typecheck、test、ja-check を `parallel: true` で並べる（`lefthook.yaml:1-27`）。
- C2: 既存の `ja-check` は `node scripts/checks/ja-check.mjs {staged_files}` で直接呼ぶ。`package.json` に script がないためである（`lefthook.yaml:24-27`、`cycles/261120-078-dev/adr.md:284`）。
- C3: `suppression-check` は `package.json` の scripts に `node scripts/checks/suppression-check.mjs` として登録済みである（`package.json:19`）。
- C4: ROADMAP 039 は、作成済みのチェッカーを pre-commit に加えることを求める（`ROADMAP.md:100`、オーナーの合意）。
- C5: 既存の抑制は 6 件すべて許可済みであり、いまの `pnpm suppression-check` は 0 violations で通る（実行結果）。

### Research & Trial

- F1: `{staged_files}` は `git diff --name-only --cached --diff-filter=ACMR` の結果であり、削除済みのファイルを含まず、存在するファイルだけを、リポジトリルートからの相対パスで渡す。出所: `https://github.com/evilmartians/lefthook/blob/v2.2.2/internal/git/wrapper/staged_files.go`、`https://github.com/evilmartians/lefthook/blob/v2.2.2/internal/git/wrapper/wrapper.go`
- F2: スペースを含むパスは、`run` に埋め込むときにシェルのエスケープを受ける。`"{staged_files}"` とクォートする形も文書にある。出所: `https://lefthook.dev/configuration/run/`（Quotes）、`https://github.com/evilmartians/lefthook/blob/v2.2.2/internal/run/controller/command/replacer/replacer.go`
- F3: `glob` に一致するステージ済みファイルが 0 件のとき、`{staged_files}` を含む job は実行されず、`no matching staged files` でスキップされる。既存の 5 job はすべて `{staged_files}` を含む。出所: `https://github.com/evilmartians/lefthook/blob/v2.2.2/internal/run/controller/command/build_command.go`、`skip_error.go`、`lefthook.yaml:9,14,18,22,26`
- F4: `fail_text` はコマンドが失敗したときに表示するテキストである。出所: `https://lefthook.dev/configuration/fail_text/`
- F5: `group` に置ける設定は `parallel`、`piped`、`jobs` であり、job を 1 つ足しても、既存 job の `glob`、`run`、`stage_fixed`、`fail_text` は変わらない。グループから継承されるのは `root`、`glob`、`exclude`、`env`、`files` だけである。出所: `https://lefthook.dev/configuration/group/`、`node_modules/lefthook/schema.json:156-179,291-381`
- F6: インストール済みの lefthook は 2.2.2 であり、`package.json` の宣言 `^2.2.2` と一致する。出所: `node_modules/lefthook/package.json:2-3`、`package.json:26`
- F7: サブディレクトリから commit したときのフックの CWD を明示する文書は確認できていない。分かっているのは、ファイルの一覧がリポジトリルートからの相対で扱われることと、`root` を指定すると job の CWD が変わることだけである。出所: `https://github.com/evilmartians/lefthook/blob/v2.2.2/internal/run/controller/filter/filter.go`、`https://lefthook.dev/configuration/root/`
- F8: `stage_fixed: true` は pre-commit 専用で、実行後に `git add` を行う。出所: `https://lefthook.dev/configuration/stage_fixed/`

### Scope

_omission_

### Decision

- Status: **accepted**
- Main: pre-commit に `suppression-check` を加える。コミットの前に、ステージ済みのコードの抑制の指摘でコミットが止まる。
  - Add:
    - `lefthook.yaml` の pre-commit の `checks` group に `suppression-check` の job を加える（C1, C4）
  - Update:
    - `README.md` と `README.ja.md` の pre-commit の説明に `suppression-check` を加える（C1）
    - `README.md` と `README.ja.md` の Checks の一覧に `suppression-check` の項目を加える（C3）
  - Drop:
    - なし
- Secondary: なし
- Policy:
  - Allowed:
    - `glob: '*.{js,jsx,ts,tsx,mts,cts,mjs,cjs}'` とする（スクリプトの対象拡張子と同じ）（F1）
    - `run: pnpm suppression-check {staged_files}` とする（C3）
    - `fail_text` に、コードを直すか、オーナーの許可を得て `Reason` を添えるかを書く（F4）
    - job は `parallel: true` の `checks` group の中に置き、`typecheck` の次に並べる（F5）
    - 対象が 0 件のときは、lefthook のスキップに任せる（F3）
    - 既存の 6 件の抑制は許可済みのまま通るため、登録しても既存のコミットを止めない（C5）
    - job の CWD はリポジトリのルートであるという既存の `ja-check` と同じ前提を共有する（C2, F6, F7）
  - Forbidden:
    - `stage_fixed` を付けない - 直す手段がないため（F8）
    - `{staged_files}` をクォートしない - lefthook がシェルのエスケープを行うため（F2）
    - `root` を指定しない - 既存の job と同じ CWD の前提を変えないため（F7）
    - `group` の `parallel` を変えない - 既存の job の実行を変えないため（F5）
    - スクリプトの検出と判定を変えない - 078-d で決着済みである

#### Details

_omission_

### Definition

- `Unit.lefthook-gate`(kept): 検査を通した上で commit も push もできる機能は変わらない。変わるのは、検査の一覧に 1 つ加わることである。
- `Unit.suppression-check`(kept): 指摘を受け取る機能は変わらない。変わるのは、指摘を届ける経路がコミットの前に加わることである。
