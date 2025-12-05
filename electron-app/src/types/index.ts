export interface Point {
    x: number;
    y: number;
}

export interface LayoutItem {
    id: string;
    type: 'rect' | 'poly';
    x: number;
    y: number;
    width?: number; // For rect
    height?: number; // For rect
    points?: number[]; // For poly [x1, y1, x2, y2, ...] relative to x,y
    rotation: number;
    color: string;
    groupId?: string;
    area?: number;
    name?: string;

    // Lock states (optional - defaults to unlocked)
    lockedX?: boolean;
    lockedY?: boolean;
    lockedWidth?: boolean;
    lockedHeight?: boolean;
    lockedArea?: boolean;  // rect only - when locked, adjusts opposite dimension to maintain area
}

export interface MachineItem {
    id: string;
    name?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    color: string;
    groupId?: string;
}

export interface SnappingConfig {
    enabled: boolean;
    grid: boolean;
    vertex: boolean;
    center: boolean;
}

export interface UIState {
    propertiesPanelVisible: boolean;
    propertiesPanelPosition: 'left' | 'right' | 'top' | 'bottom';
    propertiesPanelSize: number; // width for left/right, height for top/bottom
}


export interface AppState {
    layouts: LayoutItem[];
    machines: MachineItem[];
    selectedIds: string[];

    // Actions
    addLayout: (item: LayoutItem) => void;
    updateLayout: (id: string, updates: Partial<LayoutItem>) => void;
    removeLayout: (id: string) => void;

    addMachine: (item: MachineItem) => void;
    updateMachine: (id: string, updates: Partial<MachineItem>) => void;
    removeMachine: (id: string) => void;

    selectItem: (id: string, multi?: boolean, selectGroupMembers?: boolean) => void;
    clearSelection: () => void;

    groupItems: () => void;
    ungroupItems: () => void;

    snapping: SnappingConfig;
    setSnapping: (config: Partial<SnappingConfig>) => void;

    ui: UIState;

    // Unit system
    unit: 'px' | 'mm' | 'm';
    pixelsPerMM: number; // Conversion factor
    setUnit: (unit: 'px' | 'mm' | 'm') => void;

    // Zoom & Pan
    scale: number;
    position: { x: number, y: number };
    setScale: (scale: number) => void;
    setPosition: (pos: { x: number, y: number }) => void;

    // UI State Actions
    setPropertiesPanelVisible: (visible: boolean) => void;
    setPropertiesPanelPosition: (position: 'left' | 'right' | 'top' | 'bottom') => void;
    setPropertiesPanelSize: (size: number) => void;
}
