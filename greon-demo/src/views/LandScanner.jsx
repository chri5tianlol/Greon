import React, { useState } from 'react';
import './LandScanner.css';
import { Search, MapPin, Loader2, Sparkles, Sun, AlertCircle, Wind, Plus, Lock, Trash2, ArrowLeft } from 'lucide-react';
import MapView from '../components/MapView';
import EnergyReport from './EnergyReport';
import VerifyLandModal from './VerifyLandModal';

const LandScanner = ({ user, onAddLand }) => {
  const [properties, setProperties] = useState([]);
  const [scans, setScans] = useState([]);
  const [selectedPropId, setSelectedPropId] = useState('');
  const [scanState, setScanState] = useState('idle'); // idle, scanning, complete
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'detail'
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [propToDelete, setPropToDelete] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const fetchProperties = () => {
    fetch(`${import.meta.env.VITE_API_URL}/api/dashboard?userId=${localStorage.getItem('greon_userId')}`)
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.properties) {
          setProperties(data.user.properties);
          setScans(data.recentScans || []);
        }
      })
      .catch(console.error);
  };

  React.useEffect(() => {
    fetchProperties();
  }, [user]);

  // Load existing scan when a property is selected in 'detail' mode
  React.useEffect(() => {
    if (!selectedPropId) return;

    const prop = properties.find(p => p.id === selectedPropId);
    if (!prop) return;

    // Find if we already have a scan for this exact coord/address
    const existingScan = scans.find(s => s.propertyId === prop.id || s.address === prop.address || (s.lat === prop.lat && s.lng === prop.lng));
    
    if (existingScan) {
      setScanResult({
        scanId: existingScan.id,
        address: existingScan.address,
        coordinates: { lat: existingScan.lat, lng: existingScan.lng },
        boundaryGeoJson: prop.boundaryGeoJson ? JSON.parse(prop.boundaryGeoJson) : null,
        environmental: { irradiance: existingScan.solarIrradiance, windSpeed: existingScan.windSpeed },
        aiRecommendation: existingScan.geminiRecommendation ? JSON.parse(existingScan.geminiRecommendation) : {}
      });
      // Load saved report
      if (existingScan.reportData) {
        try { setReportData(JSON.parse(existingScan.reportData)); } catch { setReportData(null); }
      } else {
        setReportData(null);
      }
      setScanState('complete');
    } else {
      setScanState('idle');
      setScanResult(null);
    }
  }, [selectedPropId, properties, scans]);

  // Default coordinates (e.g., center of Albania for context)
  const defaultCenter = { lat: 41.1533, lng: 20.1683 };

  const handleScan = async (propertyId) => {
    const prop = properties.find(p => p.id === propertyId);
    if (!prop) return;

    setScanState('scanning');
    setScanProgress(0);
    setErrorMsg('');
    
    // Animate loader
    const interval = setInterval(() => setScanProgress(p => p >= 90 ? 90 : p + 15), 800);

    try {
      const parsedPolygon = prop.boundaryGeoJson ? JSON.parse(prop.boundaryGeoJson) : null;
      
      const response = await fetch('${import.meta.env.VITE_API_URL}/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: localStorage.getItem('greon_userId'),
          address: prop.address || `${prop.lat},${prop.lng}`, 
          drawnPolygon: parsedPolygon,
          propertyId: prop.id
        }),
      });

      const data = await response.json();
      clearInterval(interval);
      setScanProgress(100);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan the property.');
      }

      // Re-fetch properties so the scans array uses exactly the Prisma DB structure, preventing mapping crashes.
      fetchProperties();
      // the existing useEffect will notice the new scan and transition the state!
    } catch (err) {
      clearInterval(interval);
      setErrorMsg(err.message);
      setScanState('idle');
    }
  };

  const confirmDeleteProperty = async () => {
    if (!propToDelete) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/properties/${propToDelete}?userId=${localStorage.getItem('greon_userId')}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchProperties();
        if (selectedPropId === propToDelete) {
          setViewMode('list');
          setSelectedPropId('');
        }
        setPropToDelete(null);
      } else {
        const errorData = await res.json();
        setPropToDelete(null);
        setErrorMsg(errorData.error || 'Failed to delete property.');
      }
    } catch (err) {
      setPropToDelete(null);
      setErrorMsg("Deletion failed.");
    }
  };

  const handleExplore = (id) => {
    setSelectedPropId(id);
    setViewMode('detail');
  };

  const handleAddLandClick = () => {
    if (user?.subscriptionTier === 'free' && properties.length >= 1) {
      setShowPremiumModal(true);
      return;
    }
    onAddLand();
  };

  const handleGenerateReport = async () => {
    if (!scanResult?.scanId) return;
    setReportLoading(true);
    try {
      const res = await fetch('${import.meta.env.VITE_API_URL}/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: scanResult.scanId,
          userId: localStorage.getItem('greon_userId')
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate report');
      setReportData(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="land-scanner">
      {/* Delete Confirmation Modal */}
      {propToDelete && (
        <div className="modal-overlay" onClick={() => setPropToDelete(null)}>
          <div className="premium-modal slide-in" onClick={e => e.stopPropagation()} style={{ borderTopColor: '#ef4444' }}>
            <h2 style={{ color: '#ef4444' }}><Trash2 /> Delete Property</h2>
            <p>Are you certain you want to permanently delete this property and its associated AI scans? This action cannot be reversed.</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
               <button className="action-btn" style={{ background: '#ef4444', flex: 1 }} onClick={confirmDeleteProperty}>Yes, Delete</button>
               <button className="btn-close-modal" style={{ flex: 1, margin: 0 }} onClick={() => setPropToDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Custom Modal */}
      {showPremiumModal && (
        <div className="modal-overlay" onClick={() => setShowPremiumModal(false)}>
          <div className="premium-modal slide-in" onClick={e => e.stopPropagation()}>
            <h2><Lock /> Premium Tier Required</h2>
            <p>Thinking of Premium? You can add up to 3 lands with a Premium subscription tier. Unlock advanced forecasting, PPA matchmaking, and comprehensive tax credit analysis.</p>
            <button className="action-btn" onClick={() => setShowPremiumModal(false)}>Upgrade to Premium</button>
            <button className="btn-close-modal" onClick={() => setShowPremiumModal(false)}>Maybe Later</button>
          </div>
        </div>
      )}

      <div className="scanner-header">
        <h1>My Lands</h1>
        <p>Manage your registered properties and explore detailed renewable energy AI forecasts.</p>
        {errorMsg && <div className="error-banner">{errorMsg}</div>}
      </div>
      
      {viewMode === 'list' && (
        <div className="property-list slide-in">
          {properties.length === 0 ? (
            <div className="empty-state">
              <MapPin size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
              <h3>No lands registered</h3>
              <p>Add your first property to discover its renewable energy potential.</p>
            </div>
          ) : (
            properties.map(p => (
              <div key={p.id} className="property-card">
                <div className="property-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ margin: 0 }}>{p.name}</h3>
                    <span className={`status-badge status-${p.verificationStatus || 'unconfirmed'}`}>
                      {p.verificationStatus === 'confirmed' ? '✅ Confirmed' : p.verificationStatus === 'in_review' ? '⏳ In Review' : p.verificationStatus === 'declined' ? '❌ Declined' : '⚪ Unconfirmed'}
                    </span>
                  </div>
                  <p><MapPin size={14} style={{display: 'inline', marginRight: '4px', position: 'relative', top: '2px'}}/> {p.address && p.address !== 'Custom GPS Location' && p.address !== 'Custom Location' ? `Land near ${p.address}` : `Land at ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`}</p>
                </div>
                <div className="property-actions">
                  <button className="btn-explore" onClick={() => handleExplore(p.id)}>Explore</button>
                  <button className="btn-delete" onClick={() => setPropToDelete(p.id)} title="Delete Land">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
          
          <button className="btn-add-land-large" onClick={handleAddLandClick}>
             {user?.subscriptionTier === 'free' && properties.length >= 1 ? <Lock size={18} /> : <Plus size={18} />} 
             Add New Land
          </button>
        </div>
      )}

      {viewMode === 'detail' && (
        <div className={`scanner-workspace slide-in ${showReport ? 'report-layout' : ''}`}>
          {/* Back Button */}
          <div style={{ marginBottom: '16px' }}>
            <button className="btn-back" onClick={() => { setViewMode('list'); setSelectedPropId(''); setShowReport(false); }} style={{ background: 'var(--color-bg-primary)', padding: '8px 16px', borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)' }}>
              <ArrowLeft size={16} /> Back to My Lands
            </button>
          </div>

          {!showReport ? (
            /* ===== DEFAULT LAYOUT: Big Map + Energy Summary ===== */
            <>
              {/* Map Visualization Area */}
              <div className="map-container">
                {scanState === 'idle' && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
                      {properties.length > 0 && selectedPropId && (
                        <MapView 
                          lat={properties.find(p => p.id === selectedPropId)?.lat || defaultCenter.lat} 
                          lng={properties.find(p => p.id === selectedPropId)?.lng || defaultCenter.lng} 
                          satellite={true}
                          zoom={18}
                          polygonData={
                            properties.find(p => p.id === selectedPropId)?.boundaryGeoJson 
                            ? JSON.parse(properties.find(p => p.id === selectedPropId).boundaryGeoJson) 
                            : null
                          }
                        />
                      )}
                    </div>
                    <div style={{ position: 'relative', zIndex: 10, background: 'var(--color-bg-primary)', padding: '32px', borderRadius: 'var(--radius-md)', textAlign: 'center', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-brand-primary)' }}>
                      <Sparkles size={40} color="var(--color-brand-primary)" style={{marginBottom: '16px'}} />
                      <h3 style={{marginBottom: '12px', color: 'var(--color-brand-primary)', fontSize: '24px'}}>AI Analysis Pending</h3>
                      <p style={{color: 'var(--color-text-muted)', marginBottom: '24px', maxWidth: '300px', lineHeight: '1.5'}}>We need to run the Gemini AI assessment for this property to determine its renewable energy potential.</p>
                      <button className="action-btn" onClick={() => handleScan(selectedPropId)}>Run AI Analysis Now</button>
                    </div>
                  </div>
                )}
                
                {scanState === 'scanning' && (
                  <div className="map-placeholder scanning" style={{ zIndex: 10 }}>
                    <div className="scan-overlay"></div>
                    <div className="scan-line"></div>
                    <div className="loading-state">
                      <Loader2 size={40} className="spinner" />
                      <h3 className="loading-text">Analyzing climate models...</h3>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `75%` }}></div>
                      </div>
                    </div>
                  </div>
                )}

                {scanState === 'complete' && scanResult && (
                  <div className="map-placeholder complete" style={{ zIndex: 1 }}>
                    <MapView 
                      lat={scanResult.coordinates.lat} 
                      lng={scanResult.coordinates.lng} 
                      popupText={scanResult.address}
                      satellite={true}
                      zoom={19}
                      polygonData={scanResult.boundaryGeoJson}
                    />
                    <div className="zone-highlight"></div>
                  </div>
                )}
              </div>

              {/* Energy Summary Panel */}
              {scanState === 'complete' && scanResult && (
                <div className="results-panel slide-in">
                  <div className="panel-header">
                    <h2>Energy Summary</h2>
                    <Sparkles className="success-icon" />
                  </div>
                  
                  <div className="recommendation-card">
                    <div className="rec-badge">Optimal Match</div>
                    <div className="rec-content">
                      {scanResult.aiRecommendation?.optimalMatch?.toLowerCase().includes('wind') ? (
                        <Wind size={32} className="rec-icon text-accent" />
                      ) : (
                        <Sun size={32} className="rec-icon text-accent" />
                      )}
                      <div>
                        <h3>{scanResult.aiRecommendation?.optimalMatch || "Hybrid System"}</h3>
                        <p>{scanResult.aiRecommendation?.reasoning || "Based on environmental data, this system provides the highest yield."}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="data-points">
                    <div className="data-point">
                      <span className="dp-label">Est. Usable Hectares</span>
                      <span className="dp-value">{scanResult.aiRecommendation?.estimatedHectares || "N/A"} Hectares</span>
                    </div>
                    <div className="data-point">
                      <span className="dp-label">Sun Irradiance</span>
                      <span className="dp-value">{scanResult.environmental.irradiance} W/m²</span>
                    </div>
                    <div className="data-point">
                      <span className="dp-label">Avg Wind Speed</span>
                      <span className="dp-value">{scanResult.environmental.windSpeed} km/h</span>
                    </div>
                    <div className="data-point highlight-point">
                      <span className="dp-label">Est. Solar Panels</span>
                      <span className="dp-value">{scanResult.aiRecommendation?.estimatedPanels?.toLocaleString() || "N/A"}</span>
                    </div>
                  </div>
                  
                  <div className="alert-box info">
                    <AlertCircle size={20} />
                    <p>Gemini AI Strategy: Leverage the identified {scanResult.aiRecommendation?.estimatedDailySunHours} sun-hours for maximum energy yield.</p>
                  </div>
                  
                  <button className="action-btn" onClick={() => {
                    if (reportData) {
                      setShowReport(true);
                    } else {
                      handleGenerateReport();
                    }
                  }} disabled={reportLoading}>
                    {reportLoading ? <><Loader2 size={18} className="spinner" /> Generating...</> : 'Full Report'}
                  </button>

                  {(() => {
                    const selectedProp = properties.find(p => p.id === selectedPropId);
                    const vs = selectedProp?.verificationStatus || 'unconfirmed';
                    if (vs === 'unconfirmed' || vs === 'declined') {
                      return (
                        <button className="action-btn verify-btn" onClick={() => setShowVerifyModal(true)}>
                          Verify Land
                        </button>
                      );
                    } else if (vs === 'in_review') {
                      return <div className="verify-status-msg in-review">⏳ Verification under review</div>;
                    } else if (vs === 'confirmed') {
                      return <div className="verify-status-msg confirmed">✅ Land verified and confirmed</div>;
                    }
                    return null;
                  })()}
                </div>
              )}
            </>
          ) : (
            /* ===== REPORT LAYOUT: Side-by-Side Map + Report ===== */
            <div className="report-split-layout">
              {/* Left: Compact Map + Mini Summary */}
              <div className="report-left">
                <div className="report-map-compact">
                  {scanResult && (
                    <MapView 
                      lat={scanResult.coordinates.lat} 
                      lng={scanResult.coordinates.lng} 
                      popupText={scanResult.address}
                      satellite={true}
                      zoom={18}
                      polygonData={scanResult.boundaryGeoJson}
                    />
                  )}
                </div>
                <div className="report-mini-summary">
                  <h3>Energy Summary</h3>
                  <div className="mini-data-grid">
                    <div className="mini-data"><Sun size={14}/> {scanResult?.environmental?.irradiance} W/m²</div>
                    <div className="mini-data"><Wind size={14}/> {scanResult?.environmental?.windSpeed} km/h</div>
                    <div className="mini-data"><Sparkles size={14}/> {scanResult?.aiRecommendation?.estimatedPanels?.toLocaleString()} panels</div>
                    <div className="mini-data"><MapPin size={14}/> {scanResult?.aiRecommendation?.estimatedHectares} ha</div>
                  </div>
                  <button className="btn-back" onClick={() => setShowReport(false)} style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}>
                    <ArrowLeft size={14}/> Back to Summary
                  </button>
                </div>
              </div>

              {/* Right: Full Energy Report */}
              <div className="report-right">
                <EnergyReport reportData={reportData} scanResult={scanResult} onBack={() => setShowReport(false)} />
              </div>
            </div>
          )}
        </div>
      )}
      {/* Verify Land Modal */}
      {showVerifyModal && (
        <VerifyLandModal
          property={properties.find(p => p.id === selectedPropId)}
          user={user}
          onClose={() => setShowVerifyModal(false)}
          onSuccess={() => { fetchProperties(); setShowVerifyModal(false); }}
        />
      )}
    </div>
  );
};

export default LandScanner;
