import { API_BASE_URL } from "../utils/api";
import { setCsrfToken } from "../utils/csrf";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole }) {
  const [authState, setAuthState] = useState({
    loading: true,
    authenticated: false,
    roles: [],
    debug: "",
  });

  useEffect(() => {
    const storedAuth = localStorage.getItem("auth");
    let debugInfo = `localStorage auth: ${storedAuth}\n`;

    // Check if user is authenticated
    fetch(`${API_BASE_URL}/api/me/`, {
      credentials: "include",
    })
      .then((res) => {
        debugInfo += `api/me status: ${res.status}\n`;
        if (!res.ok) {
          throw new Error("Not authenticated");
        }
        return res.json();
      })
      .then((data) => {
        debugInfo += `api/me data: ${JSON.stringify(data)}\n`;
        if (data.csrfToken) {
          setCsrfToken(data.csrfToken);
        }
        if (data.authenticated) {
          localStorage.setItem("auth", JSON.stringify({
            authenticated: true,
            username: data.username,
            roles: data.roles || [],
          }));
          setAuthState({
            loading: false,
            authenticated: true,
            roles: data.roles || [],
            debug: debugInfo + "result: authenticated via API",
          });
        } else {
          // API says not authenticated — fall back to localStorage
          if (storedAuth) {
            try {
              const parsed = JSON.parse(storedAuth);
              if (parsed.authenticated) {
                setAuthState({
                  loading: false,
                  authenticated: true,
                  roles: parsed.roles || [],
                  debug: debugInfo + "result: authenticated via localStorage fallback",
                });
                return;
              }
            } catch {}
          }
          setAuthState({
            loading: false,
            authenticated: false,
            roles: [],
            debug: debugInfo + "result: NOT authenticated (no localStorage fallback)",
          });
        }
      })
      .catch((err) => {
        debugInfo += `api/me error: ${err.message}\n`;
        // Network error — fall back to localStorage
        if (storedAuth) {
          try {
            const parsed = JSON.parse(storedAuth);
            if (parsed.authenticated) {
              setAuthState({
                loading: false,
                authenticated: true,
                roles: parsed.roles || [],
                debug: debugInfo + "result: authenticated via localStorage (catch)",
              });
              return;
            }
          } catch {}
        }
        setAuthState({
          loading: false,
          authenticated: false,
          roles: [],
          debug: debugInfo + "result: NOT authenticated (catch, no localStorage)",
        });
      });
  }, []);

  // Show loading state
  if (authState.loading) {
    return <div style={{ padding: "2rem" }}>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!authState.authenticated) {
    return (
      <div style={{ padding: "2rem", whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "12px" }}>
        <h3>DEBUG: Auth failed — would redirect to /login</h3>
        <p>{authState.debug}</p>
        <p>requiredRole: {requiredRole || "none"}</p>
        <a href="/login">Go to login</a>
      </div>
    );
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