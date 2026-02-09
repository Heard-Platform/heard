export function shouldConvertImage(file: File): boolean {
  const name = file.name.toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop()! : "";

  // Formats we do NOT want to store / rely on
  const convertExtensions = new Set([
    "heic",
    "heif",
    "tif",
    "tiff",
    "bmp",
  ]);

  const convertMimeTypes = new Set([
    "image/heic",
    "image/heif",
    "image/tiff",
    "image/bmp",
  ]);

  // MIME types are unreliable on mobile Safari → extension is primary
  if (convertExtensions.has(ext)) return true;

  // Some browsers give correct MIME, some give ""
  if (file.type && convertMimeTypes.has(file.type)) return true;

  // WEBP: only convert if your system requires JPEG
  if (ext === "webp" || file.type === "image/webp") {
    return true; // ← flip to false if you want to allow WEBP
  }

  return false;
}

type ConvertOptions = {
  /** Max width/height of output JPEG. Lower = safer on mobile. */
  maxDimension?: number; // default 2048
  /** JPEG quality 0..1 */
  quality?: number; // default 0.92
  /** If true, keep original name if it has no extension */
  keepNameIfNoExt?: boolean; // default true
};

export async function convertImageToJPEG(
  file: File,
  opts: ConvertOptions = {}
): Promise<File> {
  const {
    maxDimension = 2048,
    quality = 0.92,
    keepNameIfNoExt = true,
  } = opts;

  const bitmap = await decodeImageToBitmap(file); // best-effort orientation safe
  try {
    const { width, height } = constrain(bitmap.width, bitmap.height, maxDimension);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Failed to get canvas context");

    // Draw with resize
    ctx.drawImage(bitmap as any, 0, 0, width, height);

    // Convert to JPEG blob
    const blob = await canvasToBlob(canvas, "image/jpeg", quality);
    if (!blob) throw new Error("Failed to convert image to JPEG blob");

    const outName = toJpegName(file.name, keepNameIfNoExt);
    return new File([blob], outName, { type: "image/jpeg" });
  } finally {
    // createImageBitmap bitmaps should be closed when possible
    // (not all browsers require/implement it, but safe to try)
    try {
      (bitmap as any).close?.();
    } catch {}
  }
}

function constrain(w: number, h: number, maxDim: number) {
  if (maxDim <= 0) return { width: w, height: h };
  const maxSide = Math.max(w, h);
  if (maxSide <= maxDim) return { width: w, height: h };
  const scale = maxDim / maxSide;
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  };
}

async function decodeImageToBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // 1) Best path: createImageBitmap with imageOrientation: "from-image"
  // Works in many modern browsers; if unsupported, throws.
  try {
    // Some browsers accept the second arg; some don’t → wrap in try/catch.
    const bmp = await createImageBitmap(file, {
      imageOrientation: "from-image",
      premultiplyAlpha: "none",
      colorSpaceConversion: "default",
    } as any);
    return bmp;
  } catch {
    // 2) Fallback: HTMLImageElement decode (may ignore EXIF orientation)
    // Still works broadly; for full EXIF rotation on all browsers, use exifr (see note below).
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Important for some Safari cases
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode image (unsupported format?)"));
    img.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  // toBlob is supported in modern browsers; fallback via dataURL for older ones.
  if (canvas.toBlob) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  }
  try {
    const dataUrl = canvas.toDataURL(type, quality);
    const blob = dataURLToBlob(dataUrl);
    return Promise.resolve(blob);
  } catch {
    return Promise.resolve(null);
  }
}

function dataURLToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(",");
  const mime = /data:([^;]+);/i.exec(header)?.[1] ?? "application/octet-stream";
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function toJpegName(name: string, keepNameIfNoExt: boolean) {
  // If there’s an extension, replace it. If not, append .jpg (or keep).
  const hasExt = /\.[^/.]+$/.test(name);
  if (!hasExt) return keepNameIfNoExt ? `${name}.jpg` : "image.jpg";
  return name.replace(/\.[^/.]+$/, ".jpg");
}