import yahooFinance from "yahoo-finance2";

async function test() {
  console.log("--- Testing Yahoo Finance ---");
  try {
    const quote = await yahooFinance.quote("INFY");
    console.log("INFY (NYSE) success:", quote.symbol, quote.regularMarketPrice);
  } catch (error) {
    console.error("INFY (NYSE) failed:", error);
  }
}

test();
