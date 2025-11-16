import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

const API_BASE = 'http://localhost:5000/api';

const Analytics = ({ brand }) => {
  const [sentimentData, setSentimentData] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [spikeAlert, setSpikeAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');
  const [activeMetric, setActiveMetric] = useState('overview');

  const fetchAnalytics = useCallback(async () => {
    if (!brand) return;
    
    try {
      setLoading(true);
      const [sentimentRes, sourceRes, timeRes, spikeRes] = await Promise.all([
        axios.get(`${API_BASE}/analytics/sentiment-distribution`, { params: { brand } }),
        axios.get(`${API_BASE}/analytics/source-distribution`, { params: { brand } }),
        axios.get(`${API_BASE}/analytics/mentions-over-time`, { params: { brand, days: timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90 } }),
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
  }, [brand, timeRange]);

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
  const totalMentions = sentimentData.reduce((total, item) => total + item.count, 0);
  const positiveMentions = sentimentData.find(s => s._id === 'positive')?.count || 0;
  const negativeMentions = sentimentData.find(s => s._id === 'negative')?.count || 0;
  const neutralMentions = sentimentData.find(s => s._id === 'neutral')?.count || 0;
  const positivePercentage = totalMentions > 0 ? (positiveMentions / totalMentions * 100).toFixed(1) : 0;
  const negativePercentage = totalMentions > 0 ? (negativeMentions / totalMentions * 100).toFixed(1) : 0;
  const neutralPercentage = totalMentions > 0 ? (neutralMentions / totalMentions * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-animation">
          <div className="pulse-circle"></div>
          <div className="pulse-circle delay-1"></div>
          <div className="pulse-circle delay-2"></div>
        </div>
        <h3>Loading Analytics Dashboard</h3>
        <p>Crunching the numbers for {brand}</p>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {/* Header Section */}
      <div className="analytics-header">
        <div className="header-content">
          <h1 className="analytics-title">Advanced Analytics</h1>
          <p className="analytics-subtitle">
            Deep insights for <span className="brand-highlight">{brand || 'Your Brand'}</span>
          </p>
        </div>
        <div className="header-controls">
          <div className="time-range-selector">
            <button 
              className={`time-btn ${timeRange === '7days' ? 'active' : ''}`}
              onClick={() => setTimeRange('7days')}
            >
              7 Days
            </button>
            <button 
              className={`time-btn ${timeRange === '30days' ? 'active' : ''}`}
              onClick={() => setTimeRange('30days')}
            >
              30 Days
            </button>
            <button 
              className={`time-btn ${timeRange === '90days' ? 'active' : ''}`}
              onClick={() => setTimeRange('90days')}
            >
              90 Days
            </button>
          </div>
          <button onClick={fetchAnalytics} className="refresh-btn">
            <span className="refresh-icon">🔄</span>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {spikeAlert?.isSpike && (
        <div className="analytics-alert">
          <div className="alert-icon">🚨</div>
          <div className="alert-content">
            <h4>Mention Volume Spike!</h4>
            <p>
              <strong>{spikeAlert.todayCount} mentions today</strong> - 
              <span className="spike-text"> {spikeAlert.spikePercentage}% above average</span>
            </p>
          </div>
          <div className="alert-actions">
            <button className="alert-btn primary">View Details</button>
            <button className="alert-btn secondary">Dismiss</button>
          </div>
        </div>
      )}

      {/* Metrics Overview */}
      <div className="metrics-overview">
        <div className="metric-tabs">
          <button 
            className={`metric-tab ${activeMetric === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveMetric('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`metric-tab ${activeMetric === 'sentiment' ? 'active' : ''}`}
            onClick={() => setActiveMetric('sentiment')}
          >
            😊 Sentiment
          </button>
          <button 
            className={`metric-tab ${activeMetric === 'sources' ? 'active' : ''}`}
            onClick={() => setActiveMetric('sources')}
          >
            📱 Sources
          </button>
        </div>

        <div className="metrics-grid">
          <div className="metric-card primary">
            <div className="metric-icon">📈</div>
            <div className="metric-content">
              <div className="metric-value">{totalMentions}</div>
              <div className="metric-label">Total Mentions</div>
              <div className="metric-trend">
                <span className="trend-up">↗ 12%</span> from last period
              </div>
            </div>
          </div>

          <div className="metric-card success">
            <div className="metric-icon">😊</div>
            <div className="metric-content">
              <div className="metric-value">{positiveMentions}</div>
              <div className="metric-label">Positive</div>
              <div className="metric-progress">
                <div className="progress-track">
                  <div 
                    className="progress-fill positive" 
                    style={{width: `${positivePercentage}%`}}
                  ></div>
                </div>
                <div className="progress-value">{positivePercentage}%</div>
              </div>
            </div>
          </div>

          <div className="metric-card danger">
            <div className="metric-icon">😠</div>
            <div className="metric-content">
              <div className="metric-value">{negativeMentions}</div>
              <div className="metric-label">Negative</div>
              <div className="metric-progress">
                <div className="progress-track">
                  <div 
                    className="progress-fill negative" 
                    style={{width: `${negativePercentage}%`}}
                  ></div>
                </div>
                <div className="progress-value">{negativePercentage}%</div>
              </div>
            </div>
          </div>

          <div className="metric-card warning">
            <div className="metric-icon">😐</div>
            <div className="metric-content">
              <div className="metric-value">{neutralMentions}</div>
              <div className="metric-label">Neutral</div>
              <div className="metric-progress">
                <div className="progress-track">
                  <div 
                    className="progress-fill neutral" 
                    style={{width: `${neutralPercentage}%`}}
                  ></div>
                </div>
                <div className="progress-value">{neutralPercentage}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-row">
          <div className="chart-card sentiment-chart">
            <div className="chart-header">
              <h3>Sentiment Distribution</h3>
              <div className="chart-actions">
                <button className="chart-action-btn">Export</button>
                <button className="chart-action-btn">Share</button>
              </div>
            </div>
            <div className="chart-container">
              {sentimentData.length > 0 ? (
                <Doughnut data={sentimentChartData} options={sentimentOptions} />
              ) : (
                <div className="no-data">
                  <div className="no-data-icon">📊</div>
                  <p>No sentiment data available</p>
                </div>
              )}
            </div>
            <div className="chart-footer">
              <div className="sentiment-breakdown">
                {sentimentData.map(item => (
                  <div key={item._id} className="breakdown-item">
                    <span className="breakdown-label">{item._id}</span>
                    <span className="breakdown-value">{item.count}</span>
                    <span className="breakdown-percentage">
                      {totalMentions > 0 ? ((item.count / totalMentions) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="chart-card sources-chart">
            <div className="chart-header">
              <h3>Platform Distribution</h3>
              <div className="chart-legend">
                {sourceData.map((item, index) => (
                  <div key={index} className="legend-item">
                    <span 
                      className="legend-dot"
                      style={{backgroundColor: sourceChartData.datasets[0].backgroundColor[index]}}
                    ></span>
                    <span>{item._id}</span>
                    <span className="legend-count">({item.count})</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="chart-container">
              {sourceData.length > 0 ? (
                <Bar data={sourceChartData} options={barOptions} />
              ) : (
                <div className="no-data">
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
              <div className="timeline-stats">
                <div className="stat-item">
                  <span className="stat-label">Peak Day:</span>
                  <span className="stat-value">
                    {timeData.length > 0 ? 
                      timeData.reduce((max, day) => day.total > max.total ? day : max, timeData[0])._id 
                      : 'N/A'}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg/Day:</span>
                  <span className="stat-value">
                    {timeData.length > 0 ? 
                      Math.round(timeData.reduce((sum, day) => sum + day.total, 0) / timeData.length) 
                      : 0}
                  </span>
                </div>
              </div>
            </div>
            <div className="chart-container">
              {timeData.length > 0 ? (
                <Line data={timeChartData} options={lineOptions} />
              ) : (
                <div className="no-data">
                  <div className="no-data-icon">📅</div>
                  <p>No timeline data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="insights-section">
        <h3>Key Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">🔥</div>
            <div className="insight-content">
              <h4>Engagement Hotspots</h4>
              <p>Twitter shows highest engagement rates with average of 45 interactions per mention</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">📈</div>
            <div className="insight-content">
              <h4>Growth Trend</h4>
              <p>Mention volume increased by 23% compared to previous period</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <h4>Top Topics</h4>
              <p>Product features and customer service are the most discussed topics</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">🕒</div>
            <div className="insight-content">
              <h4>Peak Hours</h4>
              <p>Most mentions occur between 2 PM - 5 PM across all platforms</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;