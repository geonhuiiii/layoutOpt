import React from 'react';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import { useStore } from './store/useStore';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

function App() {
  const {
    addLayout,
    addMachine,
    selectedIds,
    groupItems,
    ungroupItems,
    snapping,
    setSnapping,
    unit,
    setUnit,
    scale,
    setScale,
    setPosition,
    ui,
    setPropertiesPanelVisible,
    setPropertiesPanelPosition,
  } = useStore();

  const handleAddRect = async () => {
    const id = uuidv4();
    // @ts-ignore - Calculate initial area via IPC
    const area = await window.electron.ipcRenderer.calculateArea(100, 100);
    addLayout({
      id,
      type: 'rect',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      rotation: 0,
      color: 'rgba(200, 200, 200, 0.5)',
      area,
    });
  };

  const handleAddPoly = async () => {
    const id = uuidv4();
    const points = [0, 0, 100, 0, 100, 100, 50, 150, 0, 100];
    // @ts-ignore - Calculate initial area via IPC
    const area = await window.electron.ipcRenderer.calculatePolygonArea(points);
    addLayout({
      id,
      type: 'poly',
      x: 300,
      y: 100,
      points,
      rotation: 0,
      color: 'rgba(200, 200, 200, 0.5)',
      area,
    });
  }

  const handleAddMachine = () => {
    addMachine({
      id: uuidv4(),
      name: 'Machine 1',
      x: 200,
      y: 200,
      width: 50,
      height: 50,
      rotation: 0,
      color: 'orange',
    });
  };


  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedIds, removeLayout, removeMachine } = useStore.getState();
        selectedIds.forEach(id => {
          removeLayout(id);
          removeMachine(id);
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  return (
    <div className="app-container">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-section">
          <span className="section-label">Drawing</span>
          <button onClick={handleAddRect}>□ Rect</button>
          <button onClick={handleAddPoly}>⬡ Polygon</button>
          <button onClick={handleAddMachine}>⚙ Machine</button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-section">
          <span className="section-label">Edit</span>
          <button onClick={groupItems}>⊞ Group</button>
          <button onClick={ungroupItems} disabled={selectedIds.length === 0}>
            ⊟ Ungroup
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-section">
          <span className="section-label">Snapping</span>
          <label className="checkbox-label">
            <input type="checkbox" checked={snapping.enabled} onChange={(e) => setSnapping({ enabled: e.target.checked })} />
            <span>Enabled</span>
          </label>
          {snapping.enabled && (
            <>
              <label className="checkbox-label">
                <input type="checkbox" checked={snapping.grid} onChange={(e) => setSnapping({ grid: e.target.checked })} />
                <span>Grid</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={snapping.vertex} onChange={(e) => setSnapping({ vertex: e.target.checked })} />
                <span>Objects</span>
              </label>
            </>
          )}
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-section">
          <span className="section-label">Unit</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value as 'px' | 'mm' | 'm')} className="unit-select">
            <option value="px">px</option>
            <option value="mm">mm</option>
            <option value="m">m</option>
          </select>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-section">
          <span className="section-label">Zoom</span>
          <button onClick={() => setScale(Math.min(10, scale * 1.2))} title="Zoom In">🔍+</button>
          <button onClick={() => setScale(Math.max(0.1, scale * 0.8))} title="Zoom Out">🔍-</button>
          <button onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }} title="Reset View">↺</button>
          <span className="zoom-level">{Math.round(scale * 100)}%</span>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-section">
          <span className="section-label">View</span>
          <button
            onClick={() => setPropertiesPanelVisible(!ui.propertiesPanelVisible)}
            className={ui.propertiesPanelVisible ? 'active' : ''}
            title="Toggle Properties Panel"
          >
            📋
          </button>
          <select
            value={ui.propertiesPanelPosition}
            onChange={(e) => setPropertiesPanelPosition(e.target.value as any)}
            className="panel-position-select"
            disabled={!ui.propertiesPanelVisible}
          >
            <option value="left">← Left</option>
            <option value="right">Right →</option>
            <option value="top">↑ Top</option>
            <option value="bottom">Bottom ↓</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.85em', opacity: 0.7 }}>Layout Maker v0.2</span>
        </div>
      </div>

      {/* Main Area */}
      <div className="main-area">
        {/* Panel: Top */}
        {ui.propertiesPanelVisible && ui.propertiesPanelPosition === 'top' && (
          <div className="panel-container panel-top" style={{ height: `${ui.propertiesPanelSize}px` }}>
            <PropertiesPanel />
          </div>
        )}

        {/* Middle Row */}
        <div className="middle-row">
          {/* Panel: Left */}
          {ui.propertiesPanelVisible && ui.propertiesPanelPosition === 'left' && (
            <div className="panel-container panel-left" style={{ width: `${ui.propertiesPanelSize}px` }}>
              <PropertiesPanel />
            </div>
          )}

          {/* Canvas */}
          <div className="canvas-container">
            <Canvas />
          </div>

          {/* Panel: Right */}
          {ui.propertiesPanelVisible && ui.propertiesPanelPosition === 'right' && (
            <div className="panel-container panel-right" style={{ width: `${ui.propertiesPanelSize}px` }}>
              <PropertiesPanel />
            </div>
          )}
        </div>

        {/* Panel: Bottom */}
        {ui.propertiesPanelVisible && ui.propertiesPanelPosition === 'bottom' && (
          <div className="panel-container panel-bottom" style={{ height: `${ui.propertiesPanelSize}px` }}>
            <PropertiesPanel />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
