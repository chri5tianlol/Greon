import React, { useState, useEffect } from 'react';
import './CommunityGrid.css';
import { Users, Zap, Link as LinkIcon, AlertCircle, MapPin, Loader2, CheckCircle, XCircle, ChevronLeft, ChevronRight, Eye, ArrowLeft, Inbox } from 'lucide-react';
import MapView from '../components/MapView';

const CommunityGrid = () => {
  const [neighbors, setNeighbors] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  
  // Sub-page state: null = main, 'viewAll' = all operators, 'requests' = requests list, 'requestDetail' = single request detail
  const [subPage, setSubPage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const ITEMS_PER_PAGE = 5;

  const currentUserId = localStorage.getItem('greon_userId');

  useEffect(() => {
    fetch('http://localhost:3001/api/community/neighbors')
      .then(res => res.json())
      .then(data => { setNeighbors(data); setLoading(false); })
      .catch(() => setLoading(false));

    if (currentUserId) {
      fetchRequests();
    } else {
      setLoadingRequests(false);
    }
  }, [currentUserId]);

  const fetchRequests = () => {
    fetch(`http://localhost:3001/api/community/requests?userId=${currentUserId}`)
      .then(res => res.json())
      .then(data => { setRequests(data); setLoadingRequests(false); })
      .catch(() => setLoadingRequests(false));
  };

  const handleConnect = (node) => {
    fetch('http://localhost:3001/api/community/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: currentUserId,
        receiverId: node.userId,
        receiverPropertyId: node.id
      })
    })
    .then(res => res.json())
    .then(() => { fetchRequests(); })
    .catch(err => console.error(err));
  };

  const handleRequestAction = (reqId, status) => {
    fetch(`http://localhost:3001/api/community/requests/${reqId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, userId: currentUserId })
    })
    .then(res => res.json())
    .then(() => { fetchRequests(); })
    .catch(err => console.error(err));
  };

  // Center map on first confirmed neighbor, or fallback
  const centerLat = neighbors.length > 0 ? neighbors[0].lat : 41.3275;
  const centerLng = neighbors.length > 0 ? neighbors[0].lng : 19.8189;

  // Build markers for all neighbors
  const mapMarkers = neighbors.map(n => ({
    lat: n.lat,
    lng: n.lng,
    popupText: `${n.name} — ${n.capability} • ${n.amount}`
  }));

  const pendingCount = requests.incoming.filter(r => r.status === 'pending').length;

  // --- SUB-PAGE: View All Operators ---
  if (subPage === 'viewAll') {
    const totalPages = Math.ceil(neighbors.length / ITEMS_PER_PAGE);
    const paged = neighbors.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    return (
      <div className="community-grid view-container">
        <header className="view-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="cg-back-btn" onClick={() => { setSubPage(null); setCurrentPage(1); }}>
            <ArrowLeft size={18} /> Back
          </button>
          <div>
            <h1>All Operators</h1>
            <p>Showing all verified operators across all regions.</p>
          </div>
        </header>

        <div className="cg-full-section">
          {paged.map(node => {
            const isYours = node.userId === currentUserId;
            const hasRequested = requests.outgoing.some(r => r.receiverPropertyId === node.id);
            return (
              <div key={node.id} className="neighbor-card">
                <div className="neighbor-info">
                  <h4>{node.name} {isYours && '(You)'}</h4>
                  <p>{node.capability} • {node.amount}</p>
                  {node.address && <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}><MapPin size={10} style={{ display: 'inline', position: 'relative', top: '1px' }}/> {node.address}</p>}
                </div>
                {isYours ? (
                  <span className="text-accent" style={{ fontSize: '14px', fontWeight: 600 }}>Yours</span>
                ) : hasRequested ? (
                  <span className="text-muted" style={{ fontSize: '12px' }}>Requested</span>
                ) : (
                  <button className="merge-btn" onClick={() => handleConnect(node)}>
                    <LinkIcon size={16} /> Connect
                  </button>
                )}
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="cg-pagination">
              <button className="cg-page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft size={16} /> Back
              </button>
              <span className="cg-page-info">Page {currentPage} of {totalPages}</span>
              <button className="cg-page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- SUB-PAGE: Request Detail (View More) ---
  if (subPage === 'requestDetail' && selectedRequest) {
    const req = selectedRequest;
    return (
      <div className="community-grid view-container">
        <header className="view-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="cg-back-btn" onClick={() => { setSubPage('requests'); setSelectedRequest(null); }}>
            <ArrowLeft size={18} /> Back
          </button>
          <div>
            <h1>Request from {req.sender.name}</h1>
            <p>Connection request details and land information.</p>
          </div>
        </header>

        <div className="cg-detail-grid">
          <div className="cg-detail-map">
            <MapView lat={req.property.lat} lng={req.property.lng} popupText={req.property.name} satellite={true} zoom={14} />
          </div>
          <div className="cg-detail-info">
            <div className="cg-detail-card">
              <h3>Land Information</h3>
              <div className="cg-detail-row"><span>Property Name</span><strong>{req.property.name}</strong></div>
              <div className="cg-detail-row"><span>Address</span><strong>{req.property.address}</strong></div>
              <div className="cg-detail-row"><span>Coordinates</span><strong>{req.property.lat.toFixed(4)}, {req.property.lng.toFixed(4)}</strong></div>
              <div className="cg-detail-row"><span>Requested By</span><strong>{req.sender.name}</strong></div>
              <div className="cg-detail-row"><span>Email</span><strong>{req.sender.email}</strong></div>
              <div className="cg-detail-row"><span>Status</span><strong style={{ textTransform: 'capitalize' }}>{req.status}</strong></div>
            </div>

            {req.status === 'pending' && (
              <div className="cg-detail-actions">
                <button className="cg-action-btn cg-accept-btn" onClick={() => { handleRequestAction(req.id, 'accepted'); setSubPage('requests'); setSelectedRequest(null); }}>
                  <CheckCircle size={16} /> Accept Request
                </button>
                <button className="cg-action-btn cg-decline-btn" onClick={() => { handleRequestAction(req.id, 'declined'); setSubPage('requests'); setSelectedRequest(null); }}>
                  <XCircle size={16} /> Decline Request
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- SUB-PAGE: Requests List ---
  if (subPage === 'requests') {
    return (
      <div className="community-grid view-container">
        <header className="view-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="cg-back-btn" onClick={() => setSubPage(null)}>
            <ArrowLeft size={18} /> Back
          </button>
          <div>
            <h1>Connection Requests</h1>
            <p>Manage your incoming connection requests.</p>
          </div>
        </header>

        <div className="cg-full-section">
          {loadingRequests ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 size={32} className="spinner" /></div>
          ) : requests.incoming.length > 0 ? (
            requests.incoming.map(req => (
              <div key={req.id} className="cg-request-card">
                <div className="cg-request-info">
                  <h4>{req.sender.name}</h4>
                  <p>Wants to connect with <strong>{req.property.name}</strong></p>
                  <p className="cg-request-address"><MapPin size={10} /> {req.property.address}</p>
                </div>
                <div className="cg-request-right">
                  <span className={`cg-status-pill cg-status-${req.status}`}>{req.status}</span>
                  <div className="cg-request-btns">
                    {req.status === 'pending' && (
                      <>
                        <button className="cg-action-btn cg-accept-btn" onClick={() => handleRequestAction(req.id, 'accepted')}>
                          <CheckCircle size={14} /> Accept
                        </button>
                        <button className="cg-action-btn cg-decline-btn" onClick={() => handleRequestAction(req.id, 'declined')}>
                          <XCircle size={14} /> Decline
                        </button>
                      </>
                    )}
                    <button className="cg-action-btn cg-view-btn" onClick={() => { setSelectedRequest(req); setSubPage('requestDetail'); }}>
                      <Eye size={14} /> View
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
              <Inbox size={36} style={{ opacity: 0.4, marginBottom: '8px' }} />
              <p>No incoming requests.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- MAIN PAGE ---
  return (
    <div className="community-grid view-container">
      <header className="view-header">
        <h1>Community Virtual Grid</h1>
        <p>Connect with neighboring verified renewable sources to aggregate power and negotiate better PPA rates.</p>
      </header>

      <div className="grid-workspace">
        <div className="grid-map-panel">
          <div className="map-view-wrapper">
             <MapView lat={centerLat} lng={centerLng} popupText="Community Grid Region" satellite={true} zoom={12} markers={mapMarkers} />
          </div>
        </div>

        <div className="grid-sidebar">
          <div className="network-stats">
            <div className="stat-row">
              <span className="stat-label">Verified Operators</span>
              <span className="stat-value">{neighbors.length}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Aggregated Potential</span>
              <span className="stat-value text-accent">{neighbors.length > 0 ? `${(neighbors.length * 1.2).toFixed(1)} MW` : '0 MW'}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Est. Uplift via Merging</span>
              <span className="stat-value text-success">{neighbors.length > 1 ? '+18% Revenue' : 'N/A'}</span>
            </div>
          </div>

          <div className="neighbors-list">
            <h3>Nearby Operators</h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <Loader2 size={24} className="spinner" />
              </div>
            ) : neighbors.length > 0 ? (
              <>
                {neighbors.slice(0, 3).map(node => {
                  const isYours = node.userId === currentUserId;
                  const hasRequested = requests.outgoing.some(r => r.receiverPropertyId === node.id);
                  return (
                    <div key={node.id} className="neighbor-card">
                       <div className="neighbor-info">
                         <h4>{node.name} {isYours && '(You)'}</h4>
                         <p>{node.capability} • {node.amount}</p>
                         {node.address && <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}><MapPin size={10} style={{ display: 'inline', position: 'relative', top: '1px' }}/> {node.address}</p>}
                       </div>
                       {isYours ? (
                         <span className="text-accent" style={{ fontSize: '14px', fontWeight: 600 }}>Yours</span>
                       ) : hasRequested ? (
                         <span className="text-muted" style={{ fontSize: '12px' }}>Requested</span>
                       ) : (
                         <button className="merge-btn" onClick={() => handleConnect(node)}>
                           <LinkIcon size={16} /> Connect
                         </button>
                       )}
                    </div>
                  );
                })}

                {neighbors.length > 3 && (
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <button className="cg-view-all-btn" onClick={() => { setSubPage('viewAll'); setCurrentPage(1); }}>
                      View All ({neighbors.length})
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
                <Users size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <p>No verified operators in the community yet.</p>
                <p style={{ fontSize: '13px' }}>Verified lands will appear here automatically.</p>
              </div>
            )}
          </div>

          {/* Requests Summary — just a count and a View button */}
          <div className="cg-requests-summary">
            <div className="cg-requests-summary-left">
              <Inbox size={18} />
              <span>Requests</span>
              <span className="cg-requests-count">{pendingCount > 0 ? pendingCount : 'No requests'}</span>
            </div>
            <button className="cg-action-btn cg-view-btn" onClick={() => setSubPage('requests')}>
              <Eye size={14} /> View
            </button>
          </div>

          <div className="premium-upsell">
            <AlertCircle size={20} className="text-brand" />
            <p><strong>Virtual Power Plant (VPP) Access</strong> is required to automatically trade energy with neighbors. Upgrade to execute smart contracts.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityGrid;
