
import React from 'react';
import { XMarkIcon, CodeBracketIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  imageSrc: string | null;
  jsonData: any;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  imageSrc, 
  jsonData 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Result Verification
            </h2>
            <p className="text-xs text-neutral-400 mt-1">Comparing Source Image vs. Extracted {title}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body - Split View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left: Source Image */}
          <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-neutral-800 bg-neutral-900/50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-300 mb-3 uppercase tracking-wider">
              <PhotoIcon className="w-4 h-4" /> Source Image
            </div>
            <div className="flex-1 relative rounded-lg border border-neutral-700 bg-black/50 overflow-hidden flex items-center justify-center">
              {imageSrc ? (
                <img 
                  src={imageSrc} 
                  alt="Source" 
                  className="max-w-full max-h-full object-contain" 
                />
              ) : (
                <div className="text-neutral-500 flex flex-col items-center">
                  <PhotoIcon className="w-12 h-12 opacity-20" />
                  <p className="mt-2 text-sm">No source image connected</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: JSON Result */}
          <div className="flex-1 flex flex-col p-4 bg-neutral-950">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-300 mb-3 uppercase tracking-wider">
              <CodeBracketIcon className="w-4 h-4" /> Extracted Attributes
            </div>
            <div className="flex-1 relative rounded-lg border border-neutral-800 bg-black/30 overflow-hidden">
              <textarea 
                className="absolute inset-0 w-full h-full bg-transparent text-green-400 font-sans text-sm p-4 focus:outline-none resize-none"
                readOnly
                value={JSON.stringify(jsonData, null, 2)}
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-900 text-right">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;
