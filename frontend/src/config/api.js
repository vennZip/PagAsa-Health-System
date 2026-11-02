const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()
  || (import.meta.env.DEV ? "http://localhost:5000" : "");

if (!configuredApiUrl) {
  throw new Error("VITE_API_URL is not configured.");
}

export const API_URL = configuredApiUrl.replace(/\/$/, "");

export const apiUrl = (path) => (
  `${API_URL}${path.startsWith("/") ? path : `/${path}`}`
);
