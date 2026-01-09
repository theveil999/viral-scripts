"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, File, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  onClear: () => void;
  selectedFile: File | null;
  accept?: string;
  maxSize?: number; // in bytes
  disabled?: boolean;
  error?: string | null;
}

export function FileDropzone({
  onFileSelect,
  onClear,
  selectedFile,
  accept = ".txt,.vtt,.srt",
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false,
  error,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayError = error || localError;

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`;
    }

    // Check file extension
    const ext = '.' + file.name.toLowerCase().split('.').pop();
    const acceptedExts = accept.split(',').map(a => a.trim().toLowerCase());
    if (!acceptedExts.includes(ext)) {
      return `Invalid file type. Accepted: ${accept}`;
    }

    return null;
  }, [accept, maxSize]);

  const handleFile = useCallback((file: File) => {
    setLocalError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    onFileSelect(file);
  }, [validateFile, onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [handleFile]);

  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalError(null);
    onClear();
  }, [onClear]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2">
      <motion.div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-colors duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isDragging
            ? 'border-purple-500 bg-purple-500/10'
            : displayError
              ? 'border-red-500/50 bg-red-500/5 hover:border-red-500/70'
              : selectedFile
                ? 'border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-500/70'
                : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50'
          }
        `}
        animate={{
          scale: isDragging ? 1.02 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {selectedFile ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center"
            >
              <div className="w-14 h-14 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-3">
                <File className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-zinc-100 font-medium mb-1">{selectedFile.name}</p>
              <p className="text-zinc-500 text-sm mb-3">
                {formatFileSize(selectedFile.size)}
              </p>
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Remove
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center"
            >
              <div className={`
                w-14 h-14 rounded-xl border flex items-center justify-center mb-3
                ${isDragging
                  ? 'bg-purple-500/20 border-purple-500/30'
                  : 'bg-zinc-800 border-zinc-700'
                }
              `}>
                <Upload className={`w-7 h-7 ${isDragging ? 'text-purple-400' : 'text-zinc-500'}`} />
              </div>
              <p className="text-zinc-300 font-medium mb-1">
                {isDragging ? 'Drop file here' : 'Drop transcript file here'}
              </p>
              <p className="text-zinc-500 text-sm">
                or <span className="text-purple-400 hover:text-purple-300">click to browse</span>
              </p>
              <p className="text-zinc-600 text-xs mt-2">
                Supports .txt, .vtt, .srt
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {displayError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-sm text-red-400"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{displayError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
