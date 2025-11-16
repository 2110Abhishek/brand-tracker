const express = require('express');
const router = express.Router();
const Mention = require('../models/Mention');
const natural = require('natural');
const axios = require('axios');

// Initialize sentiment analyzer
const Analyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new Analyzer("English", stemmer, "afinn");

// Get all mentions with filters
router.get('/', async (req, res) => {
  try {
    const { brand, source, sentiment, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    if (brand) filter.brandName = brand;
    if (source) filter.source = source;
    if (sentiment) filter.sentiment = sentiment;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const mentions = await Mention.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Mention.countDocuments(filter);

    res.json({
      mentions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new mention (simulated data ingestion)
router.post('/', async (req, res) => {
  try {
    const { brandName, source, content, author, url, engagement } = req.body;

    // Analyze sentiment
    const tokens = content.toLowerCase().split(' ');
    const sentimentScore = analyzer.getSentiment(tokens);
    let sentiment = 'neutral';
    if (sentimentScore > 0.1) sentiment = 'positive';
    else if (sentimentScore < -0.1) sentiment = 'negative';

    // Simple topic extraction (in real scenario, use more sophisticated NLP)
    const topics = extractTopics(content);

    const mention = new Mention({
      brandName,
      source,
      content,
      author,
      url,
      sentiment,
      sentimentScore,
      topics,
      engagement,
      timestamp: new Date()
    });

    await mention.save();
    
    // Emit real-time update
    req.app.get('io').emit('newMention', mention);
    
    res.status(201).json(mention);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Simulate social media monitoring
router.post('/simulate', async (req, res) => {
  try {
    const { brandName, count = 10 } = req.body;
    
    const simulatedMentions = generateSimulatedMentions(brandName, count);
    
    for (const mentionData of simulatedMentions) {
      const mention = new Mention(mentionData);
      await mention.save();
      req.app.get('io').emit('newMention', mention);
    }
    
    res.json({ message: `${count} simulated mentions added` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function extractTopics(content) {
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 3 && !commonWords.includes(word));
  
  return [...new Set(words)].slice(0, 5);
}

function generateSimulatedMentions(brandName, count) {
  const sources = ['twitter', 'facebook', 'news', 'blog', 'forum'];
  const sentiments = ['positive', 'negative', 'neutral'];
  const topics = ['product', 'service', 'customer support', 'price', 'quality', 'delivery', 'innovation'];
  
  const mentions = [];
  
  for (let i = 0; i < count; i++) {
    const source = sources[Math.floor(Math.random() * sources.length)];
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    
    mentions.push({
      brandName,
      source,
      content: generateContent(brandName, sentiment, topics),
      author: `user${Math.floor(Math.random() * 1000)}`,
      url: `https://${source}.com/post/${Math.random().toString(36).substr(2, 9)}`,
      sentiment,
      sentimentScore: sentiment === 'positive' ? 0.8 : sentiment === 'negative' ? -0.7 : 0,
      topics: [topics[Math.floor(Math.random() * topics.length)]],
      engagement: {
        likes: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 50),
        comments: Math.floor(Math.random() * 30)
      },
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    });
  }
  
  return mentions;
}

function generateContent(brandName, sentiment, topics) {
  const positivePhrases = [
    `Love the new ${brandName} product! Amazing quality and great service.`,
    `Just experienced ${brandName}'s customer support - absolutely fantastic!`,
    `The ${brandName} team is doing incredible work in the industry.`,
    `Highly recommend ${brandName} for anyone looking for quality services.`
  ];
  
  const negativePhrases = [
    `Disappointed with ${brandName}'s recent service. Expected better.`,
    `Having issues with ${brandName} product quality lately.`,
    `${brandName} customer support was unhelpful and slow to respond.`,
    `Not satisfied with ${brandName}'s pricing strategy.`
  ];
  
  const neutralPhrases = [
    `Saw ${brandName} mentioned in the news today.`,
    `Reading about ${brandName}'s new initiatives.`,
    `Came across ${brandName} while researching solutions.`,
    `Interesting discussion about ${brandName} in the forum.`
  ];
  
  const phrases = sentiment === 'positive' ? positivePhrases : 
                 sentiment === 'negative' ? negativePhrases : neutralPhrases;
  
  return phrases[Math.floor(Math.random() * phrases.length)];
}

module.exports = router;