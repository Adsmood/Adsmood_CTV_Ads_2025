import React, { useState } from 'react';
import './LeftPanel.css';
import { useDrag } from 'react-dnd';
import ModalUploadAsset from './ModalUploadAsset';

const LeftPanel = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const componentsList = [
    { type: 'background', label: 'Background' },
    { type: 'button', label: 'Button' },
    { type: 'qr', label: 'QR Scan' },
    { type: 'invideo', label: 'InVideo' },
    { type: 'gallery', label: 'Gallery' },
    { type: 'image', label: 'Image' },
    { type: 'maxselector', label: 'Max Selector' },
    { type: 'expandablevideo', label: 'Expandable Video' },
    { type: 'carousel', label: 'Interactive Carousel' },
    { type: 'trivia', label: 'Interactive Trivia' },
    { type: 'poll', label: 'Interactive Poll' }
  ];

  const handleImageClick = () => setShowUploadModal(true);

  const DraggableItem = ({ type, label }) => {
    const [{ isDragging }, dragRef] = useDrag(() => ({
      type: 'COMPONENT',
      item: { type },
      collect: monitor => ({ isDragging: monitor.isDragging() })
    }));
    return (
      <div ref={dragRef} className="draggable-item" style={{ opacity: isDragging ? 0.5 : 1 }}>
        {label}
      </div>
    );
  };

  return (
    <div className="left-panel">
      <h4>Componentes</h4>
      <div className="components-list">
        {componentsList.map(comp =>
          comp.type === 'image' ? (
            <div key={comp.type} className="draggable-item" onClick={handleImageClick}>
              {comp.label}
            </div>
          ) : (
            <DraggableItem key={comp.type} type={comp.type} label={comp.label} />
          )
        )}
      </div>
      {showUploadModal && <ModalUploadAsset onClose={() => setShowUploadModal(false)} />}
    </div>
  );
};

export default LeftPanel; 