'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface ReceiptViewerProps {
  isOpen: boolean
  onClose: () => void
  receiptUrl: string
  transactionVendor?: string
  transactionId?: string
}

type FileType = 'image' | 'pdf' | 'unknown'

export function ReceiptViewer({
  isOpen,
  onClose,
  receiptUrl,
  transactionVendor,
}: ReceiptViewerProps) {
  const [scale, setScale] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)

  const getFileType = (url: string): FileType => {
    const extension = url.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) return 'image'
    if (extension === 'pdf') return 'pdf'
    return 'unknown'
  }

  const fileType = getFileType(receiptUrl)

  const canZoomIn = scale < 3.0
  const canZoomOut = scale > 0.5

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-[90vh] max-w-4xl gap-0 p-0">
        {/* Hidden accessibility labels */}
        <DialogTitle className="sr-only">
          Receipt {transactionVendor && `- ${transactionVendor}`}
        </DialogTitle>
        <DialogDescription className="sr-only">
          View, download, or print this receipt
        </DialogDescription>

        {/* Header Bar */}
        <div className="flex items-center justify-between border-b bg-white p-6">
          <h2 className="text-navy text-xl font-bold">
            Receipt {transactionVendor && `- ${transactionVendor}`}
          </h2>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b bg-white px-6 py-3">
          <Button
            size="sm"
            onClick={() => window.open(receiptUrl, '_blank')}
            className="bg-navy hover:bg-navy-medium gap-2 text-white"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const w = window.open(receiptUrl, '_blank')
              w?.addEventListener('load', () => w.print())
            }}
            className="bg-navy hover:bg-navy-medium gap-2 text-white"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale(Math.max(0.5, scale - 0.25))}
            disabled={!canZoomOut}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-[60px] text-center text-sm font-medium">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale(Math.min(3.0, scale + 0.25))}
            disabled={!canZoomIn}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Page Navigation Toolbar (PDFs only) */}
        {fileType === 'pdf' && (
          <div className="flex items-center gap-4 border-b bg-white px-6 py-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <span className="text-sm text-gray-600">
              Page {pageNumber} of {numPages || '...'}
            </span>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {loading && !error && (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <Loader2 className="text-navy h-8 w-8 animate-spin" />
              <p className="text-sm text-gray-600">Loading receipt...</p>
            </div>
          )}

          {error && (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-sm text-gray-600">Failed to load receipt</p>
              <Button variant="outline" size="sm" onClick={() => window.open(receiptUrl, '_blank')}>
                Open in new tab
              </Button>
            </div>
          )}

          {fileType === 'image' && (
            <div className="flex min-h-full items-center justify-center">
              <img
                src={receiptUrl}
                alt="Receipt"
                className="h-auto max-w-full"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'center',
                  display: loading || error ? 'none' : 'block',
                }}
                onLoad={() => {
                  setLoading(false)
                  setError(false)
                }}
                onError={() => {
                  setLoading(false)
                  setError(true)
                }}
              />
            </div>
          )}

          {fileType === 'pdf' && (
            <div className="flex items-center justify-center overflow-auto bg-gray-100 p-4">
              <Document
                file={receiptUrl}
                onLoadSuccess={({ numPages }) => {
                  setNumPages(numPages)
                  setPageNumber(1)
                  setLoading(false)
                  setError(false)
                }}
                onLoadError={error => {
                  console.error('PDF load error:', error)
                  setLoading(false)
                  setError(true)
                }}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-lg"
                />
              </Document>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
