import React, { useState } from 'react';
import InteractiveElement from './InteractiveElement';

const ExpandableVideo = ({ initialProps, onChange, videoUrl }) => {
  const [expanded, setExpanded] = useState(false);
  
  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  
  return (
    <InteractiveElement initialProps={initialProps} onChange={onChange}>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <video src={videoUrl} style={{ width: '100%', height: '100%' }} autoPlay loop muted />
        <button onClick={toggleExpand} style={{ position: 'absolute', bottom: '10px', right: '10px', padding: '5px 10px' }}>
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
    </InteractiveElement>
  );
};

export default ExpandableVideo; 