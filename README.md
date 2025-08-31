# Geelong Garage Doors - Premium B2B Website & Crawler

A modern, professional website for a premium B2B garage door supplier with an integrated web crawler and admin panel.

## 🏗️ Project Overview

This project consists of two main components:

1. **Premium B2B Website** - Modern, architecturally appealing homepage for trade professionals
2. **Web Crawler & Admin Panel** - Advanced crawling system with real-time monitoring

## 🚀 Features

### Website Features
- **Modern Design** - Clean, professional, architectural aesthetic
- **B2B Focused** - Tailored for architects, builders, and trade professionals
- **Responsive** - Mobile-first design with full responsiveness
- **Brand Colors** - Deep Blue (#2C3993), Vibrant Orange (#F88229), Heritage Red (#901C3B)
- **Trade Portal** - Dedicated portal for trade professionals
- **Quote System** - Prominent "Request a Quote" functionality

### Crawler Features
- **Real-time Monitoring** - Live progress tracking and statistics
- **Advanced Controls** - Configurable crawling parameters
- **Asset Management** - Automatic download and organization of images, PDFs, etc.
- **Error Handling** - Comprehensive error tracking and recovery
- **WebSocket Updates** - Real-time status updates
- **Logfire Integration** - Professional monitoring and analytics

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5.2 (App Router), TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Database**: PostgreSQL (Neon)
- **Crawler**: Python with Crawl4AI
- **Monitoring**: Logfire
- **Real-time**: WebSockets
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
GGD Mockup/
├── geelong-garage-doors-clerk/     # Next.js application
│   ├── src/
│   │   ├── app/                    # App Router pages
│   │   ├── components/             # Reusable components
│   │   ├── lib/                    # Utilities and configurations
│   │   └── types/                  # TypeScript definitions
│   ├── public/                     # Static assets
│   └── package.json
└── crawlforai/                     # Python crawler
    ├── crawl4ai_runner.py         # Main crawler script
    ├── output/                    # Crawled content
    └── requirements.txt
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/stevejford/GGD-MOCKUP.git
   cd GGD-MOCKUP
   ```

2. **Install Next.js dependencies**
   ```bash
   cd geelong-garage-doors-clerk
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   cd ../crawlforai
   pip install -r requirements.txt
   ```

4. **Environment Setup**
   ```bash
   cd ../geelong-garage-doors-clerk
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret
   
   # Database
   CRAWLER_DATABASE_URL=your_postgres_url
   
   # Admin Access
   ADMIN_EMAILS=your-email@example.com
   
   # Logfire (Optional)
   LOGFIRE_TOKEN=your_logfire_token
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the website.

## 🔧 Configuration

### Admin Panel Access
- Set `ADMIN_EMAILS` in `.env.local` with your email address
- Visit `/admin/crawl-viewer` to access the crawler admin panel

### Crawler Configuration
- **Brand**: Target website brand to crawl
- **Max Pages**: Maximum number of pages to crawl (0 = unlimited)
- **Assets**: Enable/disable asset downloading
- **Wait/Delay**: Control crawling speed and politeness

### Logfire Integration
1. Sign up at [logfire.pydantic.dev](https://logfire.pydantic.dev)
2. Create project: "geelong-garage-doors-crawler"
3. Add token to `LOGFIRE_TOKEN` in `.env.local`
4. Restart server to see real-time analytics

## 📊 Admin Panel Features

- **Dashboard** - System overview and statistics
- **Crawler Controls** - Start/stop crawling with live progress
- **Search** - AI-powered content search
- **File Browser** - Browse and view crawled content
- **Tools** - Vector embeddings and data processing
- **Logfire** - Real-time monitoring and analytics

## 🎨 Design System

### Brand Colors
- **Primary**: Deep Blue (#2C3993)
- **Action**: Vibrant Orange (#F88229) 
- **Text**: Charcoal Gray (#333333)
- **Background**: Off-White (#F9F9F9)
- **Logo**: Heritage Red (#901C3B) - Geelong word only

### Typography
- **Font**: Geist Sans (CSS variable)
- **Hierarchy**: One H1 per page, followed by H2/H3

## 🚀 Deployment

The project is configured for easy deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary and confidential.

## 📞 Contact

For questions or support, please contact the development team.

---

**Built with ❤️ for Geelong Garage Doors**
