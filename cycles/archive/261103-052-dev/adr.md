# ADR 052

## 01: consult の完了報告を折りたたんだとき、1行に何を出すか

### Context

- オーナーは、consult の完了報告が毎回チャットに全文で表示され、ログを埋めることを問題にしている（`ROADMAP.md` の 017）。
- 完了報告は `pi.sendMessage` で `customType: 'consult'` のメッセージとして渡され、専用のレンダラーが登録されていないため、既定の描画が全文を表示する（`.pi/extensions/consult/index.ts:81-89`、`dist/modes/interactive/components/custom-message.js:64-85`）。
- コンパクトの要約は、既定では1行だけを表示し、`ctrl+o` を押すと全文を表示する（`dist/modes/interactive/components/compaction-summary-message.js:36-46`）。
- オーナーは、consult の報告の表示も同じように、既定では短く表示し、読みたいときだけ全文を表示したい。
- このエントリは、その短い1行に何を表示するかを決め、切り替えの方法はエントリ 02 が決める。

### Scope

- 変更:
  - behaviour: in — 折りたたんだときに表示する1行の内容を決め、既定ではその1行だけを表示する。
  - refactor: in — その1行を組み立てる関数を純粋な形で切り出し、pi を起動せずに試せるようにする。
  - dependency: out — 依存は増やさず、`Markdown`、`Box`、`keyText` は現在の依存から使う。
  - naming: in — その関数と、その1行に埋め込む値の名前を決める。
  - format: in — 1行の形（区切り、語順、`id` と数値の置き方）を決める。
  - prose: in — `.pi/extensions/consult/README.md` に、折りたたんだときに表示する1行の内容を1段落で書く。
- 品質:
  - speed: out — 折りたたみは描画する行を減らすため、測る対象にしない。
  - security: out — 秘密、権限、外部への接続を扱わない。
  - compatibility: out — メッセージの `content` と `details` を変えないため、記録と再読み込みの互換性は保たれ、変わるのは TUI の描画だけである。
  - errors: in — `details` の項目が欠けていても1行を組み立てられるようにする（`id` と `type` 以外は任意である）。
- 運用:
  - deploy: out — 配布するものがない。
  - migration: out — 移すデータがない。
  - logs and monitoring: out — 常時記録するログや監視の仕組みがなく、折りたたみも記録を変えない。

### Research & Trial

- `Text` は与えられた幅より長い文字列を必ず折り返し、切り落とす設定を持たない（`pi-tui/dist/components/text.js:60`、`text.d.ts:13`）。
- 幅に合わせて切り落とせる部品は `TruncatedText` だけで、文字列の最初の改行までを使い、収まらない部分を `...` に置き換える（`pi-tui/dist/components/truncated-text.js:29-34`、`utils.js:1018`）。
- 拡張機能のレンダラーは端末の幅を受け取らず、`MessageRenderOptions` は `expanded` と `outputPad` だけを持つ（`pi-coding-agent/dist/core/extensions/types.d.ts:1155-1169`）。
- レンダラーが返した部品は `Container` の子として直接置かれ、幅はそのまま渡され（`pi-coding-agent/dist/modes/interactive/components/custom-message.js:54`、`pi-tui/dist/tui.js:142`）、`Box` をレンダラー側で被せると内側の幅は端末の幅から2を引いた値になる（`pi-tui/dist/components/box.js:87`）。
- コンパクトの折りたたみの行は文字数を制限しておらず、長ければ折り返す（`pi-coding-agent/dist/modes/interactive/components/compaction-summary-message.js:43`）。
- pi に同梱された `subagent` の例は、折りたたんだときに項目を10件、プレビューを3行に絞る（`pi-coding-agent/examples/extensions/subagent/index.ts:36, 781, 841`）。
- 案Aの行は38桁から47桁であり、展開の案内（15桁）を足すと53桁から62桁になる（`visibleWidth`、pi-tui 1.4.0 で実測）。
- 案Bの行は62桁から73桁であり、展開の案内を足すと78桁から89桁になる（同じ条件で実測）。
- 通知の本文は `compose` が作る報告だけで、見出しと、`place`・`turns`・`spend` の一覧はツールの戻り値にしか入らない（`.pi/extensions/consult/tool/render.ts:40-56`、`84-105`）。
- 記録には `state`・`files`・`turns`・`spend` が必ず書かれ、`reason` と `worktree` はあるときだけ書かれる（`.pi/extensions/consult/tool/consult.ts:301-317`）。

### Decision

- Status: **accepted**
- Adopted:
  - 案A — 折りたたみの1行は `[consult] <id> — <role> / <state>` とし、`turns`・`spend`・`files` は展開したときだけ表示する。
- Options:
  - 案B（`turns` と `spend` も1行に表示する）は、80桁の端末では展開の案内を足すと折り返す（実測で78桁から89桁）ため、採らなかった。
  - 案C（本文の先頭2行を表示する）は、本文は Markdown で行も長く、`Text` の折り返しで2行が3行から4行になるため、採らなかった。
  - `reportBlock` の見出しを折りたたみの1行に使う案は、その見出しが通知の本文に含まれないため、成り立たない。

### Definition

- `Unit.subagent-consult`(kept): サブエージェントの結果を受け取る約束は変わらず、変わるのは TUI で折りたたんで表示する経路だけである。

## 02: 折りたたみと展開をどの操作で切り替えるか

### Context

- エントリ 01 で、折りたたみの1行は `[consult] <id> — <role> / <state>` と決まり、`turns`・`spend`・`files` と報告の本文は展開したときだけ表示する。
- 利用者が `ctrl+o`（`app.tools.expand`）を押すと、pi は会話の記録のうち `setExpanded` を持つ部品すべてを開閉し（`interactive-mode.js:3698-3712`）、コンパクトの要約の部品は `ctrl+o` と `MouseRegion` のクリックの両方で開閉する（`compaction-summary-message.js:47-52`）。
- 既定の `tuiMode` である `fullscreen` では、`TuiAltScreen` がマウスのイベントを部品まで配る（`settings-defaults.js:61`、`tui-renderer.js:8-10`、`pi-tui/dist/tui.js:116`）。
- `regular` では `TuiMainScreen` が使われるが、そこにはマウスのイベントを配る記述がない（`tui-renderer.js:34`、`pi-tui/dist/tui-main-screen.js`）。
- オーナーは、consult の報告もコンパクトの要約と同じ操作で開閉できるようにしたい。

### Scope

- 変更:
  - behaviour: in — 折りたたみと展開を切り替える操作と、1行に展開の案内を表示するかどうかを決め、既定では折りたたむ。
  - refactor: out — 1行の組み立てと描画の形はエントリ 01 が決めたため、ここでは変えない。
  - dependency: out — 依存は増やさず、`MouseRegion` と `keyText` は現在の依存から使う。
  - naming: in — クリックによる切り替えで持つ状態と、その保存場所に名前を付ける。
  - format: in — 1行に展開の案内を足すときの語順を決める。
  - prose: in — `.pi/extensions/consult/README.md` に、切り替えの操作について1段落で書く。
- 品質:
  - speed: out — 切り替えは再描画だけのため、測る対象にしない。
  - security: out — 秘密、権限、外部への接続を扱わない。
  - compatibility: in — `ctrl+o` による展開はツール出力と共有のため利用者が consult を展開するつもりで押すとツール出力も展開し、`regular` の画面ではクリックが届かないため、この2つの振る舞いを受け入れるかどうかを決める。
  - errors: out — クリックによる切り替えの状態が見つからないときは折りたたんだ状態として扱うため、失敗する経路がない。
- 運用:
  - deploy: out — 配布するものがない。
  - migration: out — 移すデータがない。
  - logs and monitoring: out — 常時記録するログや監視の仕組みがなく、折りたたみも記録を変えない。

### Research & Trial

- 利用者が `ctrl+o` を押すと、`setToolsExpanded` が会話の記録のうち `setExpanded` を持つ部品すべてに `setExpanded` を渡す（`interactive-mode.js:3698-3712`）。
- コンパクトの要約の部品は、`MouseRegion` の `click/left` を受けて `expanded` を反転する（`compaction-summary-message.js:47-52`）。
- `CustomMessageComponent` の `invalidate()` は `rebuild()` を呼び、`rebuild()` はレンダラーを呼び直して部品を作り直し、部品は `setExpanded` と `setOutputPad`、テーマの変更、`outputPad` の変更でも作り直される（`custom-message.js:26-57`、`interactive-mode.js:4173-4183`）。
- クリックは押下と解放から作られて配られ、押下・クリック・ドラッグ・ホイールのあとに `requestRender` が呼ばれ（`pi-tui/dist/tui-alt-screen.js:667-680, 728-734, 757`）、マウスのイベントは `Container.handleMouse`、`Box.handleMouse`、`MouseRegion` を通って部品まで届く（`pi-tui/dist/tui.js:116-137`、`box.js:59-82`、`mouse-region.js:13-16`）。
- `regular` では `TuiMainScreen` が使われ、そこにはマウスのイベントを配る記述がない（`pi-tui/dist/tui-main-screen.js`）。
- 拡張機能が描き直しに使えるのは `ctx.ui.setToolsExpanded` だけで、`ExtensionUIContext` には `requestRender`、`invalidate`、`redraw`、`rerender` がなく、値が同じときは早期に戻り（`types.d.ts:72`、`interactive-mode.js:3699`）、`TUI` のインスタンスは `ctx.ui.custom` のファクトリーの引数でしか届かない（`types.d.ts:121`、`interactive-mode.js:2319`）。
- メッセージ1つを開閉するキーバインドは定義されておらず、`app.tools.expand` は予約されているため、同じキーを登録できない（`docs/keybindings.md:160-167`、`runner.js:9-28, 463-464`）。
- 「`ctrl+o` かクリックで展開」の案内は25桁で、エントリ 01 の案Aの1行（38桁から47桁）に足すと63桁から72桁になり、80桁から2を引いた78桁に収まる（`visibleWidth`、pi-tui 1.4.0 で実測）。

### Decision

- Status: **accepted**
- Adopted:
  - 案B — `ctrl+o` とクリックの両方で折りたたみを開閉し、クリックによる切り替えで持つ状態は部品の外に置いて `ctrl+o` の状態と合わせて表示する。
- Options:
  - 案A（`ctrl+o` だけを使う）は、実装はもっとも小さいが、メッセージ1つだけを開閉できないため、採らなかった。
  - 案C（専用のキーを足す）は、描き直しに使えるのが `ctx.ui.setToolsExpanded` だけで、そのキーを押した効果が `ctrl+o` と同じ全体の切り替えになるため、採らなかった。

### Definition

- `Unit.subagent-consult`(kept): サブエージェントの結果を受け取る約束は変わらず、変わるのは TUI で折りたたんで表示する経路だけである。
