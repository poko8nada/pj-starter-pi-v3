/** 見出しの直後の本文の範囲 */
/** @typedef {{ readonly from: number, readonly to: number }} SectionRange */

const FENCE = /^(`{3,}|~{3,})/;
const HEADING = /^#{1,6} /;

/**
 * 見出しの後ろにある最初のフェンス付きブロックの中身を返す（純）。無ければ null。
 *
 * @param {string} text 読んだファイル
 * @param {string} heading 見出しの行
 * @returns {string | null}
 */
export function blockUnder(text, heading) {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) {
    return null;
  }
  let mark = '';
  let open = -1;
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (open === -1) {
      const found = FENCE.exec(line);
      if (found) {
        mark = found[1];
        open = i;
      }
      continue;
    }
    if (line === mark) {
      return lines.slice(open + 1, i).join('\n');
    }
  }
  return null;
}

/**
 * 見出しの直後の本文の範囲を返す（純）。見出しが無ければ null。
 *
 * @param {readonly string[]} lines 行の並び
 * @param {string} heading 見出しの行
 * @returns {SectionRange | null}
 */
export function sectionOf(lines, heading) {
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) {
    return null;
  }
  let to = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (HEADING.test(lines[i])) {
      to = i;
      break;
    }
  }
  return { from: start + 1, to };
}
