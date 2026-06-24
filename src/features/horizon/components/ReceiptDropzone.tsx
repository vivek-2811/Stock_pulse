import React, { useState, useRef } from 'react';
import { Camera, X } from 'lucide-react';

interface ReceiptDropzoneProps {
  receiptUrl: string | null;
  onUpload: (base64: string) => void;
  onRemove: () => void;
}

export const ReceiptDropzone: React.FC<ReceiptDropzoneProps> = ({
  receiptUrl,
  onUpload,
  onRemove
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);

    // Validate type (must be image)
    if (!file.type.startsWith('image/')) {
      setError('Invalid file type. Please upload an image.');
      return;
    }

    // Validate size (limit to 2MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError('File size too large. Limit is 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        onUpload(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`relative h-32 border border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-app-green bg-app-green/5 shadow-glow-green-sm'
            : 'border-border-glass bg-surface-low hover:border-white/10 hover:bg-white/2'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/*"
          className="hidden"
        />

        {receiptUrl ? (
          <div className="absolute inset-1.5 rounded-lg overflow-hidden flex items-center justify-center bg-black/60 group">
            <img src={receiptUrl} alt="Receipt preview" className="h-full object-contain" />
            <button
              type="button"
              id="remove-receipt"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 hover:bg-black text-white hover:text-red-500 transition-colors"
              aria-label="Remove receipt"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <Camera className="w-6 h-6 text-text-muted mb-2" />
            <span className="text-xs text-white font-medium">
              Drag & drop receipt here, or <span className="text-app-green underline">browse</span>
            </span>
            <span className="text-[10px] text-text-muted mt-1">PNG, JPG, or WEBP up to 2MB</span>
          </>
        )}
      </div>
      {error && (
        <p className="text-[10px] text-red-500 font-semibold" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
export default ReceiptDropzone;
