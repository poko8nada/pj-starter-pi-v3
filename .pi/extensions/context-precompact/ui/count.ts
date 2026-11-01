/** 数字を区切る。3 桁ごとにカンマを入れ、負の値は符号を残す。 */
export function formatCount(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(Math.trunc(value));
  const grouped = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${grouped}`;
}
