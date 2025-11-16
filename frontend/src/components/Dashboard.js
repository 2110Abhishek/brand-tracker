import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE = 'http://localhost:5000/api';

const Dashboard = ({ brand, mentions }) => {
  const [sentimentData, setSentimentData] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [spikeAlert, setSpikeAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeMetric, setActiveMetric] = useState('all');

  // Fixed useEffect with useCallback
  const fetchAnalytics = useCallback(async () => {
    if (!brand) return;
    
    try {
      setLoading(true);
      const [sentimentRes, sourceRes, timeRes, spikeRes] = await Promise.all([
        axios.get(`${API_BASE}/analytics/sentiment-distribution`, { params: { brand } }),
        axios.get(`${API_BASE}/analytics/source-distribution`, { params: { brand } }),
        axios.get(`${API_BASE}/analytics/mentions-over-time`, { params: { brand, days: 7 } }),
        axios.get(`${API_BASE}/analytics/spike-alerts`, { params: { brand } })
      ]);

      setSentimentData(sentimentRes.data);
      setSourceData(sourceRes.data);
      setTimeData(timeRes.data);
      setSpikeAlert(spikeRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [brand]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Enhanced chart data with animations
  const sentimentChartData = {
    labels: sentimentData.map(item => item._id?.charAt(0).toUpperCase() + item._id?.slice(1) || 'Unknown'),
    datasets: [
      {
        data: sentimentData.map(item => item.count),
        backgroundColor: [
          'rgba(76, 175, 80, 0.8)',
          'rgba(244, 67, 54, 0.8)',
          'rgba(255, 193, 7, 0.8)'
        ],
        borderColor: [
          'rgba(76, 175, 80, 1)',
          'rgba(244, 67, 54, 1)',
          'rgba(255, 193, 7, 1)'
        ],
        borderWidth: 3,
        hoverOffset: 20,
        borderRadius: 10,
        spacing: 5
      }
    ]
  };

  const sourceChartData = {
    labels: sourceData.map(item => item._id?.charAt(0).toUpperCase() + item._id?.slice(1) || 'Unknown'),
    datasets: [
      {
        label: 'Mentions by Source',
        data: sourceData.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  const timeChartData = {
    labels: timeData.map(item => item._id),
    datasets: [
      {
        label: 'Total Mentions',
        data: timeData.map(item => item.total),
        borderColor: 'rgba(147, 51, 234, 1)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(147, 51, 234, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 10
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: '600'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.raw}`;
          }
        }
      }
    }
  };

  const sentimentOptions = {
    ...chartOptions,
    cutout: '60%',
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        position: 'bottom'
      }
    }
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    }
  };

  const lineOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    }
  };

  // Calculate metrics
  const totalMentions = mentions.length;
  const positiveMentions = sentimentData.find(s => s._id === 'positive')?.count || 0;
  const negativeMentions = sentimentData.find(s => s._id === 'negative')?.count || 0;
  const neutralMentions = sentimentData.find(s => s._id === 'neutral')?.count || 0;
  const positivePercentage = totalMentions > 0 ? (positiveMentions / totalMentions * 100).toFixed(1) : 0;
  const negativePercentage = totalMentions > 0 ? (negativeMentions / totalMentions * 100).toFixed(1) : 0;

  const recentMentions = mentions.slice(0, 6);

  const getSourceIcon = (source) => {
    switch (source) {
      case 'twitter': return '🐦';
      case 'facebook': return '📘';
      case 'news': return '📰';
      case 'blog': return '📝';
      case 'forum': return '💬';
      default: return '🌐';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😠';
      case 'neutral': return '😐';
      default: return '😶';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-animation">
          <div className="pulse-circle"></div>
          <div className="pulse-circle delay-1"></div>
          <div className="pulse-circle delay-2"></div>
        </div>
        <h3>Loading Dashboard Data...</h3>
        <p>Fetching real-time brand insights</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            Brand Intelligence Dashboard
          </h1>
          <p className="dashboard-subtitle">
            Real-time monitoring for <span className="brand-highlight">{brand || 'Your Brand'}</span>
          </p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchAnalytics}>
            <span className="refresh-icon">🔄</span>
            Refresh Data
          </button>
          <div className="time-indicator">
            <span className="live-dot"></span>
            Live Updates
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {spikeAlert?.isSpike && (
        <div className="alert-banner spike-alert">
          <div className="alert-icon">🚨</div>
          <div className="alert-content">
            <h4>Mention Spike Detected!</h4>
            <p>
              <strong>{spikeAlert.todayCount} mentions today</strong> - 
              <strong className="spike-percent"> {spikeAlert.spikePercentage}% above average</strong>
            </p>
          </div>
          <div className="alert-action">
            <button className="alert-btn">View Details</button>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-value">{totalMentions}</div>
            <div className="metric-label">Total Mentions</div>
            <div className="metric-trend">
              <span className="trend-up">↗ 12%</span> from last week
            </div>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">👍</div>
          <div className="metric-content">
            <div className="metric-value">{positiveMentions}</div>
            <div className="metric-label">Positive</div>
            <div className="metric-progress">
              <div 
                className="progress-bar positive" 
                style={{width: `${positivePercentage}%`}}
              ></div>
            </div>
            <div className="metric-percentage">{positivePercentage}%</div>
          </div>
        </div>

        <div className="metric-card danger">
          <div className="metric-icon">👎</div>
          <div className="metric-content">
            <div className="metric-value">{negativeMentions}</div>
            <div className="metric-label">Negative</div>
            <div className="metric-progress">
              <div 
                className="progress-bar negative" 
                style={{width: `${negativePercentage}%`}}
              ></div>
            </div>
            <div className="metric-percentage">{negativePercentage}%</div>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">⚖️</div>
          <div className="metric-content">
            <div className="metric-value">{neutralMentions}</div>
            <div className="metric-label">Neutral</div>
            <div className="metric-change">
              <span className="change-neutral">→ Stable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-row">
          <div className="chart-card sentiment-chart">
            <div className="chart-header">
              <h3>Sentiment Analysis</h3>
              <div className="chart-actions">
                <button className="chart-btn active">All</button>
                <button className="chart-btn">Week</button>
                <button className="chart-btn">Month</button>
              </div>
            </div>
            <div className="chart-container">
              {sentimentData.length > 0 ? (
                <Doughnut data={sentimentChartData} options={sentimentOptions} />
              ) : (
                <div className="no-data-chart">
                  <div className="no-data-icon">📈</div>
                  <p>No sentiment data available</p>
                </div>
              )}
            </div>
          </div>

          <div className="chart-card source-chart">
            <div className="chart-header">
              <h3>Platform Distribution</h3>
              <div className="chart-legend">
                {sourceData.map((item, index) => (
                  <div key={index} className="legend-item">
                    <span 
                      className="legend-dot"
                      style={{backgroundColor: sourceChartData.datasets[0].backgroundColor[index]}}
                    ></span>
                    <span>{item._id} ({item.count})</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="chart-container">
              {sourceData.length > 0 ? (
                <Bar data={sourceChartData} options={barOptions} />
              ) : (
                <div className="no-data-chart">
                  <div className="no-data-icon">📱</div>
                  <p>No source data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="chart-row">
          <div className="chart-card timeline-chart">
            <div className="chart-header">
              <h3>Mentions Timeline</h3>
              <div className="time-filters">
                <select className="time-select">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>Last 90 Days</option>
                </select>
              </div>
            </div>
            <div className="chart-container">
              {timeData.length > 0 ? (
                <Line data={timeChartData} options={lineOptions} />
              ) : (
                <div className="no-data-chart">
                  <div className="no-data-icon">📅</div>
                  <p>No timeline data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <div className="activity-header">
          <h3>Recent Mentions</h3>
          <div className="activity-stats">
            <span className="stat-badge">{recentMentions.length} mentions</span>
            <button className="view-all-btn">View All →</button>
          </div>
        </div>
        
        <div className="mentions-grid">
          {recentMentions.map((mention, index) => (
            <div 
              key={mention._id} 
              className={`mention-card ${mention.sentiment} animate-in`}
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="mention-header">
                <div className="source-info">
                  <span className="source-icon">
                    {getSourceIcon(mention.source)}
                  </span>
                  <span className="source-name">{mention.source}</span>
                </div>
                <div className={`sentiment-tag ${mention.sentiment}`}>
                  <span className="sentiment-icon">
                    {getSentimentIcon(mention.sentiment)}
                  </span>
                  {mention.sentiment}
                </div>
              </div>
              
              <div className="mention-content">
                <p>{mention.content}</p>
              </div>
              
              <div className="mention-footer">
                <div className="mention-meta">
                  <span className="author">{mention.author || 'Anonymous'}</span>
                  <span className="time">
                    {new Date(mention.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="engagement">
                  {mention.engagement?.likes > 0 && (
                    <span className="engagement-item">👍 {mention.engagement.likes}</span>
                  )}
                  {mention.engagement?.shares > 0 && (
                    <span className="engagement-item">🔄 {mention.engagement.shares}</span>
                  )}
                  {mention.engagement?.comments > 0 && (
                    <span className="engagement-item">💬 {mention.engagement.comments}</span>
                  )}
                </div>
              </div>

              {mention.topics && mention.topics.length > 0 && (
                <div className="mention-topics">
                  {mention.topics.slice(0, 3).map((topic, topicIndex) => (
                    <span key={topicIndex} className="topic-badge">#{topic}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {recentMentions.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h4>No mentions yet</h4>
            <p>Start monitoring to see brand mentions appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;