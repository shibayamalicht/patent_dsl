import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../src/parser';
import { SAMPLE_ORDER, SAMPLES, type SampleId } from '../src/samples';
import type { DiagramKind } from '../src/types';

const PUBLIC_SAMPLE_FILES = [
  '01-block.pdg',
  '02-flow.pdg',
  '03-state.pdg',
  '04-seq.pdg',
  '05-system.pdg',
  '06-iot-cloud.pdg',
  '07-image-pipeline.pdg',
  '08-control-loop.pdg',
  '09-handshake.pdg',
];

const EXPECTED_KIND: Record<SampleId, DiagramKind> = {
  block: 'block',
  system: 'block',
  iot: 'block',
  imagePipeline: 'flow',
  controlLoop: 'block',
  flow: 'flow',
  state: 'state',
  seq: 'seq',
  handshake: 'seq',
};

describe('built-in samples', () => {
  it('keeps the selector order in sync with the sample map', () => {
    expect(new Set(SAMPLE_ORDER)).toEqual(new Set(Object.keys(SAMPLES)));
  });

  for (const id of SAMPLE_ORDER) {
    it(`parses cleanly: ${id}`, () => {
      const doc = parse(SAMPLES[id].source);
      const errors = doc.diagnostics.filter(d => d.severity === 'error');

      expect(errors, `Errors found in ${id}: ${JSON.stringify(errors)}`).toHaveLength(0);
      expect(doc.nodes.size).toBeGreaterThan(0);
      expect(doc.kind).toBe(EXPECTED_KIND[id]);
    });
  }

  for (const file of PUBLIC_SAMPLE_FILES) {
    it(`parses public sample: ${file}`, () => {
      const source = readFileSync(join(process.cwd(), 'public', 'samples', file), 'utf8');
      const doc = parse(source);
      const errors = doc.diagnostics.filter(d => d.severity === 'error');

      expect(errors, `Errors found in ${file}: ${JSON.stringify(errors)}`).toHaveLength(0);
      expect(doc.nodes.size).toBeGreaterThan(0);
    });
  }
});
