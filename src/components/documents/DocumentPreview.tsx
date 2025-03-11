import React, { useEffect, useState, useRef } from 'react';
import { X, Download, ChevronLeft, ChevronRight, Maximize, Minimize, Loader } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { ProjectDocument, getCategoryDisplayName } from '../../types';

// Set the worker path to load the PDF.js worker from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.js';

interface DocumentPreviewProps {
  document: ProjectDocument;
  onClose: () => void;
}

export default function DocumentPreview({ document, onClose }: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(document.fileUrl);
        const pdfDoc = await loadingTask.promise;
        
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        
        // Render the first page
        renderPage(pdfDoc, 1);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF. Please try again or download the file.');
      } finally {
        setLoading(false);
      }
    };
    
    loadPdf();
    
    // Add fullscreen change event listener
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [document.fileUrl]);

  const renderPage = async (pdfDoc: pdfjsLib.PDFDocumentProxy, pageNum: number) => {
    try {
      setLoading(true);
      
      // Get the page
      const page = await pdfDoc.getPage(pageNum);
      
      // Set the canvas dimensions
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const context = canvas.getContext('2d');
      if (!context) return;
      
      // Calculate scale to fit width within container
      const viewport = page.getViewport({ scale });
      
      // Set canvas dimensions to match the viewport
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      setCurrentPage(pageNum);
    } catch (err) {
      console.error('Error rendering PDF page:', err);
      setError('Failed to render PDF page.');
    } finally {
      setLoading(false);
    }
  };

  const nextPage = () => {
    if (pdf && currentPage < numPages) {
      renderPage(pdf, currentPage + 1);
    }
  };

  const prevPage = () => {
    if (pdf && currentPage > 1) {
      renderPage(pdf, currentPage - 1);
    }
  };

  const zoomIn = () => {
    setScale(prevScale => {
      const newScale = prevScale + 0.2;
      if (pdf) renderPage(pdf, currentPage);
      return newScale;
    });
  };

  const zoomOut = () => {
    setScale(prevScale => {
      const newScale = Math.max(0.5, prevScale - 0.2);
      if (pdf) renderPage(pdf, currentPage);
      return newScale;
    });
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div
        ref={containerRef}
        className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="overflow-hidden">
            <h3 className="text-lg font-medium text-gray-900 truncate">{document.title}</h3>
            <p className="text-sm text-gray-500">
              {document.description || 'No description provided'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Document Metadata */}
        <div className="bg-gray-50 p-3 border-b border-gray-200 flex flex-wrap gap-y-2 gap-x-4 text-sm">
          <div>
            <span className="text-gray-500">Category:</span>{' '}
            <span className="text-gray-900">
              {document.category === 'custom' 
                ? document.customCategory 
                : getCategoryDisplayName(document.category)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Uploaded:</span>{' '}
            <span className="text-gray-900">{formatDate(document.uploadedAt)}</span>
          </div>
          <div>
            <span className="text-gray-500">Size:</span>{' '}
            <span className="text-gray-900">
              {(document.fileSize / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
          <div>
            <span className="text-gray-500">Version:</span>{' '}
            <span className="text-gray-900">v{document.version}</span>
          </div>
          {document.tags && document.tags.length > 0 && (
            <div className="flex-1 flex flex-wrap gap-1 justify-end">
              {document.tags.map(tag => (
                <span 
                  key={tag} 
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto relative flex items-center justify-center bg-gray-900">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-10">
              <Loader className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          {error && (
            <div className="text-white bg-red-500 p-4 rounded-lg max-w-md mx-auto text-center">
              {error}
            </div>
          )}
          <canvas ref={canvasRef} className="max-w-full" />
        </div>
        
        {/* Controls */}
        <div className="p-3 border-t border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex items-center space-x-2">
            <button
              onClick={prevPage}
              disabled={currentPage <= 1 || loading}
              className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-transparent"
              title="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {numPages}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage >= numPages || loading}
              className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-transparent"
              title="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={zoomOut}
              className="p-2 rounded-full hover:bg-gray-200"
              title="Zoom out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>
            <button
              onClick={zoomIn}
              className="p-2 rounded-full hover:bg-gray-200"
              title="Zoom in"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-gray-200"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
            <a
              href={document.fileUrl}
              download={document.fileName}
              className="p-2 rounded-full hover:bg-gray-200"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}