import React, { useState } from 'react';
import '../styles/LeftPanel.css';
import { useDrag } from 'react-dnd';
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

  const renderComponent = (comp) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'COMPONENT',
      item: { type: comp.type },
      collect: monitor => ({
        isDragging: !!monitor.isDragging(),
      }),
    });

    return (
      <div
        key={comp.type}
        ref={drag}
        className={`draggable-item ${isDragging ? 'dragging' : ''}`}
        onClick={() => handleComponentClick(comp.type)}
      >
        {comp.label}
      </div>
    );
  };

  return (
    <div className="left-panel">
      <h3>Componentes</h3>
      <div className="components-list">
        {components.map(comp => renderComponent(comp))}
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