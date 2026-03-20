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

function formatIndianCurrency(num: number): string {
  if (num >= 10000000) {
    return (num / 10000000).toFixed(2) + " Cr";
  } else if (num >= 100000) {
    return (num / 100000).toFixed(2) + " L";
  }
  return num.toLocaleString();
}

const MOCK_DATA: Record<string, Partial<FinancialData>> = {
  "INFY.NS": {
    price: 1650.45,
    change: -12.30,
    changePercent: -0.74,
    marketCap: "6,85,000 Cr",
    peRatio: 25.4,
    revenue: "1,54,000 Cr",
    dividendYield: 2.15,
  },
  "AAPL": {
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
    const symbol = ticker.split('.')[0].toUpperCase();
    const url = `https://www.screener.in/company/${symbol}/`;
    
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
      price: currentPrice || 0,
      marketCap: marketCapCr ? `${marketCapCr.toLocaleString()} Cr` : "N/A", 
      peRatio: peRatio || 0,
      revenue: revenueCr ? `${revenueCr.toLocaleString()} Cr` : "N/A",
      dividendYield: divYield || 0,
      change: 0,
      changePercent: 0,
    };
  } catch (error) {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    let { ticker } = await request.json();

    if (!ticker || typeof ticker !== "string") {
      return NextResponse.json(
        { error: "Invalid ticker identifier" },
        { status: 400 }
      );
    }

    const lowerCaseName = ticker.toLowerCase().trim();
    if (KNOWN_TICKERS[lowerCaseName]) {
      ticker = KNOWN_TICKERS[lowerCaseName];
    }

    const cleanTicker = ticker.toUpperCase().replace(/[^A-Z0-9.]/g, '');
    
    if (cleanTicker.includes(".NS") || cleanTicker.includes(".BO") || lowerCaseName === "infosys") {
      const screenerData = await fetchScreenerData(cleanTicker);
      if (screenerData) {
        return NextResponse.json({
          ticker: cleanTicker,
          companyName: cleanTicker,
          currency: "INR",
          ...screenerData
        });
      }
    }

    let quote: any = null;
    try {
      const { default: yahooFinance } = await import("yahoo-finance2");
      quote = await yahooFinance.quote(cleanTicker);
    } catch (apiError) {
      const screenerFallback = await fetchScreenerData(cleanTicker);
      if (screenerFallback) {
        return NextResponse.json({
          ticker: cleanTicker,
          companyName: cleanTicker,
          currency: "INR",
          ...screenerFallback
        });
      }

      if (MOCK_DATA[cleanTicker]) {
        return NextResponse.json({
          ticker: cleanTicker,
          companyName: cleanTicker,
          currency: cleanTicker.endsWith(".NS") ? "INR" : "USD",
          ...MOCK_DATA[cleanTicker]
        });
      }

      throw apiError;
    }

    if (!quote) throw new Error("Null data from provider");

    const isINR = quote.currency === "INR";
    const financialData: FinancialData = {
      ticker: cleanTicker,
      companyName: quote.longName || quote.shortName || cleanTicker,
      price: quote.regularMarketPrice || null,
      change: quote.regularMarketChange || null,
      changePercent: quote.regularMarketChangePercent || null,
      currency: quote.currency || "USD",
      marketCap: quote.marketCap 
        ? (isINR ? formatIndianCurrency(quote.marketCap) : (quote.marketCap / 1e9).toFixed(2) + "B") 
        : null,
      peRatio: quote.trailingPE || null,
      dividendYield: quote.dividendYield || null,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || null,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow || null,
      revenue: null,
      profitMargin: null,
      analystRating: quote.averageAnalystRating || null,
    };

    return NextResponse.json(financialData);
  } catch (error) {
    return NextResponse.json(
      {
        error: `Financial pipeline failure: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
}
