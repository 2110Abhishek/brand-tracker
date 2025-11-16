Brand Mention Tracker 🚀
A real-time brand monitoring platform that tracks mentions across social media, news, blogs, and forums with sentiment analysis and automated alerts.

🌟 Features
Real-time Monitoring - Live tracking across multiple platforms

Sentiment Analysis - Automated classification (Positive/Negative/Neutral)

Spike Detection - Automatic alerts for unusual mention activity

Multi-platform Support - Twitter, Facebook, News, Blogs, Forums

Beautiful Dashboard - Professional analytics and visualizations

Multi-brand Management - Monitor multiple brands in one dashboard

Real-time Updates - WebSocket-powered live data

🛠 Tech Stack
Frontend
React.js - Modern component-based UI

Chart.js - Interactive data visualizations

CSS3 - Custom animations and responsive design

WebSocket - Real-time client updates

Backend
Node.js - Runtime environment

Express.js - RESTful API framework

MongoDB - NoSQL database

Mongoose - MongoDB object modeling

Socket.io - Real-time bidirectional communication

Natural.js - NLP for sentiment analysis

🚀 Quick Start
Prerequisites
Node.js (v14 or higher)

# Backend Setup
cd backend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your MongoDB connection string

# Start backend server
npm run dev

# Frontend Setup
cd frontend
npm install

# Start frontend application
npm start

⚙️ Environment Configuration
Backend (.env)
MONGODB_URI=mongodb://localhost:27017/brand-tracker
PORT=5000
NODE_ENV=development

# MongoDB Setup
# Using MongoDB Atlas 
# 1. Create account at https://www.mongodb.com/atlas
# 2. Create a cluster and get connection string
# 3. Update MONGODB_URI in .env

📊 API Endpoints
Mentions
GET /api/mentions - Get mentions with filters

POST /api/mentions - Add new mention

POST /api/mentions/simulate - Generate sample data

Brands
GET /api/brands - Get all brands

POST /api/brands - Create new brand

POST /api/brands/initialize - Add sample brands

Analytics
GET /api/analytics/sentiment-distribution - Sentiment analysis

GET /api/analytics/source-distribution - Platform breakdown

GET /api/analytics/mentions-over-time - Timeline data

GET /api/analytics/spike-alerts - Alert detection

Dashboard
GET /api/dashboard/:brand - Dashboard configuration

GET /api/dashboard/:brand/summary - Summary data

PUT /api/dashboard/:brand/layout - Update layout

🎯 Key Features Demo
1. Real-time Monitoring
Mentions appear instantly with WebSocket updates

Live sentiment analysis

Automatic topic clustering

2. Advanced Analytics
Interactive charts and graphs

Sentiment distribution

Platform performance

Timeline trends

3. Smart Alerts
Spike detection algorithms

Real-time notifications

Sentiment-based alerts

4. Multi-brand Support
Separate dashboards for each brand

Custom tracking configurations

Comparative analytics

🔧 Development
Adding New Features
Create component in frontend/src/components/

Add route in backend/routes/ if needed

Update models in backend/models/ for new data

Test with sample data

🚀 Deployment Backend 
cd backend
npm run build
# Deploy to Node.js hosting service (render)

Deployment Frontend 
cd Frontend
npm run build
# Deploy build folder to static hosting (Vercel)

🎨 Design Decisions
1. Technology Choices
React.js for component reusability and state management

Node.js/Express for fast API development

MongoDB for flexible schema with social media data

Socket.io for real-time features over SSE

2. Architecture
Modular Components for maintainability

RESTful APIs with consistent patterns

Real-time Updates for live monitoring

Responsive Design for all devices

3. Performance Optimizations
Debounced Search to reduce API calls

WebSocket Throttling for efficient updates

Chart.js for lightweight visualizations

CSS Animations for smooth UX

🔍 Challenges & Solutions
1. Real-time Data
Challenge: Handling live updates without overwhelming the client
Solution: Implemented WebSocket throttling and optimized re-renders

2. Sentiment Analysis
Challenge: Accurate analysis without external APIs
Solution: Used Natural.js with custom dictionaries and context analysis

3. Data Visualization
Challenge: Performance with large datasets
Solution: Implemented data sampling and smooth animations

🚀 Future Enhancements
Advanced machine learning for sentiment analysis

Integration with more social media APIs

Team collaboration features

Automated reporting and exports

Mobile application

Advanced competitor analysis

🤝 Contributing
Fork the repository

Create feature branch (git checkout -b feature/AmazingFeature)

Commit changes (git commit -m 'Add AmazingFeature')

Push to branch (git push origin feature/AmazingFeature)

Open a Pull Request

📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

👥 Authors
Your Name - https://github.com/2110Abhishek

🙏 Acknowledgments
Natural.js for sentiment analysis

Chart.js for data visualizations

MongoDB for flexible data storage

React.js community for excellent components

🎯 Hackathon Submission
This project was developed for the RapidQuest Brand Mention Tracker Hackathon Challenge, demonstrating:

✅ Real-time brand monitoring across multiple platforms
✅ Automated sentiment analysis and topic clustering
✅ Spike detection with instant alerts
✅ Comprehensive analytics dashboard
✅ Professional UI/UX with responsive design
✅ Full-stack implementation with modern technologies

Demo Video: https://drive.google.com/file/d/1fvammoqWp8-Ug-WFlYmnb_NjmpoCJFVJ/view?usp=sharing
