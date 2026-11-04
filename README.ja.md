# Harness-included starter（ハーネス付きスターター）

[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6)](https://www.typescriptlang.org/) [![Node](https://img.shields.io/badge/Node-24-339933)](https://nodejs.org/) [![pnpm](https://img.shields.io/badge/pnpm-12.15.0-F69220)](https://pnpm.io/) [![pi](https://img.shields.io/badge/pi-1.4.0-7C3AED)](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)

プロジェクトと、その**エージェント用ハーネス**が最初から揃っているスターターである。このスターターには、cloneした時点で、検査・commitゲート・エージェントの規則・サイクルの仕組みが入っている。

English: [README.md](README.md)

## What is in it

### Roadmap & Cycle

製品の方向と循環の判断は、意図から記録まで追跡できる形で残る。

- [`DEFINITION.md`](DEFINITION.md): 製品像を保ち、循環の判断をその項目と対応付けて残す。
- [`ROADMAP.md`](ROADMAP.md): バージョンごとの項目を持ち、循環が選んだ番号を所有者の合意で追記する。
- [`rules/`](rules/): 定義と roadmap と readme の形と言葉の規則を集める。

### Agent

日常の作業は、役割を定めた pi の harness 上で進む。

- [`AGENTS.md`](AGENTS.md): 毎回読む規則を示し、課題は roadmap で管理し、循環は adr から close まで進める。
- [`.pi/skills/`](.pi/skills/): 循環と保守の単位を集める。
  - [`adr`](.pi/skills/adr/SKILL.md): 意図と対象項目と細目を定め、定義への判断を記録に残す。
  - [`plan`](.pi/skills/plan/SKILL.md): 合意済みの項目を順序付きの作業単位に切り分け、対象と確認を添える。
  - [`work`](.pi/skills/work/SKILL.md): 作業単位を順に実行し、記録を plan の覚書に残す。
  - [`close`](.pi/skills/close/SKILL.md): 作業の成果を集め、所有者と選別し、roadmap を更新する。
  - [`yolo`](.pi/skills/yolo/SKILL.md): 所有者の確認を挟まずに循環の工程を進め、選別で止まる。
  - [`upgrade`](.pi/skills/upgrade/SKILL.md): 依存を循環から離れて単独で更新し、監査まで終える。
- [`.pi/extensions/`](.pi/extensions/): pi に付く補助を集める。
  - [`consult`](.pi/extensions/consult/README.md): 役割と場所を指定して子 agent の pi を1体起動し、worktree と commit の補助も持つ。
  - [`quality-gate`](.pi/extensions/quality-gate/README.md): 各回の変更分だけを検査し、修正と確認を分けて進める。
  - [`context-precompact`](.pi/extensions/context-precompact/README.md): 基準位置に達する前に裏で準備し、境界で適用する。
  - [`thinking-scrub`](.pi/extensions/thinking-scrub/README.md): 繰り返す思考を生成中に止めて取り除き、次の回に持ち越さない。
  - [`sound-notify`](.pi/extensions/sound-notify/README.md): pi が利用者を待つ間に音と cmux の通知で知らせる。

### Checks

自動の検査が、書式と正確さと振る舞いと表現を、変更のたびにそろえる。

- `lint` (oxlint): 変更した JavaScript と TypeScript に対し、警告があれば失敗とする。
- `format` (oxfmt): JavaScript と TypeScript と Markdown と JSON の書式をそろえる。
- `typecheck`: commit 時と push 時の型の確認をまとめる。
  - [`scripts/checks/typecheck.mjs`](scripts/checks/typecheck.mjs): push 時に全体と harness の型を確認する。
  - [`scripts/checks/typecheck-staged.mjs`](scripts/checks/typecheck-staged.mjs): commit 時に変更分だけの型を確認する。
- `test`: プロダクト用とスターター用の検査の使い分けをまとめる。
  - [`vitest.config.ts`](vitest.config.ts): プロダクト用の設定で、harness の経路を除外する。
  - [`vitest.starter.config.ts`](vitest.starter.config.ts): スターター用の設定で、すべての検査を対象にする。
- `japanese-check` ([`scripts/checks/ja-check.mjs`](scripts/checks/ja-check.mjs)): 禁止語の出現を数え、error と warn で報告する。
- `localhook`: commit 時と push 時の連動をまとめる。
  - [`lefthook.yaml`](lefthook.yaml) pre-commit: 変更分に書式と lint と型と関連検査と日本語検査を走らせる。
  - [`lefthook.yaml`](lefthook.yaml) pre-push: 全体の型と検査を実行する。

### Handover

スターターとプロダクトの間の移動は、明示的で再現可能な形で進む。

- `harness-sync` ([`scripts/harness/`](scripts/harness/)): スターターの部品を取り込み、プロジェクトの部品を戻し、ファイルを消さない。
- `product-ready` ([`scripts/product-ready/`](scripts/product-ready/)): roadmap と定義と readme をテンプレートに置き換え、スターター用の検査配線を外す。

### CI

_Under construction_

- [`.github/workflows/pullfrog.yml`](.github/workflows/pullfrog.yml): 手動の dispatch で agent を実行する定義を保つ。

## Getting started

Node 24 以上と pnpm が必要である。

1. `pnpm install` で依存を取得する。
2. `pnpm product:ready` を一度だけ実行し、複製を自分のものにする。
3. リポジトリの直下で `pi` を起動する。

## License

UNLICENSED
