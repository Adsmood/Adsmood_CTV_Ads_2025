import React, { useContext, useState, useEffect } from 'react';
import '../styles/RightPanel.css';
import { EditorContext } from '../context/EditorContext';

const RightPanel = () => {
  const {
    selectedLayerId,
    getSelectedLayer,
    currentTime,
    addKeyframeAtCurrentTime,
    updateSelectedLayerProps
  } = useContext(EditorContext);

  const [localProps, setLocalProps] = useState({ x: 0, y: 0, scale: 1, opacity: 1, rotation: 0 });

  const selectedLayer = getSelectedLayer();

  useEffect(() => {
    if (!selectedLayer) return;
    const kf = selectedLayer.keyframes.reduce((prev, curr) =>
      curr.time <= currentTime ? curr : prev
    );
    setLocalProps({
      x: kf.x || 0,
      y: kf.y || 0,
      scale: kf.scale || 1,
      opacity: kf.opacity || 1,
      rotation: kf.rotation || 0
    });
  }, [selectedLayer, currentTime]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalProps(prev => ({ ...prev, [name]: parseFloat(value) }));
    updateSelectedLayerProps({ [name]: parseFloat(value) });
  };

  const handleAddKeyframe = () => {
    if (!selectedLayerId) return;
    addKeyframeAtCurrentTime(selectedLayerId, { ...localProps });
  };

  if (!selectedLayer) {
    return (
      <div className="right-panel">
        <h4>Propiedades</h4>
        <p>Selecciona un layer</p>
      </div>
    );
  }

  return (
    <div className="right-panel">
      <h4>Propiedades - {selectedLayer.type}</h4>
      <div className="prop-row">
        <label>X:</label>
        <input type="number" name="x" value={localProps.x} onChange={handleChange} />
      </div>
      <div className="prop-row">
        <label>Y:</label>
        <input type="number" name="y" value={localProps.y} onChange={handleChange} />
      </div>
      <div className="prop-row">
        <label>Scale:</label>
        <input type="number" step="0.1" name="scale" value={localProps.scale} onChange={handleChange} />
      </div>
      <div className="prop-row">
        <label>Opacity:</label>
        <input type="number" step="0.1" min="0" max="1" name="opacity" value={localProps.opacity} onChange={handleChange} />
      </div>
      <div className="prop-row">
        <label>Rotation:</label>
        <input type="number" step="1" name="rotation" value={localProps.rotation} onChange={handleChange} />
      </div>
      <button onClick={handleAddKeyframe}>Add Keyframe @ {currentTime}s</button>
    </div>
  );
};

export default RightPanel; 