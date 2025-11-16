const mongoose = require('mongoose');

const mentionSchema = new mongoose.Schema({
  brandName: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true,
    enum: ['twitter', 'facebook', 'news', 'blog', 'forum']
  },
  content: {
    type: String,
    required: true
  },
  author: String,
  url: String,
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
  },
  sentimentScore: Number,
  topics: [String],
  engagement: {
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 }
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  location: String,
  language: String
});

module.exports = mongoose.model('Mention', mentionSchema);