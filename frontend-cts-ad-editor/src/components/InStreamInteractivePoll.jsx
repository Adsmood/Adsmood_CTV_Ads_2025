import React, { useState } from 'react';
import InteractiveElement from './InteractiveElement';

const InStreamInteractivePoll = ({ initialProps, onChange, question = "Poll Question?", options = ["Option 1", "Option 2", "Option 3"] }) => {
  const [votes, setVotes] = useState(options.map(() => 0));
  
  const voteOption = (index) => {
    const newVotes = [...votes];
    newVotes[index] += 1;
    setVotes(newVotes);
  };

  return (
    <InteractiveElement initialProps={initialProps} onChange={onChange}>
      <div style={{ padding: '10px', background: '#fff', width: '100%', height: '100%' }}>
        <strong>{question}</strong>
        <div>
          {options.map((option, index) => (
            <div key={index} style={{ margin: '5px 0' }}>
              <button onClick={() => voteOption(index)}>{option}</button>
              <span style={{ marginLeft: '10px' }}>Votes: {votes[index]}</span>
            </div>
          ))}
        </div>
      </div>
    </InteractiveElement>
  );
};

export default InStreamInteractivePoll; 