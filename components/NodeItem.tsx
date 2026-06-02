
import React, { useRef, useState, useLayoutEffect } from 'react';
import { Node, NODE_CONFIG, PortOffsets } from '../types';
import { 
  XMarkIcon, 
  PhotoIcon, 
  ArrowPathIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  EyeIcon,
  PencilSquareIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface NodeItemProps {
  node: Node;
  isSelected?: boolean;
  isDragging?: boolean; // New prop for drag state
  onDelete: (id: string) => void;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  onConnectionStart: (e: React.PointerEvent, nodeId: string, type: 'input' | 'output') => void;
  onConnectionEnd: (e: React.PointerEvent, nodeId: string, type: 'input' | 'output') => void;
  onImageUpload: (id: string, file: File) => void;
  onTextChange: (id: string, text: string) => void;
  onWeightChange: (id: string, weight: number) => void;
  onPortsUpdate: (id: string, offsets: PortOffsets) => void;
  onPreview: (id: string) => void;
  onInteractionStart?: () => void;
}

const PRESET_OPTIONS = [
  { label: 'Coherent lighting (일관된 조명)', value: 'Coherent lighting' },
  { label: 'Seamless blend (매끄러운 혼합)', value: 'Seamless blend' },
  { label: 'Natural transition (자연스러운 전환)', value: 'Natural transition' },
  { label: 'Unified tone and texture (통일된 톤과 질감)', value: 'Unified tone and texture' },
  { label: 'Texture enhanced in Lightroom', value: 'Texture enhanced in Lightroom' },
  { label: 'Photorealistic DSLR (35mm, ISO 200)', value: 'Photorealistic, Full-frame DSLR using 35mm lens, ISO 200' },
  { label: 'Clean, modern composition', value: 'overall composition clean, modern, and uncluttered' },
  { label: 'Behance-grade aesthetic', value: 'premium Behance-grade mixed reality aesthetic showing structure clarity without overcrowding the image' },
  { label: 'Korean People (Motion Blur)', value: 'low-density Photorealistic people, korean, motion blurred' },
];

const NodeItem: React.FC<NodeItemProps> = ({ 
  node, 
  isSelected,
  isDragging,
  onDelete, 
  onPointerDown, 
  onConnectionStart, 
  onConnectionEnd,
  onImageUpload,
  onTextChange,
  onWeightChange,
  onPortsUpdate,
  onPreview,
  onInteractionStart
}) => {
  const config = NODE_CONFIG[node.type];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputPortRef = useRef<HTMLDivElement>(null);
  const outputPortRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Measure ports logic
  useLayoutEffect(() => {
    const measurePorts = () => {
      if (!rootRef.current) return;
      
      const offsets: PortOffsets = {};
      
      if (inputPortRef.current) {
        offsets.input = {
          x: inputPortRef.current.offsetLeft + inputPortRef.current.offsetWidth / 2,
          y: inputPortRef.current.offsetTop + inputPortRef.current.offsetHeight / 2
        };
      }
      
      if (outputPortRef.current) {
        offsets.output = {
          x: outputPortRef.current.offsetLeft + outputPortRef.current.offsetWidth / 2,
          y: outputPortRef.current.offsetTop + outputPortRef.current.offsetHeight / 2
        };
      }

      // Only update if changed (basic comparison)
      const currentInput = node.portOffsets?.input;
      const currentOutput = node.portOffsets?.output;
      
      const inputChanged = JSON.stringify(currentInput) !== JSON.stringify(offsets.input);
      const outputChanged = JSON.stringify(currentOutput) !== JSON.stringify(offsets.output);

      if (inputChanged || outputChanged) {
        onPortsUpdate(node.id, offsets);
      }
    };

    measurePorts();

    // Observe size changes
    const resizeObserver = new ResizeObserver(() => {
      measurePorts();
    });
    
    resizeObserver.observe(rootRef.current);
    
    return () => resizeObserver.disconnect();
  }, [node.id, node.data.result, node.data.image, node.portOffsets, onPortsUpdate]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(node.id, e.target.files[0]);
    }
  };

  const stopPropagation = (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
  };

  // --- Drag & Drop Handlers ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageUpload(node.id, file);
      }
    }
  };

  // --- Paste Handler ---
  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.items) {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            onImageUpload(node.id, file);
            e.preventDefault();
            break; 
          }
        }
      }
    }
  };

  const handlePresetChange = (value: string, checked: boolean) => {
    // Treat preset toggle as an interaction start to save history
    onInteractionStart?.();
    
    const currentText = node.data.textValue || '';
    let items = currentText.split(',').map(s => s.trim()).filter(s => s !== '');
    
    if (checked) {
      if (!items.includes(value)) items.push(value);
    } else {
      items = items.filter(i => i !== value);
    }
    
    onTextChange(node.id, items.join(', '));
  };

  const isSource = node.type === 'image_source';
  const isTextSource = node.type === 'custom_negative' || node.type === 'custom_text';
  const isPreset = node.type === 'custom_preset';
  const hasResult = !!node.data.result;

  const currentWeight = node.data.weight || 1.0;
  const currentPresets = (node.data.textValue || '').split(',').map(s => s.trim());

  // Dynamic Styles Calculation
  // Glassmorphism base
  const baseClasses = "absolute rounded-xl w-64 flex flex-col border backdrop-blur-md";
  
  // Selection Styles
  const selectionClasses = isSelected 
    ? 'border-white/40 ring-2 ring-white/10 bg-neutral-900/90' 
    : 'border-white/5 bg-neutral-900/70 hover:border-white/20';

  // Dragging Styles
  const dragClasses = isDragging
    ? 'z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-grabbing scale-105 transition-none'
    : 'z-10 shadow-xl hover:shadow-2xl cursor-grab transition-all duration-200 ease-out hover:scale-[1.02]';

  return (
    <div
      ref={rootRef}
      className={`${baseClasses} ${selectionClasses} ${dragClasses}`}
      style={{
        left: node.x,
        top: node.y,
        touchAction: 'none',
      }}
      onPointerDown={(e) => onPointerDown(e, node.id)}
    >
      {/* Header */}
      <div className={`flex justify-between items-center px-4 py-2 border-b border-white/5 bg-white/5 rounded-t-xl`}>
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${config.color.replace('border-', 'bg-')} shadow-[0_0_8px_currentColor]`}></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-200 pointer-events-none select-none truncate max-w-[140px]" title={config.title}>
            {config.title.split('(')[0]}
            </span>
        </div>
        
        <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
          {/* Preview Button */}
          {!isSource && !isTextSource && !isPreset && hasResult && (
            <button 
              onPointerDown={stopPropagation}
              onClick={() => onPreview(node.id)}
              className="text-neutral-400 hover:text-white p-1 hover:bg-white/10 rounded"
              title="Verify Result"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
          )}

          <button 
            onPointerDown={stopPropagation}
            onClick={() => onDelete(node.id)}
            className="text-neutral-500 hover:text-red-400 p-1 hover:bg-white/10 rounded"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 text-sm min-h-[60px] flex flex-col gap-3 relative pointer-events-none">
        
        {/* Case 1: Image Source Node UI */}
        {isSource && (
          <div className="flex flex-col gap-2 pointer-events-auto">
            <div 
              className={`relative w-full h-32 bg-black/40 rounded-lg border flex items-center justify-center overflow-hidden group transition-all outline-none focus:ring-2 focus:ring-blue-500/50 ${isDragOver ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onPaste={handlePaste}
              tabIndex={0} 
            >
              {node.data.image ? (
                <>
                  <img src={node.data.image} alt="Source" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div 
                    className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="text-xs text-white font-bold tracking-wide">REPLACE IMAGE</span>
                    <span className="text-[10px] text-neutral-400 mt-1">Drop or Paste (Ctrl+V)</span>
                  </div>
                </>
              ) : (
                <div 
                    className="text-neutral-500 flex flex-col items-center cursor-pointer hover:text-neutral-300 transition-colors p-4 text-center"
                    onClick={() => fileInputRef.current?.click()}
                >
                  <PhotoIcon className="w-8 h-8 mb-2" />
                  <span className="text-xs font-bold tracking-wide">UPLOAD</span>
                  <span className="text-[10px] text-neutral-600 mt-1">Drag & Drop</span>
                </div>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <div className="text-[9px] text-neutral-600 uppercase tracking-widest text-right mt-1">
              Image Output
            </div>
          </div>
        )}

        {/* Case 2: Manual Text Node (Negative / Override) */}
        {isTextSource && (
           <div className="flex flex-col gap-2 pointer-events-auto">
             <div className="relative w-full">
               <textarea
                 className="w-full h-32 bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-neutral-300 focus:outline-none focus:border-white/30 resize-none custom-scrollbar font-sans leading-relaxed"
                 placeholder={node.type === 'custom_negative' ? "Enter elements to exclude..." : "Enter critical instructions..."}
                 value={node.data.textValue || ''}
                 onChange={(e) => onTextChange(node.id, e.target.value)}
                 onFocus={() => onInteractionStart?.()} // Trigger history save on focus
                 onPointerDown={stopPropagation} // Allow text selection
               />
               <div className="absolute bottom-2 right-2 pointer-events-none opacity-30">
                 <PencilSquareIcon className="w-3 h-3 text-white" />
               </div>
             </div>
           </div>
        )}

        {/* Case 3: Custom Presets (Checkboxes) */}
        {isPreset && (
          <div className="flex flex-col gap-1.5 pointer-events-auto bg-black/40 p-2 rounded-lg border border-white/10 max-h-60 overflow-y-auto custom-scrollbar">
             {PRESET_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-start gap-2 cursor-pointer group p-1.5 hover:bg-white/5 rounded transition-colors">
                  <input 
                    type="checkbox" 
                    className="mt-0.5 appearance-none w-3.5 h-3.5 border border-neutral-600 rounded bg-neutral-900 checked:bg-lime-500 checked:border-lime-500 focus:outline-none transition-colors flex-shrink-0"
                    checked={currentPresets.includes(option.value)}
                    onChange={(e) => handlePresetChange(option.value, e.target.checked)}
                    onPointerDown={stopPropagation}
                  />
                  <span className="text-[11px] text-neutral-400 group-hover:text-neutral-200 leading-tight select-none">
                    {option.label}
                  </span>
                </label>
             ))}
          </div>
        )}

        {/* Case 4: AI Attribute Node UI */}
        {!isSource && !isTextSource && !isPreset && (
          <div className="pointer-events-auto w-full">
            <div className="mb-2 text-[9px] text-neutral-600 uppercase tracking-widest">
              Input
            </div>

            {node.data.isLoading ? (
              <div className="flex items-center gap-3 text-yellow-500 animate-pulse bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10">
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span className="text-xs font-medium tracking-wide">PROCESSING...</span>
              </div>
            ) : node.data.error ? (
              <div className="text-red-400 text-xs flex gap-2 items-start bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                 <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                 <span>{node.data.error}</span>
              </div>
            ) : node.data.result ? (
               <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-2 text-green-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                    <CheckCircleIcon className="w-3 h-3" />
                    <span>Extracted</span>
                 </div>
                 <div className="text-[10px] font-sans text-neutral-400 bg-black/40 p-3 rounded-lg border border-white/5 max-h-32 overflow-y-auto custom-scrollbar">
                    {Object.entries(node.data.result).map(([key, value]) => (
                        <div key={key} className="mb-1 last:mb-0">
                            <span className="text-fuchsia-400 opacity-80">{key}:</span> <span className="text-neutral-300">{typeof value === 'object' ? '...' : String(value).slice(0, 60) + (String(value).length > 60 ? '...' : '')}</span>
                        </div>
                    ))}
                 </div>
               </div>
            ) : (
              <div className="text-neutral-700 italic text-[10px] py-4 text-center border border-dashed border-white/5 rounded-lg">
                Waiting for connection...
              </div>
            )}
          </div>
        )}

        {/* Weight Slider */}
        {!isSource && (
          <div className="pointer-events-auto border-t border-white/5 pt-3 mt-1">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5 text-[9px] text-neutral-500 uppercase tracking-widest font-bold">
                  <AdjustmentsHorizontalIcon className="w-3 h-3" />
                  Strength
                </div>
                <span className={`text-[10px] font-sans font-bold ${currentWeight === 1 ? 'text-neutral-500' : 'text-blue-400'}`}>
                  {currentWeight.toFixed(1)}x
                </span>
             </div>
             <input 
               type="range" 
               min="0.1" 
               max="2.0" 
               step="0.1" 
               value={currentWeight}
               onChange={(e) => onWeightChange(node.id, parseFloat(e.target.value))}
               onPointerDown={(e) => { stopPropagation(e); onInteractionStart?.(); }} // Save history on drag start
               className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
             />
          </div>
        )}
      </div>

      {/* Connection Points (Ports) */}
      
      {/* Input Port (Left) */}
      {!isSource && !isTextSource && !isPreset && (
        <div 
          ref={inputPortRef}
          className="absolute -left-2.5 top-[60px] w-5 h-5 flex items-center justify-center pointer-events-auto z-20 group/port"
          onPointerDown={(e) => { stopPropagation(e); onConnectionStart(e, node.id, 'input'); }}
          onPointerUp={(e) => { stopPropagation(e); onConnectionEnd(e, node.id, 'input'); }}
        >
          <div className="w-2.5 h-2.5 bg-neutral-600 rounded-full group-hover/port:bg-white group-hover/port:scale-125 transition-all shadow-[0_0_5px_rgba(0,0,0,0.5)] cursor-crosshair border border-black" title="Input"></div>
        </div>
      )}

      {/* Output Port (Right) */}
      {(isSource || isTextSource || isPreset) && (
        <div 
          ref={outputPortRef}
          className="absolute -right-2.5 bottom-8 w-5 h-5 flex items-center justify-center pointer-events-auto z-20 group/port"
          onPointerDown={(e) => { stopPropagation(e); onConnectionStart(e, node.id, 'output'); }}
          onPointerUp={(e) => { stopPropagation(e); onConnectionEnd(e, node.id, 'output'); }}
        >
          <div className="w-2.5 h-2.5 bg-neutral-600 rounded-full group-hover/port:bg-white group-hover/port:scale-125 transition-all shadow-[0_0_5px_rgba(0,0,0,0.5)] cursor-crosshair border border-black" title="Output"></div>
        </div>
      )}
    </div>
  );
};

export default NodeItem;