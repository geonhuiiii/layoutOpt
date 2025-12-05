import React from 'react';
import { useStore } from '../store/useStore';
import type { LayoutItem } from '../types';

const MIN_SIZE = 0.01;

// Lock button component
const LockButton: React.FC<{ locked: boolean; onClick: () => void }> = ({ locked, onClick }) => (
    <button
        onClick={onClick}
        style={{
            background: locked ? '#0e639c' : '#3c3c3c',
            border: '1px solid #454545',
            borderRadius: '3px',
            padding: '4px 6px',
            cursor: 'pointer',
            fontSize: '12px',
            color: locked ? '#ffffff' : '#969696',
            minWidth: '28px',
        }}
        title={locked ? 'Unlock' : 'Lock'}
    >
        {locked ? '🔒' : '🔓'}
    </button>
);

// Editable input with lock
const EditableField: React.FC<{
    label: string;
    value: number;
    locked: boolean;
    onValueChange: (value: number) => void;
    onLockToggle: () => void;
    unit?: string;
    step?: number;
    min?: number;
}> = ({ label, value, locked, onValueChange, onLockToggle, unit = '', step = 1, min = -Infinity }) => (
    <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', color: '#969696', marginBottom: '2px' }}>{label}</div>
        <div style={{ display: 'flex', gap: '4px' }}>
            <input
                type="number"
                value={Math.round(value * 100) / 100}
                onChange={(e) => {
                    const newValue = parseFloat(e.target.value);
                    if (!isNaN(newValue) && newValue >= min) {
                        onValueChange(newValue);
                    }
                }}
                disabled={locked}
                step={step}
                style={{
                    flex: 1,
                    padding: '6px 8px',
                    background: locked ? '#2d2d30' : '#3c3c3c',
                    color: locked ? '#969696' : '#cccccc',
                    border: '1px solid #454545',
                    borderRadius: '3px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    minWidth: 0,
                }}
            />
            <LockButton locked={locked} onClick={onLockToggle} />
        </div>
        {unit && <div style={{ fontSize: '10px', color: '#6e6e6e', marginTop: '2px' }}>{unit}</div>}
    </div>
);

const PropertiesPanel: React.FC = () => {
    const { selectedIds, layouts, machines, updateLayout, updateMachine, ui, unit, pixelsPerMM } = useStore();

    // Unit conversion helpers
    const toDisplayUnit = (pixels: number): number => {
        if (unit === 'px') return pixels;
        const mm = pixels / pixelsPerMM;
        if (unit === 'mm') return mm;
        return mm / 1000;
    };

    const fromDisplayUnit = (value: number): number => {
        if (unit === 'px') return value;
        const mm = unit === 'm' ? value * 1000 : value;
        return mm * pixelsPerMM;
    };

    const getAreaUnitLabel = (): string => {
        return `${unit}²`;
    };

    if (selectedIds.length === 0) {
        return (
            <div style={{
                width: '100%',
                height: '100%',
                padding: '16px',
                color: '#cccccc',
                overflow: 'auto',
            }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Properties</h3>
                <p style={{ color: '#969696', fontSize: '13px' }}>No item selected</p>
            </div>
        );
    }

    const selectedItems = [
        ...layouts.filter(l => selectedIds.includes(l.id)),
        ...machines.filter(m => selectedIds.includes(m.id))
    ];

    const firstItem = selectedItems[0];
    const layout = layouts.find(l => l.id === firstItem?.id);
    const isLayout = !!layout;
    const isRect = isLayout && (layout as LayoutItem).type === 'rect';

    const handleNameChange = (id: string, newName: string) => {
        if (isLayout) {
            updateLayout(id, { name: newName });
        } else {
            updateMachine(id, { name: newName });
        }
    };

    const handlePositionChange = async (id: string, axis: 'x' | 'y', displayValue: number) => {
        const pixelValue = fromDisplayUnit(displayValue);
        if (isLayout) {
            const item = layout as LayoutItem;
            if ((axis === 'x' && item.lockedX) || (axis === 'y' && item.lockedY)) return;
            updateLayout(id, { [axis]: pixelValue });
        } else {
            updateMachine(id, { [axis]: pixelValue });
        }
    };

    const handleSizeChange = async (id: string, dimension: 'width' | 'height', displayValue: number) => {
        const pixelValue = Math.max(MIN_SIZE, fromDisplayUnit(displayValue));
        if (!isLayout) return;

        const item = layout as LayoutItem;

        // Check if this dimension is locked
        if ((dimension === 'width' && item.lockedWidth) || (dimension === 'height' && item.lockedHeight)) {
            return;
        }

        let updates: Partial<LayoutItem> = { [dimension]: pixelValue };

        // If area is locked, adjust the other dimension
        if (item.lockedArea && item.area && item.area > 0) {
            if (dimension === 'width') {
                const newHeight = Math.max(MIN_SIZE, item.area / pixelValue);
                updates.height = newHeight;
            } else {
                const newWidth = Math.max(MIN_SIZE, item.area / pixelValue);
                updates.width = newWidth;
            }
        } else {
            // Recalculate area
            const newWidth = dimension === 'width' ? pixelValue : (item.width || 0);
            const newHeight = dimension === 'height' ? pixelValue : (item.height || 0);
            // @ts-ignore
            const newArea = await window.electron.ipcRenderer.calculateArea(newWidth, newHeight);
            updates.area = newArea;
        }

        updateLayout(id, updates);
    };

    const handleLockToggle = (id: string, field: 'lockedX' | 'lockedY' | 'lockedWidth' | 'lockedHeight' | 'lockedArea') => {
        if (isLayout) {
            const item = layout as LayoutItem;
            updateLayout(id, { [field]: !item[field] });
        }
    };

    const isHorizontal = ui.propertiesPanelPosition === 'top' || ui.propertiesPanelPosition === 'bottom';

    return (
        <div style={{
            width: '100%',
            height: '100%',
            padding: '16px',
            color: '#cccccc',
            overflow: 'auto',
            fontSize: '13px',
        }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, borderBottom: '1px solid #3e3e42', paddingBottom: '8px' }}>
                Properties
            </h3>

            {selectedIds.length === 1 ? (
                <div style={{ display: isHorizontal ? 'flex' : 'block', gap: isHorizontal ? '24px' : '0', flexWrap: 'wrap' }}>
                    <div style={{ marginBottom: '12px', minWidth: isHorizontal ? '200px' : 'auto' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '12px', color: '#969696' }}>
                            TYPE
                        </label>
                        <div style={{ padding: '6px 8px', background: '#3c3c3c', borderRadius: '3px' }}>
                            {isLayout ? `Layout (${(firstItem as LayoutItem).type})` : 'Machine'}
                        </div>
                    </div>

                    <div style={{ marginBottom: '12px', minWidth: isHorizontal ? '200px' : 'auto' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '12px', color: '#969696' }}>
                            NAME
                        </label>
                        <input
                            type="text"
                            value={(firstItem as any).name || ''}
                            onChange={(e) => handleNameChange(firstItem.id, e.target.value)}
                            placeholder="Enter name..."
                            style={{
                                width: '100%',
                                padding: '6px 8px',
                                background: '#3c3c3c',
                                color: '#cccccc',
                                border: '1px solid #454545',
                                borderRadius: '3px',
                                fontSize: '13px',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '12px', minWidth: isHorizontal ? '200px' : 'auto' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '12px', color: '#969696' }}>
                            POSITION
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <EditableField
                                label="X"
                                value={toDisplayUnit((firstItem as any).x)}
                                locked={isLayout ? !!(layout as LayoutItem).lockedX : false}
                                onValueChange={(v) => handlePositionChange(firstItem.id, 'x', v)}
                                onLockToggle={() => isLayout && handleLockToggle(firstItem.id, 'lockedX')}
                                unit={unit}
                            />
                            <EditableField
                                label="Y"
                                value={toDisplayUnit((firstItem as any).y)}
                                locked={isLayout ? !!(layout as LayoutItem).lockedY : false}
                                onValueChange={(v) => handlePositionChange(firstItem.id, 'y', v)}
                                onLockToggle={() => isLayout && handleLockToggle(firstItem.id, 'lockedY')}
                                unit={unit}
                            />
                        </div>
                    </div>

                    {isRect && (
                        <div style={{ marginBottom: '12px', minWidth: isHorizontal ? '200px' : 'auto' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '12px', color: '#969696' }}>
                                SIZE
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <EditableField
                                    label="Width"
                                    value={toDisplayUnit((layout as LayoutItem).width || 0)}
                                    locked={!!(layout as LayoutItem).lockedWidth}
                                    onValueChange={(v) => handleSizeChange(firstItem.id, 'width', v)}
                                    onLockToggle={() => handleLockToggle(firstItem.id, 'lockedWidth')}
                                    unit={unit}
                                    min={0.01}
                                />
                                <EditableField
                                    label="Height"
                                    value={toDisplayUnit((layout as LayoutItem).height || 0)}
                                    locked={!!(layout as LayoutItem).lockedHeight}
                                    onValueChange={(v) => handleSizeChange(firstItem.id, 'height', v)}
                                    onLockToggle={() => handleLockToggle(firstItem.id, 'lockedHeight')}
                                    unit={unit}
                                    min={0.01}
                                />
                            </div>
                        </div>
                    )}

                    {isLayout && (firstItem as LayoutItem).area !== undefined && (
                        <div style={{ marginBottom: '12px', minWidth: isHorizontal ? '200px' : 'auto' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '12px', color: '#969696' }}>
                                AREA {isRect && <span style={{ fontSize: '10px', color: '#6e6e6e' }}>(lock to maintain size)</span>}
                            </label>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <div style={{
                                    flex: 1,
                                    padding: '6px 8px',
                                    background: (layout as LayoutItem).lockedArea ? '#1a3a4c' : '#3c3c3c',
                                    borderRadius: '3px',
                                    fontWeight: 600,
                                    border: (layout as LayoutItem).lockedArea ? '1px solid #0e639c' : '1px solid transparent',
                                }}>
                                    {(() => {
                                        const areaInPixels = (firstItem as LayoutItem).area!;
                                        // Area needs to be converted from px² to unit²
                                        const displayArea = toDisplayUnit(toDisplayUnit(areaInPixels));
                                        if (unit === 'm') return displayArea.toFixed(6);
                                        if (unit === 'mm') return displayArea.toFixed(2);
                                        return Math.round(displayArea);
                                    })()} {getAreaUnitLabel()}
                                </div>
                                {isRect && (
                                    <LockButton
                                        locked={!!(layout as LayoutItem).lockedArea}
                                        onClick={() => handleLockToggle(firstItem.id, 'lockedArea')}
                                    />
                                )}
                            </div>
                            {isRect && (layout as LayoutItem).lockedArea && (
                                <div style={{ fontSize: '10px', color: '#0e639c', marginTop: '4px' }}>
                                    ⓘ Width/Height을 변경하면 면적이 유지됩니다
                                </div>
                            )}
                        </div>
                    )}

                    {(firstItem as any).groupId && (
                        <div style={{ marginBottom: '12px', minWidth: isHorizontal ? '200px' : 'auto' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '12px', color: '#969696' }}>
                                GROUP ID
                            </label>
                            <div style={{ padding: '6px 8px', background: '#3c3c3c', borderRadius: '3px', fontSize: '11px', fontFamily: 'monospace' }}>
                                {(firstItem as any).groupId.substring(0, 8)}...
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <div style={{ marginBottom: '16px', padding: '12px', background: '#3c3c3c', borderRadius: '3px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{selectedIds.length} items selected</div>
                        {selectedItems.every(item => (item as any).groupId && (item as any).groupId === (firstItem as any).groupId) && (
                            <div style={{ marginTop: '8px', padding: '8px', background: '#2d2d30', borderRadius: '3px', borderLeft: '3px solid #0e639c' }}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#0e639c' }}>GROUPED</div>
                                <div style={{ fontSize: '11px', color: '#969696', fontFamily: 'monospace', marginTop: '4px' }}>
                                    {(firstItem as any).groupId.substring(0, 8)}...
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertiesPanel;
