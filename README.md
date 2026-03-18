# 🔬 ResearchAgent — AI-Powered Autonomous Company Research

An AI-powered web app where you enter any company name and an autonomous agent researches it from scratch — browsing the web, pulling financial data, reading news, and generating a structured investment/competitive brief.

**Zero paid APIs.** The Gemini API key (free tier) is the only credential needed.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| LLM | Google Gemini 2.0 Flash via OpenRouter (`openrouter.ai`) |
| Financial Data | `yahoo-finance2` (no API key) |
| Web Search | `duck-duck-scrape` (no API key) |
| News | Google News RSS via `rss-parser` |
| Hosting | Vercel (free tier, zero config) |

---

## 🚀 Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/KindaJayant/analyst-project.git
cd analyst-project

# 2. Install dependencies
npm install

# 3. Add your OpenRouter API key
cp .env.local.example .env.local
# Edit .env.local and add your key from https://openrouter.ai/keys

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter a company name to start.

---

## 🤖 How the Agent Works

The agent follows an autonomous **Plan → Act → Observe → Reflect → Synthesize** loop:

1. **Plan** — Given a company name, Gemini generates a multi-step research plan
2. **Act** — The agent calls the appropriate tool for each step (web search, financial data, or news)
3. **Observe** — It reads and processes the tool output
4. **Reflect** — It decides if results are sufficient or if it needs to retry with a different query
5. **Repeat** — Until all research is complete
6. **Synthesize** — Gemini compiles everything into a structured 6-section report

If a tool fails or returns empty results, the agent **self-corrects** by retrying with a different query.

### Tools Available

| Tool | Source | Purpose |
|------|--------|---------|
| 🔍 Search | DuckDuckGo | Company overview, competitors, general research |
| 📊 Financials | Yahoo Finance | Price, market cap, P/E, revenue, margins |
| 📰 News | Google News RSS | Latest headlines and developments |

### Final Report Sections

1. 🏢 Company Overview
2. 📊 Financial Snapshot
3. 📰 Recent News & Developments
4. ⚔️ Competitive Landscape
5. ⚠️ Risk Factors
6. 💡 Investment/Opportunity Summary (with Bull/Bear case and sentiment)

---

## 📋 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | ✅ | Your OpenRouter API key ([get one](https://openrouter.ai/keys)) |

---

## ⚡ Free Tier Limits

- **OpenRouter**: Rate limits depend on your plan and the model used
- **Yahoo Finance**: No official rate limit, but don't hammer it
- **DuckDuckGo**: Unofficial scraping, may rate-limit under heavy use
- **Google News RSS**: Public RSS, very generous limits

**Tip:** Each company analysis uses ~6-10 LLM calls. You can comfortably analyze ~100+ companies per day on the free tier.

---

## 🚀 Deploy to Vercel

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add `OPENROUTER_API_KEY` as an environment variable
4. Deploy — zero config changes needed

---

## 📸 Demo

<!-- Add a screenshot here -->
*Screenshot placeholder — run the app and capture the report view!*

---

## 📄 License

MIT
