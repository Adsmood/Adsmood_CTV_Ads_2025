import React, { useContext } from 'react';
import './Timeline.css';
import { EditorContext } from '../context/EditorContext';

const Timeline = () => {
  const { currentTime, updateCurrentTime } = useContext(EditorContext);

  const handleTimeChange = (e) => {
    updateCurrentTime(parseFloat(e.target.value));
  };

  return (
    <div className="timeline-container">
      <label>Tiempo: {currentTime}s</label>
      <input type="range" min="0" max="5" step="0.1" value={currentTime} onChange={handleTimeChange} />
    </div>
  );
};

export default Timeline; 