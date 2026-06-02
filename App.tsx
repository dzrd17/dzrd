
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  Node, 
  Connection, 
  NodeType, 
  NodeData, 
  NODE_CONFIG,
  DragState,
  ConnectionDragState,
  PortOffsets
} from './types';
import NodeItem from './components/NodeItem';
import ConnectionLine from './components/ConnectionLine';
import ComparisonModal from './components/ComparisonModal';
import { analyzeImageAttribute } from './services/geminiService';
import { 
  PlusIcon, 
  CodeBracketIcon, 
  DocumentDuplicateIcon,
  TrashIcon,
  InformationCircleIcon,
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars3BottomRightIcon,
  ArrowsUpDownIcon,
  ArrowsRightLeftIcon,
  KeyIcon,
  CpuChipIcon,
  SparklesIcon,
  CircleStackIcon,
  TicketIcon,
  PlayIcon,
  BoltIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon
} from '@heroicons/react/24/outline';

const CURRENT_MODEL = 'gemini-3-flash-preview';

const LANDING_JSON_DATA = {
  "subject": "A clustered architectural ensemble of large-scale pavilions featuring sweeping, snow-white vaulted roofs and vertical timber-slatted facades, situated in a wintry landscape.",
  "geometry": "The massing is characterized by a series of nested and overlapping curvilinear shell structures. The primary form language is organic and fluid, utilizing doubly-curved vaulted geometries that resemble undulating landforms or petals. These large-span roof volumes transition into rectilinear base components defined by fine-grained vertical rhythms. The composition relies on a rhythmic hierarchy of varying heights and scales, creating a sculptural silhouette that integrates with the surrounding mountainous topography through its repetitive, soft-edged geometric motifs.",
  "camera": {
    "view": "Elevated Eye-Level",
    "lens": "85mm Telephoto with Tilt-Shift for vertical correction and perspective compression",
    "composition": "Rule of thirds with layered planes (foreground river, midground architecture, background mountains) and a centered architectural cluster"
  },
  "materials": {
    "facade": "Vertical timber batten cladding with a desaturated, weathered grey-brown diffuse color. High roughness (approx. 0.85) to achieve a matte, non-reflective wood finish. The normal map requires distinct vertical displacement or high-frequency grooves to simulate the individual slats and natural wood grain porosity.",
    "glazing": "Large-scale curved panels with high specularity and low roughness (0.05-0.1) for sharp, mirror-like reflections of the ambient sunset. The diffuse color is a neutral light grey with high transparency. Reflection utilizes a standard Fresnel IOR of 1.52, while the normal map is largely flat to maintain clean architectural lines.",
    "pavement": "A composite of packed snow and frozen river surfaces. The snow diffuse is high-value white with high roughness (0.7) and subtle subsurface scattering. The water/ice sections feature low roughness (0.1) and high reflectivity. The normal map includes soft, macro-scale undulations for the snow banks and micro-ripples for the water surface."
  },
  "indoor_lighting": {
    "fixtures": "Interior high-bay pendants, recessed linear LEDs, exterior landscape spotlights, and low-level pathway bollards",
    "indirect_light": "Diffused internal wash visible through windows suggests ceiling-integrated cove lighting or indirect uplighting against structural timber walls",
    "color_temp": "3000K Warm White",
    "shadows": "Soft and elongated, dominated by low-angle golden hour natural light, with subtle localized shadows created by small-scale ground-level fixtures"
  },
  "light_direction": {
    "primary_source": "Low-angle backlighting from the horizon, positioned behind the distant mountain range.",
    "shadows": "Long, elongated, and soft-edged, extending towards the foreground and camera position, with deep occlusion in the crevices of the terrain.",
    "highlights": "Rim lighting along the top edges of the curved roof structures and warm, golden specular reflections on the surface of the frozen river and snow."
  },
  "entourage": {
    "people": "Small, scattered human silhouettes or low-poly 3D figures placed at the building's ground level to provide a sense of scale; they appear as distant pedestrians or visitors integrated subtly into the park-like landscape.",
    "vegetation": "Dense clusters of snow-covered coniferous evergreens (resembling spruce or pine) mixed with frosted, leafless deciduous trees. Foreground banks feature delicate, ice-laden shrubs and dry winter grasses emerging from the snow.",
    "props": "Warm landscape lighting and glowing bollards along the paths near the structure bases; small wooden pavilion-style huts or rest areas tucked within the tree line."
  },
  "soft_goods": {
    "curtains": "Not visible; the image is an exterior architectural rendering where interior window treatments are obscured by distance and glass reflections.",
    "rug": "Not applicable; ground surfaces consist of snow-covered pavement and natural terrain with no textiles present.",
    "upholstery": "None visible; the scale of this urban-level visualization does not depict furniture or interior fabric details."
  },
  "joinery_details": {
    "wall_finish": "The exterior facade features geometric perforated screens and layered architectural concrete panels with a smooth, matte finish. The design favors minimalist monolithic volumes over traditional interior wainscoting or molding.",
    "flooring": "The plaza area utilizes large-format rectangular stone pavers arranged in a standard grid pattern; no intricate interior wood patterns such as Herringbone or Chevron are visible from this aerial exterior perspective.",
    "hardware": "Hardware is not visible at this scale; however, the contemporary civic architectural style typically employs minimalist brushed stainless steel or matte black industrial-grade fixtures."
  },
  "decor": {
    "props": "The exterior set features small pedestrian figures to suggest human activity and scale, subtle architectural lighting fixtures, and textured, patterned facade panels that serve as primary art objects.",
    "greenery": "Clusters of frost-covered deciduous trees (likely Zelkova or Maple species) and dense perimeter evergreens typical of Korean urban landscaping.",
    "vibe": "A serene, monumental, and cold civic atmosphere that emphasizes minimalist geometry and quiet urban integration."
  },
  "post_processing": {
    "color_grading": "Warm, golden-hour aesthetic featuring soft amber highlights and desaturated, cool-toned shadows. The overall mood is serene and ethereal, characteristic of high-end architectural visualizations.",
    "contrast": "Low to medium contrast with significantly lifted black points and a soft highlight roll-off. This creates a hazy, cinematic dynamic range that preserves detail across the snowy foreground and misty background.",
    "effects": "Prominent bloom and light diffusion around the curved roof edges and the horizon. Strong atmospheric haze is used to simulate mist, enhancing depth. No apparent chromatic aberration or sharp glare, maintaining a clean digital finish."
  },
  "atmosphere": {
    "sky": "Soft golden hour HDRI with a warm, hazy gradient of pale orange and muted yellow, suggesting a sunrise or sunset in a cold environment.",
    "lighting": "Low-angle diffused sunlight coming from behind the camera or slightly to the side, creating soft highlights on the convex roofs and a warm glow on the water; shadows are soft and long, typical of a diffused light source at low elevation.",
    "weather": "Winter morning conditions with significant low-lying mist and ground-level fog surrounding the buildings and distant mountains; high atmospheric perspective provides a sense of depth and scale. Surfaces are covered in a layer of dry snow, and the water body exhibits a calm, reflective surface characteristic of freezing or slushy conditions."
  }
};

function App() {
  // --- API Key & App Flow State ---
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isAppStarted, setIsAppStarted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // --- Graph State ---
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  
  // --- History State ---
  const [history, setHistory] = useState<{nodes: Node[], connections: Connection[]}[]>([]);
  const [future, setFuture] = useState<{nodes: Node[], connections: Connection[]}[]>([]);
  const dragStartHistorySnapshot = useRef<{nodes: Node[], connections: Connection[]} | null>(null);
  
  // Selection State
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currX: number; currY: number; isActive: boolean } | null>(null);

  // Viewport & Pan/Zoom State
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 }); // Screen coords at start of pan

  // Dragging Nodes
  const [dragState, setDragState] = useState<DragState & { nodeId: string | null }>({
    isDragging: false,
    nodeId: null,
    startX: 0,
    startY: 0,
    initialPositions: {}
  });

  // Dragging Connections
  const [connectionDrag, setConnectionDrag] = useState<ConnectionDragState>({
    isDragging: false,
    fromNodeId: null,
    currX: 0,
    currY: 0
  });

  const rafRef = useRef<number | null>(null);

  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    imageSrc: string | null;
    jsonData: any;
  }>({
    isOpen: false,
    title: '',
    imageSrc: null,
    jsonData: null
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const nextConnId = useRef(1);
  const nextGroupId = useRef(1);

  // --- History Management ---
  const saveHistory = useCallback(() => {
    setHistory(prev => [...prev, { nodes, connections }]);
    setFuture([]);
  }, [nodes, connections]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    setFuture(prev => [{ nodes, connections }, ...prev]);
    setHistory(newHistory);
    setNodes(previous.nodes);
    setConnections(previous.connections);
  }, [history, nodes, connections]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    setHistory(prev => [...prev, { nodes, connections }]);
    setFuture(newFuture);
    setNodes(next.nodes);
    setConnections(next.connections);
  }, [future, nodes, connections]);

  // --- API Key Check ---
  useEffect(() => {
    const checkApiKey = async () => {
      // @ts-ignore
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        // Fallback for environment where aistudio is not injected (e.g. testing)
        // If ENV is present, we consider it connected, otherwise false.
        setHasApiKey(!!process.env.API_KEY);
      }
    };
    checkApiKey();
  }, []);

  const handleStartApp = async () => {
    if (hasApiKey) {
      triggerTransition();
    } else {
      try {
        // @ts-ignore
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            // Assume success and set key. Re-checking allows for robust handling but direct set avoids race condition.
            setHasApiKey(true);
            triggerTransition();
        } else {
            // Fallback
            console.warn("AI Studio object not found, assuming dev environment or bypassing.");
            setHasApiKey(true);
            triggerTransition();
        }
      } catch (e) {
        console.error("Failed to open key selector", e);
      }
    }
  };

  const triggerTransition = () => {
    setIsTransitioning(true);
    setTimeout(() => {
        setIsAppStarted(true);
        setIsTransitioning(false);
    }, 500); // Wait for fade out animation
  };

  const handleOpenSelectKey = async () => {
      try {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
      } catch (e) {
        console.error("Failed to open key selector", e);
      }
  };

  // --- Keyboard Listeners ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setIsSpacePressed(true);
      }
      
      // Grouping
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyG' && !e.shiftKey) {
        e.preventDefault();
        groupSelectedNodes();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyG') {
        e.preventDefault();
        ungroupSelectedNodes();
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyY' || (e.shiftKey && e.code === 'KeyZ'))) {
        e.preventDefault();
        redo();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedNodeIds, undo, redo]);

  const groupSelectedNodes = () => {
    if (selectedNodeIds.length < 1) return; 
    saveHistory();
    const groupId = `group-${nextGroupId.current++}`;
    setNodes(prev => prev.map(n => {
      if (selectedNodeIds.includes(n.id)) {
        return { ...n, groupId };
      }
      return n;
    }));
  };

  const ungroupSelectedNodes = () => {
    if (selectedNodeIds.length === 0) return;
    saveHistory();
    setNodes(prev => prev.map(n => {
      if (selectedNodeIds.includes(n.id)) {
        const { groupId, ...rest } = n;
        return rest;
      }
      return n;
    }));
  };

  // --- Alignment & Distribution ---
  const alignNodes = (alignment: 'left' | 'center' | 'right') => {
    if (selectedNodeIds.length < 2) return;
    saveHistory();
    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    if (selectedNodes.length === 0) return;
    let targetX = 0;
    if (alignment === 'left') {
      targetX = Math.min(...selectedNodes.map(n => n.x));
    } else if (alignment === 'right') {
      targetX = Math.max(...selectedNodes.map(n => n.x));
    } else if (alignment === 'center') {
      const sumX = selectedNodes.reduce((acc, n) => acc + n.x, 0);
      targetX = sumX / selectedNodes.length;
    }
    setNodes(prev => prev.map(n => {
      if (selectedNodeIds.includes(n.id)) {
        return { ...n, x: targetX };
      }
      return n;
    }));
  };

  const distributeNodes = (axis: 'x' | 'y') => {
    if (selectedNodeIds.length < 3) return;
    saveHistory();
    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    selectedNodes.sort((a, b) => a[axis] - b[axis]);
    const start = selectedNodes[0][axis];
    const end = selectedNodes[selectedNodes.length - 1][axis];
    const totalDistance = end - start;
    const gap = totalDistance / (selectedNodes.length - 1);
    const newPositions: Record<string, number> = {};
    selectedNodes.forEach((n, i) => {
      newPositions[n.id] = start + (gap * i);
    });
    setNodes(prev => prev.map(n => {
      if (newPositions[n.id] !== undefined) {
        return { ...n, [axis]: newPositions[n.id] };
      }
      return n;
    }));
  };

  const selectionBounds = useMemo(() => {
    if (selectedNodeIds.length < 2) return null;
    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    if (selectedNodes.length < 2) return null;
    const minX = Math.min(...selectedNodes.map(n => n.x));
    const maxX = Math.max(...selectedNodes.map(n => n.x + 256));
    const minY = Math.min(...selectedNodes.map(n => n.y));
    return {
      x: (minX + maxX) / 2,
      y: minY
    };
  }, [nodes, selectedNodeIds]);

  const renderGroups = useMemo(() => {
    const groups: Record<string, Node[]> = {};
    nodes.forEach(n => {
      if (n.groupId) {
        if (!groups[n.groupId]) groups[n.groupId] = [];
        groups[n.groupId].push(n);
      }
    });
    return Object.entries(groups).map(([groupId, members]) => {
      const xs = members.map(m => m.x);
      const ys = members.map(m => m.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs) + 256;
      const maxY = Math.max(...ys) + (members[0].type.startsWith('image') || members[0].type.startsWith('custom') ? 160 : 100);
      const padding = 20;
      return (
        <div
          key={groupId}
          className="absolute border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl pointer-events-none transition-all duration-200"
          style={{
            left: minX - padding,
            top: minY - padding - 20,
            width: maxX - minX + padding * 2,
            height: maxY - minY + padding * 2 + 20,
            zIndex: 0
          }}
        >
          <div className="absolute -top-6 left-0 text-xs text-white/50 font-bold uppercase tracking-widest bg-black/40 backdrop-blur px-2 py-0.5 rounded border border-white/10">
            Group {groupId.split('-')[1]}
          </div>
        </div>
      );
    });
  }, [nodes]);

  const getCanvasRect = () => {
    if (canvasRef.current) return canvasRef.current.getBoundingClientRect();
    return { left: 0, top: 0 };
  };

  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const rect = getCanvasRect();
    return {
      x: (screenX - rect.left - viewport.x) / viewport.zoom,
      y: (screenY - rect.top - viewport.y) / viewport.zoom
    };
  }, [viewport]);

  const addNode = (type: NodeType) => {
    saveHistory();
    const id = `node-${nextId.current++}`;
    const rect = getCanvasRect();
    const centerScreenX = rect.left + (window.innerWidth - 256) / 2;
    const centerScreenY = rect.top + window.innerHeight / 2;
    const worldPos = screenToWorld(centerScreenX, centerScreenY);
    const x = worldPos.x + (Math.random() - 0.5) * 50; 
    const y = worldPos.y + (Math.random() - 0.5) * 50;
    const newNode: Node = {
      id,
      type,
      x,
      y,
      data: { label: NODE_CONFIG[type].title, weight: 1.0 }
    };
    setNodes(prev => [...prev, newNode]);
  };

  const deleteNode = (id: string) => {
    saveHistory();
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.fromNodeId !== id && c.toNodeId !== id));
    setSelectedNodeIds(prev => prev.filter(sid => sid !== id));
  };

  const deleteConnection = (id: string) => {
    saveHistory();
    setConnections(prev => prev.filter(c => c.id !== id));
  };

  const clearAll = () => {
    saveHistory();
    setNodes([]);
    setConnections([]);
    setSelectedNodeIds([]);
    setTotalTokens(0);
    nextGroupId.current = 1;
  };

  const handleImageUpload = (nodeId: string, file: File) => {
    // Ideally we save history here, but since FileReader is async, we do it carefully.
    saveHistory(); 
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setNodes(prev => prev.map(n => 
        n.id === nodeId ? { ...n, data: { ...n.data, image: base64 } } : n
      ));
      triggerDownstreamUpdates(nodeId, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleTextChange = (nodeId: string, text: string) => {
    setNodes(prev => prev.map(n => 
      n.id === nodeId ? { ...n, data: { ...n.data, textValue: text } } : n
    ));
  };

  const handleWeightChange = (nodeId: string, weight: number) => {
     setNodes(prev => prev.map(n => 
        n.id === nodeId ? { ...n, data: { ...n.data, weight } } : n
     ));
  };

  const triggerDownstreamUpdates = (sourceId: string, imageBase64: string) => {
    const targets = connections.filter(c => c.fromNodeId === sourceId).map(c => c.toNodeId);
    targets.forEach(targetId => {
      const targetNode = nodes.find(n => n.id === targetId);
      if (targetNode) processNodeAttribute(targetNode, imageBase64);
    });
  };

  const processNodeAttribute = async (node: Node, imageBase64: string) => {
    setNodes(prev => prev.map(n => 
      n.id === node.id ? { ...n, data: { ...n.data, isLoading: true, error: undefined } } : n
    ));
    const config = NODE_CONFIG[node.type];
    if (!config.prompt) return;
    try {
      const analysis = await analyzeImageAttribute(imageBase64, config.prompt);
      setNodes(prev => prev.map(n => 
        n.id === node.id ? { ...n, data: { ...n.data, isLoading: false, result: analysis.result } } : n
      ));
      setTotalTokens(prev => prev + (analysis.usage.totalTokenCount || 0));
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
      }
      setNodes(prev => prev.map(n => 
        n.id === node.id ? { ...n, data: { ...n.data, isLoading: false, error: "AI Processing Failed" } } : n
      ));
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const rect = getCanvasRect();
    const zoomSensitivity = 0.001;
    const minZoom = 0.1;
    const maxZoom = 4;
    const delta = -e.deltaY * zoomSensitivity;
    const newZoom = Math.min(Math.max(viewport.zoom + delta, minZoom), maxZoom);
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = (mouseX - viewport.x) / viewport.zoom;
    const worldY = (mouseY - viewport.y) / viewport.zoom;
    const newViewportX = mouseX - worldX * newZoom;
    const newViewportY = mouseY - worldY * newZoom;
    setViewport({ x: newViewportX, y: newViewportY, zoom: newZoom });
  };

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (isSpacePressed || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      (e.target as Element).setPointerCapture(e.pointerId);
      return;
    }
    if (e.button === 0) {
      const rect = getCanvasRect();
      setSelectionBox({
        startX: (e.clientX - rect.left - viewport.x) / viewport.zoom,
        startY: (e.clientY - rect.top - viewport.y) / viewport.zoom,
        currX: (e.clientX - rect.left - viewport.x) / viewport.zoom,
        currY: (e.clientY - rect.top - viewport.y) / viewport.zoom,
        isActive: true
      });
      if (!e.shiftKey) setSelectedNodeIds([]);
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  };

  const handlePortsUpdate = useCallback((id: string, offsets: PortOffsets) => {
    setNodes(prev => prev.map(n => 
      n.id === id ? { ...n, portOffsets: { ...n.portOffsets, ...offsets } } : n
    ));
  }, []);

  const handleNodePointerDown = (e: React.PointerEvent, id: string) => {
    if (isSpacePressed) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);

    // Capture state before drag starts for potential history save
    dragStartHistorySnapshot.current = { nodes, connections };

    let effectiveSelection = [...selectedNodeIds];
    if (e.shiftKey) {
       if (effectiveSelection.includes(id)) effectiveSelection = effectiveSelection.filter(sid => sid !== id);
       else effectiveSelection.push(id);
    } else {
       if (!effectiveSelection.includes(id)) effectiveSelection = [id];
    }
    setSelectedNodeIds(effectiveSelection);
    const movingIds = new Set<string>(effectiveSelection);
    const involvedGroups = new Set<string>();
    nodes.forEach(n => { if (movingIds.has(n.id) && n.groupId) involvedGroups.add(n.groupId); });
    nodes.forEach(n => { if (n.groupId && involvedGroups.has(n.groupId)) movingIds.add(n.id); });
    const initialPositions: Record<string, { x: number; y: number }> = {};
    nodes.forEach(n => { if (movingIds.has(n.id)) initialPositions[n.id] = { x: n.x, y: n.y }; });
    setDragState({ isDragging: true, nodeId: id, startX: e.clientX, startY: e.clientY, initialPositions });
  };

  const handleConnectionStart = (e: React.PointerEvent, nodeId: string, type: 'input' | 'output') => {
    if (isSpacePressed) return; 
    e.stopPropagation();
    if (type === 'output') {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      setConnectionDrag({ isDragging: true, fromNodeId: nodeId, currX: worldPos.x, currY: worldPos.y });
    }
  };

  const handleConnectionEnd = (e: React.PointerEvent, nodeId: string, type: 'input' | 'output') => {
    e.stopPropagation();
    if (type === 'input' && connectionDrag.isDragging && connectionDrag.fromNodeId) {
      const fromId = connectionDrag.fromNodeId;
      const targetNode = nodes.find(n => n.id === nodeId);
      if (!targetNode) return;
      
      saveHistory(); // Save before creating connection

      let targets: string[] = [nodeId];
      if (targetNode.groupId) {
        const groupMembers = nodes.filter(n => n.groupId === targetNode.groupId);
        const additionalTargets = groupMembers
          .filter(n => n.id !== nodeId && n.id !== fromId && n.type !== 'image_source' && !n.type.startsWith('custom'))
          .map(n => n.id);
        targets = [...targets, ...additionalTargets];
      }
      setConnections(prev => {
        const newConnections = [...prev];
        targets.forEach(tId => {
           if (fromId === tId) return;
           const exists = newConnections.find(c => c.fromNodeId === fromId && c.toNodeId === tId);
           if (!exists) newConnections.push({ id: `conn-${nextConnId.current++}`, fromNodeId: fromId, toNodeId: tId });
        });
        return newConnections;
      });
      const fromNode = nodes.find(n => n.id === fromId);
      if (fromNode?.data.image) {
        targets.forEach(tId => {
           const tNode = nodes.find(n => n.id === tId);
           if (tNode) processNodeAttribute(tNode, fromNode.data.image!);
        });
      }
    }
    setConnectionDrag({ isDragging: false, fromNodeId: null, currX: 0, currY: 0 });
  };

  const refinedHandlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }
    if (selectionBox?.isActive) {
      const rect = getCanvasRect();
      const currX = (e.clientX - rect.left - viewport.x) / viewport.zoom;
      const currY = (e.clientY - rect.top - viewport.y) / viewport.zoom;
      setSelectionBox(prev => prev ? { ...prev, currX, currY } : null);
      return;
    }
    if (dragState.isDragging) {
      const dxWorld = (e.clientX - dragState.startX) / viewport.zoom;
      const dyWorld = (e.clientY - dragState.startY) / viewport.zoom;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setNodes(prev => prev.map(n => {
           const initialPos = dragState.initialPositions[n.id];
           return initialPos ? { ...n, x: initialPos.x + dxWorld, y: initialPos.y + dyWorld } : n;
        }));
      });
    }
    if (connectionDrag.isDragging) {
       const worldPos = screenToWorld(e.clientX, e.clientY);
       setConnectionDrag(prev => ({ ...prev, currX: worldPos.x, currY: worldPos.y }));
    }
  }, [isPanning, panStart, selectionBox, dragState, viewport, connectionDrag]);

  const handlePointerUp = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (selectionBox && selectionBox.isActive) {
       const x1 = Math.min(selectionBox.startX, selectionBox.currX);
       const x2 = Math.max(selectionBox.startX, selectionBox.currX);
       const y1 = Math.min(selectionBox.startY, selectionBox.currY);
       const y2 = Math.max(selectionBox.startY, selectionBox.currY);
       const selected = nodes.filter(n => n.x + 128 > x1 && n.x + 128 < x2 && n.y + 50 > y1 && n.y + 50 < y2).map(n => n.id);
       setSelectedNodeIds(selected);
       setSelectionBox(null);
    }

    // History for Drag End
    if (dragState.isDragging && dragStartHistorySnapshot.current) {
      // Check if any node actually moved from initial position
      const hasMoved = nodes.some(n => {
         const init = dragState.initialPositions[n.id];
         return init && (init.x !== n.x || init.y !== n.y);
      });
      
      if (hasMoved) {
        setHistory(prev => [...prev, dragStartHistorySnapshot.current!]);
        setFuture([]);
      }
      dragStartHistorySnapshot.current = null;
    }

    setDragState(prev => ({ ...prev, isDragging: false, initialPositions: {} }));
    setConnectionDrag(prev => ({ ...prev, isDragging: false, fromNodeId: null }));
    setIsPanning(false);
  }, [selectionBox, nodes, dragState]);

  const getPortPosition = (node: Node, type: 'input' | 'output') => {
    if (type === 'output') {
      if (node.portOffsets?.output) return { x: node.x + node.portOffsets.output.x, y: node.y + node.portOffsets.output.y };
      return { x: node.x + 256, y: node.y + 168 };
    } else {
      if (node.portOffsets?.input) return { x: node.x + node.portOffsets.input.x, y: node.y + node.portOffsets.input.y };
      return { x: node.x, y: node.y + 70 };
    }
  };

  const handlePreview = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.data.result) return;
    const connection = connections.find(c => c.toNodeId === nodeId);
    let sourceImage = null;
    if (connection) {
      const sourceNode = nodes.find(n => n.id === connection.fromNodeId);
      if (sourceNode && sourceNode.data.image) sourceImage = sourceNode.data.image;
    }
    setPreviewModal({ isOpen: true, title: NODE_CONFIG[node.type].title, imageSrc: sourceImage, jsonData: node.data.result });
  };

  const closePreviewModal = () => setPreviewModal(prev => ({ ...prev, isOpen: false }));

  const applyStringWeight = (text: string, weight: number): string => {
      if (!text) return "";
      if (weight === 1.0 || weight === 0) return text;
      return `(${text}:${weight.toFixed(1)})`;
  };

  /**
   * Recursively applies weights to a structured object or array of values.
   */
  const applyWeightToStructure = (data: any, weight: number): any => {
      if (typeof data === 'string') return applyStringWeight(data, weight);
      if (Array.isArray(data)) return data.map(item => applyWeightToStructure(item, weight));
      if (typeof data === 'object' && data !== null) {
          const newData: any = {};
          for (const key in data) newData[key] = applyWeightToStructure(data[key], weight);
          return newData;
      }
      return data;
  };

  const generateFinalJson = () => {
    const finalObj: Record<string, any> = {};
    const negativePrompts: string[] = [];
    const sortedNodes = [...nodes].sort((a, b) => a.y - b.y);
    sortedNodes.forEach(node => {
        const weight = node.data.weight || 1.0;
        if (node.type === 'image_source') return;
        if (node.type === 'custom_negative') {
            if (node.data.textValue?.trim()) negativePrompts.push(applyStringWeight(node.data.textValue.trim(), weight));
        } else if (node.type === 'custom_text') {
             if (node.data.textValue?.trim()) {
                 const weightedText = applyStringWeight(node.data.textValue.trim(), weight);
                 if (!finalObj.critical_instructions) finalObj.critical_instructions = [];
                 finalObj.critical_instructions.push(weightedText);
             }
        } else if (node.type === 'custom_preset') {
             if (node.data.textValue?.trim()) {
                 const presets = node.data.textValue.split(',').map(s => s.trim()).filter(s => s !== '');
                 if (presets.length > 0) {
                     if (!finalObj.composition_presets) finalObj.composition_presets = [];
                     presets.forEach(preset => finalObj.composition_presets.push(applyStringWeight(preset, weight)));
                 }
             }
        } else if (node.data.result) {
            Object.assign(finalObj, applyWeightToStructure(node.data.result, weight));
        }
    });
    if (negativePrompts.length > 0) finalObj.negative_prompt = negativePrompts.join(', ');
    if ((finalObj.critical_instructions as string[])?.length === 1) { finalObj.critical_instruction = finalObj.critical_instructions[0]; delete finalObj.critical_instructions; }
    if ((finalObj.composition_presets as string[])?.length === 1) { finalObj.composition_preset = finalObj.composition_presets[0]; delete finalObj.composition_presets; }
    return JSON.stringify(finalObj, null, 2);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateFinalJson());
  };

  // --- RENDERING ---

  // Landing Page View
  if (!isAppStarted) {
    const codeString = JSON.stringify(LANDING_JSON_DATA, null, 2);

    return (
      <div className="fixed inset-0 bg-[#09090b] text-white flex flex-col font-sans overflow-hidden">
        {/* Spline Background */}
        <div className="absolute inset-0 z-0">
             <iframe 
                src='https://my.spline.design/retrofuturismbganimation-Y9gSLXPS58GwvnQV2LwssUcW/' 
                frameBorder='0' 
                width='100%' 
                height='100%'
                className="w-full h-full"
                title="Spline Background"
             />
             {/* Spline Logo Cover */}
             <div className="absolute bottom-0 right-0 w-36 h-12 bg-[#09090b] pointer-events-none"></div>
        </div>
        
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none"></div>

        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
            <div className="flex-1"></div> 
            
            <div className="hidden md:flex items-center gap-8 text-xs font-bold tracking-widest opacity-70 mr-8">
                <button className="hover:opacity-100 transition-opacity">COLLECTIVE</button>
                <button className="hover:opacity-100 transition-opacity">ENTERPRISE</button>
                <button className="hover:opacity-100 transition-opacity">PRICING</button>
                <button className="hover:opacity-100 transition-opacity" onClick={handleOpenSelectKey}>LINK API</button>
            </div>

            <button 
                onClick={handleStartApp}
                className="bg-[#e0f368] hover:bg-[#d4e655] text-black px-8 py-3 font-bold text-sm tracking-wide transition-transform hover:scale-105 active:scale-95"
            >
                Start Now
            </button>
        </nav>

        {/* Main Content */}
        <div className="relative z-10 flex-1 w-full max-w-[90rem] mx-auto pointer-events-none">
            {/* JSON Box - Left */}
            <div className="absolute top-4 left-6 md:top-10 md:left-12 pointer-events-auto">
               <div className="w-[300px] md:w-[500px] h-[250px] md:h-[300px] border border-white/10 bg-black/40 backdrop-blur-md rounded-xl overflow-hidden relative shadow-2xl">
                   {/* Header of code block */}
                   <div className="absolute top-0 left-0 right-0 h-8 bg-white/5 border-b border-white/5 flex items-center px-3 gap-2 z-10">
                       <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                       <div className="ml-auto text-[10px] text-neutral-500 font-sans">architecture_prompt.json</div>
                   </div>
                   
                   {/* Scrolling Content */}
                   <div className="absolute inset-0 top-8 overflow-hidden pointer-events-none">
                       <div className="animate-scroll-vertical">
                           <pre className="p-4 text-[10px] leading-relaxed text-emerald-400 font-sans whitespace-pre-wrap opacity-80">
                               {codeString}
                           </pre>
                           <pre className="p-4 text-[10px] leading-relaxed text-emerald-400 font-sans whitespace-pre-wrap opacity-80">
                               {codeString}
                           </pre>
                       </div>
                       
                       {/* Overlay Gradients */}
                       <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/60 to-transparent pointer-events-none"></div>
                       <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                   </div>
               </div>
            </div>

            {/* Text Content - Bottom Right */}
            <div className="absolute bottom-10 right-6 md:bottom-20 md:right-12 max-w-xl pointer-events-auto text-right">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-6 text-white mix-blend-overlay opacity-90">
                    Remix Your References.
                </h1>
                
                <div className="text-base md:text-lg font-semibold text-neutral-300 leading-relaxed space-y-1">
                     <p>Don't just write.</p>
                     <p>Design your prompts visually with the style you trust.</p>
                     <p className="opacity-80 font-normal mt-2">Deconstruct your favorite images and reconstruct your vision.</p>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 w-full bg-black px-6 md:px-12 py-6 flex justify-between items-end border-t border-white/10 mt-auto">
            <div className="flex gap-6 text-[10px] text-neutral-500 font-sans uppercase tracking-widest">
                <span>© 2025 Rebuild_CG</span>
                <span className="hidden md:inline">Terms</span>
                <span className="hidden md:inline">Privacy</span>
            </div>
        </div>
      </div>
    );
  }

  // Main App View - Weavy Style Layout
  return (
    <div className={`flex h-screen w-screen overflow-hidden text-neutral-200 font-sans bg-[#000000] transition-opacity duration-700 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Left Sidebar */}
      <div className="w-64 bg-[#09090b] border-r border-[#27272a] flex flex-col z-20 flex-shrink-0">
        
        {/* Header */}
        <div className="p-5 pb-2 border-b border-transparent">
            <h1 className="text-xl font-bold text-white tracking-tight leading-none mb-2">Remix Your<br/>References.</h1>
            <h2 className="text-[10px] font-bold text-[#a1a1aa] tracking-[0.2em] uppercase">Visual Prompt Builder</h2>
        </div>

        {/* Scrollable Node List */}
        <div className="flex-1 overflow-y-auto p-4 pt-2 custom-scrollbar space-y-6">
          
          {/* Input Nodes Section */}
          <div>
            <h3 className="text-[10px] font-bold text-[#52525b] uppercase tracking-wider mb-2">Input Nodes</h3>
            <div className="space-y-2">
                <button onClick={() => addNode('image_source')} className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] hover:border-[#3f3f46] rounded-md transition-all group text-left">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> 
                    <span className="text-xs font-medium text-neutral-300 group-hover:text-white">Image Source</span>
                </button>
                <button onClick={() => addNode('custom_negative')} className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] hover:border-[#3f3f46] rounded-md transition-all group text-left">
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div> 
                    <span className="text-xs font-medium text-neutral-300 group-hover:text-white">Negative Prompt</span>
                </button>
                <button onClick={() => addNode('custom_text')} className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] hover:border-[#3f3f46] rounded-md transition-all group text-left">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></div> 
                    <span className="text-xs font-medium text-neutral-300 group-hover:text-white">Critical Instruction</span>
                </button>
                <button onClick={() => addNode('custom_preset')} className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] hover:border-[#3f3f46] rounded-md transition-all group text-left">
                    <div className="w-2 h-2 rounded-full bg-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.5)]"></div> 
                    <span className="text-xs font-medium text-neutral-300 group-hover:text-white">Composition Presets</span>
                </button>
            </div>
          </div>
          
          <div className="h-px bg-[#27272a] w-full"></div>
          
          {/* Analysis Nodes Section */}
          <div>
            <h3 className="text-[10px] font-bold text-[#52525b] uppercase tracking-wider mb-2">Analysis Nodes</h3>
            <div className="space-y-2">
              {(['attr_subject', 'attr_camera', 'attr_light_direction', 'attr_materials', 'attr_entourage', 'attr_weather', 'attr_postproc', 'attr_furniture', 'attr_lighting_artificial', 'attr_fabric', 'attr_decor', 'attr_joinery'] as NodeType[]).map((type) => (
                <button key={type} onClick={() => addNode(type)} className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] hover:border-[#3f3f46] rounded-md transition-all group text-left">
                   <div className={`w-2 h-2 rounded-full bg-${NODE_CONFIG[type].color.replace('border-', '')} flex-shrink-0`}></div> 
                   <span className="text-xs font-medium text-neutral-300 group-hover:text-white truncate">{NODE_CONFIG[type].title.split('(')[0]}</span> 
                   <PlusIcon className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500" />
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
             <button onClick={clearAll} className="w-full flex items-center justify-center gap-2 p-3 text-red-500 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/50 rounded-md text-xs transition-all uppercase tracking-wider font-bold">
              <TrashIcon className="w-3.5 h-3.5" /> Clear Canvas
            </button>
          </div>
        </div>
      </div>

      {/* Main Column */}
      <div className="flex-1 flex flex-col relative h-full">
          
        {/* Top Header Bar */}
        <div className="h-14 bg-[#09090b] border-b border-[#27272a] flex items-center justify-between px-6 z-20 flex-shrink-0">
           {/* Left Indicators */}
           <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded-full">
                 <CpuChipIcon className="w-3.5 h-3.5 text-blue-500" />
                 <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">{CURRENT_MODEL}</span>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded-full">
                 <TicketIcon className="w-3.5 h-3.5 text-purple-500" />
                 <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">{totalTokens.toLocaleString()} TOKENS</span>
              </div>
           </div>

            {/* Undo / Redo Actions */}
            <div className="flex items-center gap-2">
               <button 
                onClick={undo}
                disabled={history.length === 0}
                className="p-2 rounded hover:bg-[#27272a] text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Undo (Ctrl+Z)"
               >
                 <ArrowUturnLeftIcon className="w-4 h-4" />
               </button>
               <button 
                onClick={redo}
                disabled={future.length === 0}
                className="p-2 rounded hover:bg-[#27272a] text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Redo (Ctrl+Y)"
               >
                 <ArrowUturnRightIcon className="w-4 h-4" />
               </button>
            </div>

           {/* Right Actions */}
           <div className="flex items-center gap-4">
              <button 
                onClick={handleOpenSelectKey}
                className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 hover:text-white transition-colors uppercase tracking-widest group"
              >
                <KeyIcon className="w-3.5 h-3.5 group-hover:text-white" />
                Link API
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#052e16] border border-[#14532d] rounded-full">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
                 <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Connected</span>
              </div>
           </div>
        </div>

        {/* Canvas Area */}
        <div 
          ref={canvasRef}
          className="flex-1 relative overflow-hidden grid-bg bg-[#000000]"
          onPointerMove={refinedHandlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          onPointerDown={handleCanvasPointerDown}
          style={{ touchAction: 'none', backgroundPosition: `${viewport.x}px ${viewport.y}px`, backgroundSize: `${40 * viewport.zoom}px ${40 * viewport.zoom}px`, cursor: isSpacePressed ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
        >
          {selectionBounds && (
            <div 
              className="absolute z-50 transform -translate-x-1/2 -translate-y-full pb-3 pointer-events-none"
              style={{ left: selectionBounds.x * viewport.zoom + viewport.x, top: selectionBounds.y * viewport.zoom + viewport.y }}
            >
              <div className="pointer-events-auto flex items-center gap-1 bg-neutral-900 border border-neutral-700 rounded-full shadow-xl p-1.5" onPointerDown={e => e.stopPropagation()}>
                <button onClick={() => alignNodes('left')} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors" title="Align Left"><Bars3BottomLeftIcon className="w-4 h-4" /></button>
                <button onClick={() => alignNodes('center')} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors" title="Align Center"><Bars3Icon className="w-4 h-4" /></button>
                <button onClick={() => alignNodes('right')} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors" title="Align Right"><Bars3BottomRightIcon className="w-4 h-4" /></button>
                <div className="w-px h-4 bg-neutral-700 mx-1"></div>
                <button onClick={() => distributeNodes('y')} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors" title="Distribute Vertically"><ArrowsUpDownIcon className="w-4 h-4" /></button>
                <button onClick={() => distributeNodes('x')} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors" title="Distribute Horizontally"><ArrowsRightLeftIcon className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          <div style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`, transformOrigin: '0 0', width: '100%', height: '100%' }}>
            {renderGroups}
            {selectionBox?.isActive && (
              <div className="absolute bg-blue-500/10 border border-blue-500 z-50 pointer-events-none" style={{ left: Math.min(selectionBox.startX, selectionBox.currX), top: Math.min(selectionBox.startY, selectionBox.currY), width: Math.abs(selectionBox.currX - selectionBox.startX), height: Math.abs(selectionBox.currY - selectionBox.startY) }} />
            )}
            <svg className="absolute top-0 left-0 overflow-visible pointer-events-none z-0">
              {connections.map(conn => {
                const from = nodes.find(n => n.id === conn.fromNodeId);
                const to = nodes.find(n => n.id === conn.toNodeId);
                if (!from || !to) return null;
                const start = getPortPosition(from, 'output');
                const end = getPortPosition(to, 'input');
                return <ConnectionLine key={conn.id} id={conn.id} startX={start.x} startY={start.y} endX={end.x} endY={end.y} isActive={!!(from.data.image && to.data.isLoading)} onDelete={deleteConnection} />;
              })}
              {connectionDrag.isDragging && connectionDrag.fromNodeId && (
                <ConnectionLine id="drag-line" startX={(() => { const n = nodes.find(x => x.id === connectionDrag.fromNodeId); return n ? getPortPosition(n, 'output').x : 0; })()} startY={(() => { const n = nodes.find(x => x.id === connectionDrag.fromNodeId); return n ? getPortPosition(n, 'output').y : 0; })()} endX={connectionDrag.currX} endY={connectionDrag.currY} />
              )}
            </svg>
            {nodes.map(node => (
              <NodeItem 
                key={node.id} 
                node={node} 
                isSelected={selectedNodeIds.includes(node.id)} 
                isDragging={dragState.isDragging && (dragState.nodeId === node.id || selectedNodeIds.includes(node.id))} 
                onDelete={deleteNode} 
                onPointerDown={handleNodePointerDown} 
                onConnectionStart={handleConnectionStart} 
                onConnectionEnd={handleConnectionEnd} 
                onImageUpload={handleImageUpload} 
                onTextChange={handleTextChange} 
                onWeightChange={handleWeightChange} 
                onPortsUpdate={handlePortsUpdate} 
                onPreview={handlePreview} 
                onInteractionStart={saveHistory} // Pass saveHistory here
              />
            ))}
          </div>
        </div>

        {/* Output Panel - Docked Bottom */}
        <div className="h-64 bg-[#09090b] border-t border-[#27272a] flex flex-col z-20 flex-shrink-0">
          <div className="flex justify-between items-center px-6 py-3 border-b border-[#27272a] bg-[#09090b]">
            <div className="flex items-center gap-3 text-xs font-bold text-[#a1a1aa] uppercase tracking-widest">
              <CodeBracketIcon className="w-4 h-4 text-purple-500" /> 
              <span>Final JSON Output</span>
            </div>
            <button onClick={copyToClipboard} className="flex items-center gap-2 px-3 py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] hover:border-[#3f3f46] rounded text-[10px] font-bold uppercase tracking-wider transition-all text-neutral-300 hover:text-white">
              <DocumentDuplicateIcon className="w-3 h-3" /> Copy JSON
            </button>
          </div>
          <div className="flex-1 relative">
            <textarea className="absolute inset-0 w-full h-full bg-transparent text-emerald-400 font-mono text-xs p-6 focus:outline-none resize-none" readOnly value={generateFinalJson()} />
            <div className="absolute top-6 left-2 bottom-6 w-0.5 bg-[#27272a]"></div>
            <div className="absolute top-8 left-0 text-[10px] text-[#27272a] font-mono px-1">1</div>
          </div>
        </div>
      </div>
      
      <ComparisonModal isOpen={previewModal.isOpen} onClose={closePreviewModal} title={previewModal.title} imageSrc={previewModal.imageSrc} jsonData={previewModal.jsonData} />
    </div>
  );
}

export default App;
