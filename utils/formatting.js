/**
 * Currency & Formatting Utilities
 */

export const getCurrencySymbol = (currency) => {
  const symbols = {
    NGN: "₦",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  return symbols[currency] || currency;
};

export const formatCurrency = (value = 0, currency = "NGN") => {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${Number(value).toLocaleString("en-US")}`;
};

export const formatNumber = (value = 0) => {
  return Number(value).toLocaleString("en-US");
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
