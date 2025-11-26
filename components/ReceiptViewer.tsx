'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
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

  const getFileType = (url: string): FileType => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) return 'image';
    if (extension === 'pdf') return 'pdf';
    return 'unknown';
  };

  const fileType = getFileType(receiptUrl);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0">
        {/* Hidden accessibility labels */}
        <DialogTitle className="sr-only">
          Receipt {transactionVendor && `- ${transactionVendor}`}
        </DialogTitle>
        <DialogDescription className="sr-only">
          View, download, or print this receipt
        </DialogDescription>

        {/* Header Bar */}
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <h2 className="text-xl font-bold text-navy">
            Receipt {transactionVendor && `- ${transactionVendor}`}
          </h2>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b bg-white">
          <Button
            size="sm"
            onClick={() => window.open(receiptUrl, '_blank')}
            className="gap-2 bg-navy hover:bg-navy-medium text-white"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const w = window.open(receiptUrl, '_blank');
              w?.addEventListener('load', () => w.print());
            }}
            className="gap-2 bg-navy hover:bg-navy-medium text-white"
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>
          {fileType === 'image' && (
            <>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(zoom - 0.25, 0.5))}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(zoom + 0.25, 3))}
                disabled={zoom >= 3}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {loading && !error && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-navy" />
              <p className="text-sm text-gray-600">Loading receipt...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <p className="text-sm text-gray-600">Failed to load receipt</p>
              <Button variant="outline" size="sm" onClick={() => window.open(receiptUrl, '_blank')}>
                Open in new tab
              </Button>
            </div>
          )}

          {fileType === 'image' && (
            <div className="flex items-center justify-center min-h-full">
              <img
                src={receiptUrl}
                alt="Receipt"
                className="max-w-full h-auto"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center',
                  display: loading || error ? 'none' : 'block',
                }}
                onLoad={() => { setLoading(false); setError(false); }}
                onError={() => { setLoading(false); setError(true); }}
              />
            </div>
          )}

          {fileType === 'pdf' && (
            <iframe
              src={receiptUrl}
              className="w-full h-full min-h-[600px]"
              title="Receipt PDF"
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
