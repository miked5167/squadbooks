'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface PDFViewerProps {
  url: string
  scale: number
  onLoadSuccess: (numPages: number) => void
  onLoadError: (error: Error) => void
  pageNumber: number
  onPageChange: (page: number) => void
}

export function PDFViewer({
  url,
  scale,
  onLoadSuccess,
  onLoadError,
  pageNumber,
}: PDFViewerProps) {
  const [isClient, setIsClient] = useState(false)
  const [PDFComponents, setPDFComponents] = useState<{
    Document: any
    Page: any
  } | null>(null)

  useEffect(() => {
    setIsClient(true)

    // Dynamically import react-pdf only on client
    Promise.all([
      import('react-pdf'),
      import('react-pdf/dist/Page/AnnotationLayer.css'),
      import('react-pdf/dist/Page/TextLayer.css'),
    ]).then(([reactPdf]) => {
      // Configure worker
      reactPdf.pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString()

      setPDFComponents({
        Document: reactPdf.Document,
        Page: reactPdf.Page,
      })
    }).catch((err) => {
      console.error('Failed to load PDF components:', err)
      onLoadError(err)
    })
  }, [])

  if (!isClient || !PDFComponents) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const { Document, Page } = PDFComponents

  return (
    <div className="flex items-center justify-center overflow-auto bg-gray-100 p-4">
      <Document
        file={url}
        onLoadSuccess={({ numPages }: { numPages: number }) => {
          onLoadSuccess(numPages)
        }}
        onLoadError={(error: Error) => {
          console.error('PDF load error:', error)
          onLoadError(error)
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
  )
}
