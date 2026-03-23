import { API_BASE_URL } from "./api";
import { getCookie } from "./csrf";

export default function apiFetch(path, options = {}) {
  const token = localStorage.getItem("authToken");
  const headers = { ...(options.headers || {}) };

  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }

  // Add CSRF token for mutating requests
  const method = (options.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    const csrf = getCookie("csrftoken");
    if (csrf) {
      headers["X-CSRFToken"] = csrf;
    }
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
}
