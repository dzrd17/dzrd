export type NodeType = 
  | 'image_source' 
  | 'attr_subject' 
  | 'attr_camera' 
  | 'attr_materials' 
  | 'attr_entourage' 
  | 'attr_weather' 
  | 'attr_postproc'
  | 'attr_furniture'
  | 'attr_lighting_artificial'
  | 'attr_light_direction'
  | 'attr_fabric'
  | 'attr_decor'
  | 'attr_joinery'
  | 'custom_negative'
  | 'custom_text'
  | 'custom_preset';

export interface NodeData {
  label: string;
  image?: string; // Base64 string for source nodes
  textValue?: string; // Raw text for manual nodes
  result?: any; // JSON result from API or manual input
  isLoading?: boolean;
  error?: string;
  weight?: number; // Prompt weight (0.1 - 2.0)
}

export interface PortOffsets {
  input?: { x: number; y: number };
  output?: { x: number; y: number };
}

export interface Node {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  data: NodeData;
  portOffsets?: PortOffsets;
  groupId?: string; // ID of the group this node belongs to
}

export interface Connection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface DragState {
  isDragging: boolean;
  startX: number; // Screen coordinate X at start
  startY: number; // Screen coordinate Y at start
  // Map of Node ID -> Initial World Position {x, y} at start of drag
  // This allows O(1) lookups during drag move and avoids drift/accumulation errors
  initialPositions: Record<string, { x: number; y: number }>;
}

export interface ConnectionDragState {
  isDragging: boolean;
  fromNodeId: string | null;
  currX: number;
  currY: number;
}

// Prompts mapping
export const NODE_CONFIG: Record<NodeType, { title: string; color: string; prompt?: string }> = {
  image_source: { 
    title: 'Image Reference (참조 이미지)', 
    color: 'border-neutral-500' 
  },
  custom_negative: {
    title: 'Negative Prompt (제외 키워드)',
    color: 'border-red-600',
  },
  custom_text: {
    title: 'Critical Instruction (주요 지시문)',
    color: 'border-cyan-500',
  },
  custom_preset: {
    title: 'Composition Presets (구성 프리셋)',
    color: 'border-lime-500',
  },
  attr_subject: { 
    title: 'Subject & Geometry (건축 형태)', 
    color: 'border-indigo-500',
    prompt: 'Act as a 3D Modeler. Analyze the main architectural subject. Describe the "massing", "form language" (e.g., cantilever, curvilinear, rectilinear), and "geometric composition" for a 3D model. Return JSON format: { "subject": "Main building description", "geometry": "Geometric form description" }'
  },
  attr_camera: { 
    title: 'Camera & Framing (구도와 렌즈)', 
    color: 'border-orange-500',
    prompt: 'Act as an Architectural Photographer. Analyze the "focal length" (e.g., 24mm TS, 50mm), "camera height" (eye-level, drone shot), and "composition" (1-point perspective, rule of thirds). Mention if a "Tilt-shift" lens is needed. Return JSON format: { "camera": { "view": "Perspective type", "lens": "Focal length and type", "composition": "Composition rules" } }'
  },
  attr_materials: { 
    title: 'Material & Texture (재료의 물성)', 
    color: 'border-teal-500',
    prompt: 'Act as a 3D Rendering Expert (V-Ray/Corona). Analyze materials for PBR texturing. Describe "Diffuse Color", "Roughness/Glossiness", "Reflection" type, and "Normal Map" details (e.g., porous concrete, smooth glazing). Return JSON format: { "materials": { "facade": "Description with PBR terms", "glazing": "Glass properties", "pavement": "Ground material details" } }'
  },
  attr_entourage: { 
    title: 'Entourage & Life (조경과 점경물)', 
    color: 'border-pink-500',
    prompt: 'Act as an ArchViz Artist. Analyze the "entourage" elements. Describe "3D people assets" (e.g., motion-blurred business people), "vegetation species" (specific tree types), and "vehicles". Return JSON format: { "entourage": { "people": "Asset style and activity", "vegetation": "Plant species and density", "props": "Street furniture" } }'
  },
  attr_weather: { 
    title: 'Weather & Season (계절과 대기 상태)', 
    color: 'border-blue-500',
    prompt: 'Act as a Lighting Artist. Analyze the environment settings. Describe the "HDRI Sky" type (e.g., overcast soft light, clear blue noon), "Sun direction", "Fog/Atmospheric perspective", and surface "wetness". Return JSON format: { "atmosphere": { "sky": "HDRI description", "lighting": "Sun/Shadow properties", "weather": "Atmospheric conditions" } }'
  },
  attr_postproc: { 
    title: 'Post-Processing (톤앤매너/보정)', 
    color: 'border-purple-500',
    prompt: 'Act as a Retoucher. Analyze the "Color Grading" (LUT style), "Contrast curves", "White Balance", and optical effects like "Bloom", "Glare", or "Chromatic Aberration". Return JSON format: { "post_processing": { "color_grading": "Tone and mood", "contrast": "Contrast levels", "effects": "Optical effects" } }'
  },
  attr_light_direction: {
    title: 'Light Direction (조명 방향)',
    color: 'border-yellow-400',
    prompt: 'Act as a CG Lighting Artist. Analyze the primary light source direction relative to the camera (e.g., Top-down, 45-degree front, Backlighting/Rim light, Side lighting). Identify shadow length, direction, and softness. Return JSON format: { "light_direction": { "primary_source": "Direction and angle", "shadows": "Orientation and characteristics", "highlights": "Placement on surfaces" } }'
  },
  // --- New Interior Nodes ---
  attr_furniture: { 
    title: 'Furniture & Layout (가구/배치)', 
    color: 'border-amber-600',
    prompt: 'Act as an Interior Designer. Analyze the furniture styles (e.g., Mid-century Modern, Japandi, Bauhaus) and the specific layout/arrangement of major pieces. Describe leg shapes, frame materials, and space usage. Return JSON format: { "furniture": { "style": "Design movement and characteristics", "arrangement": "Layout description", "details": "Legs, frames, and silhouettes" } }'
  },
  attr_lighting_artificial: { 
    title: 'Artificial Lighting (인공 조명)', 
    color: 'border-yellow-500',
    prompt: 'Act as a Lighting Designer. Analyze the artificial lighting scheme. Identify specific fixtures (recessed downlights, pendants, floor lamps, cove lighting), estimate the color temperature (e.g., 3000K Warm White), and describe light distribution/IES patterns. Return JSON format: { "indoor_lighting": { "fixtures": "List of fixture types", "indirect_light": "Cove or hidden lighting details", "color_temp": "Kelvin value estimation", "shadows": "Shadow softness and direction" } }'
  },
  attr_fabric: { 
    title: 'Soft Goods & Fabric (패브릭)', 
    color: 'border-rose-400',
    prompt: 'Act as a Texture Artist. Analyze soft goods and fabrics. Describe the translucency of curtains (sheer vs opaque), the pile/weave of rugs (shaggy, flat weave), and the wear/grain details of upholstery (leather, linen, velvet). Return JSON format: { "soft_goods": { "curtains": "Translucency and material", "rug": "Texture and pile description", "upholstery": "Furniture fabric details" } }'
  },
  attr_decor: { 
    title: 'Decor & Props (데코/생활감)', 
    color: 'border-emerald-500',
    prompt: 'Act as a Set Decorator. Analyze decorative props to capture the "Lived-in look". Identify specific clutter (open books, coffee cups), art objects, and indoor plant species (e.g., Monstera, Ficus). Return JSON format: { "decor": { "props": "Small objects and clutter", "greenery": "Plant species and placement", "vibe": "Atmosphere description" } }'
  },
  attr_joinery: { 
    title: 'Joinery & Hardware (디테일 마감)', 
    color: 'border-slate-400',
    prompt: 'Act as an Interior Architect. Analyze architectural joinery and hardware. Describe wall finishes (wainscoting, molding), floor patterns (Herringbone, Chevron), and hardware materials (Brass, Chrome handles/faucets). Return JSON format: { "joinery_details": { "wall_finish": "Molding and surface texture", "flooring": "Pattern and material", "hardware": "Metal finishes and types" } }'
  }
};