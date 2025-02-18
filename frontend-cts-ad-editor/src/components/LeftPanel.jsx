import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import '../styles/LeftPanel.css';
import ModalUploadAsset from './modals/ModalUploadAsset';
import ModalUploadVideo from './modals/ModalUploadVideo';

const components = [
  { type: 'image', label: 'Image' },
  { type: 'invideo', label: 'InVideo' },
  { type: 'expandablevideo', label: 'ExpandableVideo' },
  { type: 'gallery', label: 'Gallery' },
  { type: 'maxselector', label: 'MaxSelector' },
  { type: 'carousel', label: 'Carousel' },
  { type: 'trivia', label: 'Trivia' },
  { type: 'poll', label: 'Poll' }
];

// Componente separado para el elemento arrastrable
function DraggableItem({ type, label, onClick }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'COMPONENT',
    item: { type },
    collect: monitor => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`draggable-item ${isDragging ? 'dragging' : ''}`}
      onClick={onClick}
    >
      {label}
    </div>
  );
}

const LeftPanel = () => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideoType, setSelectedVideoType] = useState(null);

  const handleComponentClick = (type) => {
    switch (type) {
      case 'image':
        setShowImageModal(true);
        break;
      case 'invideo':
      case 'expandablevideo':
        setSelectedVideoType(type);
        setShowVideoModal(true);
        break;
      default:
        break;
    }
  };

  return (
    <div className="left-panel">
      <h3>Componentes</h3>
      <div className="components-list">
        {components.map(comp => (
          <DraggableItem
            key={comp.type}
            type={comp.type}
            label={comp.label}
            onClick={() => handleComponentClick(comp.type)}
          />
        ))}
      </div>

      {showImageModal && (
        <ModalUploadAsset onClose={() => setShowImageModal(false)} />
      )}
      
      {showVideoModal && (
        <ModalUploadVideo 
          onClose={() => {
            setShowVideoModal(false);
            setSelectedVideoType(null);
          }}
          type={selectedVideoType}
        />
      )}
    </div>
  );
};

export default LeftPanel; 