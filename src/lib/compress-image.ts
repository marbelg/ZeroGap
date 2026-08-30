// Solo para el navegador (usa Canvas/createImageBitmap) — reduce el peso de
// las fotos de comprobantes/odómetro antes de subirlas a Storage. Una foto
// de cámara de celular puede pesar varios MB; comprimida a ~1600px de lado
// mayor sigue siendo perfectamente legible y ocupa una fracción del espacio.
export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.82,
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) return file;

    // Si por alguna razón la "compresión" salió más pesada (fotos ya muy
    // livianas), mejor quedarse con el archivo original.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    // Si algo falla (formato raro, navegador viejo), se sube el original
    // sin comprimir en vez de bloquear el envío.
    return file;
  }
}
