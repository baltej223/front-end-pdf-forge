
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Eye } from 'lucide-react';
import { Tool } from '@/pages/Index';

interface ProcessedFile {
  name: string;
  url: string;
  blob: Blob;
}

interface PDFPreviewProps {
  files: File[];
  processedFiles: ProcessedFile[];
  tool: Tool;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ files, processedFiles, tool }) => {
  const downloadFile = (file: ProcessedFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Input Files Preview */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Input Files ({files.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {file.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">
                        {file.type.replace('application/', '').replace('image/', '')}
                      </p>
                    </div>
                    <div className="ml-2">
                      {file.type === 'application/pdf' ? (
                        <FileText className="w-8 h-8 text-red-600" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">IMG</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processed Files */}
      {processedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="w-5 h-5" />
              Processed Files ({processedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processedFiles.map((file, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-green-50 border-green-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {file.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.blob.size)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => downloadFile(file)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {files.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-gray-100 w-fit">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No files uploaded yet
            </h3>
            <p className="text-gray-600">
              Upload files using the panel on the left to see them here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PDFPreview;
