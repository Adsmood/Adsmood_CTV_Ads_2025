import React from 'react';
import InteractiveElement from './InteractiveElement';

const InVideo = ({ initialProps, onChange, videoUrl }) => {
  return (
    <InteractiveElement initialProps={initialProps} onChange={onChange}>
      <video src={videoUrl} style={{ width: '100%', height: '100%' }} autoPlay loop muted />
    </InteractiveElement>
  );
};

export default InVideo; 