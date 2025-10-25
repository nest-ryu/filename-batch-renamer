import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { FileList } from './components/FileList';
import { DownloadIcon, LoaderIcon, CheckCircleIcon, XCircleIcon, ZipIcon } from './components/Icons';

// This tells TypeScript that JSZip is available globally from the CDN script.
declare var JSZip: any;

type ProcessState = 'idle' | 'processing' | 'success' | 'error';

const App: React.FC = () => {
  const [sourceZip, setSourceZip] = useState<File | null>(null);
  const [targetZip, setTargetZip] = useState<File | null>(null);
  const [sourceFiles, setSourceFiles] = useState<string[]>([]);
  const [targetFiles, setTargetFiles] = useState<string[]>([]);
  const [renamedZipUrl, setRenamedZipUrl] = useState<string | null>(null);
  const [processState, setProcessState] = useState<ProcessState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getLeadingNumber = (filename: string): string | null => {
    const basename = filename.split('/').pop() || '';
    const match = basename.match(/^(\d+)/);
    return match ? match[1] : null;
  };

  const handleFileChange = async (
    file: File | null,
    setZip: React.Dispatch<React.SetStateAction<File | null>>,
    setFiles: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setProcessState('idle');
    setRenamedZipUrl(null);
    setErrorMessage(null);

    if (!file) {
      setZip(null);
      setFiles([]);
      return;
    }

    setZip(file);
    setProcessState('processing');
    try {
      const zip = await JSZip.loadAsync(file);
      const fileNames: string[] = [];
      zip.forEach((relativePath: string, zipEntry: any) => {
        if (!zipEntry.dir) {
          fileNames.push(zipEntry.name);
        }
      });
      setFiles(fileNames.sort());
      setProcessState('idle');
    } catch (error) {
      console.error("Error reading ZIP file:", error);
      setErrorMessage("유효하지 않은 ZIP 파일입니다. (Invalid ZIP file.)");
      setFiles([]);
      setZip(null);
      setProcessState('error');
    }
  };

  const handleProcessZips = useCallback(async () => {
    if (!sourceZip || !targetZip) return;

    setProcessState('processing');
    setRenamedZipUrl(null);
    setErrorMessage(null);

    try {
      const sourceZipInstance = await JSZip.loadAsync(sourceZip);
      const targetZipInstance = await JSZip.loadAsync(targetZip);
      const newZip = new JSZip();

      const sourceFileMap = new Map<string, string>();
      sourceZipInstance.forEach((_relativePath: string, zipEntry: any) => {
        if (!zipEntry.dir) {
          const leadingNum = getLeadingNumber(zipEntry.name);
          if (leadingNum) {
            sourceFileMap.set(leadingNum, zipEntry.name);
          }
        }
      });
      
      const renamePromises: Promise<void>[] = [];
      targetZipInstance.forEach((_relativePath: string, zipEntry: any) => {
         if (!zipEntry.dir) {
             const promise = (async () => {
                const leadingNum = getLeadingNumber(zipEntry.name);
                let newName = zipEntry.name;

                if (leadingNum && sourceFileMap.has(leadingNum)) {
                    newName = sourceFileMap.get(leadingNum)!;
                }
                
                const content = await zipEntry.async('blob');
                newZip.file(newName, content);
             })();
             renamePromises.push(promise);
         }
      });

      await Promise.all(renamePromises);

      const newZipBlob = await newZip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(newZipBlob);
      setRenamedZipUrl(url);
      setProcessState('success');
    } catch (error) {
      console.error("Error processing ZIP files:", error);
      setErrorMessage("파일 처리 중 오류가 발생했습니다. (An error occurred during processing.)");
      setProcessState('error');
    }
  }, [sourceZip, targetZip]);
  
  const canProcess = sourceZip && targetZip;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            파일명 일괄 변경기
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            소스 ZIP 파일 목록을 기준으로 타겟 ZIP 파일의 이름을 변경합니다.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 shadow-lg backdrop-blur-sm">
            <h2 className="text-2xl font-semibold mb-4 text-purple-300 flex items-center">
              <span className="bg-purple-500 text-white rounded-full h-8 w-8 flex items-center justify-center mr-3 font-bold">1</span>
              소스 ZIP (기준)
            </h2>
            <FileUpload
              onFileChange={(file) => handleFileChange(file, setSourceZip, setSourceFiles)}
              file={sourceZip}
            />
            <FileList title="소스 파일 목록" files={sourceFiles} />
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 shadow-lg backdrop-blur-sm">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-300 flex items-center">
              <span className="bg-indigo-500 text-white rounded-full h-8 w-8 flex items-center justify-center mr-3 font-bold">2</span>
              타겟 ZIP (변경 대상)
            </h2>
            <FileUpload
              onFileChange={(file) => handleFileChange(file, setTargetZip, setTargetFiles)}
              file={targetZip}
            />
            <FileList title="타겟 파일 목록" files={targetFiles} />
          </div>
        </main>

        <footer className="mt-8 text-center">
          <button
            onClick={handleProcessZips}
            disabled={!canProcess || processState === 'processing'}
            className="w-full max-w-md mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center"
          >
            {processState === 'processing' ? (
              <>
                <LoaderIcon />
                처리 중...
              </>
            ) : (
              '파일명 변경 및 ZIP 생성'
            )}
          </button>
          
          {processState === 'success' && renamedZipUrl && (
            <div className="mt-6 p-4 bg-green-900/50 border border-green-700 rounded-lg max-w-md mx-auto">
                <div className="flex items-center justify-center text-green-300">
                    <CheckCircleIcon />
                    <span className="ml-2 font-semibold">성공적으로 생성되었습니다!</span>
                </div>
              <a
                href={renamedZipUrl}
                download={`renamed_${targetZip?.name || 'files'}.zip`}
                className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transform hover:scale-105 transition-all duration-300 inline-flex items-center justify-center"
              >
                <DownloadIcon />
                결과 다운로드
              </a>
            </div>
          )}

          {processState === 'error' && errorMessage && (
            <div className="mt-6 p-4 bg-red-900/50 border border-red-700 rounded-lg max-w-md mx-auto text-red-300 flex items-center justify-center">
                <XCircleIcon/>
                <span className="ml-2 font-semibold">{errorMessage}</span>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};

export default App;