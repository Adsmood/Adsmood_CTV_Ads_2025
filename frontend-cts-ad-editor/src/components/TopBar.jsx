import React, { useContext } from 'react';
import '../styles/TopBar.css';
import axios from 'axios';
import { EditorContext } from '../context/EditorContext';

const TopBar = () => {
  const { getProjectData } = useContext(EditorContext);

  const handleSaveProject = async () => {
    try {
      const projectData = getProjectData();
      // Reemplaza con la URL real de tu backend
      const res = await axios.post('https://TU_BACKEND_URL/projects/save', projectData);
      alert('Proyecto guardado con éxito: ' + res.data.projectId);
    } catch (error) {
      console.error('Error guardando proyecto:', error);
      alert('Error al guardar proyecto');
    }
  };

  const handleExportXML = async () => {
    try {
      // Reemplaza con la URL real de tu endpoint VAST
      const res = await axios.get('https://TU_BACKEND_URL/vast/generate');
      const xmlWindow = window.open('', '_blank');
      xmlWindow.document.write('<pre>' + res.data + '</pre>');
    } catch (error) {
      console.error('Error exportando XML:', error);
      alert('Error al exportar XML');
    }
  };

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <span className="logo">CTV Interactive Editor</span>
        <span className="menu-item">Archivo</span>
        <span className="menu-item">Edición</span>
        <span className="menu-item">Ver</span>
        <span className="menu-item">Ayuda</span>
      </div>
      <div className="top-bar-right">
        <button onClick={handleSaveProject}>Guardar Proyecto</button>
        <button onClick={handleExportXML}>Exportar XML</button>
      </div>
    </div>
  );
};

export default TopBar; 