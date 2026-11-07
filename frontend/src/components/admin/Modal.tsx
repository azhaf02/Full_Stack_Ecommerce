
import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-[2px] animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative my-auto w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-cream-50 p-6 shadow-2xl animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3
            id="modal-title"
            className="text-lg font-semibold tracking-tight text-slate-800"
          >
            {title}
          </h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-cream-200 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
