import React from 'react';
import InteractiveElement from './InteractiveElement';

const MaxSelector = ({ initialProps, onChange, options = ["Option 1", "Option 2", "Option 3"] }) => {
  return (
    <InteractiveElement initialProps={initialProps} onChange={onChange}>
      <div style={{ padding: '10px', background: '#f0f0f0', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <strong>Max Selector</strong>
        {options.map((opt, index) => (
          <div key={index} style={{ margin: '5px 0', border: '1px solid #ccc', padding: '5px' }}>
            {opt}
          </div>
        ))}
      </div>
    </InteractiveElement>
  );
};

export default MaxSelector; 