import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const BrandManager = ({ brands, onBrandsUpdate, onBrandSelect, onTabChange }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBrand, setNewBrand] = useState({
    name: '',
    keywords: '',
    socialMediaHandles: ''
  });
  const [loading, setLoading] = useState(false);
  const [activeBrand, setActiveBrand] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBrand, setEditingBrand] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleAddBrand = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API_BASE}/brands`, {
        name: newBrand.name,
        keywords: newBrand.keywords.split(',').map(k => k.trim()).filter(k => k),
        socialMediaHandles: newBrand.socialMediaHandles.split(',').map(h => h.trim()).filter(h => h)
      });

      setNewBrand({ name: '', keywords: '', socialMediaHandles: '' });
      setShowAddForm(false);
      onBrandsUpdate();
    } catch (error) {
      console.error('Error adding brand:', error);
      alert(error.response?.data?.message || 'Error adding brand');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeSample = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/brands/initialize`);
      onBrandsUpdate();
      alert('Sample brands added successfully!');
    } catch (error) {
      console.error('Error initializing brands:', error);
      alert('Error initializing sample brands');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBrand = (brand) => {
    onBrandSelect(brand.name);
    onTabChange('mentions');
  };

  const handleEditBrand = (brand) => {
    setEditingBrand(brand);
  };

  const handleUpdateBrand = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.put(`${API_BASE}/brands/${editingBrand._id}`, {
        name: editingBrand.name,
        keywords: editingBrand.keywords,
        socialMediaHandles: editingBrand.socialMediaHandles
      });

      setEditingBrand(null);
      onBrandsUpdate();
      alert('Brand updated successfully!');
    } catch (error) {
      console.error('Error updating brand:', error);
      alert(error.response?.data?.message || 'Error updating brand');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrand = async () => {
  if (!deleteConfirm) return;
  
  console.log('Attempting to delete brand:', deleteConfirm);
  console.log('Brand ID to delete:', deleteConfirm._id);
  console.log('Current brands:', brands);
  console.log('Brand IDs:', brands.map(brand => ({ id: brand._id, name: brand.name })));
  
  setLoading(true);
  try {
    await axios.delete(`${API_BASE}/brands/${deleteConfirm._id}`);
    setDeleteConfirm(null);
    onBrandsUpdate();
    alert('Brand deleted successfully!');
  } catch (error) {
    console.error('Error deleting brand:', error);
    console.error('Error response:', error.response);
    alert(error.response?.data?.message || 'Error deleting brand');
  } finally {
    setLoading(false);
  }
};

  const handleAnalytics = (brand) => {
    onBrandSelect(brand.name);
    onTabChange('analytics');
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getBrandColor = (name) => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    ];
    return colors[name.length % colors.length];
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="brand-manager-container">
      {/* Header Section */}
      <div className="brands-header">
        <div className="header-content">
          <h1 className="brands-title">Brand Management</h1>
          <p className="brands-subtitle">
            Manage and monitor all your brands in one place
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-value">{brands.length}</span>
            <span className="stat-label">Total Brands</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {brands.filter(b => b.isActive).length}
            </span>
            <span className="stat-label">Active</span>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="brands-controls">
        <div className="search-section">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search brands or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="actions-section">
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className="action-btn primary"
          >
            <span className="btn-icon">➕</span>
            {showAddForm ? 'Cancel' : 'Add New Brand'}
          </button>
          <button 
            onClick={handleInitializeSample} 
            className="action-btn secondary"
            disabled={loading}
          >
            <span className="btn-icon">🎭</span>
            {loading ? 'Adding...' : 'Add Sample Brands'}
          </button>
        </div>
      </div>

      {/* Add Brand Form */}
      {showAddForm && (
        <div className="add-brand-form-container">
          <div className="form-header">
            <h3>Add New Brand</h3>
            <p>Create a new brand profile to start monitoring</p>
          </div>
          <form onSubmit={handleAddBrand} className="brand-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-text">Brand Name</span>
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={newBrand.name}
                  onChange={(e) => setNewBrand({...newBrand, name: e.target.value})}
                  placeholder="Enter brand name"
                  className="form-input"
                  required
                />
                <div className="form-hint">This will be the primary identifier for your brand</div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-text">Keywords</span>
                </label>
                <input
                  type="text"
                  value={newBrand.keywords}
                  onChange={(e) => setNewBrand({...newBrand, keywords: e.target.value})}
                  placeholder="sports, shoes, apparel, fitness"
                  className="form-input"
                />
                <div className="form-hint">Separate keywords with commas</div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-text">Social Media Handles</span>
                </label>
                <input
                  type="text"
                  value={newBrand.socialMediaHandles}
                  onChange={(e) => setNewBrand({...newBrand, socialMediaHandles: e.target.value})}
                  placeholder="@nike, @apple, @starbucks"
                  className="form-input"
                />
                <div className="form-hint">Include @handles for better tracking</div>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="form-btn cancel"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="form-btn submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Creating Brand...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🚀</span>
                    Create Brand
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Brand Modal */}
      {editingBrand && (
        <div className="modal-overlay">
          <div className="mention-modal">
            <div className="modal-header">
              <div className="modal-title">
                <h3>Edit Brand</h3>
                <p>Update brand information and tracking settings</p>
              </div>
              <button className="close-btn" onClick={() => setEditingBrand(null)}>✕</button>
            </div>

            <div className="modal-content">
              <form onSubmit={handleUpdateBrand} className="brand-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-text">Brand Name</span>
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingBrand.name}
                      onChange={(e) => setEditingBrand({...editingBrand, name: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-text">Keywords</span>
                    </label>
                    <input
                      type="text"
                      value={editingBrand.keywords.join(', ')}
                      onChange={(e) => setEditingBrand({
                        ...editingBrand, 
                        keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                      })}
                      placeholder="sports, shoes, apparel, fitness"
                      className="form-input"
                    />
                    <div className="form-hint">Separate keywords with commas</div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-text">Social Media Handles</span>
                    </label>
                    <input
                      type="text"
                      value={editingBrand.socialMediaHandles.join(', ')}
                      onChange={(e) => setEditingBrand({
                        ...editingBrand, 
                        socialMediaHandles: e.target.value.split(',').map(h => h.trim()).filter(h => h)
                      })}
                      placeholder="@nike, @apple, @starbucks"
                      className="form-input"
                    />
                    <div className="form-hint">Separate handles with commas</div>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="form-btn cancel"
                    onClick={() => setEditingBrand(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="form-btn submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="loading-spinner-small"></span>
                        Updating Brand...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">💾</span>
                        Update Brand
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="mention-modal">
            <div className="modal-header">
              <div className="modal-title">
                <h3>Delete Brand</h3>
                <p>This action cannot be undone</p>
              </div>
              <button className="close-btn" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>

            <div className="modal-content">
              <div className="delete-warning">
                <div className="warning-icon">⚠️</div>
                <h4>Are you sure you want to delete "{deleteConfirm.name}"?</h4>
                <p>This will permanently remove the brand and all associated data including mentions and analytics.</p>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="form-btn cancel"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="form-btn delete"
                  onClick={handleDeleteBrand}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner-small"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">🗑️</span>
                      Delete Brand
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brands Grid */}
      <div className="brands-content">
        <div className="section-header">
          <h3>Your Brands</h3>
          <div className="section-info">
            <span className="brands-count">
              Showing {filteredBrands.length} of {brands.length} brands
            </span>
            {searchTerm && (
              <button 
                className="clear-filters"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </button>
            )}
          </div>
        </div>

        {filteredBrands.length === 0 ? (
          <div className="empty-brands">
            <div className="empty-icon">🏢</div>
            <h4>No brands found</h4>
            <p>
              {brands.length === 0 
                ? "You haven't added any brands yet. Start by adding your first brand!"
                : "No brands match your search criteria. Try adjusting your search."
              }
            </p>
            {brands.length === 0 && (
              <button 
                onClick={handleInitializeSample} 
                className="cta-btn"
              >
                🎭 Add Sample Brands to Get Started
              </button>
            )}
          </div>
        ) : (
          <div className="brands-grid">
            {filteredBrands.map((brand, index) => (
              <div 
                key={brand._id} 
                className={`brand-card ${activeBrand === brand._id ? 'active' : ''}`}
                onClick={() => setActiveBrand(brand._id)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div 
                  className="brand-avatar"
                  style={{ background: getBrandColor(brand.name) }}
                >
                  {getInitials(brand.name)}
                </div>

                <div className="brand-content">
                  <div className="brand-header">
                    <h4 className="brand-name">{brand.name}</h4>
                    <div className={`status-badge ${brand.isActive ? 'active' : 'inactive'}`}>
                      <span className="status-dot"></span>
                      {brand.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <div className="brand-meta">
                    <div className="meta-item">
                      <span className="meta-label">Created</span>
                      <span className="meta-value">
                        {new Date(brand.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Keywords</span>
                      <span className="meta-value">{brand.keywords.length}</span>
                    </div>
                  </div>

                  {brand.keywords.length > 0 && (
                    <div className="keywords-section">
                      <div className="section-label">Tracking Keywords</div>
                      <div className="keywords-list">
                        {brand.keywords.slice(0, 4).map((keyword, idx) => (
                          <span key={idx} className="keyword-tag">
                            #{keyword}
                          </span>
                        ))}
                        {brand.keywords.length > 4 && (
                          <span className="keyword-more">
                            +{brand.keywords.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {brand.socialMediaHandles.length > 0 && (
                    <div className="social-section">
                      <div className="section-label">Social Media</div>
                      <div className="social-handles">
                        {brand.socialMediaHandles.slice(0, 3).map((handle, idx) => (
                          <span key={idx} className="social-handle">
                            {handle}
                          </span>
                        ))}
                        {brand.socialMediaHandles.length > 3 && (
                          <span className="social-more">
                            +{brand.socialMediaHandles.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="brand-actions">
                  <button 
                    className="brand-action-btn view"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewBrand(brand);
                    }}
                  >
                    <span className="action-icon">👁️</span>
                    View
                  </button>
                  <button 
                    className="brand-action-btn edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditBrand(brand);
                    }}
                  >
                    <span className="action-icon">✏️</span>
                    Edit
                  </button>
                  <button 
                    className="brand-action-btn analytics"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAnalytics(brand);
                    }}
                  >
                    <span className="action-icon">📊</span>
                    Analytics
                  </button>
                  <button 
                    className="brand-action-btn delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(brand);
                    }}
                  >
                    <span className="action-icon">🗑️</span>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="brands-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-value">{brands.length}</div>
              <div className="stat-label">Total Brands</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔍</div>
            <div className="stat-content">
              <div className="stat-value">
                {brands.reduce((total, brand) => total + brand.keywords.length, 0)}
              </div>
              <div className="stat-label">Tracking Keywords</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📱</div>
            <div className="stat-content">
              <div className="stat-value">
                {brands.reduce((total, brand) => total + brand.socialMediaHandles.length, 0)}
              </div>
              <div className="stat-label">Social Handles</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔄</div>
            <div className="stat-content">
              <div className="stat-value">
                {brands.filter(b => b.isActive).length}
              </div>
              <div className="stat-label">Active Monitoring</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandManager;