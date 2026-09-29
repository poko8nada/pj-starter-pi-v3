/**
 * consult の delivery — 子の完了を、いま生きているセッションへ届ける 1 本の通り道。
 *
 * pi のプロセスは reload で差し替わる（拡張のインスタンスも作り直される）。子は detach されて
 * 生き続けるので、完了の知らせを「もう居ない pi」へ渡すと落ちる。ここで 1 本にまとめ、古い配線は
 * no-op にして記録（`log.jsonl`）へ回す。新しいセッションはその記録を読めばよい。
 *
 * `attach` はセッションごとに 1 回。`detach` の後に新しいインスタンスが `attach` しても、**古い
 * インスタンスの `send` は古いまま**（no-op + 記録）になる。掴んでいる pi はインスタンスごとに違うため。
 */

import type { ConsultMessage, ConsultSendOptions, PiFace } from '../tool/consult.ts';
import { appendRun, type RunRecord } from './log.ts';

/** 完了の知らせ 1 つ。pi に渡す形と、記録に回すときの元 */
export interface Delivery {
  /** いまのセッションの pi を掴む。新しいインスタンスがこれを呼ぶ */
  attach(pi: PiFace): void;
  /** 手放す。以後の `send` は記録だけになる（セッションの終わりに呼ぶ） */
  detach(): void;
  /** 子の完了を届ける。掴んでいる pi が無ければ、記録に 1 行足す */
  send(message: ConsultMessage, options: ConsultSendOptions, record: RunRecord): void;
  /** いま届けられるか（テストと、状態を出す所のため） */
  attached(): boolean;
}

/**
 * delivery を作る。
 *
 * root は**必要になったとき**に引く（`rootFor` は置き場を作るので、起動しただけで作らない）。
 * 記録へ回すのは、届け先が消えたとき（reload のあと）だけ。
 */
export function createDelivery(resolveRoot: () => string): Delivery {
  let pi: PiFace | undefined;

  return {
    attach(next) {
      pi = next;
    },
    detach() {
      pi = undefined;
    },
    attached() {
      return pi !== undefined;
    },
    send(message, options, record) {
      if (pi === undefined) {
        // 届け先が無い。落とさず、記録に回す（新しいセッションが読む）
        appendRun(resolveRoot(), { ...record, notice: message.content });
        return;
      }
      pi.sendMessage(message, options);
    },
  };
}
