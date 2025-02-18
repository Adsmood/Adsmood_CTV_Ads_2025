import React, { useState, useContext } from 'react';
import axios from 'axios';
import '../styles/ModalUploadAsset.css';
import { EditorContext } from '../context/EditorContext';

const ModalUploadAsset = ({ onClose }) => {
  const { addLayer, setLayerAssetUrl } = useContext(EditorContext);
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('asset', file);
      // Reemplaza con la URL real de tu Assets Service
      const res = await axios.post('https://TU_ASSETS_SERVICE_URL/api/assets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const assetUrl = res.data.url;
      const newLayerId = addLayer('image', 100, 100);
      setLayerAssetUrl(newLayerId, assetUrl);
      alert('Imagen subida con éxito');
      onClose();
    } catch (error) {
      console.error('Error subiendo asset:', error);
      alert('Error al subir');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Subir Imagen</h3>
        <input type="file" onChange={e => setFile(e.target.files[0])} accept="image/*" />
        <div className="modal-actions">
          <button onClick={onClose}>Cancelar</button>
          <button onClick={handleUpload} disabled={!file}>Subir</button>
        </div>
      </div>
    </div>
  );
};

export default ModalUploadAsset; 