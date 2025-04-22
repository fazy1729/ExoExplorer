import React from 'react';
import './Sidebar.css';

const Sidebar = ({ celestialObject, onNext, onPrev, type, position = 'left' }) => {
  if (!celestialObject) return null;

  return (
    <div className={`sidebar ${position === 'right' ? 'sidebar-right' : ''}`}>
      <div className="sidebar-header">
        <h2 className="celestial-name">{celestialObject.name}</h2>
        <span className="celestial-type">{type === 'star' ? 'Star' : celestialObject.type}</span>
      </div>
      
      <div className="celestial-details">
        <div className="celestial-stats">
          {type === 'star' ? (
            <>
              <div className="stat-item">
                <span className="stat-label">Magnitude:</span>
                <span className="stat-value">{celestialObject.magnitude?.toFixed(2)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Color Index:</span>
                <span className="stat-value">{celestialObject.color_index?.toFixed(2)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Distance:</span>
                <span className="stat-value">
                  {celestialObject.parallax ? (1000/celestialObject.parallax).toFixed(2) + ' parsecs' : 'Unknown'}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="stat-item">
                <span className="stat-label">Description:</span>
                <span className="stat-value">{celestialObject.description}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Radius:</span>
                <span className="stat-value">{celestialObject.radius} Earth radii</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="celestial-navigation">
        <button className="nav-btn prev-btn" onClick={onPrev}>Previous</button>
        <button className="nav-btn next-btn" onClick={onNext}>Next</button>
      </div>
    </div>
  );
};

export default Sidebar;