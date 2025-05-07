import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface PopupModalProps {
  url: string;
  width: number;
  height: number;
  title: string;
  onClose: () => void;
}

export default function PopupModal({ url, width, height, title, onClose }: PopupModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener("keydown", handleEsc);
    document.addEventListener("mousedown", handleClickOutside);
    
    // Prevent scrolling of the background
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg overflow-hidden max-w-[95vw] max-h-[90vh]"
        style={{ width: `${width}px`, maxWidth: "100%" }}
      >
        <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
          <h4 className="text-sm font-medium text-white">{title}</h4>
          <button
            type="button"
            className="text-slate-400 hover:text-white focus:outline-none"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div 
          className="bg-slate-50"
          style={{ height: `${height}px`, maxHeight: "calc(90vh - 40px)" }}
        >
          {url ? (
            <iframe
              src={url}
              title={title}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-center p-4 text-slate-500">
              <div>
                <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-slate-200 mb-3">
                  <X className="h-6 w-6 text-slate-500" />
                </div>
                <p>No URL provided or URL is invalid.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
