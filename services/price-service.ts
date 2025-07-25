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

class PriceService {
  private cache = new Map<TokenSymbol, PriceData>();
  private pendingRequests = new Map<TokenSymbol, Promise<number>>();

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

  private async fetchFromCoinGecko(): Promise<number> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=tac&vs_currencies=USD",
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "WTAC-Unwrap-App/1.0",
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `CoinGecko API failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const tacPrice = data.tac?.usd;

      if (typeof tacPrice !== "number" || isNaN(tacPrice) || tacPrice <= 0) {
        throw new Error("Invalid price data from CoinGecko");
      }

      const cachedPrice = this.getCachedPrice("TAC");
      if (
        cachedPrice &&
        Math.abs(tacPrice - cachedPrice.price) / cachedPrice.price > 0.5
      ) {
        console.warn(
          `Large price change detected: ${cachedPrice.price} -> ${tacPrice}`
        );
      }

      return tacPrice;
    } catch (error) {
      console.error("CoinGecko API error:", error);
      return this.getFallbackPrice();
    }
  }

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

  async refreshPrice(symbol: TokenSymbol): Promise<number> {
    this.cache.delete(symbol);
    this.pendingRequests.delete(symbol);

    return this.getPrice(symbol);
  }

  getCachedPriceSync(symbol: TokenSymbol): number | null {
    const cached = this.getCachedPrice(symbol);
    return cached?.price || null;
  }

  clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

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
