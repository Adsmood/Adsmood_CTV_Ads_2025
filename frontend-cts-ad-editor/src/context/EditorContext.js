import React, { createContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const EditorContext = createContext();

export const EditorProvider = ({ children }) => {
  const [layers, setLayers] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [transformMode, setTransformMode] = useState(false); // Modo transformación (Ctrl+T / Cmd+T)

  const toggleTransformMode = () => {
    setTransformMode(prev => !prev);
  };

  const addLayer = (type, x, y) => {
    const newLayer = {
      id: uuidv4(),
      type,
      keyframes: [
        {
          time: 0,
          x,
          y,
          width: 200,
          height: 150,
          scale: 1,
          opacity: 1,
          rotation: 0
        }
      ],
      assetUrl: '',
      items: [] // Por ejemplo, para carousel
    };
    setLayers(prev => [...prev, newLayer]);
    return newLayer.id;
  };

  const updateCurrentTime = (time) => {
    setCurrentTime(time);
  };

  const selectLayer = (layerId) => {
    setSelectedLayerId(layerId);
  };

  const getSelectedLayer = () => layers.find(l => l.id === selectedLayerId);

  const addKeyframeAtCurrentTime = (layerId, props) => {
    setLayers(prev =>
      prev.map(layer => {
        if (layer.id !== layerId) return layer;
        const existing = layer.keyframes.find(k => k.time === currentTime);
        if (existing) {
          Object.assign(existing, props);
          return { ...layer };
        } else {
          const newKeyframe = { time: currentTime, ...props };
          return { ...layer, keyframes: [...layer.keyframes, newKeyframe].sort((a, b) => a.time - b.time) };
        }
      })
    );
  };

  const updateSelectedLayerProps = (props) => {
    if (!selectedLayerId) return;
    setLayers(prev =>
      prev.map(layer => {
        if (layer.id !== selectedLayerId) return layer;
        let newKeyframes = [...layer.keyframes];
        let foundIndex = -1;
        for (let i = 0; i < newKeyframes.length; i++) {
          if (newKeyframes[i].time <= currentTime) foundIndex = i;
          else break;
        }
        if (foundIndex === -1) foundIndex = 0;
        Object.assign(newKeyframes[foundIndex], props);
        return { ...layer, keyframes: newKeyframes };
      })
    );
  };

  const setLayerAssetUrl = (layerId, url) => {
    setLayers(prev =>
      prev.map(layer => (layer.id === layerId ? { ...layer, assetUrl: url } : layer))
    );
  };

  const getProjectData = () => ({
    layers,
    totalDuration: 5,
    createdAt: new Date().toISOString()
  });

  return (
    <EditorContext.Provider
      value={{
        layers,
        addLayer,
        currentTime,
        updateCurrentTime,
        selectedLayerId,
        selectLayer,
        getSelectedLayer,
        addKeyframeAtCurrentTime,
        updateSelectedLayerProps,
        setLayerAssetUrl,
        getProjectData,
        transformMode,
        toggleTransformMode
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}; 