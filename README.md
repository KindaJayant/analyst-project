# 🔬 ResearchAgent — AI-Powered Autonomous Stock & Company Research

> Enter any company name or stock ticker. An autonomous AI agent researches it from scratch — browsing the web, pulling live financial data, reading the latest news — and delivers a structured investment brief in under a minute.

**Zero paid APIs.** The only credential you need is a free [OpenRouter](https://openrouter.ai/keys) key.

---

## ✨ What It Does

ResearchAgent is a fully autonomous research assistant powered by **Google Gemini 2.0 Flash**. You type a company name (e.g. `TCS`, `BLS`, `Shilchar Technologies`) and the agent:

1. Figures out the NSE/BSE ticker symbol automatically
2. Pulls live financial data from Screener.in and Yahoo Finance
3. Searches the web and Google News for the latest developments
4. Synthesises everything into a clean 6-section report with a **Bull / Bear case** and overall sentiment

The entire pipeline runs server-side in Next.js API routes — no external backend needed.

---

## 🛠️ Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) + TypeScript | Server components + API routes |
| Styling | Tailwind CSS v4 + shadcn/ui | Dark-mode first |
| LLM | Google Gemini 2.0 Flash via OpenRouter | Free tier available |
| Financial Data | `yahoo-finance2` + Screener.in scraper | No API key needed |
| Web Search | `duck-duck-scrape` → Google News RSS fallback | Layered resilience |
| News | Google News RSS via `rss-parser` | Dedicated news tool |
| Icons | `lucide-react` | |
| Hosting | Vercel (free tier) | Zero-config deploy |

---

## 🤖 How the Agent Works

The agent runs a tight **Plan → Act → Observe → Reflect → Synthesise** loop entirely inside a single API route (`/api/agent`):

```
User Input: "TCS"
      │
      ▼
┌─────────────────────────────────────────────┐
│  1. PLAN                                    │
│     Gemini generates a step-by-step         │
│     research plan for the company           │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│  2. ACT  (tool dispatch loop)               │
│                                             │
│   ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│   │ 🔍 Search│  │📊 Finance│  │📰 News  │  │
│   │ DDG + RSS│  │ Yahoo +  │  │ Google  │  │
│   │ fallback │  │Screener  │  │ News RSS│  │
│   └──────────┘  └──────────┘  └─────────┘  │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│  3. OBSERVE + REFLECT                       │
│     Agent reads tool output, decides if     │
│     results are sufficient or retries with  │
│     a different query / tool                │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│  4. SYNTHESISE                              │
│     Gemini compiles all gathered context    │
│     into the structured 6-section report    │
└─────────────────────────────────────────────┘
```

### Search Resilience

The search tool has a layered fallback strategy so results are never empty:

1. **DuckDuckGo** (`duck-duck-scrape`) — primary, no key needed
2. **Google News RSS** — automatic fallback if DDG rate-limits
3. **Return empty array** gracefully so the agent can retry with another query

### Financial Data Pipeline

For Indian stocks specifically:

1. Attempts to resolve the ticker via Yahoo Finance (`duck-duck-scrape` → `.NS` / `.BO` suffix logic)
2. Falls back to **Screener.in** — scrapes the public company page for key ratios, price, market cap, P/E, ROCE, ROE, etc.
3. Merges both sources into a single `FinancialData` object passed to the LLM

---

## 📋 Report Structure

Every analysis produces six sections:

| # | Section | What's Inside |
|---|---------|--------------|
| 1 | 🏢 Company Overview | Business description, founding, HQ, industry |
| 2 | 📊 Financial Snapshot | Price, market cap, P/E, revenue, margins, dividend yield |
| 3 | 📰 Recent News & Developments | Last 5 headlines with dates |
| 4 | ⚔️ Competitive Landscape | Key competitors and positioning |
| 5 | ⚠️ Risk Factors | Market, regulatory, operational, financial risks |
| 6 | 💡 Investment Summary | Bull case, Bear case, Overall sentiment (Bullish / Neutral / Bearish) |

---

## 🚀 Run Locally

### Prerequisites

- Node.js 18+
- A free [OpenRouter](https://openrouter.ai/keys) API key

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/KindaJayant/analyst-project.git
cd analyst-project

# 2. Install dependencies
npm install

# 3. Set up environment variables
copy .env.local.example .env.local
```

Open `.env.local` and fill in your key:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

```bash
# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), type a company name, and hit **Analyse**.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Home page — company input form
│   ├── report/[ticker]/          # Dynamic report page
│   └── api/
│       ├── agent/route.ts        # 🧠 Core agent loop (Plan → Act → Synthesise)
│       └── tools/
│           ├── search/route.ts   # 🔍 DDG search + Google News RSS fallback
│           ├── financials/route.ts # 📊 Yahoo Finance + Screener.in scraper
│           └── news/route.ts     # 📰 Dedicated Google News RSS feed
├── components/
│   └── ui/                       # shadcn/ui components (Badge, Card, etc.)
├── lib/
│   └── openrouter.ts             # Gemini 2.0 Flash via OpenRouter wrapper
└── types/                        # Shared TypeScript types
```

---

## 📋 Environment Variables

| Variable | Required | Where to Get |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | ✅ | [openrouter.ai/keys](https://openrouter.ai/keys) — free tier available |

---

## ⚡ Free Tier Usage Notes

| Service | Limit | Notes |
|---------|-------|-------|
| OpenRouter (Gemini Flash) | Generous free tier | Each analysis uses ~6–10 LLM calls |
| Yahoo Finance | Unofficial, lenient | Don't hammer it in loops |
| DuckDuckGo scraping | May rate-limit under load | Google News RSS fallback kicks in automatically |
| Google News RSS | Very generous | Public feed, no auth needed |
| Screener.in | Public pages | Used as financial data fallback for Indian stocks |

**Rough estimate:** ~100+ company analyses per day comfortably on free tiers.

---

## 🚀 Deploy to Vercel

1. Push your fork to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your repo
3. Under **Environment Variables**, add:
   ```
   OPENROUTER_API_KEY = sk-or-v1-your-key-here
   ```
4. Click **Deploy** — no config changes needed, Vercel auto-detects Next.js

---

## 📄 License

MIT — do whatever you want with it.
