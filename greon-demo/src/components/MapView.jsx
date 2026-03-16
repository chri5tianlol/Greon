import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon } from 'react-leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to dynamically update map center when coordinates change
const MapUpdater = ({ center, editable, onPolygonDrawn, onCenterChanged }) => {
  const map = useMap();
  const prevCenterRef = React.useRef(center);
  
  React.useEffect(() => {
    // Only call setView if the parent forced a major coordinate change (protects vs panning jitter)
    const prev = prevCenterRef.current;
    if (Math.abs(prev[0] - center[0]) > 0.0001 || Math.abs(prev[1] - center[1]) > 0.0001) {
      map.setView(center, map.getZoom());
    }
    prevCenterRef.current = center;
    
    // Force Leaflet to recalculate its container size after mounting
    // Fixes the blank map / grey tile issue in conditionally rendered views
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [center, map]);

  React.useEffect(() => {
    if (!onCenterChanged) return;
    const handleMoveEnd = () => {
      const c = map.getCenter();
      onCenterChanged({ lat: c.lat, lng: c.lng });
    };
    map.on('moveend', handleMoveEnd);
    return () => map.off('moveend', handleMoveEnd);
  }, [map, onCenterChanged]);

  React.useEffect(() => {
    if (editable) {
      map.pm.addControls({
        position: 'topright',
        drawMarker: false,
        drawCircleMarker: false,
        drawPolyline: false,
        drawRectangle: false,
        drawCircle: false,
        drawText: false,
        editMode: false,
        dragMode: false,
        cutPolygon: false,
        removalMode: true
      });

      map.pm.setPathOptions({
        color: '#1DA57A',
        fillColor: '#0a2342',
        fillOpacity: 0.5,
        weight: 3
      });

      map.on('pm:create', (e) => {
        if (onPolygonDrawn) {
          onPolygonDrawn(e.layer.toGeoJSON());
        }
      });
    } else {
      map.pm.removeControls();
      map.off('pm:create');
    }

    return () => {
      map.pm.removeControls();
      map.off('pm:create');
    };
  }, [editable, map, onPolygonDrawn]);

  return null;
};

const MapView = ({ lat, lng, popupText, zoom = 14, satellite = false, polygonData = null, editable = false, onPolygonDrawn, onCenterChanged, markers = [] }) => {
  const position = [lat, lng];

  // Convert GeoJSON coordinates [lng, lat] to Leaflet [lat, lng] format for the Polygon
  const polygonPositions = polygonData && polygonData.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);

  return (
    <MapContainer 
      center={position} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%', borderRadius: '16px' }}
      zoomControl={false}
    >
      {satellite ? (
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        />
      ) : (
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
      )}
      <MapUpdater center={position} editable={editable} onPolygonDrawn={onPolygonDrawn} onCenterChanged={onCenterChanged} />
      
      {polygonData && !editable && (
        <Polygon 
          positions={polygonPositions} 
          pathOptions={{ 
            color: '#1DA57A', 
            fillColor: '#0a2342', 
            fillOpacity: 0.7, 
            weight: 3, 
            dashArray: '5, 5' 
          }} 
        />
      )}

      <Marker position={position}>
        {popupText && (
          <Popup>
            {popupText}
          </Popup>
        )}
      </Marker>

      {/* Additional markers */}
      {markers.map((m, i) => (
        <Marker key={i} position={[m.lat, m.lng]}>
          {m.popupText && <Popup>{m.popupText}</Popup>}
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;
