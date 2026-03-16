import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Map, ShieldCheck, Search, Loader2 } from 'lucide-react';
import MapView from '../components/MapView';
import './Onboarding.css';

const Onboarding = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [locationMode, setLocationMode] = useState(''); // 'gps', 'address', 'map'
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState(null); // { lat, lng }
  const [polygon, setPolygon] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle location selection
  const handleGPSLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setStep(2); // Proceed to drawing
      }, (err) => {
        setErrorMsg('Failed to get location. Please try address or map pin.');
      });
    }
  };

  const handleAddressSearch = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    
    // Geocode (simplified for demo)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        setCoordinates({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        });
        setStep(2);
      } else {
        setErrorMsg('Address not found.');
      }
    } catch (err) {
      setErrorMsg('Geocoding failed.');
    }
  };

  const handleMapPin = () => {
    // Default to center
    setCoordinates({ lat: 41.3275, lng: 19.8189 }); // Tirana default
    setStep(1.5); // Intermediary step to let user pin
  };

  const handleSaveProperty = async () => {
    if (!coordinates || !polygon) {
      setErrorMsg('Please draw your property boundary to continue.');
      return;
    }

    setIsSaving(true);
    try {
      // Reverse geocode to get a real address if user selected via GPS or map pin
      let resolvedAddress = address;
      if (!resolvedAddress || resolvedAddress === 'Custom GPS Location') {
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}`, {
            headers: { 'User-Agent': 'GreonApp/1.0' }
          });
          const geoData = await geoRes.json();
          if (geoData && (geoData.address || geoData.display_name)) {
            // Use structured address fields: Road, City, Country
            const addr = geoData.address || {};
            const road = addr.road || addr.pedestrian || addr.neighbourhood || geoData.display_name.split(', ')[0] || '';
            const city = addr.city || addr.town || addr.village || addr.municipality || '';
            const country = addr.country || '';
            resolvedAddress = [road, city, country].filter(Boolean).join(', ');
          } else {
            resolvedAddress = `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;
          }
        } catch {
          resolvedAddress = `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;
        }
      }

      // Determine sequential name
      const landNames = ['Primary Land', 'Secondary Land', 'Tertiary Land'];
      let landName = 'Primary Land';
      try {
        const dashRes = await fetch(`http://localhost:3001/api/dashboard?userId=${localStorage.getItem('greon_userId')}`);
        const dashData = await dashRes.json();
        const existingCount = dashData?.user?.properties?.length || 0;
        landName = landNames[existingCount] || `Land ${existingCount + 1}`;
      } catch { /* fallback */ }

      const response = await fetch('http://localhost:3001/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localStorage.getItem('greon_userId'),
          name: landName,
          address: resolvedAddress,
          lat: coordinates.lat,
          lng: coordinates.lng,
          boundaryGeoJson: polygon
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save property');
      }

      const newProp = await response.json();
      
      // Auto-scan the property so it's ready in the dashboard
      const scanRes = await fetch('http://localhost:3001/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localStorage.getItem('greon_userId'),
          address: newProp.address || 'Custom GPS Location',
          drawnPolygon: polygon,
          propertyId: newProp.id
        })
      });

      if (!scanRes.ok) {
        const scanData = await scanRes.json();
        throw new Error(scanData.error || 'Property saved, but AI scanning failed. You can run it manually in My Lands.');
      }

      onComplete(); // Successfully saved & scanned, exit onboarding
    } catch (error) {
      setErrorMsg(error.message);
      setIsSaving(false);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        
        {/* Step 1: Location Definition */}
        {step === 1 && (
          <div className="onboarding-step fade-in">
            <h2>Welcome to Greon</h2>
            <p className="subtitle">Let's set up your first property. How would you like to locate your land?</p>
            
            {errorMsg && <div className="error-banner">{errorMsg}</div>}

            <div className="location-modes">
              <button className="mode-btn" onClick={handleGPSLocation}>
                <Navigation size={24} />
                <h3>Use My Current Location</h3>
                <p>Ensure you are physically on the property</p>
              </button>

              <button className="mode-btn" onClick={() => setLocationMode('address')}>
                <Search size={24} />
                <h3>Enter Address</h3>
                <p>Type out the physical address or coordinates</p>
              </button>

              <button className="mode-btn" onClick={handleMapPin}>
                <Map size={24} />
                <h3>Pin on Map</h3>
                <p>Visually find your land on the satellite map</p>
              </button>
            </div>

            {locationMode === 'address' && (
              <form onSubmit={handleAddressSearch} className="address-form fade-in">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Street, City, Country or Lat, Lng..." 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <button type="submit" className="action-btn">Find Land</button>
              </form>
            )}
          </div>
        )}

        {/* Step 1.5: Manual Map Pin (Simplified: User clicks to set map center) */}
        {step === 1.5 && (
          <div className="onboarding-step fade-in full-height">
            <h2>Locate Your Property</h2>
            <p className="subtitle">Pan the map until your property is perfectly centered.</p>
            
            <div className="onboarding-map-wrapper">
               <div className="map-crosshair">+</div>
               <MapView 
                  lat={coordinates.lat} 
                  lng={coordinates.lng} 
                  satellite={true} 
                  zoom={15}
                  onCenterChanged={(c) => setCoordinates(c)}
               />
            </div>
            <button className="action-btn" onClick={() => setStep(2)}>Confirm Location</button>
            <button className="text-btn mt-2" onClick={() => setStep(1)}>Back</button>
          </div>
        )}

        {/* Step 2: Draw Perimeter */}
        {step === 2 && (
          <div className="onboarding-step fade-in full-height">
            <h2>Draw Your Boundaries</h2>
            <p className="subtitle">For accurate AI planimetry, physically trace the perimeter fence of your yard avoiding roads and neighbors. The area inside the shape will be used for calculation.</p>
            
            {errorMsg && <div className="error-banner">{errorMsg}</div>}

            <div className="onboarding-map-wrapper">
               <MapView 
                  lat={coordinates.lat} 
                  lng={coordinates.lng} 
                  satellite={true} 
                  zoom={19}
                  editable={true}
                  onPolygonDrawn={(geoJson) => setPolygon(geoJson)}
               />
            </div>

            <div className="onboarding-footer">
               <button className="text-btn" onClick={() => setStep(1)}>Go Back</button>
               <button 
                  className="action-btn submit-btn" 
                  disabled={!polygon || isSaving}
                  onClick={handleSaveProperty}
               >
                 {isSaving ? <Loader2 className="spinner" /> : <ShieldCheck />}
                 {isSaving ? 'Saving & Scanning...' : 'Confirm Perimeter & Save'}
               </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Onboarding;
