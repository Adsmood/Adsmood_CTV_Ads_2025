import React, { useState, useContext } from 'react';
import axios from 'axios';
import '../../styles/ModalUploadAsset.css';
import { EditorContext } from '../../context/EditorContext';

const ModalUploadVideo = ({ onClose, type = 'invideo' }) => {
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
      
      const videoUrl = res.data.url;
      const newLayerId = addLayer(type, 100, 100);
      setLayerAssetUrl(newLayerId, videoUrl);
      alert('Video subido con éxito');
      onClose();
    } catch (error) {
      console.error('Error subiendo video:', error);
      alert('Error al subir el video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Subir Video</h3>
        <input 
          type="file" 
          onChange={e => setFile(e.target.files[0])} 
          accept="video/mp4,video/x-m4v,video/*"
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

export default ModalUploadVideo; 