import React from 'react';
import InteractiveElement from './InteractiveElement';

const ImageBackground = ({ initialProps, onChange, imageUrl }) => {
  return (
    <InteractiveElement initialProps={initialProps} onChange={onChange}>
      <img src={imageUrl} alt="Background" style={{ width: '100%', height: '100%' }} />
    </InteractiveElement>
  );
};

export default ImageBackground; 