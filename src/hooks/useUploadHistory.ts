import { useState, useEffect } from 'react';
import { UploadRecord } from '@/types/upload';

export function useUploadHistory(projectId?: string) {
  const [uploadHistory, setUploadHistory] = useState<UploadRecord[]>([]);

  const getStorageKey = (projectId: string) => `upload_history_${projectId}`;

  useEffect(() => {
    if (projectId) {
      const stored = localStorage.getItem(getStorageKey(projectId));
      if (stored) {
        try {
          setUploadHistory(JSON.parse(stored));
        } catch {
          setUploadHistory([]);
        }
      } else {
        setUploadHistory([]);
      }
    }
  }, [projectId]);

  const addUploadRecord = (record: Omit<UploadRecord, 'id' | 'uploadDate'>) => {
    if (!projectId) return;

    const newRecord: UploadRecord = {
      ...record,
      id: Date.now().toString(),
      uploadDate: new Date().toISOString(),
    };

    const updated = [newRecord, ...uploadHistory];
    setUploadHistory(updated);
    localStorage.setItem(getStorageKey(projectId), JSON.stringify(updated));
  };

  const removeUploadRecord = (recordId: string) => {
    if (!projectId) return;

    const updated = uploadHistory.filter(record => record.id !== recordId);
    setUploadHistory(updated);
    localStorage.setItem(getStorageKey(projectId), JSON.stringify(updated));
  };

  const clearHistory = () => {
    if (!projectId) return;

    setUploadHistory([]);
    localStorage.removeItem(getStorageKey(projectId));
  };

  return {
    uploadHistory,
    addUploadRecord,
    removeUploadRecord,
    clearHistory,
  };
}