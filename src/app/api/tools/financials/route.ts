import { NextResponse } from "next/server";
import type { FinancialData } from "@/types";

const KNOWN_TICKERS: Record<string, string> = {
  "infosys": "INFY.NS",
  "tcs": "TCS.NS",
  "reliance": "RELIANCE.NS",
  "wipro": "WIPRO.NS",
  "hcl": "HCLTECH.NS",
  "apple": "AAPL",
  "tesla": "TSLA",
  "microsoft": "MSFT",
  "google": "GOOGL",
  "amazon": "AMZN",
  "alphabet": "GOOGL",
};

export async function POST(request: Request) {
  try {
    let { ticker } = await request.json();

    if (!ticker || typeof ticker !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'ticker' parameter" },
        { status: 400 }
      );
    }

    // Try hardcoded fallback if it looks like a name instead of a ticker
    const lowerTicker = ticker.toLowerCase().trim();
    if (KNOWN_TICKERS[lowerTicker]) {
      ticker = KNOWN_TICKERS[lowerTicker];
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const yf = require("yahoo-finance2");
    const yahooFinance = yf.default || yf;

    let quote;
    try {
      quote = await yahooFinance.quote(ticker.toUpperCase());
    } catch {
      // Fallback for Indian stocks: try appending .NS (NSE) if it's a plain symbol
      if (!ticker.includes(".")) {
        try {
          quote = await yahooFinance.quote(`${ticker.toUpperCase()}.NS`);
        } catch {
          // Still failed
        }
      }

      if (!quote) {
        const financialData: FinancialData = {
          ticker: ticker.toUpperCase(),
          companyName: ticker,
          currentPrice: null,
          currency: "USD",
          marketCap: null,
          peRatio: null,
          fiftyTwoWeekHigh: null,
          fiftyTwoWeekLow: null,
          revenue: null,
          profitMargin: null,
          analystRating: null,
          error: `Could not find financial data for ticker "${ticker}". The company may not be publicly traded or listed on major exchanges.`,
        };
        return NextResponse.json(financialData);
      }
    }

    // Try to get additional summary data
    let summaryData: Record<string, unknown> | null = null;
    try {
      const summary = await yahooFinance.quoteSummary(quote.symbol, {
        modules: ["financialData", "defaultKeyStatistics"],
      });
      summaryData = summary as unknown as Record<string, unknown>;
    } catch {
      // Summary data is optional
    }

    const financialDataModule = summaryData?.financialData as Record<string, unknown> | undefined;

    const financialData: FinancialData = {
      ticker: ticker.toUpperCase(),
      companyName: (quote.displayName || quote.shortName || quote.longName || ticker) as string,
      currentPrice: (quote.regularMarketPrice as number) ?? null,
      currency: (quote.currency as string) || "USD",
      marketCap: (quote.marketCap as number) ?? null,
      peRatio: (quote.trailingPE as number) ?? null,
      fiftyTwoWeekHigh: (quote.fiftyTwoWeekHigh as number) ?? null,
      fiftyTwoWeekLow: (quote.fiftyTwoWeekLow as number) ?? null,
      revenue: (financialDataModule?.totalRevenue as Record<string, unknown>)?.raw as number ?? null,
      profitMargin: (financialDataModule?.profitMargins as Record<string, unknown>)?.raw as number ?? null,
      analystRating: (financialDataModule?.recommendationKey as string) ?? (quote.averageAnalystRating as string) ?? null,
    };

    return NextResponse.json(financialData);
  } catch (error) {
    console.error("Financials tool error:", error);
    return NextResponse.json(
      {
        error: `Financial data fetch failed: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
}
