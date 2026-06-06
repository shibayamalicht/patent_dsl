import { describe, expect, it } from 'vitest';
import { buildNodeDefinitionLine, quoteIfNeeded } from '../src/gui-format';
import { parse } from '../src/parser';

describe('GUI source formatting', () => {
  it('keeps a symbol-only node definition label-free', () => {
    const line = buildNodeDefinitionLine('10', '', '', 'normal');
    const doc = parse(line);

    expect(line).toBe('10 =');
    expect(doc.nodes.get('10')?.label).toEqual({});
  });

  it('creates a decision marker only when the diamond shape is selected without labels', () => {
    const line = buildNodeDefinitionLine('S110', '', '', 'cond');

    expect(line).toBe('S110 = ?');
    expect(parse(line).nodes.get('S110')?.label.ja).toBe('?');
  });

  it('labels normal GUI nodes as rectangles without modifying text', () => {
    expect(buildNodeDefinitionLine('11', '処理部', '', 'normal')).toBe('11 = 処理部');
    expect(buildNodeDefinitionLine('12', '条件', '', 'cond')).toBe('12 = 条件?');
  });

  it('quotes labels that would otherwise conflict with syntax', () => {
    expect(quoteIfNeeded('I/O')).toBe('"I/O"');
    expect(buildNodeDefinitionLine('13', 'I/O', 'I/O interface', 'normal'))
      .toBe('13 = "I/O" / "I/O interface"');
  });
});
