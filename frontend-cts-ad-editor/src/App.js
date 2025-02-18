import React, { useContext, useEffect } from 'react';
import { EditorProvider, EditorContext } from './context/EditorContext';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import TopBar from './components/TopBar';
import LeftPanel from './components/LeftPanel';
import CanvasArea from './components/CanvasArea';
import RightPanel from './components/RightPanel';
import Timeline from './components/Timeline';

function AppContent() {
  const { toggleTransformMode } = useContext(EditorContext);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        toggleTransformMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTransformMode]);

  return (
    <div className="app-container">
      <TopBar />
      <div className="main-layout">
        <LeftPanel />
        <CanvasArea />
        <RightPanel />
      </div>
      <Timeline />
    </div>
  );
}

function App() {
  return (
    <EditorProvider>
      <DndProvider backend={HTML5Backend}>
        <AppContent />
      </DndProvider>
    </EditorProvider>
  );
}

export default App; 