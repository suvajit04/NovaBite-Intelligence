# NovaBite Intelligence

> A modern sales intelligence platform with real-time analytics and AI-powered insights.

[![JavaScript](https://img.shields.io/badge/JavaScript-76.2%25-yellow)](#)
[![CSS](https://img.shields.io/badge/CSS-21.6%25-blue)](#)
[![HTML](https://img.shields.io/badge/HTML-1.1%25-orange)](#)
[![Dockerfile](https://img.shields.io/badge/Dockerfile-1.1%25-lightblue)](#)

## 📋 Overview

NovaBite Intelligence is a comprehensive sales intelligence platform designed to help businesses analyze, track, and optimize their sales performance. It combines a robust backend API with an intuitive React-based frontend dashboard.

## ✨ Key Features

- 📊 **Real-time Analytics Dashboard** - KPIs, charts, and data visualization
- 💬 **AI-Powered Chat Interface** - Conversational sales insights
- 📈 **Sales Aggregation** - Comprehensive data analysis and reporting
- 🚀 **Express Backend** - Scalable and efficient API
- ⚡ **React Frontend** - Modern, responsive user interface
- 🐳 **Docker Support** - Easy deployment and containerization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation & Running Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/suvajit04/NovaBite-Intelligence.git
   cd NovaBite-Intelligence
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   npm run seed    # Optional: seed database from CSV
   npm start       # Starts on http://localhost:4000
   ```

3. **Set up the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm start       # Opens http://localhost:3000
   ```

## 📁 Project Structure

```
NovaBite-Intelligence/
├── backend/              # Express API server
│   ├── routes/          # API endpoints
│   ├── models/          # Data models
│   └── package.json
├── frontend/            # React dashboard
│   ├── src/
│   ├── public/
│   └── package.json
├── data/                # Sample data (CSV)
└── Dockerfile           # Container configuration
```

## 🔌 API Endpoints

- `GET /api/health` - Health check
- `GET /api/summary` - Sales summary KPIs
- `POST /api/chat` - AI-powered chat endpoint

### Example Requests

```bash
# Health check
curl http://localhost:4000/api/health

# Get summary
curl http://localhost:4000/api/summary

# Chat with AI
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"Give me a brief summary of sales"}'
```

## ⚙️ Environment Setup

Create a `.env` file in the `backend/` directory:

```env
ANTHROPIC_API_KEY=your_api_key_here
PORT=4000
NODE_ENV=development
```

## 🐳 Docker Deployment

```bash
docker build -t novabite-intelligence .
docker run -p 4000:4000 -p 3000:3000 novabite-intelligence
```

## 📊 Technology Stack

- **Backend**: Express.js, SQLite/CSV adapter
- **Frontend**: React, CSS
- **Deployment**: Docker
- **Language**: JavaScript (76.2%)

## 📝 Development

### Running Tests
```bash
cd backend
npm test
```

### Building for Production
```bash
cd frontend
npm run build
```

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

This project is provided as-is for demonstration and evaluation purposes.

## 👤 Author

- **GitHub**: [@suvajit04](https://github.com/suvajit04)

## 📞 Support

For detailed setup instructions and troubleshooting, see [DETAILED_README.md](./novabite/README.md).

---

**Last Updated**: June 2026
