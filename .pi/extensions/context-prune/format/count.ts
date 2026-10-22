/**
 * 数字の区切り。桁区切りはここ 1 か所に揃える。
 */
export function formatCount(value: number): string {
  return value.toLocaleString('ja-JP');
}
