/**
 * consult 拡張の入口。道具とスラッシュコマンドの登録だけを行う。
 *
 * 走っている子の管理は `tool/consult.ts` の `createRuntime` が 1 か所で持ち、道具の `action` とコマンドの両方が同じ `control` を呼ぶ。
 */

import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { PARAMETERS, createRuntime } from './tool/consult.ts';
import { PARAMETERS as REF_PARAMETERS, execute as refExecute } from './tool/refs.ts';

export default function (pi: ExtensionAPI) {
  const consult = createRuntime(pi);

  pi.registerTool({
    name: 'consult_new',
    label: 'Consult new',
    description:
      "Start a child pi in the background with the policy of a type (model, tools, environment, limits, role) and return its id at once. When the child finishes, its text is delivered as a message. The caller picks only the type; the child does not see this conversation. One child per input. An action of 'list' shows the running children, and 'cancel' stops one by id.",
    promptSnippet:
      'Start a background child pi with a type (research / review / trial / code); the result arrives as a message',
    promptGuidelines: [
      'Use consult_new when a question is better answered without this conversation in view: reviewing your own work, getting a second opinion, or applying a role you were not given.',
      'consult_new starts the child in the background and returns an id. Do not wait for it; the child text arrives later as a consult message. Use action list or cancel to see or stop the running children.',
      'The types and their limits live in .pi/extensions/consult/types.json. The caller cannot override them; to change the policy, edit that file.',
    ],
    parameters: PARAMETERS,

    execute: (...args) => consult.execute(...args),
  });

  pi.registerCommand('consult-status', {
    description: 'List the consult children that are still running',
    handler: (args, ctx) => consult.commands.status(args, ctx),
  });

  pi.registerCommand('consult-cancel', {
    description: 'Stop a running consult child (usage: /consult-cancel <id>)',
    handler: (args, ctx) => consult.commands.cancel(args, ctx),
  });

  pi.registerCommand('consult-sound', {
    description: 'Turn the consult sound on or off (usage: /consult-sound on|off)',
    handler: (args, ctx) => consult.commands.sound(args, ctx),
  });

  pi.registerTool({
    name: 'consult_refs',
    label: 'Consult refs',
    description:
      "List and delete the refs consult leaves behind. 'list' shows every consult/ ref with its hash; 'delete' removes one, and refuses anything that is not a consult/ ref. Nothing else in the repository is touched.",
    promptSnippet: 'List or delete the refs left by consult (only consult/ refs can be deleted)',
    promptGuidelines: [
      'Use consult_refs after a consult child that wrote something: decide whether to take the ref in or discard it, then delete it in the same breath.',
      'A ref that is not a consult/ ref is never deleted by this tool.',
    ],
    parameters: REF_PARAMETERS,

    execute: refExecute,
  });
}
