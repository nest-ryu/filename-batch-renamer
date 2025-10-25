
import React from 'react';

interface FileListProps {
  title: string;
  files: string[];
}

export const FileList: React.FC<FileListProps> = ({ title, files }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-300 mb-2">
        {title} <span className="text-sm font-normal text-gray-500">({files.length}개 파일)</span>
      </h3>
      <div className="h-64 bg-gray-900/70 rounded-lg p-3 overflow-y-auto border border-gray-700 text-gray-400 text-sm">
        {files.length > 0 ? (
          <ul>
            {files.map((file, index) => (
              <li key={index} className="py-1 px-2 rounded hover:bg-gray-700/50 truncate" title={file}>
                {file.split('/').pop()}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            ZIP 파일을 업로드하세요.
          </div>
        )}
      </div>
    </div>
  );
};
