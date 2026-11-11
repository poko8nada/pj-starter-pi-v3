# Harness-included starter（ハーネス付きスターター）

[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6)](https://www.typescriptlang.org/) [![Node](https://img.shields.io/badge/Node-24-339933)](https://nodejs.org/) [![pnpm](https://img.shields.io/badge/pnpm-12.15.0-F69220)](https://pnpm.io/) [![pi](https://img.shields.io/badge/pi-1.4.0-7C3AED)](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)

プロジェクトと、その**エージェント用ハーネス**が最初から揃っているスターターである。このスターターには、cloneした時点で、検査・commitゲート・エージェントの規則・サイクルの仕組みが入っている。

English: [README.md](README.md)

## What is in it

### Roadmap & Cycle

プロダクトの方向とサイクルの判断は、意図から記録まで追跡できるように残る。

- [DEFINITION.md](DEFINITION.md): プロダクト像を保ち、サイクルの判断をその中の項目と対応付けて残す。
- [ROADMAP.md](ROADMAP.md): バージョンごとの項目を持ち、サイクルが選んだ番号をオーナーの合意のもとで追記する。
- rules: `rules/*` - 定義と roadmap と readme の形と言葉の規則をまとめる。

### Agent

日常の作業は、役割を定めた pi の harness 上で進む。

- [AGENTS.md](AGENTS.md): 毎回読むべき規則を示し、項目は roadmap で管理し、サイクルは adr から close まで進む。
- skills:
  - `adr`: 意図と対象項目とエントリーを定め、定義に関する判断を記録に残す。
  - `plan`: 合意済みの項目を順序付きの作業単位に切り分け、対象ファイルと確認方法を添える。
  - `work`: 作業単位を順に実行し、記録を plan のノートに残す。
  - `close`: 作業の成果を集め、オーナーとともにトリアージし、roadmap を更新する。
  - `yolo`: オーナーの確認を挟まずにサイクルのステージを進め、トリアージで止まる。
  - `upgrade`: 依存をサイクルとは別に単独で更新し、監査まで行う。
- extensions:
  - `consult`: 役割と場所を指定して pi の子エージェントを1体起動し、worktree と commit の補助も持つ。
  - `quality-gate`: ターンの変更分だけを検査し、修正と確認を分けて進める。
  - `context-precompact`: しきい値に達する前にバックグラウンドで準備し、境界で適用する。
  - `thinking-scrub`: 同じ思考の繰り返しを生成中に止めて取り除き、次のターンに持ち越さない。
  - `sound-notify`: pi がユーザーを待つ間に、音と cmux の通知でユーザーに知らせる。

### Checks

自動の検査が、変更のたびに書式と正確さと振る舞いと表現をそろえる。

- lint: `oxlint` - 変更した JavaScript と TypeScript に対し、警告があれば失敗とする。
- format: `oxfmt` - JavaScript、TypeScript、Markdown、JSON の書式をそろえる。
- typecheck:
  - `scripts/checks/typecheck.mjs` - push 時にルートと harness の型を確認する。
  - `scripts/checks/typecheck-staged.mjs` - commit 時に変更分だけの型を確認する。
- test:
  - `vitest.config.ts` - テストの設定で、product:ready が test-exclude.json の一覧を除外に書く。
- japanese-check: `scripts/checks/ja-check.mjs` - 禁止語の出現を数え、error と warn で報告し、`scripts/checks/ja-check.json` の `exclude` に書いたパスは検査しない。
- localhook: `lefthook`
  - pre-commit: 変更分に書式と lint と型と関連テストと日本語検査を実行する。
  - pre-push: 全体の型とテストを実行する。

### Handover

スターターとプロダクトの間の移動は、明示的で再現可能な形で行う。

- harness-sync: `scripts/harness/*` - スターターの部品を取り込み、プロジェクトの部品を戻し、ファイルは削除しない。
- product-ready: `scripts/product-ready/*` - roadmap と定義と readme をテンプレートに置き換え、test-exclude.json の一覧をテストの除外に書く。

### CI

_Under construction_

## Getting started

Node 24 以上と pnpm が必要である。

1. `pnpm install` で依存を取得する。
2. `pnpm product:ready` を一度だけ実行し、クローンを自分のものにする。
3. リポジトリの直下で `pi` を起動する。

## License

UNLICENSED
