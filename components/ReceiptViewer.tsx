'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer, ZoomIn, ZoomOut, Loader2, AlertCircle } from 'lucide-react';

interface ReceiptViewerProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl: string;
  transactionVendor?: string;
  transactionId?: string;
}

type FileType = 'image' | 'pdf' | 'unknown';

export function ReceiptViewer({
  isOpen,
  onClose,
  receiptUrl,
  transactionVendor,
}: ReceiptViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Determine file type from URL
  const getFileType = (url: string): FileType => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) {
      return 'image';
    }
    if (extension === 'pdf') {
      return 'pdf';
    }
    return 'unknown';
  };

  const fileType = getFileType(receiptUrl);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = () => {
    // Open in new tab which triggers download
    window.open(receiptUrl, '_blank');
  };

  const handlePrint = () => {
    if (fileType === 'pdf') {
      // For PDFs, open in new window and trigger print
      const printWindow = window.open(receiptUrl, '_blank');
      printWindow?.addEventListener('load', () => {
        printWindow.print();
      });
    } else {
      // For images, create a print-friendly page
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Receipt - ${transactionVendor || 'Transaction'}</title>
              <style>
                body { margin: 0; padding: 20px; }
                img { max-width: 100%; height: auto; }
                @media print {
                  body { padding: 0; }
                }
              </style>
            </head>
            <body>
              <img src="${receiptUrl}" alt="Receipt" onload="window.print(); window.close();" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-navy dark:text-white text-xl font-bold">
            Receipt {transactionVendor && `- ${transactionVendor}`}
          </DialogTitle>
          <DialogDescription className="text-gray-700 dark:text-gray-300">
            View, download, or print this receipt
          </DialogDescription>
        </DialogHeader>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pb-4 border-b bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
          <Button
            variant="default"
            size="sm"
            onClick={handleDownload}
            className="gap-2 bg-navy hover:bg-navy-medium text-white"
          >
            <Download className="w-4 h-4" />
            <span className="font-medium">Download</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handlePrint}
            className="gap-2 bg-navy hover:bg-navy-medium text-white"
          >
            <Printer className="w-4 h-4" />
            <span className="font-medium">Print</span>
          </Button>
          {fileType === 'image' && (
            <>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="gap-1 border-navy text-navy hover:bg-navy hover:text-white disabled:opacity-50"
              >
                <ZoomOut className="w-4 h-4" />
                <span className="text-xs font-medium">-</span>
              </Button>
              <span className="text-sm font-semibold text-navy dark:text-white min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="gap-1 border-navy text-navy hover:bg-navy hover:text-white disabled:opacity-50"
              >
                <ZoomIn className="w-4 h-4" />
                <span className="text-xs font-medium">+</span>
              </Button>
            </>
          )}
        </div>

        {/* Receipt Viewer */}
        <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Loading receipt...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 text-destructive">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm">Failed to load receipt</p>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                Open in new tab
              </Button>
            </div>
          )}

          {fileType === 'image' && (
            <img
              src={receiptUrl}
              alt="Receipt"
              className="max-w-full h-auto transition-transform duration-200"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                display: loading || error ? 'none' : 'block',
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}

          {fileType === 'pdf' && (
            <iframe
              src={receiptUrl}
              className="w-full h-full min-h-[500px] border-0 rounded"
              title="Receipt PDF"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            />
          )}

          {fileType === 'unknown' && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm">Unsupported file format</p>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                Download file
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
