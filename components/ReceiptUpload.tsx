'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, X, FileImage, File, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

interface ReceiptUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  currentFile: File | null
  disabled?: boolean
  maxSizeMB?: number
  hideLabel?: boolean
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
const DEFAULT_MAX_SIZE_MB = 5

export function ReceiptUpload({
  onFileSelect,
  onFileRemove,
  currentFile,
  disabled = false,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  hideLabel = false,
}: ReceiptUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'File type must be JPG, PNG, WebP, or PDF',
      }
    }

    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size must be less than ${maxSizeMB}MB`,
      }
    }

    return { valid: true }
  }

  // Handle file selection
  const handleFile = useCallback(
    (file: File) => {
      const validation = validateFile(file)

      if (!validation.valid) {
        toast.error(validation.error)
        return
      }

      onFileSelect(file)

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPreview(null)
      }
    },
    [onFileSelect, maxSizeBytes, maxSizeMB]
  )

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFile(files[0])
      }
    },
    [disabled, handleFile]
  )

  // Handle file input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile]
  )

  // Handle remove
  const handleRemove = useCallback(() => {
    onFileRemove()
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onFileRemove])

  // Handle click to open file dialog
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled])

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-2">
      {!hideLabel && (
        <label className="text-sm font-medium text-navy">Receipt (Optional)</label>
      )}

      {currentFile ? (
        // File selected - show preview
        <Card className="border-2 border-navy/20">
          <div className="p-4">
            {/* Preview area */}
            {preview ? (
              <div className="mb-3 relative aspect-video w-full overflow-hidden rounded-lg bg-navy/5">
                <img
                  src={preview}
                  alt="Receipt preview"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="mb-3 flex items-center justify-center p-8 bg-navy/5 rounded-lg">
                <File className="w-16 h-16 text-navy/40" />
              </div>
            )}

            {/* File info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {currentFile.type === 'application/pdf' ? (
                  <File className="w-5 h-5 text-red-600 flex-shrink-0" />
                ) : (
                  <FileImage className="w-5 h-5 text-navy flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-navy truncate">
                    {currentFile.name}
                  </p>
                  <p className="text-xs text-navy/60">
                    {formatFileSize(currentFile.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        // No file - show upload area
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`
            relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 cursor-pointer
            ${isDragging ? 'border-meadow bg-meadow/5 scale-[1.02]' : 'border-navy/20 hover:border-navy/40 hover:bg-navy/5'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />

          <div className="flex flex-col items-center text-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                isDragging ? 'bg-meadow/20' : 'bg-navy/10'
              }`}
            >
              <Upload className={`w-6 h-6 ${isDragging ? 'text-meadow' : 'text-navy/60'}`} />
            </div>

            <p className="text-sm font-medium text-navy mb-1">
              {isDragging ? 'Drop your file here' : 'Click to upload or drag and drop'}
            </p>

            <p className="text-xs text-navy/60">
              JPG, PNG, WebP, or PDF (max {maxSizeMB}MB)
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-navy/60 mt-2">
        Upload a photo or scan of your receipt for record keeping
      </p>
    </div>
  )
}
