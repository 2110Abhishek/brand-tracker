const express = require('express');
const router = express.Router();
const Mention = require('../models/Mention');
const Analytics = require('../models/Analytics');

// Get comprehensive analytics for a brand
router.get('/overview', async (req, res) => {
  try {
    const { brand, period = '7d' } = req.query;
    
    if (!brand) {
      return res.status(400).json({ message: 'Brand name is required' });
    }

    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    
    // Try to get analytics from Analytics collection first
    let analytics = await Analytics.getLatestAnalytics(brand, days);
    
    if (analytics.length === 0) {
      // Fallback to real-time calculation from mentions
      analytics = [await calculateRealTimeAnalytics(brand, days)];
    }

    const latest = analytics[0];
    const previous = analytics[1] || analytics[0];
    
    const insights = {
      totalMentions: latest.metrics.totalMentions,
      totalGrowth: latest.calculateGrowth ? latest.calculateGrowth(previous, 'totalMentions') : 0,
      sentimentScore: latest.metrics.sentimentScore,
      engagementScore: latest.metrics.engagementScore,
      positiveMentions: latest.metrics.positiveMentions,
      negativeMentions: latest.metrics.negativeMentions,
      neutralMentions: latest.metrics.neutralMentions,
      sourceBreakdown: latest.sourceBreakdown || {},
      trendingTopics: latest.topicDistribution ? latest.topicDistribution.slice(0, 5) : [],
      peakHours: latest.peakHours || Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 })),
      trendingKeywords: latest.trendingKeywords || [],
      competitorComparison: latest.competitorComparison || {
        mainBrand: brand,
        competitors: []
      }
    };

    res.json(insights);
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get sentiment distribution (existing endpoint - keep for backward compatibility)
router.get('/sentiment-distribution', async (req, res) => {
  try {
    const { brand, startDate, endDate } = req.query;
    
    let match = {};
    if (brand) match.brandName = brand;
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) match.timestamp.$gte = new Date(startDate);
      if (endDate) match.timestamp.$lte = new Date(endDate);
    }

    const sentimentData = await Mention.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$sentiment',
          count: { $sum: 1 },
          avgScore: { $avg: '$sentimentScore' }
        }
      }
    ]);

    res.json(sentimentData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get source distribution (existing endpoint - keep for backward compatibility)
router.get('/source-distribution', async (req, res) => {
  try {
    const { brand } = req.query;
    
    let match = {};
    if (brand) match.brandName = brand;

    const sourceData = await Mention.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(sourceData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get mentions over time (existing endpoint - keep for backward compatibility)
router.get('/mentions-over-time', async (req, res) => {
  try {
    const { brand, days = 7 } = req.query;
    
    let match = { brandName: brand };
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    match.timestamp = { $gte: startDate };

    const timeData = await Mention.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            sentiment: "$sentiment"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          sentiments: {
            $push: {
              sentiment: "$_id.sentiment",
              count: "$count"
            }
          },
          total: { $sum: "$count" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(timeData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get spike alerts (existing endpoint - keep for backward compatibility)
router.get('/spike-alerts', async (req, res) => {
  try {
    const { brand } = req.query;
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Compare today's mentions with weekly average
    const todayCount = await Mention.countDocuments({
      brandName: brand,
      timestamp: { 
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      }
    });

    const weeklyAvg = await Mention.aggregate([
      {
        $match: {
          brandName: brand,
          timestamp: { $gte: weekAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          avgCount: { $avg: "$count" }
        }
      }
    ]);

    const avg = weeklyAvg[0]?.avgCount || 0;
    const isSpike = todayCount > avg * 2; // Spike if 2x above average

    res.json({
      todayCount,
      weeklyAverage: avg,
      isSpike,
      spikePercentage: avg > 0 ? ((todayCount - avg) / avg * 100).toFixed(2) : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// NEW ENDPOINTS FOR ENHANCED ANALYTICS

// Get topic analysis
router.get('/topic-analysis', async (req, res) => {
  try {
    const { brand, limit = 10 } = req.query;
    
    let match = {};
    if (brand) match.brandName = brand;

    const topicData = await Mention.aggregate([
      { $match: match },
      { $unwind: '$topics' },
      {
        $group: {
          _id: '$topics',
          count: { $sum: 1 },
          sentiment: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ['$sentiment', 'positive'] }, then: 1 },
                  { case: { $eq: ['$sentiment', 'negative'] }, then: -1 },
                  { case: { $eq: ['$sentiment', 'neutral'] }, then: 0 }
                ],
                default: 0
              }
            }
          },
          engagement: {
            $avg: {
              $add: [
                '$engagement.likes',
                '$engagement.shares',
                '$engagement.comments'
              ]
            }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json(topicData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get engagement metrics
router.get('/engagement-metrics', async (req, res) => {
  try {
    const { brand, days = 7 } = req.query;
    
    let match = { brandName: brand };
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    match.timestamp = { $gte: startDate };

    const engagementData = await Mention.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          avgLikes: { $avg: '$engagement.likes' },
          avgShares: { $avg: '$engagement.shares' },
          avgComments: { $avg: '$engagement.comments' },
          totalEngagement: {
            $sum: {
              $add: [
                '$engagement.likes',
                '$engagement.shares',
                '$engagement.comments'
              ]
            }
          },
          maxLikes: { $max: '$engagement.likes' },
          maxShares: { $max: '$engagement.shares' },
          maxComments: { $max: '$engagement.comments' }
        }
      }
    ]);

    res.json(engagementData[0] || {
      avgLikes: 0,
      avgShares: 0,
      avgComments: 0,
      totalEngagement: 0,
      maxLikes: 0,
      maxShares: 0,
      maxComments: 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate daily analytics (to be called by a cron job or manually)
router.post('/generate-daily', async (req, res) => {
  try {
    const { brand } = req.body;
    
    if (!brand) {
      return res.status(400).json({ message: 'Brand name is required' });
    }

    const analytics = await calculateRealTimeAnalytics(brand, 1);
    
    // Save to Analytics collection if model exists
    if (Analytics) {
      const savedAnalytics = new Analytics({
        brandName: brand,
        date: new Date(),
        period: 'daily',
        ...analytics
      });
      await savedAnalytics.save();
    }

    res.json({
      message: 'Daily analytics generated successfully',
      analytics
    });
  } catch (error) {
    console.error('Error generating daily analytics:', error);
    res.status(500).json({ message: error.message });
  }
});

// Helper function to calculate real-time analytics from mentions
async function calculateRealTimeAnalytics(brand, days) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const mentions = await Mention.find({
    brandName: brand,
    timestamp: { $gte: startDate }
  });

  const totalMentions = mentions.length;
  const positiveMentions = mentions.filter(m => m.sentiment === 'positive').length;
  const negativeMentions = mentions.filter(m => m.sentiment === 'negative').length;
  const neutralMentions = mentions.filter(m => m.sentiment === 'neutral').length;

  const sentimentScore = totalMentions > 0 ? 
    (positiveMentions - negativeMentions) / totalMentions : 0;

  const engagementScore = totalMentions > 0 ? 
    mentions.reduce((sum, mention) => 
      sum + (mention.engagement?.likes || 0) + 
           (mention.engagement?.shares || 0) + 
           (mention.engagement?.comments || 0), 0) / totalMentions : 0;

  // Source breakdown
  const sourceBreakdown = mentions.reduce((acc, mention) => {
    acc[mention.source] = (acc[mention.source] || 0) + 1;
    return acc;
  }, {});

  // Topic distribution
  const topicDistribution = mentions.reduce((acc, mention) => {
    mention.topics?.forEach(topic => {
      const existing = acc.find(t => t.topic === topic);
      if (existing) {
        existing.count++;
        existing.sentiment[mention.sentiment]++;
      } else {
        acc.push({
          topic,
          count: 1,
          sentiment: {
            positive: mention.sentiment === 'positive' ? 1 : 0,
            negative: mention.sentiment === 'negative' ? 1 : 0,
            neutral: mention.sentiment === 'neutral' ? 1 : 0
          }
        });
      }
    });
    return acc;
  }, []).sort((a, b) => b.count - a.count).slice(0, 10);

  // Peak hours analysis
  const peakHours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: mentions.filter(m => new Date(m.timestamp).getHours() === hour).length
  }));

  return {
    metrics: {
      totalMentions,
      positiveMentions,
      negativeMentions,
      neutralMentions,
      sentimentScore,
      engagementScore,
      reach: totalMentions * 100 // Simplified reach calculation
    },
    sourceBreakdown,
    topicDistribution,
    peakHours,
    trendingKeywords: topicDistribution.slice(0, 5).map(t => ({
      keyword: t.topic,
      count: t.count,
      growth: 0
    }))
  };
}

module.exports = router;