import yahooFinance from "yahoo-finance2";
import { search } from "duck-duck-scrape";

async function test() {
  console.log("--- Testing Yahoo Finance ---");
  try {
    const quote = await yahooFinance.quote("INFY");
    console.log("INFY (NYSE) success:", quote.symbol, quote.regularMarketPrice);
  } catch (error) {
    console.log("INFY (NYSE) failed:", error instanceof Error ? error.message : String(error));
  }

  try {
    const quote = await yahooFinance.quote("INFY.NS");
    console.log("INFY.NS (NSE) success:", quote.symbol, quote.regularMarketPrice);
  } catch (error) {
    console.log("INFY.NS (NSE) failed:", error instanceof Error ? error.message : String(error));
  }

  console.log("\n--- Testing DuckDuckGo Search ---");
  try {
    const results = await search("Infosys stock ticker", { safeSearch: 0 });
    console.log("Search success, results count:", results.results.length);
    console.log("First result:", results.results[0]?.title);
  } catch (error) {
    console.log("Search failed:", error instanceof Error ? error.message : String(error));
  }
}

test();
