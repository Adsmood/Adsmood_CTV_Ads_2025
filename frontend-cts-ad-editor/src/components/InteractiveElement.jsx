import React, { useContext, useState } from 'react';
import Rnd from 'react-rnd';
import './InteractiveElement.css';
import { EditorContext } from '../context/EditorContext';

const snapGrid = 10;

const InteractiveElement = ({ initialProps, onChange, children }) => {
  const { transformMode } = useContext(EditorContext);
  const [state, setState] = useState({
    x: initialProps.x || 0,
    y: initialProps.y || 0,
    width: initialProps.width || 200,
    height: initialProps.height || 150,
    rotation: initialProps.rotation || 0
  });

  const handleDragStop = (e, d) => {
    const newX = Math.round(d.x / snapGrid) * snapGrid;
    const newY = Math.round(d.y / snapGrid) * snapGrid;
    const newState = { ...state, x: newX, y: newY };
    setState(newState);
    onChange && onChange(newState);
  };

  const handleResizeStop = (e, direction, ref, delta, position) => {
    const newWidth = Math.round(ref.offsetWidth / snapGrid) * snapGrid;
    const newHeight = Math.round(ref.offsetHeight / snapGrid) * snapGrid;
    const newX = Math.round(position.x / snapGrid) * snapGrid;
    const newY = Math.round(position.y / snapGrid) * snapGrid;
    const newState = { ...state, width: newWidth, height: newHeight, x: newX, y: newY };
    setState(newState);
    onChange && onChange(newState);
  };

  const startRotation = (e) => {
    e.stopPropagation();
    const centerX = state.width / 2;
    const centerY = state.height / 2;
    const startAngle = Math.atan2(e.clientY - (state.y + centerY), e.clientX - (state.x + centerX)) * 180 / Math.PI;
    const initialRotation = state.rotation;
    const onMouseMove = (moveEvent) => {
      const angle = Math.atan2(moveEvent.clientY - (state.y + centerY), moveEvent.clientX - (state.x + centerX)) * 180 / Math.PI;
      const newRotation = initialRotation + (angle - startAngle);
      const updated = { ...state, rotation: newRotation };
      setState(updated);
      onChange && onChange(updated);
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <Rnd
      size={{ width: state.width, height: state.height }}
      position={{ x: state.x, y: state.y }}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      bounds="parent"
      dragGrid={[snapGrid, snapGrid]}
      resizeGrid={[snapGrid, snapGrid]}
      enableResizing={{
        bottom: true, bottomLeft: true, bottomRight: true,
        left: true, right: true, top: true, topLeft: true, topRight: true
      }}
      lockAspectRatio={transformMode}
    >
      <div
        className="interactive-element"
        style={{
          width: '100%',
          height: '100%',
          transform: `rotate(${state.rotation}deg)`,
          position: 'relative'
        }}
      >
        {children}
        <div className="rotation-handle" onMouseDown={startRotation} />
      </div>
    </Rnd>
  );
};

export default InteractiveElement; 