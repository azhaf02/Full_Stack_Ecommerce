import React, { useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid email or password");
      }

      if (!data.access_token) {
        throw new Error("Login succeeded but no access token was returned.");
      }

      localStorage.setItem("access_token", data.access_token);

      if (data.user) {
        localStorage.setItem("auth_user", JSON.stringify(data.user));
      }

      window.location.href = "/checkout";
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Login failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f5f0e6",
      padding: "20px"
    }}>
      <form
        onSubmit={handleLogin}
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "white",
          padding: "32px",
          borderRadius: "16px",
          boxShadow: "0 8px 30px rgba(0,0,0,.12)"
        }}
      >
        <h1 style={{ color: "#53652f", marginBottom: "8px" }}>
          VIORA
        </h1>

        <p style={{ color: "#666", marginBottom: "25px" }}>
          Login to continue to checkout
        </p>

        {message && (
          <div style={{
            background: "#ffe5e5",
            color: "#b00020",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "15px"
          }}>
            {message}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            border: "none",
            borderRadius: "8px",
            background: "#68783b",
            color: "white",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px",
  marginBottom: "14px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  fontSize: "15px"
};
