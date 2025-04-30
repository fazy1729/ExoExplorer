// Sidebar.jsx
import React, { useEffect, useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ celestialObject, onNext, onPrev, type, position = 'left' }) => {
  const [isEntering, setIsEntering] = useState(true);
  const [contentKey, setContentKey] = useState(0);

  useEffect(() => {
    setIsEntering(true);
    const timer = setTimeout(() => setIsEntering(false), 300);
    return () => clearTimeout(timer);
  }, [celestialObject]);

  useEffect(() => {
    setContentKey(prevKey => prevKey + 1);
  }, [celestialObject]);

  if (!celestialObject) return null;

  return (
    <div className={`sidebar ${position === 'right' ? 'sidebar-right' : ''} ${isEntering ? 'sidebar-entering' : ''}`}>
      {/* Floating particles background */}
      <div className="particles">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
          }} />
        ))}
      </div>

      {/* Glowing border effect */}
      <div className="sidebar-glow"></div>

      <div className="sidebar-content" key={contentKey}>
        <div className="sidebar-header">
          <h2 className="celestial-name">
            {celestialObject.name}
            <span className="name-glow"></span>
          </h2>
          <span className="celestial-type">
            {type === 'star' ? 'Star' : celestialObject.type}
            <span className="type-glow"></span>
          </span>
        </div>
        
        <div className="celestial-details">
          <div className="celestial-stats">
            {type === 'star' ? (
              <>
                <div className="stat-item">
                  <span className="stat-label">Magnitude:</span>
                  <span className="stat-value">
                    {celestialObject.magnitude?.toFixed(2)}
                    <span className="stat-glow"></span>
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Color Index:</span>
                  <span className="stat-value">
                    {celestialObject.color_index?.toFixed(2)}
                    <span className="stat-glow"></span>
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Distance:</span>
                  <span className="stat-value">
                    {celestialObject.parallax ? (1000/celestialObject.parallax).toFixed(2) + ' parsecs' : 'Unknown'}
                    <span className="stat-glow"></span>
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="stat-item">
                  <span className="stat-label">Description:</span>
                  <span className="stat-value">
                    {celestialObject.description}
                    <span className="stat-glow"></span>
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Radius:</span>
                  <span className="stat-value">
                    {celestialObject.radius} Earth radii
                    <span className="stat-glow"></span>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="celestial-navigation">
          <button className="nav-btn prev-btn" onClick={onPrev}>
            <span>Previous</span>
            <div className="btn-glow"></div>
            <div className="btn-orb"></div>
          </button>
          <button className="nav-btn next-btn" onClick={onNext}>
            <span>Next</span>
            <div className="btn-glow"></div>
            <div className="btn-orb"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;