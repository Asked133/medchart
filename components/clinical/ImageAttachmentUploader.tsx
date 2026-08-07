'use client'
import { useState, useEffect } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'

interface ImageAttachmentUploaderProps {
  images: File[]
  onChange: (images: File[]) => void
}

interface ImagePreview {
  file: File
  url: string
}

export default function ImageAttachmentUploader({ images, onChange }: ImageAttachmentUploaderProps) {
  const [previews, setPreviews] = useState<ImagePreview[]>([])

  useEffect(() => {
    const newPreviews = images.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }))
    setPreviews(newPreviews)

    return () => {
      newPreviews.forEach((p) => URL.revokeObjectURL(p.url))
    }
  }, [images])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const filesArray = Array.from(e.target.files)
    onChange([...images, ...filesArray])
  }

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden p-5 space-y-4 shadow-clinical-sm">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Imágenes adjuntas</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {previews.map((prev, i) => (
          <div key={i} className="relative aspect-square bg-background rounded-lg border border-border-strong overflow-hidden group shadow-clinical-sm">
            <img src={prev.url} alt={`Adjunto ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute top-2 right-2 bg-surface/90 p-1.5 rounded-md text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface border border-border-subtle shadow-clinical-sm"
              title="Eliminar imagen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border-strong rounded-lg hover:border-brand hover:bg-surface-hover cursor-pointer transition-colors text-foreground-muted hover:text-brand-text">
          <ImagePlus className="w-6 h-6 mb-2" />
          <span className="text-xs font-medium text-center px-2">Añadir foto</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
        </label>
      </div>
      <p className="text-xs text-foreground-muted">Puedes subir múltiples imágenes. Serán comprimidas automáticamente antes de guardarse.</p>
    </div>
  )
}
