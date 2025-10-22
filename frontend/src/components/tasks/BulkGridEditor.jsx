import React, { useState, useEffect } from 'react';
import { importBulk } from '../../api/tasks';

const defaultRow = (parsed) => ({
  title: parsed.title || '',
  status: parsed.status || 'pending',
  priority: parsed.metadata?.priority || 'medium',
  group: parsed.metadata?.group || null,
  dueAt: parsed.metadata?.dueAt ? new Date(parsed.metadata.dueAt).toISOString().slice(0,10) : '',
  tags: parsed.metadata?.tags || [],
  estimatedMinutes: parsed.metadata?.estimatedMinutes || '',
  preview: parsed.raw || '',
  warnings: parsed.warnings || []
});

const TagInput = ({ value = [], onChange }) => {
  const [text, setText] = useState(value.join(','));
  useEffect(()=> setText(value.join(',')), [value]);
  return (
    <input className="border p-1 rounded text-sm w-full" value={text} onChange={(e)=>{setText(e.target.value); onChange(e.target.value.split(',').map(s=>s.trim()).filter(Boolean));}} />
  );
};

const BulkGridEditor = ({ parsedRows, groups = [], onClose }) => {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [bulk, setBulk] = useState({ priority: '', group: '', dueAt: '' });
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(()=>{
    setRows(parsedRows.map(p => defaultRow(p)));
    setSelected(new Set());
    setResults([]);
  }, [parsedRows]);

  const toggleSelect = (i) => {
    const s = new Set(selected);
    if (s.has(i)) s.delete(i); else s.add(i);
    setSelected(s);
  };

  const applyBulk = () => {
    const idxs = Array.from(selected);
    if (idxs.length === 0) return;
    setRows(prev => prev.map((r, i)=> idxs.includes(i) ? {...r, ...bulk, group: bulk.group || r.group} : r));
  };

  const validateRow = (r) => {
    const errors = [];
    if (!r.title || !r.title.trim()) errors.push('Title is required');
    if (r.dueAt && isNaN(new Date(r.dueAt).getTime())) errors.push('Invalid date');
    return errors;
  };

  const handleImport = async () => {
    setImporting(true);
    setResults([]);
    const payload = rows.map(r=>({
      title: r.title,
      description: r.preview || undefined,
      status: r.status,
      priority: r.priority,
      group: r.group,
      dueAt: r.dueAt || undefined,
      tags: r.tags,
      estimatedMinutes: r.estimatedMinutes || undefined
    }));

    try {
      const res = await importBulk(payload);
      setResults(res.data);
    } catch (e) {
      console.error('Import failed', e);
      setResults({ success: false, message: e.response?.data?.message || e.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="bg-white border rounded p-3 mb-3">
        <div className="flex items-center space-x-2">
          <select className="border p-1 rounded text-sm" value={bulk.priority} onChange={(e)=>setBulk(b=>({...b, priority: e.target.value}))}>
            <option value="">Set priority...</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <select className="border p-1 rounded text-sm" value={bulk.group} onChange={(e)=>setBulk(b=>({...b, group: e.target.value}))}>
            <option value="">Set group...</option>
            {groups.map(g=> <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>

          <input type="date" className="border p-1 rounded text-sm" value={bulk.dueAt} onChange={(e)=>setBulk(b=>({...b, dueAt: e.target.value}))} />

          <button onClick={applyBulk} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Apply to selected</button>

          <div className="ml-auto flex items-center space-x-2">
            <button onClick={onClose} className="px-3 py-1 border rounded text-sm">Close</button>
            <button onClick={handleImport} disabled={importing} className="px-3 py-1 bg-green-600 text-white rounded text-sm">{importing? 'Importing...' : 'Save to DB'}</button>
          </div>
        </div>
      </div>

      <div className="overflow-auto bg-white border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-2"><input type="checkbox" onChange={(e)=>{ if (e.target.checked) setSelected(new Set(rows.map((r,i)=>i))); else setSelected(new Set()); }} /></th>
              <th className="p-2 text-left">Title</th>
              <th className="p-2">Status</th>
              <th className="p-2">Priority</th>
              <th className="p-2">Group</th>
              <th className="p-2">Due</th>
              <th className="p-2">Tags</th>
              <th className="p-2">Est (min)</th>
              <th className="p-2">Warnings</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={`${selected.has(i)? 'bg-blue-50': ''}`}>
                <td className="p-2 text-center"><input type="checkbox" checked={selected.has(i)} onChange={()=>toggleSelect(i)} /></td>
                <td className="p-2"><input className="w-full border p-1 rounded text-sm" value={r.title} onChange={(e)=> setRows(prev=> prev.map((x,idx)=> idx===i? {...x, title: e.target.value} : x))} /></td>
                <td className="p-2">
                  <select className="border p-1 rounded text-sm" value={r.status} onChange={(e)=> setRows(prev=> prev.map((x,idx)=> idx===i? {...x, status: e.target.value} : x))}>
                    <option value="draft">draft</option>
                    <option value="pending">pending</option>
                    <option value="in-progress">in-progress</option>
                    <option value="completed">completed</option>
                  </select>
                </td>
                <td className="p-2">
                  <select className="border p-1 rounded text-sm" value={r.priority} onChange={(e)=> setRows(prev=> prev.map((x,idx)=> idx===i? {...x, priority: e.target.value} : x))}>
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                </td>
                <td className="p-2">
                  <select className="border p-1 rounded text-sm" value={r.group || ''} onChange={(e)=> setRows(prev=> prev.map((x,idx)=> idx===i? {...x, group: e.target.value} : x))}>
                    <option value="">(default)</option>
                    {groups.map(g=> <option key={g._id} value={g._id}>{g.name}</option>)}
                  </select>
                </td>
                <td className="p-2"><input type="date" className="border p-1 rounded text-sm" value={r.dueAt || ''} onChange={(e)=> setRows(prev=> prev.map((x,idx)=> idx===i? {...x, dueAt: e.target.value} : x))} /></td>
                <td className="p-2"><TagInput value={r.tags} onChange={(tags)=> setRows(prev=> prev.map((x,idx)=> idx===i? {...x, tags} : x))} /></td>
                <td className="p-2"><input type="number" min="0" className="border p-1 rounded text-sm w-20" value={r.estimatedMinutes || ''} onChange={(e)=> setRows(prev=> prev.map((x,idx)=> idx===i? {...x, estimatedMinutes: e.target.value} : x))} /></td>
                <td className="p-2 text-xs text-yellow-700">{r.warnings?.length>0 ? r.warnings.join(', ') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Results */}
      {results && (
        <div className="mt-3">
          <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default BulkGridEditor;
