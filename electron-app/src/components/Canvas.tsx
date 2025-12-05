import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Line, Transformer, Circle, Group, Text } from 'react-konva';
import { useStore } from '../store/useStore';
import type { LayoutItem } from '../types';

const Canvas: React.FC = () => {
    const { layouts, machines, selectedIds, selectItem, updateLayout, updateMachine, scale, position, setScale, setPosition, ui } = useStore();
    const trRef = useRef<any>(null);
    const layerRef = useRef<any>(null);
    const stageRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPanning, setIsPanning] = React.useState(false);
    const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });
    const [dimensions, setDimensions] = React.useState({ width: window.innerWidth, height: window.innerHeight });

    // Nested selection state - track last clicked item
    const [lastClickedItem, setLastClickedItem] = React.useState<{ id: string, timestamp: number } | null>(null);
    const DOUBLE_CLICK_THRESHOLD = 500; // ms

    // Drag selection box state
    const [selectionBox, setSelectionBox] = React.useState<{
        visible: boolean;
        startX: number;
        startY: number;
        currentX: number;
        currentY: number;
    } | null>(null);
    const [isDraggingSelection, setIsDraggingSelection] = React.useState(false);

    const { unit, pixelsPerMM } = useStore();

    // Unit conversion helpers
    const toDisplayUnit = (pixels: number): number => {
        if (unit === 'px') return pixels;
        const mm = pixels / pixelsPerMM;
        if (unit === 'mm') return mm;
        return mm / 1000; // Convert to meters
    };

    const getUnitLabel = (): string => {
        return unit;
    };

    const formatValue = (pixels: number): string => {
        const value = toDisplayUnit(pixels);
        if (unit === 'm') return value.toFixed(3);
        if (unit === 'mm') return value.toFixed(1);
        return Math.round(value).toString();
    };

    // Calculate font size that fits within the container and adjusts for zoom
    // Returns font size in canvas units (before zoom is applied)
    const calculateFontSize = (containerWidth: number, containerHeight: number, text: string, baseSize: number = 14): number => {
        // Adjust for zoom: when zoomed out (scale < 1), increase font size
        // to compensate so text remains readable
        const zoomCompensation = Math.min(1 / scale, 3); // Cap at 3x compensation

        // Calculate max font size that fits in container
        const lines = text.split('\n').length;
        const maxHeightBasedSize = containerHeight / (lines * 1.5); // 1.5 for line height
        const longestLine = Math.max(...text.split('\n').map(line => line.length));
        const maxWidthBasedSize = longestLine > 0 ? (containerWidth * 0.9) / (longestLine * 0.6) : baseSize; // 0.6 is approx char width ratio

        // Use the smaller of width/height constraints
        const containerBasedSize = Math.min(maxHeightBasedSize, maxWidthBasedSize);

        // Apply zoom compensation but limit final size
        const compensatedSize = baseSize * zoomCompensation;

        // Final font size: minimum of container-based and zoom-compensated, but at least 8
        return Math.max(8, Math.min(containerBasedSize, compensatedSize, 48));
    };

    // Selection logic
    const checkDeselect = (e: any) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            // Don't deselect if we're starting a drag selection
            if (!isDraggingSelection) {
                selectItem('', false);
            }
        }
    };

    // Transformer logic
    useEffect(() => {
        if (trRef.current && layerRef.current) {
            const nodes = selectedIds
                .map(id => {
                    const groupNode = layerRef.current.findOne('#' + id);
                    // Check if it's a Group containing a Rect (layout item)
                    if (groupNode && groupNode.getClassName() === 'Group') {
                        const rectChild = groupNode.findOne('Rect');
                        // Only transform if it's a rect layout (not a polygon or machine)
                        const layout = layouts.find(l => l.id === id && l.type === 'rect');
                        if (rectChild && layout) {
                            return groupNode;
                        }
                    }
                    return null;
                })
                .filter(node => node !== null);

            if (nodes.length > 0) {
                trRef.current.nodes(nodes);
                trRef.current.getLayer().batchDraw();
            } else {
                trRef.current.nodes([]);
                trRef.current.getLayer().batchDraw();
            }
        }
    }, [selectedIds, layouts]);

    // Zoom handler
    const handleWheel = (e: any) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;

        const oldScale = scale;
        const pointer = stage.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - position.x) / oldScale,
            y: (pointer.y - position.y) / oldScale,
        };

        const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
        const clampedScale = Math.max(0.1, Math.min(10, newScale));

        setScale(clampedScale);
        setPosition({
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
        });
    };

    // Pan and selection box handlers
    const handleMouseDown = (e: any) => {
        const clickedOnEmpty = e.target === e.target.getStage();

        if (e.evt.button === 1 || e.evt.spaceKey) { // Middle click or space
            setIsPanning(true);
            setPanStart({ x: e.evt.clientX - position.x, y: e.evt.clientY - position.y });
        } else if (clickedOnEmpty && e.evt.button === 0) { // Left click on empty area
            // Start drag selection
            const stage = stageRef.current;
            if (!stage) return;

            const pointerPos = stage.getPointerPosition();
            setSelectionBox({
                visible: false, // Only show after minimum drag
                startX: pointerPos.x,
                startY: pointerPos.y,
                currentX: pointerPos.x,
                currentY: pointerPos.y,
            });
            setIsDraggingSelection(true);
        } else {
            checkDeselect(e);
        }
    };

    const handleMouseMove = (e: any) => {
        if (isPanning) {
            setPosition({
                x: e.evt.clientX - panStart.x,
                y: e.evt.clientY - panStart.y,
            });
        } else if (isDraggingSelection && selectionBox) {
            const stage = stageRef.current;
            if (!stage) return;

            const pointerPos = stage.getPointerPosition();
            const dx = Math.abs(pointerPos.x - selectionBox.startX);
            const dy = Math.abs(pointerPos.y - selectionBox.startY);

            // Show selection box after minimum drag distance (5px)
            const visible = dx > 5 || dy > 5;

            setSelectionBox({
                ...selectionBox,
                currentX: pointerPos.x,
                currentY: pointerPos.y,
                visible,
            });
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);

        // Handle drag selection completion
        if (isDraggingSelection && selectionBox && selectionBox.visible) {
            // Convert screen coordinates to canvas coordinates
            const x1 = (Math.min(selectionBox.startX, selectionBox.currentX) - position.x) / scale;
            const y1 = (Math.min(selectionBox.startY, selectionBox.currentY) - position.y) / scale;
            const x2 = (Math.max(selectionBox.startX, selectionBox.currentX) - position.x) / scale;
            const y2 = (Math.max(selectionBox.startY, selectionBox.currentY) - position.y) / scale;

            // Find all items within selection box
            const selectedItemIds: string[] = [];

            // Check layouts
            layouts.forEach(layout => {
                let itemBounds = { x1: 0, y1: 0, x2: 0, y2: 0 };

                if (layout.type === 'rect') {
                    itemBounds = {
                        x1: layout.x,
                        y1: layout.y,
                        x2: layout.x + (layout.width || 0),
                        y2: layout.y + (layout.height || 0),
                    };
                } else if (layout.type === 'poly' && layout.points) {
                    const xs = layout.points.filter((_, i) => i % 2 === 0).map(x => layout.x + x);
                    const ys = layout.points.filter((_, i) => i % 2 !== 0).map(y => layout.y + y);
                    itemBounds = {
                        x1: Math.min(...xs),
                        y1: Math.min(...ys),
                        x2: Math.max(...xs),
                        y2: Math.max(...ys),
                    };
                }

                // Check if item intersects with selection box
                if (!(itemBounds.x2 < x1 || itemBounds.x1 > x2 || itemBounds.y2 < y1 || itemBounds.y1 > y2)) {
                    selectedItemIds.push(layout.id);
                }
            });

            // Check machines
            machines.forEach(machine => {
                const itemBounds = {
                    x1: machine.x,
                    y1: machine.y,
                    x2: machine.x + machine.width,
                    y2: machine.y + machine.height,
                };

                // Check if item intersects with selection box
                if (!(itemBounds.x2 < x1 || itemBounds.x1 > x2 || itemBounds.y2 < y1 || itemBounds.y1 > y2)) {
                    selectedItemIds.push(machine.id);
                }
            });

            // Update selection
            if (selectedItemIds.length > 0) {
                // Select all items within the box
                // First, clear selection
                selectItem('', false);
                // Then add all items
                selectedItemIds.forEach((id, index) => {
                    // Don't select group members automatically for drag selection
                    selectItem(id, index > 0, false);
                });
            } else {
                selectItem('', false);
            }
        }

        setIsDraggingSelection(false);
        setSelectionBox(null);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
            }
            // ESC key to clear selection
            if (e.code === 'Escape') {
                selectItem('', false);
                setLastClickedItem(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectItem]);

    // Handle resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({ width: rect.width, height: rect.height });
            }
        };

        updateDimensions();
        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [ui.propertiesPanelVisible, ui.propertiesPanelPosition, ui.propertiesPanelSize]);

    const handleLineDblClick = (layout: LayoutItem, e: any) => {
        const stage = e.target.getStage();
        const mousePos = stage.getPointerPosition();
        const relX = mousePos.x - layout.x;
        const relY = mousePos.y - layout.y;

        const points = layout.points || [];
        let insertIndex = points.length;
        let minDist = Number.MAX_VALUE;

        // Find nearest segment
        for (let i = 0; i < points.length; i += 2) {
            const x1 = points[i];
            const y1 = points[i + 1];
            const x2 = points[(i + 2) % points.length];
            const y2 = points[(i + 3) % points.length];

            // Distance from point (relX, relY) to segment (x1,y1)-(x2,y2)
            const A = relX - x1;
            const B = relY - y1;
            const C = x2 - x1;
            const D = y2 - y1;

            const dot = A * C + B * D;
            const len_sq = C * C + D * D;
            let param = -1;
            if (len_sq !== 0) // in case of 0 length line
                param = dot / len_sq;

            let xx, yy;

            if (param < 0) {
                xx = x1;
                yy = y1;
            }
            else if (param > 1) {
                xx = x2;
                yy = y2;
            }
            else {
                xx = x1 + param * C;
                yy = y1 + param * D;
            }

            const dx = relX - xx;
            const dy = relY - yy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) {
                minDist = dist;
                insertIndex = i + 2; // Insert after the first point of the segment
            }
        }

        const newPoints = [...points];
        newPoints.splice(insertIndex, 0, relX, relY);
        updateLayout(layout.id, { points: newPoints });
        setTimeout(() => updateArea(layout.id), 0); // Defer slightly to ensure state update? Or just call it.
    };

    const handlePointDblClick = (layout: LayoutItem, index: number, e: any) => {
        e.cancelBubble = true;
        const newPoints = [...(layout.points || [])];
        // Remove x and y
        newPoints.splice(index, 2);
        updateLayout(layout.id, { points: newPoints });
    };

    const handleDragStart = (e: any) => {
        const id = e.target.id();
        if (!selectedIds.includes(id)) {
            selectItem(id, e.evt.shiftKey);
        }
    };

    const handleDragMove = (e: any) => {
        const id = e.target.id();
        const node = e.target;
        const newX = node.x();
        const newY = node.y();

        const layout = layouts.find(l => l.id === id);
        const machine = machines.find(m => m.id === id);
        const item = layout || machine;

        if (item && selectedIds.length > 1) {
            const dx = newX - item.x;
            const dy = newY - item.y;

            // Update positions of other selected items during drag
            selectedIds.forEach(sid => {
                if (sid === id) return; // Skip the dragged item itself

                const l = layouts.find(x => x.id === sid);
                if (l) {
                    const groupNode = layerRef.current?.findOne('#' + sid);
                    if (groupNode) {
                        groupNode.position({
                            x: l.x + dx,
                            y: l.y + dy
                        });
                    }
                }
                const m = machines.find(x => x.id === sid);
                if (m) {
                    const groupNode = layerRef.current?.findOne('#' + sid);
                    if (groupNode) {
                        groupNode.position({
                            x: m.x + dx,
                            y: m.y + dy
                        });
                    }
                }
            });
            layerRef.current?.batchDraw();
        }
    };

    const handleDragEnd = async (e: any) => {
        const id = e.target.id();
        const node = e.target;
        const newX = node.x();
        const newY = node.y();

        const layout = layouts.find(l => l.id === id);
        const machine = machines.find(m => m.id === id);
        const item = layout || machine;

        if (item) {
            const dx = newX - item.x;
            const dy = newY - item.y;

            selectedIds.forEach(sid => {
                const l = layouts.find(x => x.id === sid);
                if (l) {
                    updateLayout(sid, { x: l.x + dx, y: l.y + dy });
                }
                const m = machines.find(x => x.id === sid);
                if (m) {
                    updateMachine(sid, { x: m.x + dx, y: m.y + dy });
                }
            });
        }
    };

    const updateArea = async (id: string) => {
        const layout = layouts.find(l => l.id === id);
        if (!layout) return;

        let area = 0;
        if (layout.type === 'rect') {
            // @ts-ignore
            area = await window.electron.ipcRenderer.calculateArea(layout.width || 0, layout.height || 0);
        } else if (layout.type === 'poly' && layout.points) {
            // @ts-ignore
            area = await window.electron.ipcRenderer.calculatePolygonArea(layout.points);
        }
        updateLayout(id, { area });
    };

    // Update area when layout changes (debounced or on interaction end)
    // For now, let's call it on TransformEnd and PointDragEnd


    const { snapping } = useStore();
    const GRID_SIZE = 20;
    const SNAP_THRESHOLD = 10;

    const getSnapPos = (pos: { x: number, y: number }) => {
        if (!snapping.enabled) return pos;

        let { x, y } = pos;

        // Grid Snapping
        if (snapping.grid) {
            x = Math.round(x / GRID_SIZE) * GRID_SIZE;
            y = Math.round(y / GRID_SIZE) * GRID_SIZE;
        }

        // Object Snapping (Vertex/Center/Midpoints/Quarter points)
        if (snapping.vertex || snapping.center) {
            let snappedX = false;
            let snappedY = false;
            const snapPoints: { x: number, y: number }[] = [];

            // Collect all snap points from layouts
            for (const layout of layouts) {
                if (selectedIds.includes(layout.id)) continue;

                if (layout.type === 'rect') {
                    const left = layout.x;
                    const right = layout.x + (layout.width || 0);
                    const top = layout.y;
                    const bottom = layout.y + (layout.height || 0);
                    const centerX = layout.x + (layout.width || 0) / 2;
                    const centerY = layout.y + (layout.height || 0) / 2;
                    const quarter1X = layout.x + (layout.width || 0) / 4;
                    const quarter3X = layout.x + (layout.width || 0) * 3 / 4;
                    const quarter1Y = layout.y + (layout.height || 0) / 4;
                    const quarter3Y = layout.y + (layout.height || 0) * 3 / 4;

                    // Corners
                    snapPoints.push({ x: left, y: top });
                    snapPoints.push({ x: right, y: top });
                    snapPoints.push({ x: left, y: bottom });
                    snapPoints.push({ x: right, y: bottom });

                    // Centers and midpoints
                    snapPoints.push({ x: centerX, y: top });
                    snapPoints.push({ x: centerX, y: bottom });
                    snapPoints.push({ x: left, y: centerY });
                    snapPoints.push({ x: right, y: centerY });
                    snapPoints.push({ x: centerX, y: centerY }); // Center point

                    // Quarter points
                    snapPoints.push({ x: quarter1X, y: top });
                    snapPoints.push({ x: quarter3X, y: top });
                    snapPoints.push({ x: quarter1X, y: bottom });
                    snapPoints.push({ x: quarter3X, y: bottom });
                    snapPoints.push({ x: left, y: quarter1Y });
                    snapPoints.push({ x: right, y: quarter1Y });
                    snapPoints.push({ x: left, y: quarter3Y });
                    snapPoints.push({ x: right, y: quarter3Y });

                } else if (layout.type === 'poly' && layout.points) {
                    // Vertices
                    for (let i = 0; i < layout.points.length; i += 2) {
                        snapPoints.push({
                            x: layout.x + layout.points[i],
                            y: layout.y + layout.points[i + 1]
                        });
                    }

                    // Midpoints and quarter points of edges
                    for (let i = 0; i < layout.points.length; i += 2) {
                        const x1 = layout.x + layout.points[i];
                        const y1 = layout.y + layout.points[i + 1];
                        const x2 = layout.x + layout.points[(i + 2) % layout.points.length];
                        const y2 = layout.y + layout.points[(i + 3) % layout.points.length];

                        // Midpoint
                        snapPoints.push({
                            x: (x1 + x2) / 2,
                            y: (y1 + y2) / 2
                        });

                        // Quarter points
                        snapPoints.push({
                            x: x1 * 0.75 + x2 * 0.25,
                            y: y1 * 0.75 + y2 * 0.25
                        });
                        snapPoints.push({
                            x: x1 * 0.25 + x2 * 0.75,
                            y: y1 * 0.25 + y2 * 0.75
                        });
                    }
                }
            }

            // Snap to nearest point
            for (const point of snapPoints) {
                if (!snappedX && Math.abs(x - point.x) < SNAP_THRESHOLD) {
                    x = point.x;
                    snappedX = true;
                }
                if (!snappedY && Math.abs(y - point.y) < SNAP_THRESHOLD) {
                    y = point.y;
                    snappedY = true;
                }
                if (snappedX && snappedY) break;
            }
        }

        return { x, y };
    };

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#1e1e1e' }}>
            <Stage
                ref={stageRef}
                width={dimensions.width}
                height={dimensions.height}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={checkDeselect}
            >
                <Layer ref={layerRef}>
                    {/* Render Layouts */}
                    {layouts.map((layout) => {
                        if (layout.type === 'rect') {
                            const isSelected = selectedIds.includes(layout.id);
                            return (
                                <Group
                                    key={layout.id}
                                    id={layout.id}
                                    x={layout.x}
                                    y={layout.y}
                                    draggable
                                    dragBoundFunc={getSnapPos}
                                    onClick={(e) => {
                                        e.cancelBubble = true;
                                        const now = Date.now();
                                        const isGrouped = !!layout.groupId;
                                        const isAlreadySelected = selectedIds.includes(layout.id);

                                        // Nested selection logic for grouped items (second click to select individual)
                                        if (isGrouped && lastClickedItem && lastClickedItem.id === layout.id &&
                                            (now - lastClickedItem.timestamp) < DOUBLE_CLICK_THRESHOLD) {
                                            selectItem(layout.id, false, false);
                                            setLastClickedItem(null);
                                        } else if (isAlreadySelected && !e.evt.shiftKey) {
                                            // Clicking on selected item without shift - select only this one
                                            selectItem(layout.id, false, isGrouped);
                                            if (isGrouped) {
                                                setLastClickedItem({ id: layout.id, timestamp: now });
                                            }
                                        } else {
                                            // Clicking on unselected item or shift-click
                                            selectItem(layout.id, e.evt.shiftKey, true);
                                            if (isGrouped) {
                                                setLastClickedItem({ id: layout.id, timestamp: now });
                                            }
                                        }
                                    }}
                                    onDragStart={handleDragStart}
                                    onDragMove={handleDragMove}
                                    onDragEnd={handleDragEnd}
                                    onTransformEnd={async (e) => {
                                        const groupNode = e.target;
                                        const scaleX = groupNode.scaleX();
                                        const scaleY = groupNode.scaleY();

                                        groupNode.scaleX(1);
                                        groupNode.scaleY(1);

                                        const MIN_SIZE = 0.01;
                                        let newX = groupNode.x();
                                        let newY = groupNode.y();
                                        let newWidth = Math.max(MIN_SIZE, (layout.width || 0) * scaleX);
                                        let newHeight = Math.max(MIN_SIZE, (layout.height || 0) * scaleY);

                                        // Apply position locks
                                        if (layout.lockedX) newX = layout.x;
                                        if (layout.lockedY) newY = layout.y;

                                        // Apply dimension locks
                                        if (layout.lockedWidth) newWidth = layout.width || MIN_SIZE;
                                        if (layout.lockedHeight) newHeight = layout.height || MIN_SIZE;

                                        // Area lock: maintain area by adjusting the other dimension
                                        if (layout.lockedArea && layout.area && layout.area > 0) {
                                            const targetArea = layout.area;
                                            const widthChanged = Math.abs(scaleX - 1) > 0.001;
                                            const heightChanged = Math.abs(scaleY - 1) > 0.001;

                                            if (widthChanged && !layout.lockedWidth && !layout.lockedHeight) {
                                                // Width changed, adjust height to maintain area
                                                newHeight = Math.max(MIN_SIZE, targetArea / newWidth);
                                            } else if (heightChanged && !layout.lockedHeight && !layout.lockedWidth) {
                                                // Height changed, adjust width to maintain area
                                                newWidth = Math.max(MIN_SIZE, targetArea / newHeight);
                                            }
                                        }

                                        updateLayout(layout.id, {
                                            x: newX,
                                            y: newY,
                                            width: newWidth,
                                            height: newHeight,
                                            rotation: groupNode.rotation(),
                                        });

                                        // Update area only if not locked
                                        if (!layout.lockedArea) {
                                            updateArea(layout.id);
                                        }
                                    }}
                                >
                                    <Rect
                                        width={layout.width}
                                        height={layout.height}
                                        fill={layout.color}
                                        stroke={isSelected ? 'blue' : 'black'}
                                        strokeWidth={isSelected ? 1 : 1}
                                    />
                                    <Text
                                        width={layout.width}
                                        height={layout.height}
                                        text={(() => {
                                            const displayText = [
                                                layout.name || '',
                                                layout.area ? `${formatValue(layout.area)} ${getUnitLabel()}²` : ''
                                            ].filter(Boolean).join('\n');
                                            return displayText;
                                        })()}
                                        align="center"
                                        verticalAlign="middle"
                                        listening={false}
                                        fontSize={calculateFontSize(
                                            layout.width || 100,
                                            layout.height || 100,
                                            [
                                                layout.name || '',
                                                layout.area ? `${formatValue(layout.area)} ${getUnitLabel()}²` : ''
                                            ].filter(Boolean).join('\n')
                                        )}
                                    />
                                </Group>
                            );
                        } else if (layout.type === 'poly' && layout.points) {
                            const isSelected = selectedIds.includes(layout.id);
                            return (
                                <Group
                                    key={layout.id}
                                    id={layout.id}
                                    x={layout.x}
                                    y={layout.y}
                                    draggable
                                    dragBoundFunc={getSnapPos}
                                    onClick={(e) => {
                                        e.cancelBubble = true;
                                        const now = Date.now();
                                        const isGrouped = !!layout.groupId;
                                        const isAlreadySelected = selectedIds.includes(layout.id);

                                        // Nested selection logic for grouped items (second click to select individual)
                                        if (isGrouped && lastClickedItem && lastClickedItem.id === layout.id &&
                                            (now - lastClickedItem.timestamp) < DOUBLE_CLICK_THRESHOLD) {
                                            selectItem(layout.id, false, false);
                                            setLastClickedItem(null);
                                        } else if (isAlreadySelected && !e.evt.shiftKey) {
                                            // Clicking on selected item without shift - select only this one
                                            selectItem(layout.id, false, isGrouped);
                                            if (isGrouped) {
                                                setLastClickedItem({ id: layout.id, timestamp: now });
                                            }
                                        } else {
                                            // Clicking on unselected item or shift-click
                                            selectItem(layout.id, e.evt.shiftKey, true);
                                            if (isGrouped) {
                                                setLastClickedItem({ id: layout.id, timestamp: now });
                                            }
                                        }
                                    }}
                                    onDragStart={handleDragStart}
                                    onDragMove={handleDragMove}
                                    onDragEnd={handleDragEnd}
                                >
                                    <Line
                                        points={layout.points}
                                        closed
                                        fill={layout.color}
                                        stroke={isSelected ? 'blue' : 'black'}
                                        strokeWidth={2}
                                        onDblClick={(e) => handleLineDblClick(layout, e)}
                                    />
                                    <Text
                                        x={0}
                                        y={0}
                                        text={(() => {
                                            const displayText = [
                                                layout.name || '',
                                                layout.area ? `${formatValue(layout.area)} ${getUnitLabel()}²` : ''
                                            ].filter(Boolean).join('\n');
                                            return displayText;
                                        })()}
                                        offsetX={-1 * (layout.points?.reduce((sum, val, i) => i % 2 === 0 ? sum + val : sum, 0) || 0) / ((layout.points?.length || 2) / 2)}
                                        offsetY={-1 * (layout.points?.reduce((sum, val, i) => i % 2 !== 0 ? sum + val : sum, 0) || 0) / ((layout.points?.length || 2) / 2)}
                                        listening={false}
                                        fontSize={(() => {
                                            // Calculate bounding box for polygon
                                            const points = layout.points || [];
                                            if (points.length < 4) return 12;
                                            const xs = points.filter((_, i) => i % 2 === 0);
                                            const ys = points.filter((_, i) => i % 2 !== 0);
                                            const polyWidth = Math.max(...xs) - Math.min(...xs);
                                            const polyHeight = Math.max(...ys) - Math.min(...ys);
                                            return calculateFontSize(
                                                polyWidth,
                                                polyHeight,
                                                [
                                                    layout.name || '',
                                                    layout.area ? `${formatValue(layout.area)} ${getUnitLabel()}²` : ''
                                                ].filter(Boolean).join('\n')
                                            );
                                        })()}
                                        align="center"
                                    />
                                    {/* Render Anchors if selected */}
                                    {isSelected && layout.points.map((_coord, i) => {
                                        if (i % 2 !== 0) return null; // Only render for x coords (pairs)
                                        const x = layout.points![i];
                                        const y = layout.points![i + 1];
                                        return (
                                            <Circle
                                                key={i}
                                                x={x}
                                                y={y}
                                                radius={5}
                                                fill="white"
                                                stroke="blue"
                                                draggable
                                                onDragMove={(_e) => {
                                                    // We need to update the line points while dragging anchor
                                                    // But updating state on every move might be slow? 
                                                    // For now, let's try updating state.
                                                    // Actually, better to update state on DragEnd or use a local temp state?
                                                    // Let's try direct update first.
                                                    // Wait, the anchor is inside the Group.
                                                    // Dragging anchor moves it relative to Group.
                                                    // We need to prevent Group drag when dragging anchor?
                                                    // e.cancelBubble = true on dragStart?
                                                }}
                                                onDragStart={(e) => {
                                                    e.cancelBubble = true;
                                                }}
                                                onDragEnd={(e) => {
                                                    // Update the point in the layout
                                                    // The anchor position is relative to the Group (which is at layout.x, layout.y)
                                                    const newPoints = [...(layout.points || [])];
                                                    newPoints[i] = e.target.x();
                                                    newPoints[i + 1] = e.target.y();
                                                    updateLayout(layout.id, { points: newPoints });
                                                    updateArea(layout.id);
                                                }}
                                                onDblClick={(e) => handlePointDblClick(layout, i, e)}
                                            />
                                        );
                                    })}
                                </Group>
                            );
                        }
                        return null;
                    })}

                    {/* Render Machines */}
                    {machines.map((machine) => {
                        const isSelected = selectedIds.includes(machine.id);
                        return (
                            <Group
                                key={machine.id}
                                id={machine.id}
                                x={machine.x}
                                y={machine.y}
                                draggable
                                dragBoundFunc={getSnapPos}
                                onClick={(e) => {
                                    e.cancelBubble = true;
                                    const now = Date.now();
                                    const isGrouped = !!machine.groupId;
                                    const isAlreadySelected = selectedIds.includes(machine.id);

                                    // If already selected and not shift-clicking, just select this one (deselect others)
                                    if (isAlreadySelected && !e.evt.shiftKey) {
                                        // Nested selection logic for grouped items
                                        if (isGrouped && lastClickedItem && lastClickedItem.id === machine.id &&
                                            (now - lastClickedItem.timestamp) < DOUBLE_CLICK_THRESHOLD) {
                                            // Second click on same item - select individual only
                                            selectItem(machine.id, false, false);
                                            setLastClickedItem(null);
                                        } else {
                                            // First click on selected item - select this one only
                                            selectItem(machine.id, false, isGrouped);
                                            if (isGrouped) {
                                                setLastClickedItem({ id: machine.id, timestamp: now });
                                            }
                                        }
                                    } else if (!isAlreadySelected) {
                                        // Clicking on unselected item - select it (clears others unless shift)
                                        selectItem(machine.id, e.evt.shiftKey, true);
                                        if (isGrouped) {
                                            setLastClickedItem({ id: machine.id, timestamp: now });
                                        }
                                    }
                                }}
                                onDragStart={handleDragStart}
                                onDragMove={handleDragMove}
                                onDragEnd={handleDragEnd}
                            >
                                <Rect
                                    width={machine.width}
                                    height={machine.height}
                                    fill={machine.color}
                                    stroke={isSelected ? 'red' : 'green'}
                                    strokeWidth={isSelected ? 2 : 1}
                                />
                                <Text
                                    width={machine.width}
                                    height={machine.height}
                                    text={machine.name || ''}
                                    align="center"
                                    verticalAlign="middle"
                                    listening={false}
                                    fontSize={calculateFontSize(
                                        machine.width,
                                        machine.height,
                                        machine.name || 'Machine'
                                    )}
                                    fill="white"
                                />
                            </Group>
                        );
                    })}

                    {/* Drag Selection Box */}
                    {selectionBox && selectionBox.visible && (
                        <Rect
                            x={Math.min(selectionBox.startX, selectionBox.currentX)}
                            y={Math.min(selectionBox.startY, selectionBox.currentY)}
                            width={Math.abs(selectionBox.currentX - selectionBox.startX)}
                            height={Math.abs(selectionBox.currentY - selectionBox.startY)}
                            fill="rgba(0, 120, 255, 0.1)"
                            stroke="rgba(0, 120, 255, 0.5)"
                            strokeWidth={1}
                            listening={false}
                        />
                    )}

                    <Transformer ref={trRef} />
                </Layer>
            </Stage>
        </div >
    );
};

export default Canvas;
