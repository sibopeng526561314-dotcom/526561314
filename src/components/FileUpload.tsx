import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploadProps {
  onFileProcessed: (fileName: string, fileType: string, titles: string[]) => void;
}

export default function FileUpload({ onFileProcessed }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];

  const simulateTitleRecognition = (fileName: string): string[] => {
    const sampleTitles = [
      "What are the main principles of sustainable development?",
      "Explain the process of photosynthesis in plants.",
      "Describe the impact of climate change on ocean ecosystems.",
      "What role does artificial intelligence play in modern healthcare?",
      "Analyze the economic factors that led to the 2008 financial crisis.",
      "Discuss the importance of renewable energy sources.",
      "How does machine learning differ from traditional programming?",
      "Explain the concept of blockchain technology and its applications."
    ];

    const numTitles = Math.floor(Math.random() * 4) + 3;
    return sampleTitles.slice(0, numTitles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!allowedTypes.includes(file.type)) {
      alert('Unsupported file format. Please upload DOC, DOCX, PPT, PPTX, PDF, JPG, or PNG files.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('File size exceeds 50MB limit.');
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);

          const titles = simulateTitleRecognition(file.name);
          onFileProcessed(file.name, file.type, titles);

          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Upload Document</h2>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".doc,.docx,.ppt,.pptx,.pdf,.jpg,.jpeg,.png"
          onChange={handleFileInput}
        />

        <Upload className="mx-auto mb-4 text-gray-400" size={48} />
        <p className="text-gray-600 mb-2">
          Drag and drop your file here, or click to select
        </p>
        <p className="text-sm text-gray-500">
          Supported formats: DOC, DOCX, PPT, PPTX, PDF, JPG, PNG (Max 50MB)
        </p>
      </div>

      {uploadedFile && (
        <div className="mt-4">
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-gray-800">{uploadedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={handleClearFile}
              className="text-gray-500 hover:text-red-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {isUploading && (
            <div className="mt-3">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {!isUploading && uploadProgress === 100 && (
            <div className="mt-3 text-green-600 text-sm font-medium">
              Upload complete! Titles recognized successfully.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
