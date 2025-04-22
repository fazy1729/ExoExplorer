import React from 'react';
import './Sidebar.css';

const Sidebar = ({ planet, onNext, onPrev }) => {
  if (!planet) return null;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="planet-name">{planet.name}</h2>
        <span className="planet-type">{planet.type}</span>
      </div>
      
      <div className="planet-details">
        <div className="planet-stats">
          {planet.type === 'Star' ? (
            <>
              <div className="stat-item">
                <span className="stat-label">Magnitude:</span>
                <span className="stat-value">{planet.magnitude?.toFixed(2)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Color Index:</span>
                <span className="stat-value">{planet.color_index?.toFixed(2)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Distance:</span>
                <span className="stat-value">
                  {planet.parallax ? (1000/planet.parallax).toFixed(2) + ' parsecs' : 'Unknown'}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="stat-item">
                <span className="stat-label">Description:</span>
                <span className="stat-value">{planet.description}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Radius:</span>
                <span className="stat-value">{planet.radius} Earth radii</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="planet-navigation">
        <button className="nav-btn prev-btn" onClick={onPrev}>Previous</button>
        <button className="nav-btn next-btn" onClick={onNext}>Next</button>
      </div>
    </div>
  );
};

export default Sidebar;