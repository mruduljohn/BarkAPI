import { describe, it, expect } from 'vitest';
import { inferSchema } from '../parser/response-inferrer';

describe('inferSchema', () => {
  it('infers null', () => {
    expect(inferSchema(null)).toEqual({ type: 'null' });
  });

  it('infers string', () => {
    expect(inferSchema('hello')).toEqual({ type: 'string' });
  });

  it('infers integer', () => {
    expect(inferSchema(42)).toEqual({ type: 'integer' });
  });

  it('infers number (float)', () => {
    expect(inferSchema(3.14)).toEqual({ type: 'number' });
  });

  it('infers boolean', () => {
    expect(inferSchema(true)).toEqual({ type: 'boolean' });
  });

  it('infers empty array', () => {
    expect(inferSchema([])).toEqual({ type: 'array', items: {} });
  });

  it('infers array of strings', () => {
    expect(inferSchema(['a', 'b'])).toEqual({
      type: 'array',
      items: { type: 'string' },
    });
  });

  it('infers simple object', () => {
    const result = inferSchema({ name: 'Alice', age: 30 });
    expect(result.type).toBe('object');
    expect(result.properties.name).toEqual({ type: 'string' });
    expect(result.properties.age).toEqual({ type: 'integer' });
    expect(result.required).toContain('name');
    expect(result.required).toContain('age');
  });

  it('marks null fields as not required', () => {
    const result = inferSchema({ name: 'Alice', avatar: null });
    expect(result.required).toContain('name');
    expect(result.required).not.toContain('avatar');
  });

  it('infers nested objects', () => {
    const result = inferSchema({ user: { id: 1, email: 'a@b.com' } });
    expect(result.properties.user.type).toBe('object');
    expect(result.properties.user.properties.id).toEqual({ type: 'integer' });
    expect(result.properties.user.properties.email).toEqual({ type: 'string' });
  });

  it('infers array of objects', () => {
    const result = inferSchema([{ id: 1 }, { id: 2 }]);
    expect(result.type).toBe('array');
    expect(result.items.type).toBe('object');
    expect(result.items.properties.id).toEqual({ type: 'integer' });
  });

  it('handles undefined value gracefully', () => {
    const result = inferSchema(undefined);
    expect(result).toEqual({});
  });
});
