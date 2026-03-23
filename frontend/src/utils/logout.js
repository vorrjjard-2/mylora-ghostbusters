import apiFetch from "./apiFetch";
import { setCsrfToken } from "./csrf";

export async function handleLogout(navigate) {
  try {
    await apiFetch("/api/logout/", {
      method: "POST",
    });
  } catch (err) {
    console.error("Logout failed:", err);
  }
  localStorage.removeItem("authToken");
  localStorage.removeItem("auth");
  localStorage.removeItem("order_items");
  localStorage.removeItem("delivery_details");
  setCsrfToken(null);
  navigate("/login", { replace: true });
}
