import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://brand-tracker-backend.onrender.com/api';

const MentionList = ({ mentions, brand, onRefresh }) => {
  const [filters, setFilters] = useState({
    sentiment: '',
    source: '',
    search: ''
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest');
  const [selectedMention, setSelectedMention] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter mentions based on current filters
  const filteredMentions = mentions.filter(mention => {
    return (
      (!filters.sentiment || mention.sentiment === filters.sentiment) &&
      (!filters.source || mention.source === filters.source) &&
      (!filters.search || 
       mention.content.toLowerCase().includes(filters.search.toLowerCase()) ||
       mention.author?.toLowerCase().includes(filters.search.toLowerCase()))
    );
  });

  // Sort mentions
  const sortedMentions = [...filteredMentions].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.timestamp) - new Date(a.timestamp);
      case 'oldest':
        return new Date(a.timestamp) - new Date(b.timestamp);
      case 'engagement':
        const engagementA = (a.engagement?.likes || 0) + (a.engagement?.shares || 0) + (a.engagement?.comments || 0);
        const engagementB = (b.engagement?.likes || 0) + (b.engagement?.shares || 0) + (b.engagement?.comments || 0);
        return engagementB - engagementA;
      case 'sentiment':
        const sentimentOrder = { positive: 3, neutral: 2, negative: 1 };
        return sentimentOrder[b.sentiment] - sentimentOrder[a.sentiment];
      default:
        return 0;
    }
  });

  const handleSimulateMentions = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/mentions/simulate`, {
        brandName: brand,
        count: 10
      });
      onRefresh();
    } catch (error) {
      console.error('Error simulating mentions:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({ sentiment: '', source: '', search: '' });
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'twitter': return { icon: '🐦', color: '#1DA1F2', name: 'Twitter' };
      case 'facebook': return { icon: '📘', color: '#1877F2', name: 'Facebook' };
      case 'news': return { icon: '📰', color: '#FF6B6B', name: 'News' };
      case 'blog': return { icon: '📝', color: '#4ECDC4', name: 'Blog' };
      case 'forum': return { icon: '💬', color: '#45B7D1', name: 'Forum' };
      default: return { icon: '🌐', color: '#95A5A6', name: 'Web' };
    }
  };

  const getSentimentConfig = (sentiment) => {
    switch (sentiment) {
      case 'positive': 
        return { 
          color: '#10B981', 
          bgColor: 'rgba(16, 185, 129, 0.1)',
          icon: '😊',
          label: 'Positive'
        };
      case 'negative': 
        return { 
          color: '#EF4444', 
          bgColor: 'rgba(239, 68, 68, 0.1)',
          icon: '😠',
          label: 'Negative'
        };
      case 'neutral': 
        return { 
          color: '#F59E0B', 
          bgColor: 'rgba(245, 158, 11, 0.1)',
          icon: '😐',
          label: 'Neutral'
        };
      default: 
        return { 
          color: '#6B7280', 
          bgColor: 'rgba(107, 114, 128, 0.1)',
          icon: '😶',
          label: 'Unknown'
        };
    }
  };

  const getEngagementScore = (engagement) => {
    return (engagement?.likes || 0) + (engagement?.shares || 0) + (engagement?.comments || 0);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return time.toLocaleDateString();
  };

  const MentionCard = ({ mention, index }) => {
    const sourceConfig = getSourceIcon(mention.source);
    const sentimentConfig = getSentimentConfig(mention.sentiment);
    const engagementScore = getEngagementScore(mention.engagement);

    return (
      <div 
        className={`mention-card ${viewMode} ${mention.sentiment} animate-in`}
        style={{ animationDelay: `${index * 0.05}s` }}
        onClick={() => setSelectedMention(mention)}
      >
        <div className="mention-card-header">
          <div className="source-section">
            <div 
              className="source-avatar"
              style={{ backgroundColor: sourceConfig.color }}
            >
              {sourceConfig.icon}
            </div>
            <div className="source-info">
              <div className="source-name">{sourceConfig.name}</div>
              <div className="mention-author">{mention.author || 'Anonymous User'}</div>
            </div>
          </div>
          
          <div className="sentiment-section">
            <div 
              className="sentiment-indicator"
              style={{ 
                backgroundColor: sentimentConfig.bgColor,
                color: sentimentConfig.color
              }}
            >
              <span className="sentiment-icon">{sentimentConfig.icon}</span>
              <span className="sentiment-label">{sentimentConfig.label}</span>
            </div>
          </div>
        </div>

        <div className="mention-card-content">
          <p className="mention-text">{mention.content}</p>
        </div>

        <div className="mention-card-footer">
          <div className="engagement-metrics">
            {mention.engagement?.likes > 0 && (
              <div className="metric">
                <span className="metric-icon">👍</span>
                <span className="metric-value">{mention.engagement.likes}</span>
              </div>
            )}
            {mention.engagement?.shares > 0 && (
              <div className="metric">
                <span className="metric-icon">🔄</span>
                <span className="metric-value">{mention.engagement.shares}</span>
              </div>
            )}
            {mention.engagement?.comments > 0 && (
              <div className="metric">
                <span className="metric-icon">💬</span>
                <span className="metric-value">{mention.engagement.comments}</span>
              </div>
            )}
            {engagementScore > 0 && (
              <div className="engagement-score">
                <span className="score-value">{engagementScore}</span>
                <span className="score-label">Engagement</span>
              </div>
            )}
          </div>
          
          <div className="time-section">
            <span className="time-ago">{formatTimeAgo(mention.timestamp)}</span>
            <span className="full-date">
              {new Date(mention.timestamp).toLocaleDateString()}
            </span>
          </div>
        </div>

        {mention.topics && mention.topics.length > 0 && (
          <div className="mention-topics">
            {mention.topics.slice(0, 4).map((topic, topicIndex) => (
              <span 
                key={topicIndex} 
                className="topic-tag"
                style={{ backgroundColor: sourceConfig.color + '20' }}
              >
                #{topic}
              </span>
            ))}
          </div>
        )}

        <div className="mention-card-actions">
          <button className="action-btn view-btn">View Details</button>
          <button className="action-btn share-btn">Share</button>
        </div>
      </div>
    );
  };

  const MentionDetailModal = ({ mention, onClose }) => {
    if (!mention) return null;

    const sourceConfig = getSourceIcon(mention.source);
    const sentimentConfig = getSentimentConfig(mention.sentiment);

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="mention-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">
              <h3>Mention Details</h3>
              <p>Complete information about this mention</p>
            </div>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="modal-content">
            <div className="detail-section">
              <div className="detail-header">
                <div 
                  className="source-badge-large"
                  style={{ backgroundColor: sourceConfig.color }}
                >
                  {sourceConfig.icon}
                  <span>{sourceConfig.name}</span>
                </div>
                <div 
                  className="sentiment-badge-large"
                  style={{ 
                    backgroundColor: sentimentConfig.bgColor,
                    color: sentimentConfig.color
                  }}
                >
                  {sentimentConfig.icon}
                  <span>{sentimentConfig.label}</span>
                </div>
              </div>

              <div className="content-section">
                <h4>Content</h4>
                <p className="detail-content">{mention.content}</p>
              </div>

              <div className="metadata-grid">
                <div className="metadata-item">
                  <span className="metadata-label">Author</span>
                  <span className="metadata-value">{mention.author || 'Unknown'}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Published</span>
                  <span className="metadata-value">
                    {new Date(mention.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Engagement</span>
                  <span className="metadata-value">
                    {getEngagementScore(mention.engagement)} points
                  </span>
                </div>
                {mention.url && (
                  <div className="metadata-item">
                    <span className="metadata-label">Source URL</span>
                    <a href={mention.url} className="metadata-link" target="_blank" rel="noopener noreferrer">
                      Visit Source
                    </a>
                  </div>
                )}
              </div>

              {mention.engagement && (
                <div className="engagement-section">
                  <h4>Engagement Metrics</h4>
                  <div className="engagement-grid">
                    <div className="engagement-item">
                      <span className="engagement-icon">👍</span>
                      <span className="engagement-count">{mention.engagement.likes || 0}</span>
                      <span className="engagement-label">Likes</span>
                    </div>
                    <div className="engagement-item">
                      <span className="engagement-icon">🔄</span>
                      <span className="engagement-count">{mention.engagement.shares || 0}</span>
                      <span className="engagement-label">Shares</span>
                    </div>
                    <div className="engagement-item">
                      <span className="engagement-icon">💬</span>
                      <span className="engagement-count">{mention.engagement.comments || 0}</span>
                      <span className="engagement-label">Comments</span>
                    </div>
                  </div>
                </div>
              )}

              {mention.topics && mention.topics.length > 0 && (
                <div className="topics-section">
                  <h4>Related Topics</h4>
                  <div className="topics-list">
                    {mention.topics.map((topic, index) => (
                      <span key={index} className="topic-tag-large">
                        #{topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mention-list-container">
      {/* Header Section */}
      <div className="mentions-header">
        <div className="header-content">
          <h1 className="page-title">Brand Mentions</h1>
          <p className="page-subtitle">
            Monitor and analyze all mentions of <span className="brand-name">{brand}</span>
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-value">{mentions.length}</span>
            <span className="stat-label">Total Mentions</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{filteredMentions.length}</span>
            <span className="stat-label">Filtered</span>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="controls-section">
        <div className="search-filters">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search mentions, authors, or content..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="search-input"
            />
            {filters.search && (
              <button 
                className="clear-search"
                onClick={() => setFilters({...filters, search: ''})}
              >
                ✕
              </button>
            )}
          </div>

          <div className="filter-group">
            <select
              value={filters.sentiment}
              onChange={(e) => setFilters({...filters, sentiment: e.target.value})}
              className="filter-select"
            >
              <option value="">All Sentiments</option>
              <option value="positive">😊 Positive</option>
              <option value="negative">😠 Negative</option>
              <option value="neutral">😐 Neutral</option>
            </select>

            <select
              value={filters.source}
              onChange={(e) => setFilters({...filters, source: e.target.value})}
              className="filter-select"
            >
              <option value="">All Sources</option>
              <option value="twitter">🐦 Twitter</option>
              <option value="facebook">📘 Facebook</option>
              <option value="news">📰 News</option>
              <option value="blog">📝 Blog</option>
              <option value="forum">💬 Forum</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="newest">🕒 Newest First</option>
              <option value="oldest">🕒 Oldest First</option>
              <option value="engagement">🔥 Most Engaged</option>
              <option value="sentiment">😊 Sentiment</option>
            </select>
          </div>
        </div>

        <div className="action-controls">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ▦ Grid
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰ List
            </button>
          </div>

          <button 
            onClick={handleSimulateMentions} 
            className="simulate-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner-small"></span>
                Generating...
              </>
            ) : (
              <>
                <span className="simulate-icon">🎭</span>
                Simulate Mentions
              </>
            )}
          </button>

          {(filters.sentiment || filters.source || filters.search) && (
            <button onClick={clearFilters} className="clear-filters-btn">
              ✕ Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <span className="results-count">
          Showing {sortedMentions.length} of {mentions.length} mentions
        </span>
        {(filters.sentiment || filters.source || filters.search) && (
          <div className="active-filters">
            {filters.sentiment && (
              <span className="active-filter">
                Sentiment: {filters.sentiment}
                <button onClick={() => setFilters({...filters, sentiment: ''})}>✕</button>
              </span>
            )}
            {filters.source && (
              <span className="active-filter">
                Source: {filters.source}
                <button onClick={() => setFilters({...filters, source: ''})}>✕</button>
              </span>
            )}
            {filters.search && (
              <span className="active-filter">
                Search: "{filters.search}"
                <button onClick={() => setFilters({...filters, search: ''})}>✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Mentions Grid/List */}
      <div className={`mentions-display ${viewMode}`}>
        {sortedMentions.length > 0 ? (
          sortedMentions.map((mention, index) => (
            <MentionCard key={mention._id} mention={mention} index={index} />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>No mentions found</h3>
            <p>
              {mentions.length === 0 
                ? `No mentions available for ${brand}. Try simulating some mentions or check back later.`
                : 'No mentions match your current filters. Try adjusting your search criteria.'
              }
            </p>
            {mentions.length === 0 && (
              <button onClick={handleSimulateMentions} className="cta-btn">
                🎭 Generate Sample Mentions
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mention Detail Modal */}
      <MentionDetailModal 
        mention={selectedMention} 
        onClose={() => setSelectedMention(null)} 
      />
    </div>
  );
};

export default MentionList;