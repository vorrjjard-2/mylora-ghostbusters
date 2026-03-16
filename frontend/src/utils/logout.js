import { API_BASE_URL } from "./api";
import { getCookie, setCsrfToken } from "./csrf";

export async function handleLogout(navigate) {
  try {
    await fetch(`${API_BASE_URL}/api/logout/`, {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRFToken": getCookie("csrftoken") },
    });
  } catch (err) {
    console.error("Logout failed:", err);
  }
  localStorage.removeItem("order_items");
  localStorage.removeItem("delivery_details");
  setCsrfToken(null);
  navigate("/login", { replace: true });
}
