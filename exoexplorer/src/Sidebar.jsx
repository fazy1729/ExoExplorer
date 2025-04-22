import React from 'react';
import './Sidebar.css';

const Sidebar = ({ celestialObject, onNext, onPrev, onToggleView, viewMode }) => {
  if (!celestialObject) return null;

  return (
    <div className="sidebar">
      <h2>{celestialObject.name}</h2>
      <p>Type: {celestialObject.type}</p>
      
      {celestialObject.type === 'Star' ? (
        <>
          <p>Magnitude: {celestialObject.magnitude?.toFixed(2)}</p>
          <p>Color Index: {celestialObject.color_index?.toFixed(2)}</p>
          <p>Distance: {celestialObject.parallax ? (1000/celestialObject.parallax).toFixed(2) + ' parsecs' : 'Unknown'}</p>
        </>
      ) : (
        <>
          <p>{celestialObject.description}</p>
          <p>Radius: {celestialObject.radius} Earth radii</p>
        </>
      )}
      
      <div className="navigation">
        <button onClick={onPrev}>Previous</button>
        <button onClick={onToggleView}>
          View {viewMode === 'planets' ? 'Stars' : 'Planets'}
        </button>
        <button onClick={onNext}>Next</button>
      </div>
    </div>
  );
};

export default Sidebar;