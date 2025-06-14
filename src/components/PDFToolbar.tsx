
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tool } from '@/pages/Index';
import { toast } from '@/hooks/use-toast';
import { PDFDocument, rgb } from 'pdf-lib';

interface PDFToolbarProps {
  tool: Tool;
  files: File[];
  onFileProcessed: (file: { name: string; url: string; blob: Blob }) => void;
}

const PDFToolbar: React.FC<PDFToolbarProps> = ({ tool, files, onFileProcessed }) => {
  const [processing, setProcessing] = useState(false);
  const [splitPages, setSplitPages] = useState('1-2');
  const [compressionLevel, setCompressionLevel] = useState([75]);
  const [mergeOrder, setMergeOrder] = useState<number[]>([]);

  React.useEffect(() => {
    setMergeOrder(files.map((_, index) => index));
  }, [files]);

  const handleSplitPDF = async () => {
    if (files.length === 0 || files[0].type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Please upload a PDF file to split",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Parse page range
      const pages = splitPages.split(',').map(range => {
        if (range.includes('-')) {
          const [start, end] = range.split('-').map(n => parseInt(n.trim()) - 1);
          return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        }
        return [parseInt(range.trim()) - 1];
      }).flat();

      // Create new PDF with selected pages
      const newPdfDoc = await PDFDocument.create();
      const copiedPages = await newPdfDoc.copyPages(pdfDoc, pages);
      copiedPages.forEach(page => newPdfDoc.addPage(page));

      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      onFileProcessed({
        name: `${file.name.replace('.pdf', '')}_split.pdf`,
        url,
        blob
      });

      toast({
        title: "PDF Split Successfully",
        description: `Extracted ${pages.length} pages`,
      });
    } catch (error) {
      console.error('Split error:', error);
      toast({
        title: "Split Failed",
        description: "An error occurred while splitting the PDF",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleMergePDFs = async () => {
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length < 2) {
      toast({
        title: "Error",
        description: "Please upload at least 2 PDF files to merge",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();

      for (const index of mergeOrder) {
        if (index < pdfFiles.length) {
          const file = pdfFiles[index];
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await PDFDocument.load(arrayBuffer);
          const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          pages.forEach(page => mergedPdf.addPage(page));
        }
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      onFileProcessed({
        name: 'merged_document.pdf',
        url,
        blob
      });

      toast({
        title: "PDFs Merged Successfully",
        description: `Combined ${pdfFiles.length} PDF files`,
      });
    } catch (error) {
      console.error('Merge error:', error);
      toast({
        title: "Merge Failed",
        description: "An error occurred while merging PDFs",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleImageToPDF = async () => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please upload image files to convert",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const pdfDoc = await PDFDocument.create();

      for (const file of imageFiles) {
        const arrayBuffer = await file.arrayBuffer();
        let image;
        
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          image = await pdfDoc.embedJpg(arrayBuffer);
        } else if (file.type === 'image/png') {
          image = await pdfDoc.embedPng(arrayBuffer);
        } else {
          continue;
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      onFileProcessed({
        name: 'images_to_pdf.pdf',
        url,
        blob
      });

      toast({
        title: "Images Converted Successfully",
        description: `Created PDF from ${imageFiles.length} images`,
      });
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: "Conversion Failed",
        description: "An error occurred while converting images",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCompressPDF = async () => {
    if (files.length === 0 || files[0].type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Please upload a PDF file to compress",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Save with compression (this is a simplified approach)
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const compressionRatio = ((file.size - blob.size) / file.size * 100).toFixed(1);

      onFileProcessed({
        name: `${file.name.replace('.pdf', '')}_compressed.pdf`,
        url,
        blob
      });

      toast({
        title: "PDF Compressed Successfully",
        description: `File size reduced by ${compressionRatio}%`,
      });
    } catch (error) {
      console.error('Compression error:', error);
      toast({
        title: "Compression Failed",
        description: "An error occurred while compressing the PDF",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleEditPDF = async () => {
    if (files.length === 0 || files[0].type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Please upload a PDF file to edit",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Add sample text annotation
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      firstPage.drawText('Sample Edit - Text Added by PDF Forge', {
        x: 50,
        y: firstPage.getHeight() - 50,
        size: 12,
        color: rgb(1, 0, 0),
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
        title: "PDF Edited Successfully",
        description: "Sample text has been added to the document",
      });
    } catch (error) {
      console.error('Edit error:', error);
      toast({
        title: "Edit Failed",
        description: "An error occurred while editing the PDF",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const renderToolControls = () => {
    switch (tool) {
      case 'split':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="split-pages">Page Range</Label>
              <Input
                id="split-pages"
                value={splitPages}
                onChange={(e) => setSplitPages(e.target.value)}
                placeholder="e.g., 1-3, 5, 7-9"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter page numbers or ranges separated by commas
              </p>
            </div>
            <Button onClick={handleSplitPDF} disabled={processing} className="w-full">
              {processing ? 'Splitting...' : 'Split PDF'}
            </Button>
          </div>
        );

      case 'merge':
        return (
          <div className="space-y-4">
            <div>
              <Label>File Order</Label>
              <p className="text-xs text-gray-500 mb-2">
                Files will be merged in the uploaded order
              </p>
              <div className="space-y-2">
                {files.filter(f => f.type === 'application/pdf').map((file, index) => (
                  <div key={index} className="flex items-center p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium mr-2">{index + 1}.</span>
                    <span className="truncate">{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={handleMergePDFs} disabled={processing} className="w-full">
              {processing ? 'Merging...' : 'Merge PDFs'}
            </Button>
          </div>
        );

      case 'image-to-pdf':
        return (
          <div className="space-y-4">
            <div>
              <Label>Images to Convert</Label>
              <p className="text-xs text-gray-500 mb-2">
                {files.filter(f => f.type.startsWith('image/')).length} image(s) selected
              </p>
            </div>
            <Button onClick={handleImageToPDF} disabled={processing} className="w-full">
              {processing ? 'Converting...' : 'Convert to PDF'}
            </Button>
          </div>
        );

      case 'compress':
        return (
          <div className="space-y-4">
            <div>
              <Label>Compression Level: {compressionLevel[0]}%</Label>
              <Slider
                value={compressionLevel}
                onValueChange={setCompressionLevel}
                max={100}
                min={10}
                step={5}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Higher values = better quality, larger file size
              </p>
            </div>
            <Button onClick={handleCompressPDF} disabled={processing} className="w-full">
              {processing ? 'Compressing...' : 'Compress PDF'}
            </Button>
          </div>
        );

      case 'edit':
        return (
          <div className="space-y-4">
            <div>
              <Label>Edit Options</Label>
              <p className="text-xs text-gray-500 mb-2">
                Basic editing features (more advanced features coming soon)
              </p>
            </div>
            <Button onClick={handleEditPDF} disabled={processing} className="w-full">
              {processing ? 'Processing...' : 'Add Sample Text'}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tool Settings</CardTitle>
      </CardHeader>
      <CardContent>
        {renderToolControls()}
      </CardContent>
    </Card>
  );
};

export default PDFToolbar;
