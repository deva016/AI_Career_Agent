"use client";

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker to avoid "window is not defined" or other issues in Next.js
// We use unpkg CDN for the worker to avoid complex webpack config
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [error, setError] = useState<boolean>(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setError(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error("Failed to load PDF", error);
    setError(true);
  }

  return (
    <div className="flex flex-col h-full bg-black/40 rounded-xl overflow-hidden shadow-inner border border-white/5 relative">
      {/* PDF Controls Header */}
      <div className="flex items-center justify-between p-3 bg-white/5 border-b border-white/10 shrink-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 text-white/60 hover:text-white"
            onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs font-mono font-bold text-white/80 w-16 text-center">
            {pageNumber} / {numPages || '-'}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 text-white/60 hover:text-white"
            onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-7 h-7 text-white/60 hover:text-white hover:bg-white/10 rounded"
            onClick={() => setScale(prev => Math.max(prev - 0.2, 0.5))}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[10px] font-mono text-white/60 min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-7 h-7 text-white/60 hover:text-white hover:bg-white/10 rounded"
            onClick={() => setScale(prev => Math.min(prev + 0.2, 2.5))}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* PDF Canvas Area */}
      <div className="flex-1 overflow-auto custom-scrollbar relative bg-black/50 p-6 flex justify-center">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-sm font-bold text-white uppercase tracking-widest text-center">
              Cannot render PDF
            </p>
            <p className="text-xs text-white/60 text-center max-w-[250px]">
              The file may be corrupted, or the hosting provider denied access (CORS).
            </p>
          </div>
        ) : (
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex flex-col items-center justify-center h-full text-white/40 min-h-[400px]">
                 <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                 <span className="text-xs font-bold uppercase tracking-widest">Loading Document...</span>
              </div>
            }
            className="shadow-2xl transition-transform"
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale} 
              renderTextLayer={true} 
              renderAnnotationLayer={true}
              className="rounded overflow-hidden"
              loading={
                 <div className="w-[600px] h-[800px] bg-white/5 animate-pulse rounded flex items-center justify-center">
                    <span className="text-white/20 text-xs uppercase tracking-widest font-bold">Rendering Page...</span>
                 </div>
              }
            />
          </Document>
        )}
      </div>
    </div>
  );
}
