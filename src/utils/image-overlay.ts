export function openImageOverlay(url: string) {
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4";
  overlay.onclick = () => overlay.remove();

  const img = document.createElement("img");
  img.src = url;
  img.className = "max-w-full max-h-full object-contain";

  overlay.appendChild(img);
  document.body.appendChild(overlay);
}