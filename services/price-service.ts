import { TokenSymbol } from "@/types";

interface PriceData {
  readonly price: number;
  readonly lastUpdated: number;
  readonly symbol: TokenSymbol;
}

interface CachedPrice extends PriceData {
  readonly isStale: boolean;
}

const CACHE_DURATION = 5 * 60 * 1000;
const STALE_DURATION = 30 * 60 * 1000;

class PriceService {
  private cache = new Map<TokenSymbol, PriceData>();
  private pendingRequests = new Map<TokenSymbol, Promise<number>>();

  /**
   * Get cached price if available and not stale
   */
  private getCachedPrice(symbol: TokenSymbol): CachedPrice | null {
    const cached = this.cache.get(symbol);

    if (!cached) return null;

    const now = Date.now();
    const age = now - cached.lastUpdated;

    return {
      ...cached,
      isStale: age > CACHE_DURATION,
    };
  }

  /**
   * Fetch price from CoinGecko API
   */
  private async fetchFromCoinGecko(): Promise<number> {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=tac&vs_currencies=USD"
      );

      if (!response.ok) {
        throw new Error("CoinGecko API failed");
      }

      const data = await response.json();

      const tacPrice = data.tac?.usd;

      if (typeof tacPrice === "number" && tacPrice > 0) {
        return tacPrice;
      }

      throw new Error("Invalid price data from CoinGecko");
    } catch (error) {
      console.error("CoinGecko API error:", error);
      return this.getFallbackPrice();
    }
  }

  /**
   * Get fallback price when API fails
   */
  private getFallbackPrice(): number {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("tac-price-fallback");
      if (cached) {
        const { price, timestamp } = JSON.parse(cached);

        if (Date.now() - timestamp < 60 * 60 * 1000) {
          return price;
        }
      }
    }

    return 0.0012;
  }

  /**
   * Store fallback price in localStorage
   */
  private storeFallbackPrice(price: number): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "tac-price-fallback",
        JSON.stringify({
          price,
          timestamp: Date.now(),
        })
      );
    }
  }

  /**
   * Fetch fresh price data
   */
  private async fetchPrice(symbol: TokenSymbol): Promise<number> {
    if (symbol !== "TAC" && symbol !== "WTAC") {
      throw new Error(`Price fetching not supported for ${symbol}`);
    }

    let price: number;

    try {
      price = await this.fetchFromCoinGecko();
    } catch (error) {
      console.error("Failed to fetch TAC price from CoinGecko:", error);
      price = this.getFallbackPrice();
    }

    this.storeFallbackPrice(price);

    this.cache.set(symbol, {
      price,
      lastUpdated: Date.now(),
      symbol,
    });

    return price;
  }

  /**
   * Get token price with caching
   */
  async getPrice(symbol: TokenSymbol): Promise<number> {
    const cached = this.getCachedPrice(symbol);

    if (cached && !cached.isStale) {
      return cached.price;
    }

    const pending = this.pendingRequests.get(symbol);
    if (pending) {
      return pending;
    }

    const pricePromise = this.fetchPrice(symbol).finally(() => {
      this.pendingRequests.delete(symbol);
    });

    this.pendingRequests.set(symbol, pricePromise);

    return pricePromise;
  }

  /**
   * Get multiple prices at once
   */
  async getPrices(
    symbols: TokenSymbol[]
  ): Promise<Record<TokenSymbol, number>> {
    const pricePromises = symbols.map(async (symbol) => {
      const price = await this.getPrice(symbol);
      return [symbol, price] as const;
    });

    const results = await Promise.all(pricePromises);

    return Object.fromEntries(results) as Record<TokenSymbol, number>;
  }

  /**
   * Force refresh price (ignore cache)
   */
  async refreshPrice(symbol: TokenSymbol): Promise<number> {
    this.cache.delete(symbol);
    this.pendingRequests.delete(symbol);

    return this.getPrice(symbol);
  }

  /**
   * Get cached price without making network request
   */
  getCachedPriceSync(symbol: TokenSymbol): number | null {
    const cached = this.getCachedPrice(symbol);
    return cached?.price || null;
  }

  /**
   * Clear all cached prices
   */
  clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    this.cache.forEach((data, symbol) => {
      const age = Date.now() - data.lastUpdated;
      stats[symbol] = {
        price: data.price,
        ageMs: age,
        ageMinutes: Math.round(age / 60000),
        isStale: age > CACHE_DURATION,
      };
    });

    return stats;
  }
}

export const priceService = new PriceService();

export type { PriceData, CachedPrice };
