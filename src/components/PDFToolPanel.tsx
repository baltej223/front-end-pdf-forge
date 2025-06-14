
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  MousePointer, 
  Type, 
  Pen, 
  Square, 
  Circle, 
  Eraser,
  Undo,
  Redo,
  Download,
  Trash2
} from 'lucide-react';

interface PDFToolPanelProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  toolSettings: any;
  onSettingsChange: (settings: any) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const PDFToolPanel: React.FC<PDFToolPanelProps> = ({
  activeTool,
  onToolChange,
  toolSettings,
  onSettingsChange,
  onUndo,
  onRedo,
  onClear,
  onSave,
  canUndo,
  canRedo
}) => {
  const tools = [
    { id: 'select', name: 'Select', icon: MousePointer, description: 'Select and move objects' },
    { id: 'text', name: 'Text', icon: Type, description: 'Add text' },
    { id: 'draw', name: 'Draw', icon: Pen, description: 'Free drawing' },
    { id: 'rectangle', name: 'Rectangle', icon: Square, description: 'Draw rectangles' },
    { id: 'circle', name: 'Circle', icon: Circle, description: 'Draw circles' },
    { id: 'eraser', name: 'Eraser', icon: Eraser, description: 'Remove objects' },
  ];

  const updateSetting = (key: string, value: any) => {
    onSettingsChange({ ...toolSettings, [key]: value });
  };

  const renderToolSettings = () => {
    switch (activeTool) {
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label>Text Content</Label>
              <Textarea
                value={toolSettings.text || 'New Text'}
                onChange={(e) => updateSetting('text', e.target.value)}
                placeholder="Enter text"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Font Size: {toolSettings.fontSize || 16}px</Label>
                <Slider
                  value={[toolSettings.fontSize || 16]}
                  onValueChange={(value) => updateSetting('fontSize', value[0])}
                  min={8}
                  max={72}
                  step={1}
                />
              </div>
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={toolSettings.color || '#000000'}
                  onChange={(e) => updateSetting('color', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Font Family</Label>
              <Select
                value={toolSettings.fontFamily || 'Arial'}
                onValueChange={(value) => updateSetting('fontFamily', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant={toolSettings.fontWeight === 'bold' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSetting('fontWeight', toolSettings.fontWeight === 'bold' ? 'normal' : 'bold')}
              >
                Bold
              </Button>
              <Button
                variant={toolSettings.fontStyle === 'italic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSetting('fontStyle', toolSettings.fontStyle === 'italic' ? 'normal' : 'italic')}
              >
                Italic
              </Button>
            </div>
          </div>
        );

      case 'draw':
        return (
          <div className="space-y-4">
            <div>
              <Label>Brush Color</Label>
              <Input
                type="color"
                value={toolSettings.color || '#000000'}
                onChange={(e) => updateSetting('color', e.target.value)}
              />
            </div>
            <div>
              <Label>Brush Size: {toolSettings.strokeWidth || 2}px</Label>
              <Slider
                value={[toolSettings.strokeWidth || 2]}
                onValueChange={(value) => updateSetting('strokeWidth', value[0])}
                min={1}
                max={20}
                step={1}
              />
            </div>
          </div>
        );

      case 'rectangle':
      case 'circle':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stroke Color</Label>
                <Input
                  type="color"
                  value={toolSettings.color || '#000000'}
                  onChange={(e) => updateSetting('color', e.target.value)}
                />
              </div>
              <div>
                <Label>Fill Color</Label>
                <Input
                  type="color"
                  value={toolSettings.fillColor || '#ffffff'}
                  onChange={(e) => updateSetting('fillColor', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Stroke Width: {toolSettings.strokeWidth || 2}px</Label>
              <Slider
                value={[toolSettings.strokeWidth || 2]}
                onValueChange={(value) => updateSetting('strokeWidth', value[0])}
                min={1}
                max={10}
                step={1}
              />
            </div>
            <div>
              <Label>Opacity: {toolSettings.opacity || 100}%</Label>
              <Slider
                value={[toolSettings.opacity || 100]}
                onValueChange={(value) => updateSetting('opacity', value[0])}
                min={10}
                max={100}
                step={5}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-4">
            <p className="text-gray-500">Select a tool to see settings</p>
          </div>
        );
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Tools Section */}
      <Card className="border-0 border-b rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant={activeTool === tool.id ? 'default' : 'outline'}
                className="w-full justify-start h-auto p-3"
                onClick={() => onToolChange(tool.id)}
              >
                <Icon className="w-4 h-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">{tool.name}</div>
                  <div className="text-xs text-gray-500">{tool.description}</div>
                </div>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <Separator />

      {/* Tool Settings */}
      <Card className="border-0 border-b rounded-none flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tool Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {renderToolSettings()}
        </CardContent>
      </Card>

      <Separator />

      {/* Actions */}
      <Card className="border-0 rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="flex-1"
            >
              <Undo className="w-4 h-4 mr-2" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="flex-1"
            >
              <Redo className="w-4 h-4 mr-2" />
              Redo
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Button
            onClick={onSave}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Save PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFToolPanel;
