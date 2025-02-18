import React, { useState } from 'react';
import InteractiveElement from './InteractiveElement';

const InStreamInteractiveTrivia = ({ initialProps, onChange, question = "Trivia Question?", choices = ["A", "B", "C", "D"] }) => {
  const [selected, setSelected] = useState(null);
  
  return (
    <InteractiveElement initialProps={initialProps} onChange={onChange}>
      <div style={{ padding: '10px', background: '#fff', width: '100%', height: '100%' }}>
        <strong>{question}</strong>
        <div>
          {choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => setSelected(index)}
              style={{
                margin: '5px',
                backgroundColor: selected === index ? '#4e2aad' : '#ccc'
              }}
            >
              {choice}
            </button>
          ))}
        </div>
      </div>
    </InteractiveElement>
  );
};

export default InStreamInteractiveTrivia; 