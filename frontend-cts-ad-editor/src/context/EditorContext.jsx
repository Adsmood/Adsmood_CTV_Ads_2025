import React, { createContext, useState, useCallback } from 'react';
import axios from 'axios';

export const EditorContext = createContext();

export const EditorProvider = ({ children }) => {
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [transformMode, setTransformMode] = useState(false);

  const addLayer = useCallback((type, x, y) => {
    const newLayer = {
      id: Date.now(),
      type,
      keyframes: [{
        x,
        y,
        width: 200,
        height: 150,
        rotation: 0,
        opacity: 1
      }],
      assetUrl: null
    };
    setLayers(prev => [...prev, newLayer]);
    return newLayer.id;
  }, []);

  const updateSelectedLayerProps = useCallback((newProps) => {
    if (!selectedLayerId) return;
    setLayers(prev => prev.map(layer => 
      layer.id === selectedLayerId 
        ? { ...layer, keyframes: [{ ...layer.keyframes[0], ...newProps }] }
        : layer
    ));
  }, [selectedLayerId]);

  const setLayerAssetUrl = useCallback(async (layerId, file) => {
    try {
      const formData = new FormData();
      formData.append('asset', file);
      
      const response = await axios.post('https://adsmood-ctv-assets.onrender.com/api/assets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setLayers(prev => prev.map(layer =>
        layer.id === layerId
          ? { ...layer, assetUrl: response.data.url }
          : layer
      ));

      return response.data.url;
    } catch (error) {
      console.error('Error uploading asset:', error);
      throw error;
    }
  }, []);

  const selectLayer = useCallback((id) => {
    setSelectedLayerId(id);
  }, []);

  const deleteSelectedLayer = useCallback(() => {
    if (!selectedLayerId) return;
    setLayers(prev => prev.filter(layer => layer.id !== selectedLayerId));
    setSelectedLayerId(null);
  }, [selectedLayerId]);

  return (
    <EditorContext.Provider value={{
      layers,
      selectedLayerId,
      transformMode,
      addLayer,
      updateSelectedLayerProps,
      setLayerAssetUrl,
      selectLayer,
      deleteSelectedLayer,
      setTransformMode
    }}>
      {children}
    </EditorContext.Provider>
  );
}; 