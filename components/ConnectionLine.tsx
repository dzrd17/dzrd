import React from 'react';

interface ConnectionLineProps {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isActive?: boolean;
  onDelete?: (id: string) => void;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ id, startX, startY, endX, endY, isActive, onDelete }) => {
  // Calculate Control Points for Bezier Curve
  const dist = Math.abs(endX - startX);
  const cp1X = startX + dist * 0.5;
  const cp1Y = startY;
  const cp2X = endX - dist * 0.5;
  const cp2Y = endY;

  const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

  // Calculate midpoint (t=0.5) of the Cubic Bezier for the delete button
  // Formula: B(t) = (1-t)^3*P0 + 3(1-t)^2*t*P1 + 3(1-t)*t^2*P2 + t^3*P3
  const t = 0.5;
  const midX = Math.pow(1 - t, 3) * startX + 
               3 * Math.pow(1 - t, 2) * t * cp1X + 
               3 * (1 - t) * Math.pow(t, 2) * cp2X + 
               Math.pow(t, 3) * endX;
  const midY = Math.pow(1 - t, 3) * startY + 
               3 * Math.pow(1 - t, 2) * t * cp1Y + 
               3 * (1 - t) * Math.pow(t, 2) * cp2Y + 
               Math.pow(t, 3) * endY;

  return (
    <g className="group">
      {/* Invisible thicker path to make hovering easier */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="15"
        fill="none"
        className="pointer-events-auto cursor-pointer"
      />
      
      {/* Shadow/Outline */}
      <path
        d={pathData}
        stroke="#000"
        strokeWidth="5"
        fill="none"
        opacity="0.3"
      />
      
      {/* Main Line */}
      <path
        d={pathData}
        stroke={isActive ? "#e2e8f0" : "#64748b"}
        strokeWidth="2"
        fill="none"
        className="transition-colors duration-300 group-hover:stroke-neutral-300"
      />
      
      {/* Animated Dash if Active (Processing) */}
      {isActive && (
        <path
           d={pathData}
           stroke="#4ade80"
           strokeWidth="2"
           fill="none"
           strokeDasharray="10,10"
           className="animate-pulse"
        />
      )}

      {/* Delete Button (Visible on Hover) */}
      {onDelete && (
        <g 
          transform={`translate(${midX}, ${midY})`} 
          className="pointer-events-auto cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
        >
          <circle r="8" fill="#171717" stroke="#ef4444" strokeWidth="1" />
          <path 
            d="M -3 -3 L 3 3 M 3 -3 L -3 3" 
            stroke="#ef4444" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
          />
        </g>
      )}
    </g>
  );
};

export default ConnectionLine;