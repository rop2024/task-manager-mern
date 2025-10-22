import React, { useState, useEffect } from 'react';
import BulkImportCard from '../components/tasks/BulkImportCard';
import BulkGridEditor from '../components/tasks/BulkGridEditor';
import usePageTitle from '../hooks/usePageTitle';
import axios from 'axios';

const BulkImportPage = () => {
  usePageTitle('Bulk Import');
  const [parsedRows, setParsedRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [editing, setEditing] = useState(null);
  const [groups, setGroups] = useState([]);

  const handlePreview = (parsed, errs) => {
    setParsedRows(parsed || []);
    setErrors(errs || []);
  };

  useEffect(()=>{
    const fetchGroups = async ()=>{
      try{
        const res = await axios.get('/api/groups');
        setGroups(res.data.data || []);
      }catch(e){
        console.error('Failed to load groups', e);
      }
    };
    fetchGroups();
  }, []);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <BulkImportCard onPreview={handlePreview} />

        {parsedRows.length > 0 && (
          <BulkGridEditor parsedRows={parsedRows} groups={groups} onClose={() => setParsedRows([])} />
        )}
      </div>
    </div>
  );
};

export default BulkImportPage;
