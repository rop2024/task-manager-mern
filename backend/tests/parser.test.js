import { parseMarkdown } from '../utils/markdownParser.js';

describe('parseMarkdown', () => {
  test('parses simple checklist lines', () => {
    const md = `- [ ] Buy milk\n- [x] Done task`;
    const { items, errors } = parseMarkdown(md);
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe('Buy milk');
    expect(items[0].status).toBe('pending');
    expect(items[1].status).toBe('completed');
    expect(errors.length).toBe(0);
  });

  test('parses metadata and tags', () => {
    const md = `- [ ] Task A | priority:high | group:Work | tags:one,two | due:2025-12-01 | estimatedMinutes:45`;
    const { items, errors } = parseMarkdown(md);
    expect(items).toHaveLength(1);
    const meta = items[0].metadata;
    expect(meta.priority).toBe('high');
    expect(meta.group).toBe('Work');
    expect(Array.isArray(meta.tags)).toBe(true);
    expect(meta.tags).toContain('one');
    expect(meta.dueAt).toBeTruthy();
    expect(meta.estimatedMinutes).toBe(45);
    expect(errors.length).toBe(0);
  });

  test('returns errors for non-checklist lines or missing title', () => {
    const md = `Just some text\n- [ ]  | priority:low`;
    const { items, errors } = parseMarkdown(md);
    expect(items.length).toBe(0);
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });
});
