
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import PDFCanvas from './PDFCanvas';
import PDFToolPanel from './PDFToolPanel';
import { PDFDocument } from 'pdf-lib';

interface PDFEditorProps {
  file: File;
  onFileProcessed: (file: { name: string; url: string; blob: Blob }) => void;
}

const PDFEditor: React.FC<PDFEditorProps> = ({ file, onFileProcessed }) => {
  const [activeTool, setActiveTool] = useState('select');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [fabricCanvas, setFabricCanvas] = useState<any>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [toolSettings, setToolSettings] = useState({
    color: '#000000',
    fillColor: '#ffffff',
    strokeWidth: 2,
    fontSize: 16,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle: 'normal',
    opacity: 100,
    text: 'New Text'
  });

  useEffect(() => {
    loadPDFInfo();
  }, [file]);

  useEffect(() => {
    if (fabricCanvas) {
      // Track canvas state for undo/redo
      fabricCanvas.on('path:created', updateUndoRedo);
      fabricCanvas.on('object:added', updateUndoRedo);
      fabricCanvas.on('object:removed', updateUndoRedo);
      fabricCanvas.on('object:modified', updateUndoRedo);
    }
  }, [fabricCanvas]);

  const loadPDFInfo = async () => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      setTotalPages(pdfDoc.getPageCount());
      
      toast({
        title: "PDF Loaded",
        description: `Ready to edit ${pdfDoc.getPageCount()} pages`,
      });
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to load PDF for editing",
        variant: "destructive",
      });
    }
  };

  const updateUndoRedo = () => {
    if (fabricCanvas) {
      setCanUndo(fabricCanvas.getObjects().length > 0);
      setCanRedo(false); // Simplified for now
    }
  };

  const handleCanvasReady = (canvas: any) => {
    setFabricCanvas(canvas);
  };

  const handleUndo = () => {
    if (fabricCanvas && canUndo) {
      const objects = fabricCanvas.getObjects();
      if (objects.length > 0) {
        fabricCanvas.remove(objects[objects.length - 1]);
        updateUndoRedo();
      }
    }
  };

  const handleRedo = () => {
    // Simplified redo implementation
    toast({
      title: "Redo",
      description: "Redo functionality coming soon!",
    });
  };

  const handleClear = () => {
    if (fabricCanvas) {
      fabricCanvas.clear();
      // Re-render the PDF background
      fabricCanvas.renderAll();
      updateUndoRedo();
      toast({
        title: "Canvas Cleared",
        description: "All annotations have been removed",
      });
    }
  };

  const handleSave = async () => {
    if (!fabricCanvas) return;

    try {
      // Convert canvas to image
      const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: 2
      });

      // Create a new PDF with the edited content
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([fabricCanvas.width, fabricCanvas.height]);
      
      // Convert dataURL to bytes and embed as image
      const imageBytes = await fetch(dataURL).then(res => res.arrayBuffer());
      const image = await pdfDoc.embedPng(imageBytes);
      
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: fabricCanvas.width,
        height: fabricCanvas.height,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      onFileProcessed({
        name: `${file.name.replace('.pdf', '')}_edited.pdf`,
        url,
        blob
      });

      toast({
        title: "PDF Saved",
        description: "Your edited PDF has been saved successfully",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: "An error occurred while saving the PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-[600px] bg-gray-50 rounded-lg overflow-hidden">
      {/* Tool Panel */}
      <PDFToolPanel
        activeTool={activeTool}
        onToolChange={setActiveTool}
        toolSettings={toolSettings}
        onSettingsChange={setToolSettings}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onSave={handleSave}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Page Navigation */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              Page {currentPage + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages - 1}
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              >
                Next
              </Button>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Tool: <span className="font-medium capitalize">{activeTool}</span>
          </div>
        </div>

        {/* Canvas */}
        <PDFCanvas
          pdfFile={file}
          currentPage={currentPage}
          activeTool={activeTool}
          toolSettings={toolSettings}
          onCanvasReady={handleCanvasReady}
        />
      </div>
    </div>
  );
};

export default PDFEditor;
