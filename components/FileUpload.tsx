
import React from 'react';
import { UploadIcon, ZipIcon, XCircleIcon } from './Icons';

interface FileUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ file, onFileChange }) => {
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileChange(files[0]);
    }
    // Reset input value to allow re-uploading the same file
    event.target.value = '';
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
  }

  return (
    <div className="mb-4">
      <label
        htmlFor={`file-upload-${React.useId()}`}
        className="relative block w-full border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 transition-colors duration-300 bg-gray-900/50"
      >
        <div className="flex flex-col items-center justify-center">
            <UploadIcon />
            <span className="mt-2 block text-sm font-semibold text-gray-300">
            여기에 ZIP 파일을 드래그하거나 클릭하여 업로드
            </span>
            <span className="block text-xs text-gray-500">.zip</span>
        </div>
        <input
          id={`file-upload-${React.useId()}`}
          type="file"
          accept=".zip"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </label>
      {file && (
        <div className="mt-3 flex items-center justify-between bg-gray-700/80 p-3 rounded-lg text-sm">
            <div className="flex items-center truncate">
                <ZipIcon />
                <span className="ml-2 text-gray-200 truncate" title={file.name}>{file.name}</span>
            </div>
            <button onClick={handleClearFile} className="text-gray-400 hover:text-white transition-colors duration-200">
              <XCircleIcon />
            </button>
        </div>
      )}
    </div>
  );
};
