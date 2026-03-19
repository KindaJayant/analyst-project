const yahooFinance = require("yahoo-finance2").default;
const { search } = require("duck-duck-scrape");

async function test() {
  console.log("--- Testing Yahoo Finance ---");
  try {
    const quote = await yahooFinance.quote("INFY");
    console.log("INFY (NYSE) success:", quote.symbol, quote.regularMarketPrice);
  } catch (e) {
    console.log("INFY (NYSE) failed:", e.message);
  }

  try {
    const quote = await yahooFinance.quote("INFY.NS");
    console.log("INFY.NS (NSE) success:", quote.symbol, quote.regularMarketPrice);
  } catch (e) {
    console.log("INFY.NS (NSE) failed:", e.message);
  }

  console.log("\n--- Testing DuckDuckGo Search ---");
  try {
    const results = await search("Infosys stock ticker", { safeSearch: 0 });
    console.log("Search success, results count:", results.results.length);
    console.log("First result:", results.results[0]?.title);
  } catch (e) {
    console.log("Search failed:", e.message);
  }
}

test();
