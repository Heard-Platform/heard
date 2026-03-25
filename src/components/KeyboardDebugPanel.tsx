interface KeyboardDebugPanelProps {
  show: boolean;
  isKeyboardOpen: boolean;
  viewportHeight: number;
  windowHeight: number;
  ratio: number;
  threshold?: number;
  initialWindowHeight?: number;
}

export function KeyboardDebugPanel({
  show,
  isKeyboardOpen,
  viewportHeight,
  windowHeight,
  ratio,
  threshold = 0.75,
  initialWindowHeight,
}: KeyboardDebugPanelProps) {
  if (!show) return null;

  return (
    <div className="fixed top-20 right-4 z-50 bg-black/90 text-white p-3 rounded-lg text-xs font-mono shadow-lg border border-green-500">
      <div className="font-bold text-green-400 mb-2">⌨️ KEYBOARD DEBUG</div>
      <div className="space-y-1">
        <div>
          <span className="text-gray-400">viewport.height:</span>{" "}
          <span className="text-yellow-300">{viewportHeight.toFixed(0)}</span>
        </div>
        <div>
          <span className="text-gray-400">window.innerHeight:</span>{" "}
          <span className="text-yellow-300">{windowHeight.toFixed(0)}</span>
        </div>
        <div>
          <span className="text-gray-400">ratio:</span>{" "}
          <span className="text-cyan-300">{ratio.toFixed(3)}</span>
        </div>
        <div className="pt-1 border-t border-gray-700 mt-1">
          <span className="text-gray-400">keyboard:</span>{" "}
          <span className={isKeyboardOpen ? "text-red-400 font-bold" : "text-green-400"}>
            {isKeyboardOpen ? "OPEN" : "CLOSED"}
          </span>
        </div>
        <div>
          <span className="text-gray-400">threshold:</span>{" "}
          <span className="text-blue-300">{threshold.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-400">buttons:</span>{" "}
          <span className={!isKeyboardOpen ? "text-green-400" : "text-red-400"}>
            {!isKeyboardOpen ? "VISIBLE" : "HIDDEN"}
          </span>
        </div>
        {initialWindowHeight && (
          <div>
            <span className="text-gray-400">initialWindowHeight:</span>{" "}
            <span className="text-yellow-300">{initialWindowHeight.toFixed(0)}</span>
          </div>
        )}
      </div>
      <div className="pt-1 border-t border-gray-700 mt-1">
        <div className="font-bold text-green-400 mb-2">Local Storage</div>

        <button
          className="w-full text-left text-orange-400 hover:text-orange-300 active:text-orange-200"
          onClick={() => localStorage.removeItem("heard_swipe_count")}
        >
          ↺ reset swipe tutorial
        </button>
      </div>
    </div>
  );
}