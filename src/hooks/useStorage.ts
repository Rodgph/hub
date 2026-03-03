import { useState } from 'react';
import { storageService } from '@/services/storage.service';

export function useStorage() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (path: string, file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const url = await storageService.uploadFile(path, file);
      return url;
    } catch (err: any) {
      const msg = err.message || 'Erro inesperado no upload';
      setError(msg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    upload,
    isUploading,
    error,
    clearError: () => setError(null)
  };
}
