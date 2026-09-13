import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedMaxWidth = maxWidth.startsWith('max-w-') ? maxWidth : `max-w-${maxWidth}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`bg-surface border border-theme rounded-2xl w-full ${normalizedMaxWidth} card-shadow p-4 sm:p-6 md:p-7 relative max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-subtle mb-4 sm:mb-5 shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-primary tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-secondary mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-secondary hover:text-primary hover:bg-subtle transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1 -mr-1 overscroll-contain touch-scroll-x">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
