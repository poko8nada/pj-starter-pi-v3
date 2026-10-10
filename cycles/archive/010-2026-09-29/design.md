# DESIGN 010

## `worktree-cleanup`

実装に要る入力（ADR 02-1 / 02-2 と consult のソース）が同じで、分けると並列の利得が無いので、1つの worktree にする。

- ADR: 02-1, 02-2
- Where: worktree
- Scope:
  - consult.worktree: 実体の無い worktree の登録と、どの作業場にも checkout されていない取り込み済みの枝を片付ける
  - consult.docs: 片付けた物と、残す物（未マージ）を説明に足す
- Boundary:
  - Plans: なし
  - External:
    - `git`: worktree の登録を消し、どの作業場にも checkout されていない枝を列挙する
      - Version: `2.23+`（`%(worktreepath)` を使うため）
      - Contract: `prune` の後は枝の出所が消えるので、`consult/*` の命名に頼る
