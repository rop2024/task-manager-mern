// Simple Markdown checklist parser
// Parses lines starting with - [ ] or - [x] and optional pipe-separated metadata
export function parseMarkdown(markdown) {
  if (!markdown) return { items: [], errors: [] };

  const lines = String(markdown).split(/\r?\n/);
  const items = [];
  const errors = [];

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) return; // ignore empty lines

    // Match checklist lines like: - [ ] Title | key:val | key2:val2
    const m = line.match(/^[-*]\s*\[( |x|X)\]\s*(.*)$/);
    if (!m) {
      // not a checklist line — ignore but record as non-critical
      errors.push({ line: idx, raw: raw, message: 'Not a checklist line' });
      return;
    }

    const checked = m[1] && m[1].toLowerCase() === 'x';
    let rest = m[2].trim();

    // Split off metadata by pipe separators. First segment is title
    const parts = rest.split('|').map(p => p.trim()).filter(p => p.length > 0);
    const title = parts.shift() || '';

    const metadata = {};
    parts.forEach(part => {
      const kv = part.split(':');
      if (kv.length < 2) {
        // treat as tag shorthand
        if (!metadata.tags) metadata.tags = [];
        metadata.tags.push(part);
        return;
      }
      const key = kv[0].trim().toLowerCase();
      const value = kv.slice(1).join(':').trim();

      if (key === 'tags') {
        metadata.tags = value.split(',').map(t => t.trim()).filter(Boolean);
      } else if (key === 'due' || key === 'dueat' || key === 'dueAt') {
        const d = new Date(value);
        if (!isNaN(d.getTime())) metadata.dueAt = d.toISOString();
        else metadata.dueAt = null;
      } else if (key === 'priority') {
        metadata.priority = value.toLowerCase();
      } else if (key === 'group') {
        metadata.group = value;
      } else if (key === 'estimatedminutes' || key === 'estimated') {
        const n = parseInt(value, 10);
        metadata.estimatedMinutes = Number.isFinite(n) ? n : null;
      } else if (key === 'description') {
        metadata.description = value;
      } else {
        // unknown metadata - store as-is
        metadata[key] = value;
      }
    });

    if (!title) {
      errors.push({ line: idx, raw: raw, message: 'Missing title' });
      return;
    }

    items.push({
      title,
      status: checked ? 'completed' : 'pending',
      rawLineIndex: idx,
      metadata
    });
  });

  return { items, errors };
}

export default parseMarkdown;
