const yahooFinance = require("yahoo-finance2").default;

async function test() {
  console.log("--- Testing Yahoo Finance ---");
  try {
    const quote = await yahooFinance.quote("INFY");
    console.log("INFY (NYSE) success:", quote.symbol, quote.regularMarketPrice);
  } catch (e) {
    console.error("INFY (NYSE) failed:", e);
  }
}

test();
