import { create } from 'zustand';
import type { AppState } from '../types';

export const useStore = create<AppState>((set) => ({
    layouts: [],
    machines: [],
    selectedIds: [],

    addLayout: (item) => set((state) => ({ layouts: [...state.layouts, item] })),
    updateLayout: (id, updates) => set((state) => ({
        layouts: state.layouts.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    })),
    removeLayout: (id) => set((state) => ({
        layouts: state.layouts.filter((item) => item.id !== id),
        selectedIds: state.selectedIds.filter((sid) => sid !== id),
    })),

    addMachine: (item) => set((state) => ({ machines: [...state.machines, item] })),
    updateMachine: (id, updates) => set((state) => ({
        machines: state.machines.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    })),
    removeMachine: (id) => set((state) => ({
        machines: state.machines.filter((item) => item.id !== id),
        selectedIds: state.selectedIds.filter((sid) => sid !== id),
    })),

    selectItem: (id, multi = false, selectGroupMembers = true) => set((state) => {
        // If selecting an item that is part of a group, optionally select all group members
        let idsToSelect = [id];
        if (id && selectGroupMembers) {
            const layout = state.layouts.find(l => l.id === id);
            const machine = state.machines.find(m => m.id === id);
            const item = layout || machine;
            if (item && item.groupId) {
                const groupLayoutIds = state.layouts.filter(l => l.groupId === item.groupId).map(l => l.id);
                const groupMachineIds = state.machines.filter(m => m.groupId === item.groupId).map(m => m.id);
                idsToSelect = [...groupLayoutIds, ...groupMachineIds];
            }
        }

        if (multi) {
            // Toggle selection
            const newSelected = [...state.selectedIds];
            idsToSelect.forEach(sid => {
                if (newSelected.includes(sid)) {
                    // Deselect
                    const idx = newSelected.indexOf(sid);
                    if (idx > -1) newSelected.splice(idx, 1);
                } else {
                    newSelected.push(sid);
                }
            });
            return { selectedIds: newSelected };
        } else {
            return { selectedIds: id ? idsToSelect : [] };
        }
    }),
    clearSelection: () => set({ selectedIds: [] }),

    groupItems: () => set((state) => {
        const { selectedIds, layouts, machines } = state;
        if (selectedIds.length < 2) return {};

        // Check if already grouped? For now, just create a new group ID
        const newGroupId = 'group-' + Math.random().toString(36).substr(2, 9);

        return {
            layouts: layouts.map(l => selectedIds.includes(l.id) ? { ...l, groupId: newGroupId } : l),
            machines: machines.map(m => selectedIds.includes(m.id) ? { ...m, groupId: newGroupId } : m),
        };
    }),

    ungroupItems: () => set((state) => {
        const { selectedIds, layouts, machines } = state;
        return {
            layouts: layouts.map(l => selectedIds.includes(l.id) ? { ...l, groupId: undefined } : l),
            machines: machines.map(m => selectedIds.includes(m.id) ? { ...m, groupId: undefined } : m),
        };
    }),

    snapping: {
        enabled: true,
        grid: true,
        vertex: false,
        center: false,
    },
    setSnapping: (config) => set((state) => ({ snapping: { ...state.snapping, ...config } })),

    // Unit system (default: mm, 1px = 0.264583mm at 96 DPI)
    unit: 'mm',
    pixelsPerMM: 3.7795275591, // 96 DPI = 3.78 pixels per mm
    setUnit: (unit) => set({ unit }),

    // Zoom & Pan
    scale: 1,
    position: { x: 0, y: 0 },
    setScale: (scale) => set({ scale }),
    setPosition: (pos) => set({ position: pos }),

    // UI State
    ui: {
        propertiesPanelVisible: true,
        propertiesPanelPosition: 'right' as const,
        propertiesPanelSize: 280,
    },
    setPropertiesPanelVisible: (visible: boolean) => set((state) => ({ ui: { ...state.ui, propertiesPanelVisible: visible } })),
    setPropertiesPanelPosition: (position: 'left' | 'right' | 'top' | 'bottom') => set((state) => ({ ui: { ...state.ui, propertiesPanelPosition: position } })),
    setPropertiesPanelSize: (size: number) => set((state) => ({ ui: { ...state.ui, propertiesPanelSize: size } })),
}));
