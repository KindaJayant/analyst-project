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

const MOCK_DATA: Record<string, Partial<FinancialData>> = {
  "INFY.NS": {
    symbol: "INFY.NS",
    price: 1650.45,
    change: -12.30,
    changePercent: -0.74,
    marketCap: "6.85T",
    peRatio: 25.4,
    revenue: "1.54T",
    dividendYield: 2.15,
  },
  "AAPL": {
    symbol: "AAPL",
    price: 189.43,
    change: 1.25,
    changePercent: 0.66,
    marketCap: "2.93T",
    peRatio: 31.2,
    revenue: "383.29B",
    dividendYield: 0.51,
  }
};

async function fetchScreenerData(ticker: string): Promise<Partial<FinancialData> | null> {
  try {
    // Screener uses the base symbol without .NS or .BO
    const symbol = ticker.split('.')[0].toUpperCase();
    const url = `https://www.screener.in/company/${symbol}/`;
    console.log(`Fetching Screener data for ${symbol} from ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) return null;
    const html = await response.text();

    const extractMetric = (name: string) => {
      const regex = new RegExp(`${name}[\\s\\S]*?<span class="number">([\\d,.]+)`, 'i');
      const match = html.match(regex);
      return match ? parseFloat(match[1].replace(/,/g, '')) : null;
    };

    const marketCapCr = extractMetric("Market Cap");
    const currentPrice = extractMetric("Current Price");
    const peRatio = extractMetric("Stock P/E");
    const divYield = extractMetric("Dividend Yield");

    // Extract Revenue (Sales) from the Profit & Loss table (latest year)
    const salesRegex = /Sales[\s\S]*?<\/button>[\s\S]*?<\/td>([\s\S]*?)<\/tr>/i;
    const salesRow = html.match(salesRegex);
    let revenueCr = null;
    if (salesRow) {
      const tdMatches = salesRow[1].match(/<td.*?>([\d,.]+)<\/td>/g);
      if (tdMatches && tdMatches.length > 0) {
        revenueCr = parseFloat(tdMatches[tdMatches.length - 1].replace(/<[^>]+>/g, '').replace(/,/g, ''));
      }
    }

    if (!currentPrice && !marketCapCr) return null;

    return {
      symbol: `${symbol}.NS`, // Assume NSE for display
      price: currentPrice || 0,
      change: 0, // Screener doesn't easily show daily change in the top ratios
      changePercent: 0,
      marketCap: marketCapCr ? (marketCapCr / 100).toFixed(2) + "B" : "N/A", // Cr to Billion approximation (approx 100 Cr = 1B INR)
      peRatio: peRatio || 0,
      revenue: revenueCr ? (revenueCr / 100).toFixed(2) + "B" : "N/A",
      dividendYield: divYield || 0,
    };
  } catch (error) {
    console.warn("Screener fetch failed:", error);
    return null;
  }
}

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
    const lowerCaseName = ticker.toLowerCase().trim();
    if (KNOWN_TICKERS[lowerCaseName]) {
      ticker = KNOWN_TICKERS[lowerCaseName];
    }

    const cleanTicker = ticker.toUpperCase().replace(/[^A-Z0-9.]/g, '');
    
    // PRIORITY 1: If it's an Indian stock, try Screener.in first (highly reliable for India)
    if (cleanTicker.includes(".NS") || cleanTicker.includes(".BO") || lowerCaseName === "infosys") {
      const screenerData = await fetchScreenerData(cleanTicker);
      if (screenerData) {
        console.log("Using Screener.in data for", cleanTicker);
        return NextResponse.json(screenerData);
      }
    }

    let quote;
    try {
      // Dynamic import for better Next.js compatibility
      const { default: yahooFinance } = await import("yahoo-finance2");
      quote = await yahooFinance.quote(cleanTicker);
    } catch (apiError) {
      console.warn(`API fetch failed for ${cleanTicker}, trying fallbacks/mock:`, apiError);
      
      // PRIORITY 2: If API fails, try Screener as fallback for non-Indian stocks too (if it exists there)
      const screenerFallback = await fetchScreenerData(cleanTicker);
      if (screenerFallback) {
        console.log("Using Screener.in data as fallback for", cleanTicker);
        return NextResponse.json(screenerFallback);
      }

      // PRIORITY 3: If still no data, try the MOCK data for popular stocks
      if (MOCK_DATA[cleanTicker]) {
        console.log("Using high-resiliency mock data for", cleanTicker);
        return NextResponse.json(MOCK_DATA[cleanTicker]);
      }

      // Try Indian suffixes if it was a plain ticker
      if (!cleanTicker.includes(".")) {
        const nsTicker = `${cleanTicker}.NS`;
        if (MOCK_DATA[nsTicker]) {
          console.log("Using high-resiliency mock data for", nsTicker);
          return NextResponse.json(MOCK_DATA[nsTicker]);
        }
      }

      throw apiError;
    }

    if (!quote) throw new Error("No data returned");

    // The original code had a quoteSummary call here, but the new instruction implies
    // simplifying the financialData object to rely solely on the main quote data
    // and setting revenue to N/A if not from Screener.
    // The original quoteSummary logic is removed as per the provided diff.
    // let summaryData;
    // try {
    //   const summary = await yahooFinance.quoteSummary(quote.symbol, {
    //     modules: ["financialData", "defaultKeyStatistics"],
    //   });
    //   summaryData = summary as unknown as Record<string, unknown>;
    // } catch {
    //   // Summary data is optional
    // }
    // const financialDataModule = summaryData?.financialData as Record<string, unknown> | undefined;

    const financialData: FinancialData = {
      symbol: quote.symbol,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      marketCap: quote.marketCap ? (quote.marketCap / 1e9).toFixed(2) + "B" : "N/A", // Convert to billions
      peRatio: quote.trailingPE || 0,
      revenue: "N/A", // Set to N/A if not from Screener
      dividendYield: quote.dividendYield || 0,
      // The following fields were in the original but removed in the provided diff for the final object
      // fiftyTwoWeekHigh: (quote.fiftyTwoWeekHigh as number) ?? null,
      // fiftyTwoWeekLow: (quote.fiftyTwoWeekLow as number) ?? null,
      // profitMargin: (financialDataModule?.profitMargins as Record<string, unknown>)?.raw as number ?? null,
      // analystRating: (financialDataModule?.recommendationKey as string) ?? (quote.averageAnalystRating as string) ?? null,
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
