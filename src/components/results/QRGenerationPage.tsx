import { X, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "../ui/button";
import type { Statement } from "../../types";

const baseImageUrl = "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/qr-keys";

interface QRGenerationPageProps {
  statement: Statement;
  onClose: () => void;
}

export function QRGenerationPage({ statement, onClose }: QRGenerationPageProps) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const roomId = statement.roomId;

  const voteOptions = [
    { vote: "agree", label: "Agree", color: "bg-green-500", suffix: "a" },
    { vote: "pass", label: "Unsure", color: "bg-gray-500", suffix: "u" },
    { vote: "disagree", label: "Disagree", color: "bg-red-500", suffix: "d" },
  ] as const;

  const getFlyerUrl = (vote: string) => {
    return `${baseUrl}/flyer/${roomId}/${statement.id}/${vote}`;
  };

  const getImagePath = (rowIndex: number, suffix: string) => {
    return `${baseImageUrl}/${rowIndex + 1}${suffix}.png`;
  };

  const downloadQRCode = (rowIndex: number, vote: string, suffix: string) => {
    const svg = document.getElementById(`qr-${rowIndex}-${vote}`);
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 180;
    canvas.height = 180;

    const svgClone = svg.cloneNode(true) as SVGElement;
    const imageElements = svgClone.querySelectorAll('image');
    imageElements.forEach(img => img.remove());

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const qrImg = new Image();
    qrImg.crossOrigin = "anonymous";

    qrImg.onload = () => {
      ctx.drawImage(qrImg, 0, 0, 180, 180);
      
      const overlayImg = new Image();
      overlayImg.crossOrigin = "anonymous";
      
      overlayImg.onload = () => {
        const overlayWidth = 40;
        const overlayHeight = 25;
        const x = (180 - overlayWidth) / 2;
        const y = (180 - overlayHeight) / 2;
        
        ctx.globalAlpha = 0.5;
        ctx.drawImage(overlayImg, x, y, overlayWidth, overlayHeight);
        ctx.globalAlpha = 1.0;
        
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = pngUrl;
            link.download = `qr-group-${rowIndex + 1}${suffix}.png`;
            link.click();
            URL.revokeObjectURL(pngUrl);
            URL.revokeObjectURL(svgUrl);
          }
        });
      };
      
      overlayImg.src = getImagePath(rowIndex, suffix);
    };

    qrImg.src = svgUrl;
  };

  return (
    <div className="min-h-screen bg-white p-8" style={{position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1000}}>
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4">QR Code Flyer</h1>
            <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
              <p className="text-base leading-relaxed text-gray-900">
                {statement.text}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="ml-4"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="space-y-6">
          {Array.from({ length: 6 }).map((_, rowIndex) => (
            <div key={rowIndex} className="space-y-3">
              <div className="text-xl font-bold text-gray-900">
                Group {rowIndex + 1}
              </div>
              <div className="grid grid-cols-3 gap-6 pb-6 border-b-2 border-gray-200 last:border-b-0">
                {voteOptions.map(({ vote, label, color, suffix }) => {
                  const url = getFlyerUrl(vote);
                  const imagePath = getImagePath(rowIndex, suffix);
                  return (
                    <div
                      key={`${rowIndex}-${vote}`}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className={`${color} text-white px-4 py-2 rounded-lg font-semibold text-lg`}>
                        {label}
                      </div>
                      <div className="bg-white p-4 rounded-lg border-2 border-gray-300">
                        <QRCodeSVG
                          id={`qr-${rowIndex}-${vote}`}
                          value={url}
                          size={180}
                          level="M"
                          imageSettings={{
                            src: imagePath,
                            height: 25,
                            width: 40,
                            opacity: 0.5,
                            excavate: false,
                          }}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadQRCode(rowIndex, vote, suffix)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm">
            Print this page to distribute QR codes for voting
          </p>
        </div>
      </div>
    </div>
  );
}
