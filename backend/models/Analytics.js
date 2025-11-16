const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  brandName: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  metrics: {
    totalMentions: { type: Number, default: 0 },
    positiveMentions: { type: Number, default: 0 },
    negativeMentions: { type: Number, default: 0 },
    neutralMentions: { type: Number, default: 0 },
    sentimentScore: { type: Number, default: 0 }, // -1 to 1 scale
    engagementScore: { type: Number, default: 0 },
    reach: { type: Number, default: 0 }
  },
  sourceBreakdown: {
    twitter: { type: Number, default: 0 },
    facebook: { type: Number, default: 0 },
    news: { type: Number, default: 0 },
    blog: { type: Number, default: 0 },
    forum: { type: Number, default: 0 }
  },
  topicDistribution: [{
    topic: String,
    count: Number,
    sentiment: {
      positive: { type: Number, default: 0 },
      negative: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 }
    }
  }],
  peakHours: [{
    hour: Number,
    count: Number
  }],
  trendingKeywords: [{
    keyword: String,
    count: Number,
    growth: Number // percentage growth from previous period
  }],
  competitorComparison: {
    mainBrand: String,
    competitors: [{
      name: String,
      mentionCount: Number,
      sentimentScore: Number,
      marketShare: Number // percentage
    }]
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
analyticsSchema.index({ brandName: 1, date: -1 });
analyticsSchema.index({ brandName: 1, period: 1, date: -1 });

// Static method to get latest analytics for a brand
analyticsSchema.statics.getLatestAnalytics = function(brandName, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    brandName,
    date: { $gte: startDate }
  }).sort({ date: -1 });
};

// Method to calculate growth percentage
analyticsSchema.methods.calculateGrowth = function(previousData, metric) {
  if (!previousData || previousData.metrics[metric] === 0) return 0;
  const current = this.metrics[metric];
  const previous = previousData.metrics[metric];
  return ((current - previous) / previous * 100).toFixed(1);
};

module.exports = mongoose.model('Analytics', analyticsSchema);