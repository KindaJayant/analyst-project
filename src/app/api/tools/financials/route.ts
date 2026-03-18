import { NextResponse } from "next/server";
import type { FinancialData } from "@/types";

export async function POST(request: Request) {
  try {
    const { ticker } = await request.json();

    if (!ticker || typeof ticker !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'ticker' parameter" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const yahooFinance = require("yahoo-finance2");

    let quote;
    try {
      quote = await yahooFinance.quote(ticker.toUpperCase());
    } catch {
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
        error: `Could not find financial data for ticker "${ticker}". The company may not be publicly traded.`,
      };
      return NextResponse.json(financialData);
    }

    // Try to get additional summary data
    let summaryData: Record<string, unknown> | null = null;
    try {
      const summary = await yahooFinance.quoteSummary(ticker.toUpperCase(), {
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
