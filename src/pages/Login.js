import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await login(email, password);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("email", res.data.email);
      navigate("/home");
    } catch (err) {
      setError("Invalid email or password!");
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgAnimation}>
        <div style={styles.circle1} />
        <div style={styles.circle2} />
        <div style={styles.circle3} />
      </div>
      <div style={{ ...styles.card, opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(40px)", transition: "all 0.6s ease" }}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>HC</div>
          <h1 style={styles.logoText}>PhotoCloud</h1>
          <p style={styles.tagline}>Owned by Harsh Kumawat</p>
          <p style={styles.subtitle}>Your personal media gallery</p>
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleLogin}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>@</span>
              <input style={styles.input} type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>*</span>
              <input style={styles.input} type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>
          <button style={{ ...styles.button, opacity: loading ? 0.8 : 1 }} type="submit" disabled={loading}>
            {loading ? (
              <span style={styles.loadingDots}>
                <span style={styles.dot} />
                <span style={styles.dot} />
                <span style={styles.dot} />
              </span>
            ) : "Sign In"}
          </button>
        </form>
      </div>
      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-30px) scale(1.1)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,20px) scale(0.9)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,30px) scale(1.05)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
};

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)", position: "relative", overflow: "hidden" },
  bgAnimation: { position: "absolute", inset: 0, pointerEvents: "none" },
  circle1: { position: "absolute", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(102,126,234,0.3), transparent)", top: "-100px", left: "-100px", animation: "float1 8s ease-in-out infinite" },
  circle2: { position: "absolute", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(118,75,162,0.3), transparent)", bottom: "-50px", right: "-50px", animation: "float2 10s ease-in-out infinite" },
  circle3: { position: "absolute", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.05), transparent)", top: "50%", left: "50%", animation: "float3 6s ease-in-out infinite" },
  card: { background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", borderRadius: "24px", padding: "48px 40px", width: "100%", maxWidth: "420px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)", position: "relative", zIndex: 1 },
  logoSection: { textAlign: "center", marginBottom: "36px" },
  logoImg: { height: "48px", objectFit: "contain" },
  logoIcon: { width: "72px", height: "72px", background: "linear-gradient(135deg, #667eea, #764ba2)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "900", color: "white", margin: "0 auto 16px", boxShadow: "0 8px 32px rgba(102,126,234,0.5)", lineHeight: "72px", textAlign: "center" },
  logoText: { color: "white", fontSize: "28px", fontWeight: "800", margin: "0 0 4px", letterSpacing: "-0.5px" },
  tagline: { color: "#667eea", fontSize: "13px", fontWeight: "600", margin: "0 0 8px", letterSpacing: "0.5px" },
  subtitle: { color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 },
  error: { background: "rgba(255,68,68,0.15)", border: "1px solid rgba(255,68,68,0.3)", color: "#ff6b6b", padding: "12px", borderRadius: "12px", marginBottom: "20px", textAlign: "center", fontSize: "14px" },
  inputGroup: { marginBottom: "20px" },
  label: { display: "block", color: "rgba(255,255,255,0.7)", fontSize: "13px", fontWeight: "600", marginBottom: "8px", letterSpacing: "0.3px" },
  inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "14px", color: "rgba(255,255,255,0.4)", fontSize: "16px", fontWeight: "600", zIndex: 1 },
  input: { width: "100%", padding: "14px 14px 14px 40px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", color: "white", fontSize: "15px", outline: "none", boxSizing: "border-box", transition: "border-color 0.3s" },
  button: { width: "100%", padding: "16px", background: "linear-gradient(135deg, #667eea, #764ba2)", color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer", marginTop: "8px", letterSpacing: "0.5px", boxShadow: "0 8px 32px rgba(102,126,234,0.4)", transition: "all 0.3s" },
  loadingDots: { display: "flex", gap: "6px", justifyContent: "center", alignItems: "center" },
  dot: { width: "8px", height: "8px", background: "white", borderRadius: "50%", animation: "blink 1s ease-in-out infinite" },
};

export default Login;
