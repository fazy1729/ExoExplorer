import React, { useEffect, useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ celestialObject, onNext, onPrev, type, position = 'left' }) => {
  const [isEntering, setIsEntering] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setIsEntering(true);
    const timer = setTimeout(() => setIsEntering(false), 300);
    return () => clearTimeout(timer);
  }, [celestialObject]);

  if (!celestialObject) return null;

  const formatStarName = (name) => {
    const match = name.match(/Star-(\d+)/);
    if (match) {
      const starNames = ["Sirius", "Vega", "Polaris", "Antares", "Arcturus", "Rigel", "Betelgeuse"];
      const index = parseInt(match[1]) % starNames.length;
      const letterCode = 65 + (parseInt(match[1]) % 26);
      return `${starNames[index]} ${String.fromCharCode(letterCode)}`;
    }
    return name;
  };

  const getStarType = (colorIndex) => {
    if (colorIndex === undefined || colorIndex === null) return "Unknown Type";
    if (colorIndex < -0.2) return "O-type (Blue)";
    if (colorIndex < 0.0) return "B-type (Blue-White)";
    if (colorIndex < 0.3) return "A-type (White)";
    if (colorIndex < 0.6) return "F-type (Yellow-White)";
    if (colorIndex < 1.0) return "G-type (Yellow)";
    if (colorIndex < 1.5) return "K-type (Orange)";
    return "M-type (Red)";
  };

  const getPlanetType = (radius) => {
    if (!radius) return "Unknown Type";
    if (radius < 0.5) return "Dwarf Planet";
    if (radius < 1.2) return "Terrestrial";
    if (radius < 5) return "Super-Earth";
    if (radius < 20) return "Neptune-like";
    return "Gas Giant";
  };

  const getColorFromBv = (bv) => {
    if (bv === undefined || bv === null) return "#ffffff";
    if (bv < -0.2) return "#9bb0ff";
    if (bv < 0.0) return "#a6d2ff";
    if (bv < 0.3) return "#ffffff";
    if (bv < 0.6) return "#ffdf91";
    if (bv < 1.0) return "#ffcc33";
    if (bv < 1.5) return "#ff9933";
    return "#ff5a5a";
  };

  return (
    <div className={`sidebar ${position === 'right' ? 'sidebar-right' : ''} ${isEntering ? 'sidebar-entering' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Collapse Button */}
      <button 
        className="collapse-btn"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <span className="btn-icon">▶</span>
        ) : (
          <span className="btn-icon">◀</span>
        )}
      </button>

      {/* Cosmic Background */}
      <div className="cosmic-background">
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={i} 
            className="cosmic-particle"
            style={{
              '--size': `${Math.random() * 4 + 1}px`,
              '--x': `${Math.random() * 100}%`,
              '--y': `${Math.random() * 100}%`,
              '--delay': `${Math.random() * 5}s`,
              '--duration': `${10 + Math.random() * 20}s`,
              '--hue': type === 'star' 
                ? celestialObject.color_index 
                  ? 30 + (celestialObject.color_index * 30) 
                  : 200 
                : 180
            }}
          />
        ))}
      </div>

      {!isCollapsed ? (
        <div className="sidebar-content">
          <div className="sidebar-header">
            <div className="celestial-title">
              <h2 className="celestial-name">
                {formatStarName(celestialObject.name)}
                <span 
                  className="name-glow" 
                  style={{
                    background: type === 'star' 
                      ? getColorFromBv(celestialObject.color_index)
                      : '#6bd6ff'
                  }}
                />
              </h2>
              <span className="celestial-type">
                {type === 'star' 
                  ? getStarType(celestialObject.color_index)
                  : getPlanetType(celestialObject.radius)}
              </span>
            </div>

            {type === 'star' && (
              <div className="star-visualization">
                <div 
                  className="star-preview" 
                  style={{
                    background: `radial-gradient(circle, 
                      ${getColorFromBv(celestialObject.color_index)}, 
                      #000)`,
                    boxShadow: `0 0 30px ${getColorFromBv(celestialObject.color_index)}`
                  }}
                />
                <div className="star-rings" />
              </div>
            )}
          </div>
          
          <div className="celestial-details">
            <div className="detail-section">
              <h3>Basic Properties</h3>
              <div className="stat-grid">
                {type === 'star' ? (
                  <>
                    <div className="stat-item">
                      <span className="stat-label">Magnitude:</span>
                      <span className="stat-value">
                        {celestialObject.magnitude?.toFixed(2) || 'N/A'}
                        <span className="stat-unit">mag</span>
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Color Index:</span>
                      <span className="stat-value">
                        {celestialObject.color_index?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Distance:</span>
                      <span className="stat-value">
                        {celestialObject.parallax ? (1000/celestialObject.parallax).toFixed(2) : 'N/A'}
                        <span className="stat-unit">parsecs</span>
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Temperature:</span>
                      <span className="stat-value">
                        {celestialObject.temperature?.toFixed(0) || 'N/A'}
                        <span className="stat-unit">K</span>
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="stat-item">
                      <span className="stat-label">Orbital Period:</span>
                      <span className="stat-value">
                        {celestialObject.orbital_period?.toFixed(2) || 'N/A'}
                        <span className="stat-unit">days</span>
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Radius:</span>
                      <span className="stat-value">
                        {celestialObject.radius || 'N/A'}
                        <span className="stat-unit">R⊕</span>
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Mass:</span>
                      <span className="stat-value">
                        {celestialObject.mass || 'N/A'}
                        <span className="stat-unit">M⊕</span>
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Discovery Year:</span>
                      <span className="stat-value">
                        {celestialObject.discovery_year || 'N/A'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {type === 'star' && (
              <div className="detail-section">
                <h3>Spectral Characteristics</h3>
                <div className="spectral-display">
                  <div 
                    className="spectral-bar" 
                    style={{
                      background: `linear-gradient(to right, #9bb0ff, #a6d2ff, #fff, #ffdf91, #ff8c69, #ff5a5a)`,
                    }}
                  >
                    <div 
                      className="spectral-marker" 
                      style={{
                        left: `${celestialObject.color_index ? 
                          Math.min(Math.max((celestialObject.color_index + 0.4) * 100, 0), 100) : 50}%`,
                        background: getColorFromBv(celestialObject.color_index)
                      }}
                    />
                  </div>
                  <div className="spectral-labels">
                    <span>O</span>
                    <span>B</span>
                    <span>A</span>
                    <span>F</span>
                    <span>G</span>
                    <span>K</span>
                    <span>M</span>
                  </div>
                </div>
              </div>
            )}

            {type === 'planet' && (
              <div className="detail-section">
                <h3>Atmospheric Composition</h3>
                <div className="composition-bars">
                  {['H₂', 'He', 'N₂', 'O₂', 'CO₂'].map((gas, i) => (
                    <div key={gas} className="gas-bar">
                      <div className="gas-label">{gas}</div>
                      <div 
                        className="gas-amount" 
                        style={{
                          width: `${Math.random() * 80 + 5}%`,
                          animationDelay: `${i * 0.1}s`
                        }}
                      />
                      <div className="gas-percent">
                        {Math.floor(Math.random() * 50 + 5)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="celestial-navigation">
            <button className="nav-btn prev-btn" onClick={onPrev}>
              <div className="btn-orb" />
              <span>Previous</span>
            </button>
            <button className="nav-btn next-btn" onClick={onNext}>
              <div className="btn-orb" />
              <span>Next</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="collapsed-content">
          <h2 className="collapsed-title">
            {formatStarName(celestialObject.name).split(' ')[0]}
          </h2>
          <div className="collapsed-nav">
            <button className="nav-btn-mini" onClick={onPrev}>↑</button>
            <button className="nav-btn-mini" onClick={onNext}>↓</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;