
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  Type, 
  Image, 
  Square, 
  Circle, 
  Minus, 
  ArrowRight,
  Highlighter,
  Eraser,
  RotateCcw,
  RotateCw,
  Crop,
  Scissors
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { toast } from '@/hooks/use-toast';

interface PDFEditorProps {
  file: File;
  onFileProcessed: (file: { name: string; url: string; blob: Blob }) => void;
}

type EditTool = 'text' | 'image' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'highlight' | 'erase' | 'rotate' | 'crop';

const PDFEditor: React.FC<PDFEditorProps> = ({ file, onFileProcessed }) => {
  const [activeTool, setActiveTool] = useState<EditTool>('text');
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Text editing properties
  const [textContent, setTextContent] = useState('Sample Text');
  const [fontSize, setFontSize] = useState([12]);
  const [textColor, setTextColor] = useState('#000000');
  const [fontFamily, setFontFamily] = useState('Helvetica');
  
  // Shape properties
  const [shapeColor, setShapeColor] = useState('#000000');
  const [shapeOpacity, setShapeOpacity] = useState([100]);
  const [strokeWidth, setStrokeWidth] = useState([2]);
  
  // Highlight properties
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  const [highlightOpacity, setHighlightOpacity] = useState([50]);
  
  // Position properties
  const [xPosition, setXPosition] = useState([100]);
  const [yPosition, setYPosition] = useState([100]);
  const [width, setWidth] = useState([100]);
  const [height, setHeight] = useState([50]);
  
  // Rotation
  const [rotation, setRotation] = useState([0]);

  const tools = [
    { id: 'text' as EditTool, name: 'Add Text', icon: Type, color: 'text-blue-600' },
    { id: 'image' as EditTool, name: 'Insert Image', icon: Image, color: 'text-green-600' },
    { id: 'rectangle' as EditTool, name: 'Rectangle', icon: Square, color: 'text-purple-600' },
    { id: 'circle' as EditTool, name: 'Circle', icon: Circle, color: 'text-red-600' },
    { id: 'line' as EditTool, name: 'Line', icon: Minus, color: 'text-gray-600' },
    { id: 'arrow' as EditTool, name: 'Arrow', icon: ArrowRight, color: 'text-indigo-600' },
    { id: 'highlight' as EditTool, name: 'Highlight', icon: Highlighter, color: 'text-yellow-600' },
    { id: 'erase' as EditTool, name: 'Erase', icon: Eraser, color: 'text-orange-600' },
    { id: 'rotate' as EditTool, name: 'Rotate Page', icon: RotateCw, color: 'text-pink-600' },
    { id: 'crop' as EditTool, name: 'Crop Page', icon: Crop, color: 'text-teal-600' },
  ];

  useEffect(() => {
    loadPDF();
  }, [file]);

  const loadPDF = async () => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuffer);
      setPdfDoc(doc);
      setTotalPages(doc.getPageCount());
      toast({
        title: "PDF Loaded",
        description: `Ready to edit ${doc.getPageCount()} pages`,
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

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    } : { r: 0, g: 0, b: 0 };
  };

  const applyTextEdit = async () => {
    if (!pdfDoc) return;
    
    setProcessing(true);
    try {
      const pages = pdfDoc.getPages();
      const page = pages[currentPage];
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const color = hexToRgb(textColor);
      
      page.drawText(textContent, {
        x: xPosition[0],
        y: page.getHeight() - yPosition[0],
        size: fontSize[0],
        font: font,
        color: rgb(color.r, color.g, color.b),
        rotate: degrees(rotation[0]),
      });

      await savePDF();
    } catch (error) {
      console.error('Text edit error:', error);
      toast({
        title: "Error",
        description: "Failed to add text",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const applyShapeEdit = async (shape: 'rectangle' | 'circle') => {
    if (!pdfDoc) return;
    
    setProcessing(true);
    try {
      const pages = pdfDoc.getPages();
      const page = pages[currentPage];
      const color = hexToRgb(shapeColor);
      const opacity = shapeOpacity[0] / 100;
      
      if (shape === 'rectangle') {
        page.drawRectangle({
          x: xPosition[0],
          y: page.getHeight() - yPosition[0] - height[0],
          width: width[0],
          height: height[0],
          borderColor: rgb(color.r, color.g, color.b),
          borderWidth: strokeWidth[0],
          color: rgb(color.r, color.g, color.b),
          opacity: opacity,
        });
      } else if (shape === 'circle') {
        page.drawCircle({
          x: xPosition[0] + width[0] / 2,
          y: page.getHeight() - yPosition[0] - height[0] / 2,
          size: Math.min(width[0], height[0]) / 2,
          borderColor: rgb(color.r, color.g, color.b),
          borderWidth: strokeWidth[0],
          color: rgb(color.r, color.g, color.b),
          opacity: opacity,
        });
      }

      await savePDF();
    } catch (error) {
      console.error('Shape edit error:', error);
      toast({
        title: "Error",
        description: `Failed to add ${shape}`,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const applyLineEdit = async () => {
    if (!pdfDoc) return;
    
    setProcessing(true);
    try {
      const pages = pdfDoc.getPages();
      const page = pages[currentPage];
      const color = hexToRgb(shapeColor);
      
      page.drawLine({
        start: { x: xPosition[0], y: page.getHeight() - yPosition[0] },
        end: { x: xPosition[0] + width[0], y: page.getHeight() - yPosition[0] - height[0] },
        thickness: strokeWidth[0],
        color: rgb(color.r, color.g, color.b),
      });

      await savePDF();
    } catch (error) {
      console.error('Line edit error:', error);
      toast({
        title: "Error",
        description: "Failed to add line",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const applyHighlight = async () => {
    if (!pdfDoc) return;
    
    setProcessing(true);
    try {
      const pages = pdfDoc.getPages();
      const page = pages[currentPage];
      const color = hexToRgb(highlightColor);
      const opacity = highlightOpacity[0] / 100;
      
      page.drawRectangle({
        x: xPosition[0],
        y: page.getHeight() - yPosition[0] - height[0],
        width: width[0],
        height: height[0],
        color: rgb(color.r, color.g, color.b),
        opacity: opacity,
      });

      await savePDF();
    } catch (error) {
      console.error('Highlight error:', error);
      toast({
        title: "Error",
        description: "Failed to add highlight",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const rotatePage = async (direction: 'cw' | 'ccw') => {
    if (!pdfDoc) return;
    
    setProcessing(true);
    try {
      const pages = pdfDoc.getPages();
      const page = pages[currentPage];
      const rotationDegrees = direction === 'cw' ? 90 : -90;
      
      page.setRotation(degrees(page.getRotation().angle + rotationDegrees));
      
      await savePDF();
    } catch (error) {
      console.error('Rotation error:', error);
      toast({
        title: "Error",
        description: "Failed to rotate page",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const savePDF = async () => {
    if (!pdfDoc) return;
    
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    onFileProcessed({
      name: `${file.name.replace('.pdf', '')}_edited.pdf`,
      url,
      blob
    });

    toast({
      title: "Edit Applied",
      description: "Your changes have been saved to the PDF",
    });
  };

  const handleToolAction = async () => {
    switch (activeTool) {
      case 'text':
        await applyTextEdit();
        break;
      case 'rectangle':
        await applyShapeEdit('rectangle');
        break;
      case 'circle':
        await applyShapeEdit('circle');
        break;
      case 'line':
        await applyLineEdit();
        break;
      case 'highlight':
        await applyHighlight();
        break;
      default:
        toast({
          title: "Tool Not Implemented",
          description: `${activeTool} tool is coming soon!`,
        });
    }
  };

  const renderToolSettings = () => {
    switch (activeTool) {
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label>Text Content</Label>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Enter text to add"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Font Size: {fontSize[0]}px</Label>
                <Slider value={fontSize} onValueChange={setFontSize} min={8} max={72} step={1} />
              </div>
              <div>
                <Label>Text Color</Label>
                <Input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Font Family</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times-Roman">Times Roman</SelectItem>
                  <SelectItem value="Courier">Courier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'rectangle':
      case 'circle':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={shapeColor}
                  onChange={(e) => setShapeColor(e.target.value)}
                />
              </div>
              <div>
                <Label>Opacity: {shapeOpacity[0]}%</Label>
                <Slider value={shapeOpacity} onValueChange={setShapeOpacity} min={10} max={100} step={5} />
              </div>
            </div>
            <div>
              <Label>Stroke Width: {strokeWidth[0]}px</Label>
              <Slider value={strokeWidth} onValueChange={setStrokeWidth} min={1} max={10} step={1} />
            </div>
          </div>
        );

      case 'line':
        return (
          <div className="space-y-4">
            <div>
              <Label>Line Color</Label>
              <Input
                type="color"
                value={shapeColor}
                onChange={(e) => setShapeColor(e.target.value)}
              />
            </div>
            <div>
              <Label>Line Thickness: {strokeWidth[0]}px</Label>
              <Slider value={strokeWidth} onValueChange={setStrokeWidth} min={1} max={20} step={1} />
            </div>
          </div>
        );

      case 'highlight':
        return (
          <div className="space-y-4">
            <div>
              <Label>Highlight Color</Label>
              <Input
                type="color"
                value={highlightColor}
                onChange={(e) => setHighlightColor(e.target.value)}
              />
            </div>
            <div>
              <Label>Opacity: {highlightOpacity[0]}%</Label>
              <Slider value={highlightOpacity} onValueChange={setHighlightOpacity} min={10} max={100} step={5} />
            </div>
          </div>
        );

      case 'rotate':
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => rotatePage('ccw')} disabled={processing} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Rotate Left
              </Button>
              <Button onClick={() => rotatePage('cw')} disabled={processing} className="flex-1">
                <RotateCw className="w-4 h-4 mr-2" />
                Rotate Right
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-4">
            <p className="text-gray-500">Tool settings coming soon!</p>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Advanced PDF Editor</CardTitle>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
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
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tool Selection */}
        <div>
          <Label className="text-base font-medium mb-3 block">Editing Tools</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  variant={activeTool === tool.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTool(tool.id)}
                  className="flex items-center gap-2 h-auto p-2"
                >
                  <Icon className={`w-4 h-4 ${tool.color}`} />
                  <span className="text-xs">{tool.name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Position and Size Controls */}
        {['text', 'rectangle', 'circle', 'line', 'highlight'].includes(activeTool) && (
          <div>
            <Label className="text-base font-medium mb-3 block">Position & Size</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>X Position: {xPosition[0]}px</Label>
                <Slider value={xPosition} onValueChange={setXPosition} min={0} max={600} step={5} />
              </div>
              <div>
                <Label>Y Position: {yPosition[0]}px</Label>
                <Slider value={yPosition} onValueChange={setYPosition} min={0} max={800} step={5} />
              </div>
              <div>
                <Label>Width: {width[0]}px</Label>
                <Slider value={width} onValueChange={setWidth} min={10} max={400} step={5} />
              </div>
              <div>
                <Label>Height: {height[0]}px</Label>
                <Slider value={height} onValueChange={setHeight} min={10} max={200} step={5} />
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Tool-specific Settings */}
        <div>
          <Label className="text-base font-medium mb-3 block">Tool Settings</Label>
          {renderToolSettings()}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2">
          {activeTool !== 'rotate' && (
            <Button
              onClick={handleToolAction}
              disabled={processing || !pdfDoc}
              className="flex-1"
            >
              {processing ? 'Processing...' : `Apply ${tools.find(t => t.id === activeTool)?.name}`}
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => {
              setTextContent('Sample Text');
              setXPosition([100]);
              setYPosition([100]);
              setWidth([100]);
              setHeight([50]);
            }}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFEditor;
