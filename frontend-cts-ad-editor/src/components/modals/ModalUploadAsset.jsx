import React, { useState, useContext } from 'react';
import axios from 'axios';
import '../../styles/ModalUploadAsset.css';
import { EditorContext } from '../../context/EditorContext';

const ModalUploadAsset = ({ onClose }) => {
  const { addLayer, setLayerAssetUrl } = useContext(EditorContext);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('asset', file);
      
      const res = await axios.post('https://adsmood-ctv-assets.onrender.com/api/assets/upload', formData, {
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
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Subir Imagen</h3>
        <input 
          type="file" 
          onChange={e => setFile(e.target.files[0])} 
          accept="image/*"
          disabled={uploading}
        />
        <div className="modal-actions">
          <button onClick={onClose} disabled={uploading}>Cancelar</button>
          <button 
            onClick={handleUpload} 
            disabled={!file || uploading}
          >
            {uploading ? 'Subiendo...' : 'Subir'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalUploadAsset; 