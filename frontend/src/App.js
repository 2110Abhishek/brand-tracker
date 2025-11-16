import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import MentionList from './components/MentionList';
import Analytics from './components/Analytics';
import BrandManager from './components/BrandManager';
import './App.css';

const API_BASE = 'http://localhost:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mentions, setMentions] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');

  useEffect(() => {
    // Initialize socket connection
    const socket = io('http://localhost:5000');
    
    socket.on('newMention', (newMention) => {
      setMentions(prev => [newMention, ...prev]);
    });

    // Load initial data
    fetchBrands();
    fetchMentions();

    return () => socket.disconnect();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await axios.get(`${API_BASE}/brands`);
      setBrands(response.data);
      if (response.data.length > 0 && !selectedBrand) {
        setSelectedBrand(response.data[0].name);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchMentions = async (brand = selectedBrand) => {
    try {
      const response = await axios.get(`${API_BASE}/mentions`, {
        params: { brand, limit: 50 }
      });
      setMentions(response.data.mentions);
    } catch (error) {
      console.error('Error fetching mentions:', error);
    }
  };

  const handleBrandChange = (brand) => {
    setSelectedBrand(brand);
    fetchMentions(brand);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Brand Mention Tracker</h1>
        <div className="brand-selector">
          <select 
            value={selectedBrand} 
            onChange={(e) => handleBrandChange(e.target.value)}
          >
            <option value="">Select a brand</option>
            {brands.map(brand => (
              <option key={brand._id} value={brand.name}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <nav className="app-nav">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'mentions' ? 'active' : ''}
          onClick={() => setActiveTab('mentions')}
        >
          Mentions
        </button>
        <button 
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={activeTab === 'brands' ? 'active' : ''}
          onClick={() => setActiveTab('brands')}
        >
          Manage Brands
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'dashboard' && (
          <Dashboard 
            brand={selectedBrand} 
            mentions={mentions}
          />
        )}
        {activeTab === 'mentions' && (
          <MentionList 
            mentions={mentions}
            brand={selectedBrand}
            onRefresh={fetchMentions}
          />
        )}
        {activeTab === 'analytics' && (
          <Analytics brand={selectedBrand} />
        )}
        {activeTab === 'brands' && (
  <BrandManager 
    brands={brands}
    onBrandsUpdate={fetchBrands}
    onBrandSelect={setSelectedBrand}
    onTabChange={setActiveTab}
  />
)}
      </main>
    </div>
  );
}

export default App;