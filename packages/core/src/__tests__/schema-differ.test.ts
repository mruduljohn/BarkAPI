import { describe, it, expect } from 'vitest';
import { diffSchemas } from '../diff/schema-differ';

describe('diffSchemas', () => {
  it('returns empty array when schemas match', () => {
    const spec = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] };
    const actual = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] };
    expect(diffSchemas(spec, actual)).toEqual([]);
  });

  it('detects type change as breaking', () => {
    const spec = { type: 'object', properties: { email: { type: 'string' } } };
    const actual = { type: 'object', properties: { email: { type: 'number' } } };
    const drifts = diffSchemas(spec, actual);
    expect(drifts).toHaveLength(1);
    expect(drifts[0]).toMatchObject({
      field_path: 'email',
      drift_type: 'type_changed',
      severity: 'breaking',
      expected: 'string',
      actual: 'number',
    });
  });

  it('detects removed required field as breaking', () => {
    const spec = {
      type: 'object',
      properties: { id: { type: 'integer' }, name: { type: 'string' } },
      required: ['id', 'name'],
    };
    const actual = {
      type: 'object',
      properties: { id: { type: 'integer' } },
      required: ['id'],
    };
    const drifts = diffSchemas(spec, actual);
    const removed = drifts.find(d => d.drift_type === 'removed');
    expect(removed).toBeDefined();
    expect(removed!.severity).toBe('breaking');
    expect(removed!.field_path).toBe('name');
  });

  it('detects removed optional field as warning', () => {
    const spec = {
      type: 'object',
      properties: { id: { type: 'integer' }, avatar: { type: 'string' } },
      required: ['id'],
    };
    const actual = {
      type: 'object',
      properties: { id: { type: 'integer' } },
      required: ['id'],
    };
    const drifts = diffSchemas(spec, actual);
    const removed = drifts.find(d => d.drift_type === 'removed');
    expect(removed).toBeDefined();
    expect(removed!.severity).toBe('warning');
  });

  it('detects added field as info', () => {
    const spec = { type: 'object', properties: { id: { type: 'integer' } } };
    const actual = {
      type: 'object',
      properties: { id: { type: 'integer' }, extra: { type: 'string' } },
    };
    const drifts = diffSchemas(spec, actual);
    const added = drifts.find(d => d.drift_type === 'added');
    expect(added).toBeDefined();
    expect(added!.severity).toBe('info');
    expect(added!.field_path).toBe('extra');
  });

  it('detects nullability change (non-null to nullable) as warning', () => {
    const spec = { type: 'string' };
    const actual = { type: 'string', nullable: true };
    const drifts = diffSchemas(spec, actual);
    expect(drifts).toHaveLength(1);
    expect(drifts[0]).toMatchObject({
      drift_type: 'nullability_changed',
      severity: 'warning',
    });
  });

  it('detects nullability change (nullable to non-null) as breaking', () => {
    const spec = { type: 'string', nullable: true };
    const actual = { type: 'string' };
    const drifts = diffSchemas(spec, actual);
    expect(drifts).toHaveLength(1);
    expect(drifts[0]).toMatchObject({
      drift_type: 'nullability_changed',
      severity: 'breaking',
    });
  });

  it('detects optional to required change as breaking', () => {
    const spec = {
      type: 'object',
      properties: { name: { type: 'string' } },
    };
    const actual = {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    };
    const drifts = diffSchemas(spec, actual);
    const req = drifts.find(d => d.drift_type === 'required_changed');
    expect(req).toBeDefined();
    expect(req!.severity).toBe('breaking');
  });

  it('recurses into nested objects', () => {
    const spec = {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: { email: { type: 'string' } },
        },
      },
    };
    const actual = {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: { email: { type: 'number' } },
        },
      },
    };
    const drifts = diffSchemas(spec, actual);
    expect(drifts[0].field_path).toBe('data.email');
    expect(drifts[0].drift_type).toBe('type_changed');
  });

  it('recurses into arrays', () => {
    const spec = { type: 'array', items: { type: 'string' } };
    const actual = { type: 'array', items: { type: 'number' } };
    const drifts = diffSchemas(spec, actual);
    expect(drifts[0].field_path).toBe('[]');
    expect(drifts[0].drift_type).toBe('type_changed');
  });

  it('handles top-level type change', () => {
    const spec = { type: 'object', properties: {} };
    const actual = { type: 'array', items: {} };
    const drifts = diffSchemas(spec, actual);
    expect(drifts).toHaveLength(1);
    expect(drifts[0]).toMatchObject({
      field_path: '.',
      drift_type: 'type_changed',
      severity: 'breaking',
    });
  });

  it('handles array type notation for nullable', () => {
    const spec = { type: ['string', 'null'] };
    const actual = { type: 'string' };
    const drifts = diffSchemas(spec, actual);
    const nullDrift = drifts.find(d => d.drift_type === 'nullability_changed');
    expect(nullDrift).toBeDefined();
    expect(nullDrift!.severity).toBe('breaking');
  });

  it('returns empty for identical complex schema', () => {
    const schema = {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              email: { type: 'string' },
            },
            required: ['id', 'name'],
          },
        },
      },
      required: ['users'],
    };
    expect(diffSchemas(schema, schema)).toEqual([]);
  });
});
