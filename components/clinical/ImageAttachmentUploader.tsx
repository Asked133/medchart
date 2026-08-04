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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-5 space-y-4">
      <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Imágenes adjuntas</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {previews.map((prev, i) => (
          <div key={i} className="relative aspect-square bg-slate-800 rounded-lg border border-slate-700 overflow-hidden group">
            <img src={prev.url} alt={`Adjunto ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute top-2 right-2 bg-slate-900/80 p-1.5 rounded-md text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-900"
              title="Eliminar imagen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-lg hover:border-blue-500 hover:bg-slate-800/50 cursor-pointer transition-colors text-slate-400 hover:text-blue-400">
          <ImagePlus className="w-6 h-6 mb-2" />
          <span className="text-xs font-medium text-center px-2">Añadir foto</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
        </label>
      </div>
      <p className="text-xs text-slate-500">Puedes subir múltiples imágenes. Serán comprimidas automáticamente antes de guardarse.</p>
    </div>
  )
}
