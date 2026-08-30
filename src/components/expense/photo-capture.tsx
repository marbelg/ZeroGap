"use client";

import { useRef, useState } from "react";

interface PhotoCaptureProps {
  name: string;
  label: string;
  required?: boolean;
}

/**
 * Captura de foto para comprobantes/odómetro. Dos accesos separados
 * (cámara vs galería) porque el atributo `capture` en un solo <input>
 * hace que algunos navegadores móviles abran la cámara directo y oculten
 * la opción de elegir una foto ya guardada.
 */
export function PhotoCapture({ name, label, required }: PhotoCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileValid, setFileValid] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (hiddenInputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      hiddenInputRef.current.files = dt.files;
    }
    setFileValid(true);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    setPreview(null);
    setFileValid(false);
    if (hiddenInputRef.current) hiddenInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-foreground-muted">
        {label}
        {required && <span className="text-danger"> *</span>}
      </p>

      {preview ? (
        <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={label} className="h-48 w-full object-cover" />
          <button
            type="button"
            onClick={clearPhoto}
            className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white"
          >
            Quitar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-border bg-surface-muted text-xs font-medium text-foreground-muted transition-colors hover:border-brand hover:text-brand"
          >
            <CameraIcon />
            Tomar foto
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-border bg-surface-muted text-xs font-medium text-foreground-muted transition-colors hover:border-brand hover:text-brand"
          >
            <GalleryIcon />
            Elegir de galería
          </button>
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {/* Input real que viaja en el FormData del form padre */}
      <input ref={hiddenInputRef} type="file" name={name} className="hidden" required={required && !fileValid} />
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}
