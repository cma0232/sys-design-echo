# System Design Interview Practice App

A free, voice-enabled system design interview practice platform built with Next.js, powered by AI.

## Features

- **Voice-based Interview**: Practice speaking your designs just like a real interview
- **Multiple LLM Support**: Works with Claude (Anthropic), GPT (OpenAI), or Gemini (Google)
- **Interactive Diagram**: Draw your system architecture using Excalidraw
- **Real-time Feedback**: Get detailed evaluation on scalability, trade-offs, and communication
- **Free to Use**: 100% free - bring your own API key (free tier works!)
- **30-Minute Sessions**: Timed practice sessions mimicking real interviews

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui, Excalidraw
- **AI**: Vercel AI SDK with support for:
  - Anthropic Claude
  - OpenAI GPT
  - Google Gemini
- **Voice**: Browser Web Speech API (free, no external services)
- **Camera**: WebRTC
- **State Management**: Zustand

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- An API key from one of:
  - [Anthropic](https://console.anthropic.com/) (recommended)
  - [OpenAI](https://platform.openai.com/api-keys)
  - [Google AI Studio](https://aistudio.google.com/app/apikey)

All providers offer free tiers that are sufficient for this app!

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Usage

1. **Enter API Key**: On first visit, enter your LLM API key (stored locally in your browser)
2. **Select Topic**: Choose from 10 classic system design topics
3. **Start Interview**: Begin your 30-minute practice session
4. **Speak & Draw**:
   - Click "Start Speaking" to answer questions via voice
   - Draw your system diagram in the main canvas
   - The AI interviewer will ask follow-up questions
5. **Submit**: When done (or time runs out), submit for feedback
6. **Review Feedback**: Get scores and detailed feedback on scalability, trade-offs, and communication

## Deployment (Vercel)

This app is optimized for Vercel deployment:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Deploy (zero configuration needed!)
4. Share with friends - they'll need their own API keys

## Browser Compatibility

- **Best Experience**: Chrome or Edge (for Web Speech API)
- **Supported**: All modern browsers (Firefox, Safari) but voice features may vary

## Cost

- **Development**: Free
- **Hosting on Vercel**: Free tier is sufficient
- **AI API Costs**: You use your own API key
  - Example: ~$0.10-0.30 per 30-min interview with Claude
  - Free tiers typically include enough credits for many practice sessions

## License

MIT
