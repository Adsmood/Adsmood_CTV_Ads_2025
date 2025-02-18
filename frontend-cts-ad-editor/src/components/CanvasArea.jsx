import React, { useContext, useRef } from 'react';
import { useDrop } from 'react-dnd';
import '../styles/CanvasArea.css';
import { EditorContext } from '../context/EditorContext';

// Importando todos los componentes interactivos
import ButtonInteractive from './ButtonInteractive';
import QRScan from './QRScan';
import ImageBackground from './ImageBackground';
import InVideo from './InVideo';
import MaxSelector from './MaxSelector';
import ExpandableVideo from './ExpandableVideo';
import InStreamInteractiveCarousel from './InStreamInteractiveCarousel';
import InStreamInteractiveTrivia from './InStreamInteractiveTrivia';
import InStreamInteractivePoll from './InStreamInteractivePoll';

const CanvasArea = () => {
  const canvasRef = useRef(null);
  const { layers, addLayer, updateSelectedLayerProps, selectLayer } = useContext(EditorContext);

  const [, drop] = useDrop(() => ({
    accept: 'COMPONENT',
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = offset.x - canvasRect.left;
      const y = offset.y - canvasRect.top;
      addLayer(item.type, x, y);
    }
  }));

  const renderLayer = (layer) => {
    const props = {
      initialProps: layer.keyframes[0],
      onChange: (newProps) => {
        updateSelectedLayerProps(newProps);
      },
      onClick: () => selectLayer(layer.id)
    };

    switch (layer.type) {
      case 'button':
        return <ButtonInteractive {...props} label="Click Me" />;
      case 'qr':
        return <QRScan {...props} qrUrl={layer.assetUrl || 'https://placeholder-qr.com'} />;
      case 'background':
        return <ImageBackground {...props} imageUrl={layer.assetUrl} />;
      case 'invideo':
        return <InVideo {...props} videoUrl={layer.assetUrl} />;
      case 'maxselector':
        return <MaxSelector {...props} />;
      case 'expandablevideo':
        return <ExpandableVideo {...props} videoUrl={layer.assetUrl} />;
      case 'carousel':
        return <InStreamInteractiveCarousel {...props} items={layer.items || []} />;
      case 'trivia':
        return <InStreamInteractiveTrivia {...props} />;
      case 'poll':
        return <InStreamInteractivePoll {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="canvas-area" ref={drop}>
      <div className="canvas" ref={canvasRef}>
        {layers.map(layer => (
          <div key={layer.id}>
            {renderLayer(layer)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CanvasArea; 