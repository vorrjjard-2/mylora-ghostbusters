import { API_BASE_URL } from "../utils/api";
import { setCsrfToken } from "../utils/csrf";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole }) {
  const [authState, setAuthState] = useState({
    loading: true,
    authenticated: false,
    roles: [],
  });

  useEffect(() => {
    // Check if user is authenticated
    fetch(`${API_BASE_URL}/api/me/`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Not authenticated");
        }
        return res.json();
      })
      .then((data) => {
        if (data.csrfToken) {
          setCsrfToken(data.csrfToken);
        }
        setAuthState({
          loading: false,
          authenticated: data.authenticated,
          roles: data.roles || [],
        });
      })
      .catch(() => {
        setAuthState({
          loading: false,
          authenticated: false,
          roles: [],
        });
      });
  }, []);

  // Show loading state
  if (authState.loading) {
    return <div style={{ padding: "2rem" }}>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!authState.authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role if specified
  if (requiredRole && !authState.roles.includes(requiredRole)) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  // User is authenticated and has required role
  return children;
}