import React, { useState } from 'react';
import InteractiveElement from './InteractiveElement';

const InStreamInteractiveCarousel = ({ initialProps, onChange, items = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const prevItem = () => {
    setCurrentIndex((currentIndex - 1 + items.length) % items.length);
  };
  const nextItem = () => {
    setCurrentIndex((currentIndex + 1) % items.length);
  };

  return (
    <InteractiveElement initialProps={initialProps} onChange={onChange}>
      <div style={{ width: '100%', height: '100%', position: 'relative', background: '#fff' }}>
        {items.length > 0 ? (
          <img src={items[currentIndex]} alt={`Carousel ${currentIndex}`} style={{ width: '100%', height: '100%' }} />
        ) : (
          <div style={{ textAlign: 'center', paddingTop: '20px' }}>Carousel (No items)</div>
        )}
        <button onClick={prevItem} style={{ position: 'absolute', top: '50%', left: '10px' }}>{"<"}</button>
        <button onClick={nextItem} style={{ position: 'absolute', top: '50%', right: '10px' }}>{">"}</button>
      </div>
    </InteractiveElement>
  );
};

export default InStreamInteractiveCarousel; 