import React, { useState } from 'react';
import BulkImportCard from '../components/tasks/BulkImportCard';
import usePageTitle from '../hooks/usePageTitle';

const BulkImportPage = () => {
  usePageTitle('Bulk Import');
  const [parsedRows, setParsedRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [editing, setEditing] = useState(null);

  const handlePreview = (parsed, errs) => {
    setParsedRows(parsed || []);
    setErrors(errs || []);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <BulkImportCard onPreview={handlePreview} />

        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold mb-3">Preview ({parsedRows.length})</h4>

          {errors.length > 0 && (
            <div className="mb-3 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">Found {errors.length} warnings/errors during parse</div>
          )}

          {parsedRows.length === 0 ? (
            <div className="text-sm text-gray-500">No rows to preview</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="py-2">#</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Metadata</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((r, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 text-gray-600">{i + 1}</td>
                    <td className="py-2 font-medium text-gray-900">{r.title}</td>
                    <td className="py-2 text-gray-600">{r.status}</td>
                    <td className="py-2 text-gray-600">{Object.keys(r.metadata || {}).length > 0 ? Object.entries(r.metadata).map(([k,v])=>`${k}:${Array.isArray(v)?v.join(','):v}`).join('; ') : '-'}</td>
                    <td className="py-2 text-right">
                      <button onClick={() => setEditing({ index: i, row: r })} className="text-blue-600 hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Simple editor modal */}
        {editing && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 w-full max-w-2xl">
              <h4 className="font-semibold mb-2">Edit row {editing.index + 1}</h4>
              <input className="w-full p-2 border rounded mb-2" value={editing.row.title} onChange={(e)=> setEditing(s=>({...s, row: {...s.row, title: e.target.value}}))} />
              <div className="flex space-x-2">
                <button onClick={() => {
                  setParsedRows(prev => prev.map((r,idx) => idx === editing.index ? editing.row : r));
                  setEditing(null);
                }} className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
                <button onClick={() => setEditing(null)} className="px-3 py-2 border rounded">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkImportPage;
