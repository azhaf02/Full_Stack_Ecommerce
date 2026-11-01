import React, { useState } from 'react';
import FaqPage from './pages/support/FaqPage';
import DashboardLayout from './components/DashboardLayout';

function App() {
  // 💡 Manages a clean master switch state loop between Public FAQ Hub and Member Dashboard views
  const [viewMode, setViewMode] = useState<'public_hub' | 'member_dashboard'>('public_hub');

  return (
    <>
      {/* 🛠️ Floating Admin Toggle Header: Strictly designed to showcase both of your features instantly */}
      <div style={{
        backgroundColor: '#1B241C',
        padding: '10px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #9EB09A',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}>
        <span style={{ fontSize: '11px', color: '#FAF8F5', fontWeight: 600, letterSpacing: '1px' }}>
          SYSTEM PORTAL SPLIT CONTROLS // VIEWING: {viewMode.toUpperCase()}
        </span>
        <button
          onClick={() => setViewMode(prev => prev === 'public_hub' ? 'member_dashboard' : 'public_hub')}
          style={{
            backgroundColor: '#FAF8F5',
            color: '#232F24',
            border: 'none',
            borderRadius: '4px',
            padding: '5px 14px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {viewMode === 'public_hub' ? 'SWITCH TO MEMBER DASHBOARD →' : 'SWITCH TO PUBLIC FAQ HUB ←'}
        </button>
      </div>

      {/* -------------------- DYNAMIC UNIFIED ENVIRONMENT INGESTION PANELS -------------------- */}
      <div style={{ minHeight: 'calc(100vh - 42px)' }}>
        {viewMode === 'public_hub' ? (
          /* 🌐 View 1: Your Savana-Style Interactive FAQ Category Grids Center (Olive Edition) */
          <FaqPage />
        ) : (
          /* 🖥️ View 2: Aliza's Olive-Green Production Dashboard Layout Framework containing your support form inside */
          <DashboardLayout />
        )}
      </div>
    </>
  );
}

export default App;
