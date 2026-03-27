"use client";

import { useRef, useState } from 'react';
import { Button } from '@/app/components/ui/button';

type FileUploaderProps = {
  accept?: string;
  onFileSelect: (file: File | null) => void;
  maxSizeMB?: number;
  className?: string;
};

export function FileUploader({ accept, onFileSelect, maxSizeMB = 200, className }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleSelect = (file: File | null) => {
    if (!file) {
      setFileName('');
      setError('');
      onFileSelect(null);
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Max file size is ${maxSizeMB}MB`);
      setFileName('');
      onFileSelect(null);
      return;
    }

    setError('');
    setFileName(file.name);
    onFileSelect(file);
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleSelect(e.target.files?.[0] || null)}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          Choose file
        </Button>
        <span className="text-sm text-gray-600">{fileName || 'No file selected'}</span>
      </div>
      {error ? <p className="text-sm text-red-600 mt-2">{error}</p> : null}
    </div>
  );
}
