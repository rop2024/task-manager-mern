import { parseMarkdown } from '../utils/markdownParser.js';

test('parses simple checklist lines', () => {
  const md = `- [ ] Buy groceries | priority:medium | group:Personal | due:2025-10-30\n- [x] Submit report | priority:high | group:Work`;
  const { items, errors } = parseMarkdown(md);
  expect(errors.length).toBe(0);
  expect(items.length).toBe(2);
  expect(items[0].title).toBe('Buy groceries');
  expect(items[0].status).toBe('pending');
  expect(items[0].metadata.priority).toBe('medium');
  expect(items[0].metadata.group).toBe('Personal');
  expect(items[1].status).toBe('completed');
});

test('handles malformed and non-checklist lines', () => {
  const md = `This is not a checklist\n- [ ] Valid item\n- [] broken\n- [x] Done item | tags:one,two`;
  const { items, errors } = parseMarkdown(md);
  // Expect at least one error for non-checklist and malformed
  expect(errors.length).toBeGreaterThanOrEqual(1);
  expect(items.find(i => i.title === 'Valid item')).toBeTruthy();
  expect(items.find(i => i.title === 'Done item')).toBeTruthy();
});
