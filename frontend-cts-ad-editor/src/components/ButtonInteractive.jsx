import React from 'react';
import InteractiveElement from './InteractiveElement';

const ButtonInteractive = ({ initialProps, onChange, label, onClick }) => {
  return (
    <InteractiveElement initialProps={initialProps} onChange={onChange}>
      <button style={{ width: '100%', height: '100%' }} onClick={onClick}>
        {label}
      </button>
    </InteractiveElement>
  );
};

export default ButtonInteractive; 