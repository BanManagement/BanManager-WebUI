/* eslint-disable @next/next/no-img-element */
import { useState, useRef, useCallback, forwardRef, createContext, useContext, useEffect } from 'react'
import Uploady, { useUploady, useBatchAddListener, useItemProgressListener, useItemFinishListener, useItemErrorListener } from '@rpldy/uploady'
import { usePasteUpload } from '@rpldy/upload-paste'
import { FiPaperclip, FiX } from 'react-icons/fi'
import clsx from 'clsx'

const UploadContext = createContext(null)

function FileChip ({ id, url, name, onRemove, progress, error }) {
  const isUploading = progress !== undefined && progress < 100
  const displayName = name.length > 20 ? name.slice(0, 17) + '...' : name

  return (
    <div
      className={clsx(
        'relative flex items-center gap-2 pl-1 pr-1 py-1 rounded-full',
        'bg-primary-700 border transition-colors',
        error ? 'border-red-500' : 'border-primary-600'
      )}
      title={error || name}
    >
      {/* Thumbnail */}
      <div className='w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-primary-600'>
        <img
          src={url}
          alt={name}
          className='w-full h-full object-cover'
        />
      </div>

      {/* Filename */}
      <span
        className={clsx(
          'text-sm truncate max-w-[120px]',
          error ? 'text-red-400' : 'text-gray-300'
        )}
      >
        {error ? 'Failed' : isUploading ? 'Uploading...' : displayName}
      </span>

      {/* Delete button with proper touch target */}
      <button
        onClick={() => onRemove(id)}
        className={clsx(
          'flex items-center justify-center w-8 h-8 -mr-1 rounded-full transition-colors',
          'text-gray-400 hover:text-white hover:bg-red-500/80'
        )}
        type='button'
        title='Remove'
      >
        <FiX className='w-4 h-4' />
      </button>

      {/* Progress bar */}
      {isUploading && (
        <div className='absolute bottom-0 left-2 right-2 h-0.5 bg-gray-600 rounded-full overflow-hidden'>
          <div
            className='bg-accent-500 h-full transition-all duration-300'
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

export function AttachButton ({ disabled }) {
  const ctx = useContext(UploadContext)
  if (!ctx) return null

  const { onAttach, totalFiles, maxFiles } = ctx
  const canUploadMore = totalFiles < maxFiles

  return (
    <div className='flex items-center gap-2'>
      <button
        type='button'
        onClick={onAttach}
        disabled={!canUploadMore || disabled}
        className={clsx(
          'flex items-center gap-1.5 text-sm transition-colors whitespace-nowrap',
          canUploadMore && !disabled
            ? 'text-gray-400 hover:text-accent-400'
            : 'text-gray-600 cursor-not-allowed'
        )}
      >
        <FiPaperclip className='w-4 h-4 flex-shrink-0' />
        <span className='lg:hidden'>Add files</span>
        <span className='hidden lg:inline'>Paste, drop, or click to add files</span>
      </button>
      {maxFiles > 0 && totalFiles > 0 && (
        <span className='text-xs text-gray-500'>
          {totalFiles}/{maxFiles}
        </span>
      )}
    </div>
  )
}

const TextAreaWithUpload = forwardRef(function TextAreaWithUpload (props, ref) {
  const {
    onDocumentsChange,
    documents = [],
    maxFiles = 3,
    placeholder = 'Add your comment here...',
    maxLength = 250,
    minLength,
    required = false,
    value,
    onChange,
    disabled = false,
    label,
    rows,
    className,
    children,
    ...rest
  } = props

  const containerRef = useRef(null)
  const uploady = useUploady()
  const [isDragging, setIsDragging] = useState(false)
  const [previews, setPreviews] = useState([])
  const [uploadedIds, setUploadedIds] = useState(documents)
  const [progress, setProgress] = useState({})
  const [errors, setErrors] = useState({})
  const dragCounter = useRef(0)

  // Sync with external documents prop (e.g., when form is reset)
  useEffect(() => {
    if (documents.length === 0 && uploadedIds.length > 0) {
      setUploadedIds([])
      setPreviews([])
      setProgress({})
      setErrors({})
    }
  }, [documents])

  usePasteUpload(containerRef)

  useBatchAddListener((batch) => {
    const newPreviews = batch.items.map(item => ({
      id: item.id,
      url: URL.createObjectURL(item.file),
      name: item.file.name
    }))
    setPreviews(prev => [...prev, ...newPreviews])
  })

  useItemProgressListener((item) => {
    setProgress(prev => ({ ...prev, [item.id]: item.completed }))
  })

  useItemFinishListener((item) => {
    if (item.uploadResponse?.data?.id) {
      const docId = item.uploadResponse.data.id
      setUploadedIds(prev => {
        const newIds = [...prev, docId]
        onDocumentsChange(newIds)
        return newIds
      })
      setPreviews(prev => {
        const removed = prev.find(p => p.id === item.id)
        if (removed?.url) URL.revokeObjectURL(removed.url)
        return prev.filter(p => p.id !== item.id)
      })
      setProgress(prev => {
        const { [item.id]: _, ...rest } = prev
        return rest
      })
    }
  })

  useItemErrorListener((item) => {
    let errorMessage = 'Upload failed'
    try {
      const response = item.uploadResponse?.data
      if (response?.error) {
        errorMessage = response.error
      }
    } catch (e) {
      // Use default error message
    }
    setErrors(prev => ({ ...prev, [item.id]: errorMessage }))
  })

  const handleRemovePreview = useCallback((previewId) => {
    setPreviews(prev => {
      const removed = prev.find(p => p.id === previewId)
      if (removed?.url) URL.revokeObjectURL(removed.url)
      return prev.filter(p => p.id !== previewId)
    })
    setProgress(prev => {
      const { [previewId]: _, ...rest } = prev
      return rest
    })
    setErrors(prev => {
      const { [previewId]: _, ...rest } = prev
      return rest
    })
  }, [])

  const handleRemoveUploaded = useCallback((docId) => {
    setUploadedIds(prev => {
      const newIds = prev.filter(id => id !== docId)
      onDocumentsChange(newIds)
      return newIds
    })
  }, [onDocumentsChange])

  const handleAttachClick = useCallback(() => {
    if (uploady) {
      uploady.showFileUpload()
    }
  }, [uploady])

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && uploady) {
      uploady.upload(files)
    }
  }, [uploady])

  const totalFiles = previews.length + uploadedIds.length

  const contextValue = {
    onAttach: handleAttachClick,
    totalFiles,
    maxFiles
  }

  return (
    <UploadContext.Provider value={contextValue}>
      <div ref={containerRef} className={clsx('w-full', className)}>
        {label && (
          <label className='block text-sm font-medium text-gray-300 mb-2'>
            {label}
          </label>
        )}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={clsx(
            'relative rounded-3xl transition-all bg-primary-900',
            isDragging && 'ring-2 ring-accent-500 bg-accent-500/10'
          )}
        >
          <textarea
            ref={ref}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            minLength={minLength}
            required={required}
            disabled={disabled}
            rows={rows}
            className={clsx(
              'w-full py-2.5 px-4 bg-transparent text-gray-300 placeholder-gray-400',
              'text-lg focus:outline-none resize-none min-h-[80px]',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            {...rest}
          />

          {/* File chips inside the comment box */}
          {totalFiles > 0 && (
            <div className='flex flex-wrap gap-2 px-3 pb-3'>
              {uploadedIds.map((docId, idx) => (
                <FileChip
                  key={docId}
                  id={docId}
                  url={`${process.env.BASE_PATH || ''}/api/documents/${docId}`}
                  name={`Image ${idx + 1}`}
                  onRemove={handleRemoveUploaded}
                />
              ))}
              {previews.map(preview => (
                <FileChip
                  key={preview.id}
                  {...preview}
                  onRemove={handleRemovePreview}
                  progress={progress[preview.id]}
                  error={errors[preview.id]}
                />
              ))}
            </div>
          )}

          {isDragging && (
            <div className='absolute inset-0 flex items-center justify-center bg-accent-500/20 rounded-3xl pointer-events-none'>
              <span className='text-accent-400 font-medium'>Drop images here</span>
            </div>
          )}
        </div>

        {/* Error message display */}
        {Object.keys(errors).length > 0 && (
          <div className='mt-2 px-2 text-sm text-red-400'>
            {Object.values(errors)[0]}
          </div>
        )}

        {/* Render children (typically the action row) */}
        {children}
      </div>
    </UploadContext.Provider>
  )
})

const CommentWithUpload = forwardRef(function CommentWithUpload (props, ref) {
  const { onDocumentsChange, documents = [], maxFiles = 3, children, ...textAreaProps } = props

  return (
    <Uploady
      destination={{
        url: `${process.env.BASE_PATH || ''}/api/upload`,
        withCredentials: true
      }}
      accept='image/*'
      multiple
      maxConcurrent={2}
      fileFilter={(file) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        return allowedTypes.includes(file.type)
      }}
    >
      <TextAreaWithUpload
        ref={ref}
        onDocumentsChange={onDocumentsChange}
        documents={documents}
        maxFiles={maxFiles}
        {...textAreaProps}
      >
        {children}
      </TextAreaWithUpload>
    </Uploady>
  )
})

export default CommentWithUpload
