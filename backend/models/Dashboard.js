const mongoose = require('mongoose');

const dashboardSchema = new mongoose.Schema({
  brandName: {
    type: String,
    required: true,
    unique: true
  },
  widgets: [{
    type: {
      type: String,
      enum: ['sentiment', 'sources', 'timeline', 'metrics', 'topics', 'engagement', 'alerts'],
      required: true
    },
    position: {
      x: Number,
      y: Number,
      w: Number,
      h: Number
    },
    config: mongoose.Schema.Types.Mixed, // Flexible configuration for each widget
    isVisible: { type: Boolean, default: true }
  }],
  preferences: {
    refreshRate: { type: Number, default: 300 }, // seconds
    timeRange: { type: String, default: '7d' }, // 7d, 30d, 90d
    theme: { type: String, default: 'dark' },
    compactMode: { type: Boolean, default: false }
  },
  quickStats: {
    totalMentions: { type: Number, default: 0 },
    positiveRate: { type: Number, default: 0 },
    negativeRate: { type: Number, default: 0 },
    avgEngagement: { type: Number, default: 0 },
    topSource: { type: String, default: '' },
    trendingTopic: { type: String, default: '' }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Static method to get or create dashboard for a brand
dashboardSchema.statics.getOrCreate = async function(brandName) {
  let dashboard = await this.findOne({ brandName });
  
  if (!dashboard) {
    // Create default dashboard layout
    dashboard = new this({
      brandName,
      widgets: [
        {
          type: 'metrics',
          position: { x: 0, y: 0, w: 6, h: 2 },
          config: { showTrends: true, compact: false }
        },
        {
          type: 'sentiment',
          position: { x: 6, y: 0, w: 3, h: 2 },
          config: { showPercentages: true }
        },
        {
          type: 'sources',
          position: { x: 9, y: 0, w: 3, h: 2 },
          config: { showCounts: true }
        },
        {
          type: 'timeline',
          position: { x: 0, y: 2, w: 8, h: 3 },
          config: { showTrendLine: true, timeRange: '7d' }
        },
        {
          type: 'topics',
          position: { x: 8, y: 2, w: 4, h: 3 },
          config: { maxTopics: 5, showSentiment: true }
        },
        {
          type: 'alerts',
          position: { x: 0, y: 5, w: 12, h: 2 },
          config: { showOnlyCritical: false }
        }
      ]
    });
    await dashboard.save();
  }
  
  return dashboard;
};

// Method to update quick stats
dashboardSchema.methods.updateQuickStats = async function() {
  const Analytics = mongoose.model('Analytics');
  const Mention = mongoose.model('Mention');
  
  const recentAnalytics = await Analytics.findOne({ 
    brandName: this.brandName 
  }).sort({ date: -1 });
  
  if (recentAnalytics) {
    const { metrics, sourceBreakdown, topicDistribution } = recentAnalytics;
    
    this.quickStats = {
      totalMentions: metrics.totalMentions,
      positiveRate: metrics.positiveMentions / metrics.totalMentions * 100,
      negativeRate: metrics.negativeMentions / metrics.totalMentions * 100,
      avgEngagement: metrics.engagementScore,
      topSource: Object.entries(sourceBreakdown).reduce((a, b) => 
        a[1] > b[1] ? a : b
      )[0],
      trendingTopic: topicDistribution.length > 0 ? 
        topicDistribution[0].topic : 'No topics'
    };
    
    this.lastUpdated = new Date();
    await this.save();
  }
};

module.exports = mongoose.model('Dashboard', dashboardSchema);