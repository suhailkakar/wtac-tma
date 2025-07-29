import { ValidationResult, ValidationError } from "@/types";

export const VALIDATION_RULES = {
  INPUT_VALUE: {
    MAX_LENGTH: 20,
    MAX_DECIMAL_PLACES: 6,
    MIN_VALUE: 0,
    MAX_VALUE: 1e12,
  },
  BALANCE: {
    MIN_BALANCE_REQUIRED: 0.000000001,
  },
} as const;

const NUMERIC_PATTERN = /^[0-9]*\.?[0-9]*$/;
const LEADING_ZEROS_PATTERN = /^0+(?=\d)/;

export function validateNumericInput(value: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!value || value.trim() === "") {
    return { isValid: true, errors: [] };
  }

  if (!NUMERIC_PATTERN.test(value)) {
    errors.push({
      field: "inputValue",
      message: "Only numbers and decimal points are allowed",
      code: "INVALID_FORMAT",
    });
  }

  if (value.length > VALIDATION_RULES.INPUT_VALUE.MAX_LENGTH) {
    errors.push({
      field: "inputValue",
      message: `Maximum ${VALIDATION_RULES.INPUT_VALUE.MAX_LENGTH} characters allowed`,
      code: "MAX_LENGTH_EXCEEDED",
    });
  }

  const decimalIndex = value.indexOf(".");
  if (decimalIndex !== -1) {
    const decimalPlaces = value.length - decimalIndex - 1;
    if (decimalPlaces > VALIDATION_RULES.INPUT_VALUE.MAX_DECIMAL_PLACES) {
      errors.push({
        field: "inputValue",
        message: `Maximum ${VALIDATION_RULES.INPUT_VALUE.MAX_DECIMAL_PLACES} decimal places allowed`,
        code: "EXCESSIVE_DECIMALS",
      });
    }
  }

  if ((value.match(/\./g) || []).length > 1) {
    errors.push({
      field: "inputValue",
      message: "Only one decimal point allowed",
      code: "MULTIPLE_DECIMALS",
    });
  }

  const numValue = parseFloat(value);
  if (!isNaN(numValue)) {
    if (numValue < VALIDATION_RULES.INPUT_VALUE.MIN_VALUE) {
      errors.push({
        field: "inputValue",
        message: "Value must be greater than 0",
        code: "VALUE_TOO_LOW",
      });
    }

    if (numValue > VALIDATION_RULES.INPUT_VALUE.MAX_VALUE) {
      errors.push({
        field: "inputValue",
        message: "Value is too large",
        code: "VALUE_TOO_HIGH",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function sanitizeNumericInput(value: string): string {
  if (!value) return "0";

  let sanitized = value.replace(/[^0-9.]/g, "");

  const decimalIndex = sanitized.indexOf(".");
  if (decimalIndex !== -1) {
    sanitized =
      sanitized.slice(0, decimalIndex + 1) +
      sanitized.slice(decimalIndex + 1).replace(/\./g, "");
  }

  if (sanitized !== "0" && !sanitized.startsWith("0.")) {
    sanitized = sanitized.replace(LEADING_ZEROS_PATTERN, "");
  }

  if (sanitized.startsWith(".")) {
    sanitized = "0" + sanitized;
  }

  if (!sanitized) {
    return "0";
  }
  
  if (sanitized === ".") {
    return "0.";
  }

  // Preserve trailing decimal point for user input
  if (sanitized.endsWith(".") && !sanitized.includes("..")) {
    return sanitized;
  }

  // Preserve decimal digits while user is typing (don't remove trailing zeros if input is short)
  const inputDecimalIndex = sanitized.indexOf(".");
  if (inputDecimalIndex !== -1 && sanitized.length - inputDecimalIndex <= 7) {
    // If it's a valid number and not too many decimal places, keep as-is
    const num = parseFloat(sanitized);
    if (!isNaN(num) && isFinite(num)) {
      return sanitized;
    }
  }

  const num = parseFloat(sanitized);
  if (!isNaN(num) && isFinite(num)) {
    const fixedNum = Math.round(num * 1e8) / 1e8;

    let result = fixedNum.toString();

    const dotIndex = result.indexOf(".");
    if (dotIndex !== -1 && result.length - dotIndex - 1 > 6) {
      result = fixedNum.toFixed(6);

      result = result.replace(/\.?0+$/, "");
    }

    return result;
  }

  return sanitized;
}

export function validateSufficientBalance(
  inputAmount: string,
  availableBalance: string
): ValidationResult {
  const errors: ValidationError[] = [];

  const amount = parseFloat(inputAmount);
  const balance = parseFloat(availableBalance);

  if (isNaN(amount) || isNaN(balance)) {
    errors.push({
      field: "balance",
      message: "Invalid balance or amount",
      code: "INVALID_NUMBERS",
    });
    return { isValid: false, errors };
  }

  // Use epsilon comparison for floating point precision issues
  const epsilon = 1e-9; // Small tolerance for floating point precision
  if (amount > balance + epsilon) {
    errors.push({
      field: "balance",
      message: "Insufficient balance",
      code: "INSUFFICIENT_BALANCE",
    });
  }

  if (balance < VALIDATION_RULES.BALANCE.MIN_BALANCE_REQUIRED) {
    errors.push({
      field: "balance",
      message: "Minimum balance required",
      code: "MIN_BALANCE_NOT_MET",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function formatDisplayNumber(
  value: string | number,
  maxDecimals: number = 10
): string {
  if (!value || value === "0") return "0";

  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";

  if (num < 0.000001 && num > 0) {
    return num.toExponential(2);
  }

  const formatted = num.toFixed(maxDecimals);

  return formatted.replace(/\.?0+$/, "");
}

export function isValidPositiveNumber(value: string): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && isFinite(num);
}
