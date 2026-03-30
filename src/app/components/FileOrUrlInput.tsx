"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface FileItem {
  id: string;
  file: File;
}

interface FileOrUrlInputProps {
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onFilesChange?: (files: File[]) => void;
  onUrlChange?: (url: string) => void;
  initialFiles?: File[];
  initialUrl?: string;
  allowUrl?: boolean;
  allowFiles?: boolean;
}

export function FileOrUrlInput({
  label = "Attach file",
  accept = "*/*",
  multiple = false,
  maxSizeMB = 50,
  onFilesChange,
  onUrlChange,
  initialFiles = [],
  initialUrl = "",
  allowUrl = true,
  allowFiles = true,
}: FileOrUrlInputProps) {
  const [files, setFiles] = useState<FileItem[]>(
    initialFiles.map((f) => ({ id: crypto.randomUUID(), file: f }))
  );
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!multiple && selected.length + files.length > 1) {
      setError("Only one file allowed");
      return;
    }
    for (const file of selected) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File ${file.name} exceeds ${maxSizeMB}MB`);
        return;
      }
    }
    setError("");
    const newItems = selected.map((file) => ({ id: crypto.randomUUID(), file }));
    const updated = multiple ? [...files, ...newItems] : newItems;
    setFiles(updated);
    onFilesChange?.(updated.map((i) => i.file));
  };

  const removeFile = (id: string) => {
    const updated = files.filter((f) => f.id !== id);
    setFiles(updated);
    onFilesChange?.(updated.map((i) => i.file));
  };

  const handleUrlChange = (val: string) => {
    setUrl(val);
    onUrlChange?.(val);
  };

  return (
    <div className="space-y-3">
      {label && <Label>{label}</Label>}
      {allowFiles && allowUrl ? (
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Upload File</TabsTrigger>
            <TabsTrigger value="url">Use URL</TabsTrigger>
          </TabsList>
          <TabsContent value="file" className="space-y-3">
            <Input type="file" accept={accept} multiple={multiple} onChange={handleFileSelect} />
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded border p-2">
                    <span className="text-sm truncate">{item.file.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(item.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="url">
            <Input
              type="url"
              placeholder="https://example.com/file.pdf"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
            />
          </TabsContent>
        </Tabs>
      ) : allowFiles ? (
        <div className="space-y-3">
          <Input type="file" accept={accept} multiple={multiple} onChange={handleFileSelect} />
          {files.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded border p-2">
              <span className="text-sm truncate">{item.file.name}</span>
              <Button variant="ghost" size="sm" onClick={() => removeFile(item.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <Input type="url" placeholder="https://..." value={url} onChange={(e) => handleUrlChange(e.target.value)} />
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}