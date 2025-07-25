export type Network = "mainnet" | "testnet";

export type TokenSymbol = "WTAC" | "TAC" | "ETH" | "USDC" | "USDT" | "BTC";

export interface Token {
  readonly symbol: TokenSymbol;
  readonly name: string;
  readonly icon: string;
  readonly balance: string;
  readonly decimals: number;
  readonly contractAddress?: string;
}

export interface SwapState {
  readonly inputValue: string;
  readonly inputToken: Token;
  readonly outputToken: Token;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly estimatedOutput: string;
  readonly exchangeRate: number;
}

export interface SwapAction {
  type:
    | "SET_INPUT_VALUE"
    | "SET_LOADING"
    | "SET_ERROR"
    | "CLEAR_ERROR"
    | "SET_ESTIMATED_OUTPUT"
    | "UPDATE_BALANCES";
  payload?: string | boolean | { inputBalance: string; outputBalance: string };
}

export interface NetworkState {
  readonly network: Network;
  readonly isTestnet: boolean;
  readonly rpcUrl: string;
  readonly explorerUrl: string;
}

export interface NetworkContextValue extends NetworkState {
  readonly toggleNetwork: () => void;
  readonly setNetwork: (network: Network) => void;
}

export interface AssetInputProps {
  readonly value: string;
  readonly token: Token;
  readonly fiatValue: string;
  readonly isReadOnly?: boolean;
  readonly onValueChange: (value: string) => void;
  readonly onTokenSelect?: () => void;
  readonly error?: string;
  readonly maxLength?: number;
}

export interface AssetOutputProps {
  readonly token: Token;
  readonly value: string;
  readonly fiatValue: string;
  readonly isLoading?: boolean;
}

export interface MessageProps {
  readonly text: string;
  readonly type?: "info" | "error" | "warning" | "success";
  readonly className?: string;
}

export interface ActionButtonProps {
  readonly text: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly isLoading?: boolean;
  readonly variant?: "primary" | "secondary" | "danger";
  readonly className?: string;
}

export interface NumericKeypadProps {
  readonly onKeyPress: (key: string) => void;
  readonly onBackspace: () => void;
  readonly disabled?: boolean;
  readonly maxLength?: number;
}

export interface PresetButtonsProps {
  readonly onPresetSelect: (percentage: number) => void;
  readonly disabled?: boolean;
  readonly availableBalance: string;
}

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: ValidationError[];
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export const NETWORKS: Record<Network, NetworkState> = {
  mainnet: {
    network: "mainnet",
    isTestnet: false,
    rpcUrl: "https://toncenter.com/api/v2/jsonRPC",
    explorerUrl: "https://tonscan.org",
  },
  testnet: {
    network: "testnet",
    isTestnet: true,
    rpcUrl: "https://testnet.toncenter.com/api/v2/jsonRPC",
    explorerUrl: "https://testnet.tonscan.org",
  },
} as const;

export const TOKENS: Record<TokenSymbol, Omit<Token, "balance">> = {
  WTAC: {
    symbol: "WTAC",
    name: "Wrapped TAC",
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/37338.png",
    decimals: 18,
    contractAddress: "0:976525D85B589495D4A3A3B3889E8AF7F960F5717CCB41D84AA1CABF7C8E5F87",
  },
  TAC: {
    symbol: "TAC",
    name: "TAC Token",
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/37338.png",
    decimals: 18,
    contractAddress: "0:44FE006B53798F23D8478E526847F918CAB8508320850FA11459F6B8D96F13EC",
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    icon: "E",
    decimals: 18,
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    icon: "U",
    decimals: 6,
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    icon: "T",
    decimals: 6,
  },
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    icon: "B",
    decimals: 8,
  },
} as const;
