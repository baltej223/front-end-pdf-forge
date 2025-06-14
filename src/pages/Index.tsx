
import React, { useState } from 'react';
import { Upload, FileText, Scissors, Merge, Image, Minimize2, Edit3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FileUploader from '@/components/FileUploader';
import PDFToolbar from '@/components/PDFToolbar';
import PDFPreview from '@/components/PDFPreview';
import { toast } from '@/hooks/use-toast';

export type Tool = 'upload' | 'split' | 'merge' | 'image-to-pdf' | 'compress' | 'edit';

const Index = () => {
  const [selectedTool, setSelectedTool] = useState<Tool>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processedFiles, setProcessedFiles] = useState<{ name: string; url: string; blob: Blob }[]>([]);

  const tools = [
    {
      id: 'split' as Tool,
      name: 'Split PDF',
      description: 'Extract specific pages or split into multiple documents',
      icon: Scissors,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      id: 'merge' as Tool,
      name: 'Merge PDFs',
      description: 'Combine multiple PDF files into one document',
      icon: Merge,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
    },
    {
      id: 'image-to-pdf' as Tool,
      name: 'Image to PDF',
      description: 'Convert JPG, PNG images to PDF format',
      icon: Image,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
    },
    {
      id: 'compress' as Tool,
      name: 'Compress PDF',
      description: 'Reduce file size while maintaining quality',
      icon: Minimize2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
    },
    {
      id: 'edit' as Tool,
      name: 'Edit PDF',
      description: 'Add text, annotations, and modify content',
      icon: Edit3,
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100',
    },
  ];

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files);
    toast({
      title: "Files uploaded successfully",
      description: `${files.length} file(s) ready for processing`,
    });
  };

  const handleFileProcessed = (processedFile: { name: string; url: string; blob: Blob }) => {
    setProcessedFiles(prev => [...prev, processedFile]);
    toast({
      title: "File processed successfully",
      description: `${processedFile.name} is ready for download`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PDF Forge</h1>
                <p className="text-sm text-gray-600">Professional PDF manipulation tool</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTool === 'upload' ? (
          <div className="space-y-8">
            {/* File Upload Section */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your PDF Tool</h2>
              <p className="text-lg text-gray-600 mb-8">Select a tool below to get started with your PDF manipulation</p>
            </div>

            <FileUploader onFilesUploaded={handleFilesUploaded} />

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Card
                    key={tool.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${tool.bgColor} border-0`}
                    onClick={() => setSelectedTool(tool.id)}
                  >
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto mb-4 p-3 rounded-full bg-white shadow-sm">
                        <Icon className={`w-8 h-8 ${tool.color}`} />
                      </div>
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        {tool.name}
                      </CardTitle>
                      <CardDescription className="text-gray-600 text-sm">
                        {tool.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Back to tools button */}
            <Button
              variant="outline"
              onClick={() => setSelectedTool('upload')}
              className="mb-4"
            >
              ← Back to Tools
            </Button>

            {/* Current Tool Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {tools.find(t => t.id === selectedTool)?.name}
              </h2>
              <p className="text-lg text-gray-600">
                {tools.find(t => t.id === selectedTool)?.description}
              </p>
            </div>

            {/* Tool Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel - File Upload & Controls */}
              <div className="lg:col-span-1 space-y-6">
                <FileUploader onFilesUploaded={handleFilesUploaded} />
                
                {uploadedFiles.length > 0 && (
                  <PDFToolbar
                    tool={selectedTool}
                    files={uploadedFiles}
                    onFileProcessed={handleFileProcessed}
                  />
                )}
              </div>

              {/* Right Panel - Preview & Results */}
              <div className="lg:col-span-2">
                <PDFPreview
                  files={uploadedFiles}
                  processedFiles={processedFiles}
                  tool={selectedTool}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
