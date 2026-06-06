export type GuiNodeShape = 'normal' | 'cond';

export function quoteIfNeeded(s: string): string {
  return /[/:=#"]/.test(s) ? `"${s.replace(/"/g, '\\"')}"` : s;
}

export function buildNodeDefinitionLine(
  id: string,
  rawJa: string,
  rawEn: string,
  shape: GuiNodeShape,
): string {
  let ja = rawJa.trim();
  let en = rawEn.trim();

  if (shape === 'cond') {
    if (ja && !ja.endsWith('?')) ja = `${ja}?`;
    if (en && !en.endsWith('?')) en = `${en}?`;
    if (!ja && !en) ja = '?';
  }

  if (ja && en) return `${id} = ${quoteIfNeeded(ja)} / ${quoteIfNeeded(en)}`;
  if (ja) return `${id} = ${quoteIfNeeded(ja)}`;
  if (en) return `${id} = ${quoteIfNeeded(en)}`;
  return `${id} =`;
}
