import React, { useRef, useEffect, useState } from 'react';
import { Canvas as FabricCanvas, FabricText, Rect, Circle, Path, FabricImage } from 'fabric';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { toast } from '@/hooks/use-toast';

interface PDFCanvasProps {
  pdfFile: File;
  currentPage: number;
  activeTool: string;
  toolSettings: any;
  onCanvasReady: (canvas: FabricCanvas) => void;
}

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PDFCanvas: React.FC<PDFCanvasProps> = ({ 
  pdfFile, 
  currentPage, 
  activeTool, 
  toolSettings, 
  onCanvasReady 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  useEffect(() => {
    loadPDF();
  }, [pdfFile]);

  useEffect(() => {
    if (canvasRef.current && !fabricCanvas) {
      const canvas = new FabricCanvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
      });

      setFabricCanvas(canvas);
      onCanvasReady(canvas);

      // Handle canvas events
      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:up', handleMouseUp);

      return () => {
        canvas.dispose();
      };
    }
  }, [canvasRef.current]);

  useEffect(() => {
    if (fabricCanvas && pdfDoc) {
      renderPDFPage();
    }
  }, [fabricCanvas, pdfDoc, currentPage]);

  useEffect(() => {
    if (fabricCanvas) {
      updateCanvasMode();
    }
  }, [fabricCanvas, activeTool, toolSettings]);

  const loadPDF = async () => {
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to load PDF",
        variant: "destructive",
      });
    }
  };

  const renderPDFPage = async () => {
    if (!pdfDoc || !fabricCanvas) return;

    try {
      const page = await pdfDoc.getPage(currentPage + 1);
      const viewport = page.getViewport({ scale: 1 });
      
      // Create a temporary canvas to render the PDF page
      const tempCanvas = document.createElement('canvas');
      const tempContext = tempCanvas.getContext('2d');
      tempCanvas.width = viewport.width;
      tempCanvas.height = viewport.height;

      await page.render({ canvasContext: tempContext, viewport }).promise;

      // Convert to fabric image and set as background
      const dataURL = tempCanvas.toDataURL();
      
      // Use FabricImage.fromURL for Fabric.js v6
      FabricImage.fromURL(dataURL).then((img) => {
        img.set({
          scaleX: fabricCanvas.width! / viewport.width,
          scaleY: fabricCanvas.height! / viewport.height,
          selectable: false,
          evented: false,
        });
        
        // Set as background by adding to canvas and sending to back
        fabricCanvas.add(img);
        fabricCanvas.sendObjectToBack(img);
        fabricCanvas.renderAll();
      });

    } catch (error) {
      console.error('Error rendering PDF page:', error);
      toast({
        title: "Error",
        description: "Failed to render PDF page",
        variant: "destructive",
      });
    }
  };

  const updateCanvasMode = () => {
    if (!fabricCanvas) return;

    // Reset canvas modes
    fabricCanvas.isDrawingMode = false;
    fabricCanvas.selection = true;

    switch (activeTool) {
      case 'select':
        fabricCanvas.defaultCursor = 'default';
        break;
      case 'text':
        fabricCanvas.defaultCursor = 'text';
        break;
      case 'draw':
        fabricCanvas.isDrawingMode = true;
        if (fabricCanvas.freeDrawingBrush) {
          fabricCanvas.freeDrawingBrush.color = toolSettings.color || '#000000';
          fabricCanvas.freeDrawingBrush.width = toolSettings.strokeWidth || 2;
        }
        break;
      case 'rectangle':
      case 'circle':
        fabricCanvas.defaultCursor = 'crosshair';
        fabricCanvas.selection = false;
        break;
      default:
        fabricCanvas.defaultCursor = 'default';
    }
  };

  let isDrawing = false;
  let startPoint = { x: 0, y: 0 };
  let activeShape: any = null;

  const handleMouseDown = (e: any) => {
    if (!fabricCanvas) return;

    const pointer = fabricCanvas.getPointer(e.e);
    startPoint = { x: pointer.x, y: pointer.y };

    switch (activeTool) {
      case 'text':
        addText(pointer.x, pointer.y);
        break;
      case 'rectangle':
        isDrawing = true;
        activeShape = new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: toolSettings.fillColor || 'transparent',
          stroke: toolSettings.color || '#000000',
          strokeWidth: toolSettings.strokeWidth || 2,
          opacity: (toolSettings.opacity || 100) / 100,
        });
        fabricCanvas.add(activeShape);
        break;
      case 'circle':
        isDrawing = true;
        activeShape = new Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 0,
          fill: toolSettings.fillColor || 'transparent',
          stroke: toolSettings.color || '#000000',
          strokeWidth: toolSettings.strokeWidth || 2,
          opacity: (toolSettings.opacity || 100) / 100,
        });
        fabricCanvas.add(activeShape);
        break;
    }
  };

  const handleMouseMove = (e: any) => {
    if (!fabricCanvas || !isDrawing || !activeShape) return;

    const pointer = fabricCanvas.getPointer(e.e);

    if (activeTool === 'rectangle') {
      const width = Math.abs(pointer.x - startPoint.x);
      const height = Math.abs(pointer.y - startPoint.y);
      activeShape.set({
        width: width,
        height: height,
        left: Math.min(pointer.x, startPoint.x),
        top: Math.min(pointer.y, startPoint.y),
      });
    } else if (activeTool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(pointer.x - startPoint.x, 2) + Math.pow(pointer.y - startPoint.y, 2)
      ) / 2;
      activeShape.set({
        radius: radius,
        left: startPoint.x - radius,
        top: startPoint.y - radius,
      });
    }

    fabricCanvas.renderAll();
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      isDrawing = false;
      activeShape = null;
    }
  };

  const addText = (x: number, y: number) => {
    if (!fabricCanvas) return;

    const text = new FabricText(toolSettings.text || 'New Text', {
      left: x,
      top: y,
      fontSize: toolSettings.fontSize || 16,
      fill: toolSettings.color || '#000000',
      fontFamily: toolSettings.fontFamily || 'Arial',
      fontWeight: toolSettings.fontWeight || 'normal',
      fontStyle: toolSettings.fontStyle || 'normal',
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    
    // For Fabric.js v6, use textEditingManager to enter editing mode
    if (fabricCanvas.textEditingManager) {
      fabricCanvas.textEditingManager.editObject(text);
    }
  };

  return (
    <div className="flex-1 bg-gray-100 p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-fit mx-auto">
        <canvas 
          ref={canvasRef} 
          className="border border-gray-300 rounded cursor-crosshair"
        />
      </div>
    </div>
  );
};

export default PDFCanvas;
