import React, { useState } from 'react';
import axios from 'axios';

const BulkImportCard = ({ onPreview }) => {
  const [markdown, setMarkdown] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [errors, setErrors] = useState([]);
  const [showGuidelines, setShowGuidelines] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    const form = new FormData();
    form.append('file', file);

    try {
      setParsing(true);
      const res = await axios.post('/api/tasks/bulk/upload-file', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onPreview(res.data.parsed, res.data.errors);
    } catch (e) {
      console.error('Upload parse error', e);
      setErrors([{ message: e.response?.data?.message || 'Upload failed' }]);
    } finally {
      setParsing(false);
    }
  };

  const handlePreview = async () => {
    try {
      setParsing(true);
      const res = await axios.post('/api/tasks/bulk/parse', { markdown });
      onPreview(res.data.parsed, res.data.errors);
    } catch (e) {
      console.error('Parse error', e);
      setErrors([{ message: e.response?.data?.message || 'Parse failed' }]);
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-lg mb-2">Bulk Import</h3>
        <button aria-expanded={showGuidelines} aria-controls="bulk-guidelines" onClick={() => setShowGuidelines(s => !s)} className="text-sm text-blue-600 hover:underline">
          {showGuidelines ? 'Hide guidelines' : 'Show guidelines'}
        </button>
      </div>

      {showGuidelines && (
        <div id="bulk-guidelines" role="region" aria-label="Bulk import guidelines" className="mb-3 p-3 bg-gray-50 border border-gray-100 rounded text-sm text-gray-700">
          <strong className="block mb-1">Quick rules</strong>
          <ul className="list-disc ml-5 mb-2">
            <li>One task per line, using Markdown checkboxes: <code>- [ ] Title</code> or <code>- [x] Title</code>.</li>
            <li>Optional inline metadata after the title using pipes: <code>| priority:high | group:Work | due:2025-10-30 | tags:one,two</code>.</li>
            <li>Use ISO dates (YYYY-MM-DD) for due dates. Tags are comma-separated.</li>
            <li>Max recommended per request: 50 items. Large files should be split into multiple batches.</li>
          </ul>
          <strong className="block mb-1">Examples</strong>
          <div className="text-xs mb-2">
            <code>- [ ] Buy groceries | priority:medium | group:Personal | due:2025-10-30 | tags:errands,shopping | estimatedMinutes:30</code>
          </div>
          <strong className="block">Troubleshooting</strong>
          <ul className="list-disc ml-5 mt-1">
            <li>Lines without a checkbox will be ignored or flagged.</li>
            <li>If a group name isn't found, tasks will be assigned to your default group.</li>
            <li>Import returns per-row errors so you can fix and retry failing rows.</li>
          </ul>
        </div>
      )}

      <textarea
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
        placeholder="Paste checklist Markdown here..."
        className="w-full h-48 p-3 border rounded-lg text-sm mb-3 resize-none"
        aria-label="Bulk markdown input"
        spellCheck={false}
      />

      <div className="flex items-center space-x-3 mb-3">
        <label className="cursor-pointer inline-flex items-center px-3 py-2 border rounded bg-gray-50 hover:bg-gray-100" aria-label="Upload markdown file">
          <input type="file" accept=".md,text/markdown" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          <span className="text-sm">Upload .md</span>
        </label>
        <button onClick={handlePreview} disabled={parsing} className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
          Preview
        </button>
        <button onClick={() => onPreview([], [])} className="px-3 py-2 border rounded text-sm">Open in Editor</button>
        <button disabled className="ml-auto px-3 py-2 bg-green-600 text-white rounded text-sm opacity-60 cursor-not-allowed">Import All</button>
      </div>

      {fileName && <div className="text-xs text-gray-500 mb-2">Selected file: {fileName}</div>}

      {errors.length > 0 && (
        <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-700">
          {errors.map((e, i) => <div key={i}>{e.message}</div>)}
        </div>
      )}
    </div>
  );
};

export default BulkImportCard;
