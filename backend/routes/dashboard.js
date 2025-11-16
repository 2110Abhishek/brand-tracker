const express = require('express');
const router = express.Router();
const Mention = require('../models/Mention');

// Simple dashboard routes that work with existing Mention model
router.get('/:brand/summary', async (req, res) => {
  try {
    const { brand } = req.params;
    const { period = '7d' } = req.query;
    
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get recent mentions
    const recentMentions = await Mention.find({
      brandName: brand,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: -1 }).limit(50);
    
    // Calculate metrics
    const totalMentions = recentMentions.length;
    const positiveMentions = recentMentions.filter(m => m.sentiment === 'positive').length;
    const negativeMentions = recentMentions.filter(m => m.sentiment === 'negative').length;
    const neutralMentions = recentMentions.filter(m => m.sentiment === 'neutral').length;
    
    const sourceBreakdown = recentMentions.reduce((acc, mention) => {
      acc[mention.source] = (acc[mention.source] || 0) + 1;
      return acc;
    }, {});
    
    const recentEngagement = recentMentions.reduce((sum, mention) => 
      sum + (mention.engagement?.likes || 0) + 
           (mention.engagement?.shares || 0) + 
           (mention.engagement?.comments || 0), 0);
    
    // Spike detection
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMentions = recentMentions.filter(m => 
      new Date(m.timestamp) >= today
    ).length;
    
    const avgDailyMentions = totalMentions / days;
    const isSpike = todayMentions > avgDailyMentions * 1.5;
    
    const summary = {
      realTime: {
        totalMentions,
        positiveMentions,
        negativeMentions,
        neutralMentions,
        sentimentDistribution: {
          positive: totalMentions > 0 ? (positiveMentions / totalMentions * 100).toFixed(1) : 0,
          negative: totalMentions > 0 ? (negativeMentions / totalMentions * 100).toFixed(1) : 0,
          neutral: totalMentions > 0 ? (neutralMentions / totalMentions * 100).toFixed(1) : 0
        },
        sourceBreakdown,
        recentEngagement,
        todayMentions,
        isSpike,
        spikePercentage: avgDailyMentions > 0 ? 
          ((todayMentions - avgDailyMentions) / avgDailyMentions * 100).toFixed(1) : 0
      },
      insights: generateInsights(recentMentions)
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get widget data
router.get('/:brand/widgets/:widgetType', async (req, res) => {
  try {
    const { brand, widgetType } = req.params;
    const { config = '{}' } = req.query;
    const widgetConfig = JSON.parse(config);
    
    let widgetData = {};
    
    switch (widgetType) {
      case 'sentiment':
        widgetData = await getSentimentWidgetData(brand, widgetConfig);
        break;
      case 'sources':
        widgetData = await getSourcesWidgetData(brand, widgetConfig);
        break;
      case 'timeline':
        widgetData = await getTimelineWidgetData(brand, widgetConfig);
        break;
      case 'topics':
        widgetData = await getTopicsWidgetData(brand, widgetConfig);
        break;
      case 'engagement':
        widgetData = await getEngagementWidgetData(brand, widgetConfig);
        break;
      default:
        return res.status(400).json({ message: 'Unknown widget type' });
    }
    
    res.json(widgetData);
  } catch (error) {
    console.error(`Error fetching ${req.params.widgetType} widget data:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Widget data helper functions
async function getSentimentWidgetData(brand, config) {
  const { timeRange = '7d' } = config;
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  
  const mentions = await Mention.find({
    brandName: brand,
    timestamp: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
  });
  
  const sentimentCounts = mentions.reduce((acc, mention) => {
    acc[mention.sentiment] = (acc[mention.sentiment] || 0) + 1;
    return acc;
  }, { positive: 0, negative: 0, neutral: 0 });
  
  const total = mentions.length;
  
  return {
    data: sentimentCounts,
    percentages: {
      positive: total > 0 ? (sentimentCounts.positive / total * 100).toFixed(1) : 0,
      negative: total > 0 ? (sentimentCounts.negative / total * 100).toFixed(1) : 0,
      neutral: total > 0 ? (sentimentCounts.neutral / total * 100).toFixed(1) : 0
    },
    totalMentions: total
  };
}

async function getSourcesWidgetData(brand, config) {
  const { timeRange = '7d' } = config;
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  
  const sourceData = await Mention.aggregate([
    {
      $match: {
        brandName: brand,
        timestamp: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  return {
    sources: sourceData,
    topSource: sourceData[0]?._id || 'None',
    totalSources: sourceData.length
  };
}

async function getTimelineWidgetData(brand, config) {
  const { timeRange = '7d' } = config;
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  
  const timelineData = await Mention.aggregate([
    {
      $match: {
        brandName: brand,
        timestamp: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
        },
        count: { $sum: 1 },
        positive: {
          $sum: { $cond: [{ $eq: ["$sentiment", "positive"] }, 1, 0] }
        },
        negative: {
          $sum: { $cond: [{ $eq: ["$sentiment", "negative"] }, 1, 0] }
        },
        neutral: {
          $sum: { $cond: [{ $eq: ["$sentiment", "neutral"] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  return {
    timeline: timelineData,
    peakDay: timelineData.reduce((max, day) => day.count > max.count ? day : max, { count: 0 }),
    averagePerDay: timelineData.length > 0 ? 
      timelineData.reduce((sum, day) => sum + day.count, 0) / timelineData.length : 0
  };
}

async function getTopicsWidgetData(brand, config) {
  const { maxTopics = 5, timeRange = '7d' } = config;
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  
  const topicData = await Mention.aggregate([
    {
      $match: {
        brandName: brand,
        timestamp: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
      }
    },
    { $unwind: '$topics' },
    {
      $group: {
        _id: '$topics',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: parseInt(maxTopics) }
  ]);
  
  return {
    topics: topicData,
    trendingTopic: topicData[0]?._id || 'No topics',
    totalTopics: topicData.length
  };
}

async function getEngagementWidgetData(brand, config) {
  const { timeRange = '7d' } = config;
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  
  const engagementData = await Mention.aggregate([
    {
      $match: {
        brandName: brand,
        timestamp: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: '$engagement.likes' },
        totalShares: { $sum: '$engagement.shares' },
        totalComments: { $sum: '$engagement.comments' },
        avgLikes: { $avg: '$engagement.likes' },
        avgShares: { $avg: '$engagement.shares' },
        avgComments: { $avg: '$engagement.comments' }
      }
    }
  ]);
  
  return engagementData[0] || {
    totalLikes: 0,
    totalShares: 0,
    totalComments: 0,
    avgLikes: 0,
    avgShares: 0,
    avgComments: 0
  };
}

// Helper function to generate insights
function generateInsights(mentions) {
  const insights = [];
  
  if (mentions.length === 0) {
    insights.push({
      type: 'info',
      title: 'No Data Available',
      message: 'Start monitoring to see insights about your brand mentions.'
    });
    return insights;
  }
  
  // Sentiment insight
  const positiveCount = mentions.filter(m => m.sentiment === 'positive').length;
  const negativeCount = mentions.filter(m => m.sentiment === 'negative').length;
  const total = mentions.length;
  
  if (positiveCount / total > 0.7) {
    insights.push({
      type: 'positive',
      title: 'Excellent Sentiment',
      message: `Your brand has ${((positiveCount / total) * 100).toFixed(1)}% positive mentions. Great job!`
    });
  } else if (negativeCount / total > 0.3) {
    insights.push({
      type: 'warning',
      title: 'Negative Sentiment Alert',
      message: `Your brand has ${((negativeCount / total) * 100).toFixed(1)}% negative mentions. Consider addressing concerns.`
    });
  }
  
  // Engagement insight
  const totalEngagement = mentions.reduce((sum, m) => 
    sum + (m.engagement?.likes || 0) + (m.engagement?.shares || 0) + (m.engagement?.comments || 0), 0);
  
  const avgEngagement = totalEngagement / total;
  
  if (avgEngagement > 50) {
    insights.push({
      type: 'positive',
      title: 'High Engagement',
      message: `Your mentions are receiving high engagement (avg ${avgEngagement.toFixed(1)} interactions per mention).`
    });
  }
  
  // Source insight
  const sourceCounts = mentions.reduce((acc, m) => {
    acc[m.source] = (acc[m.source] || 0) + 1;
    return acc;
  }, {});
  
  const topSource = Object.entries(sourceCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  
  insights.push({
    type: 'info',
    title: 'Top Platform',
    message: `Most of your mentions are coming from ${topSource}.`
  });
  
  return insights;
}

module.exports = router;