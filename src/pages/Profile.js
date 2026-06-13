import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile, changePassword } from "../services/api";

const Profile = () => {
  const [profile, setProfile] = useState({ name: "", email: "", profilePic: "", role: "" });
  const [name, setName] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [darkMode] = useState(() => JSON.parse(localStorage.getItem("darkMode") || "false"));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      setProfile(res.data);
      setName(res.data.name);
      setProfilePic(res.data.profilePic);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({ name, profilePic });
      localStorage.setItem("name", name);
      setMessage("success:Profile updated successfully!");
      fetchProfile();
    } catch (err) {
      setMessage("error:Failed to update profile!");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage("error:New passwords do not match!");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("error:Password must be at least 6 characters!");
      return;
    }
    try {
      await changePassword({ currentPassword, newPassword });
      setMessage("success:Password changed successfully!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      setMessage("error:Current password is incorrect!");
    }
  };

  const theme = darkMode ? dark : light;
  const msgType = message.split(":")[0];
  const msgText = message.split(":")[1];

  const initials = profile.name ? profile.name.charAt(0).toUpperCase() : profile.email ? profile.email.charAt(0).toUpperCase() : "U";

  return (
    <div style={{ ...styles.container, background: theme.bg, color: theme.text, minHeight: "100vh" }}>
      <div style={{ ...styles.navbar, background: theme.navbar, borderBottom: "1px solid " + theme.border }}>
        <div style={styles.logoSection}>
          <img src="/logo.svg" alt="Logo" style={{ height: "38px", objectFit: "contain" }} />
        </div>
        <div style={styles.navRight}>
          <button style={{ ...styles.backBtn, background: theme.cardBg, color: theme.text, border: "1px solid " + theme.border }} onClick={() => navigate("/home")}>
            Back to Gallery
          </button>
        </div>
      </div>

      <div style={{ ...styles.content, flexDirection: isMobile ? "column" : "row" }}>
        <div style={{ ...styles.sidebar, background: theme.cardBg, border: "1px solid " + theme.border }}>
          <div style={styles.avatarSection}>
            {profilePic ? (
              <img src={profilePic} alt="Profile" style={styles.avatar} />
            ) : (
              <div style={styles.avatarPlaceholder}>{initials}</div>
            )}
            <p style={{ ...styles.profileName, color: theme.text }}>{profile.name || "No Name"}</p>
            <p style={{ ...styles.profileEmail, color: theme.subText }}>{profile.email}</p>
            <span style={styles.roleBadge}>{profile.role}</span>
          </div>

          <nav style={styles.nav}>
            <button style={{ ...styles.navItem, background: activeTab === "profile" ? "#667eea22" : "transparent", color: activeTab === "profile" ? "#667eea" : theme.text }} onClick={() => setActiveTab("profile")}>
              👤 Edit Profile
            </button>
            <button style={{ ...styles.navItem, background: activeTab === "password" ? "#667eea22" : "transparent", color: activeTab === "password" ? "#667eea" : theme.text }} onClick={() => setActiveTab("password")}>
              🔒 Change Password
            </button>
          </nav>
        </div>

        <div style={{ ...styles.main, background: theme.cardBg, border: "1px solid " + theme.border }}>
          {message && (
            <div style={{ ...styles.msg, background: msgType === "success" ? "rgba(46,213,115,0.15)" : "rgba(255,71,87,0.15)", border: "1px solid " + (msgType === "success" ? "rgba(46,213,115,0.3)" : "rgba(255,71,87,0.3)"), color: msgType === "success" ? "#2ed573" : "#ff4757" }}>
              {msgText}
            </div>
          )}

          {activeTab === "profile" && (
            <div>
              <h2 style={{ ...styles.title, color: theme.text }}>Edit Profile</h2>

              <div style={styles.formGroup}>
                <label style={{ ...styles.label, color: theme.subText }}>Display Name</label>
                <input
                  style={{ ...styles.input, background: theme.inputBg, color: theme.text, border: "1px solid " + theme.border }}
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={{ ...styles.label, color: theme.subText }}>Email</label>
                <input
                  style={{ ...styles.input, background: theme.inputBg, color: theme.subText, border: "1px solid " + theme.border }}
                  value={profile.email}
                  disabled
                />
              </div>

              <div style={styles.formGroup}>
                <label style={{ ...styles.label, color: theme.subText }}>Profile Picture URL</label>
                <input
                  style={{ ...styles.input, background: theme.inputBg, color: theme.text, border: "1px solid " + theme.border }}
                  placeholder="Enter image URL for profile picture"
                  value={profilePic}
                  onChange={(e) => setProfilePic(e.target.value)}
                />
                {profilePic && (
                  <img src={profilePic} alt="Preview" style={styles.preview} onError={(e) => e.target.style.display = "none"} />
                )}
              </div>

              <button style={styles.saveBtn} onClick={handleUpdateProfile}>
                Save Changes
              </button>
            </div>
          )}

          {activeTab === "password" && (
            <div>
              <h2 style={{ ...styles.title, color: theme.text }}>Change Password</h2>

              <div style={styles.formGroup}>
                <label style={{ ...styles.label, color: theme.subText }}>Current Password</label>
                <input
                  style={{ ...styles.input, background: theme.inputBg, color: theme.text, border: "1px solid " + theme.border }}
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={{ ...styles.label, color: theme.subText }}>New Password</label>
                <input
                  style={{ ...styles.input, background: theme.inputBg, color: theme.text, border: "1px solid " + theme.border }}
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={{ ...styles.label, color: theme.subText }}>Confirm New Password</label>
                <input
                  style={{ ...styles.input, background: theme.inputBg, color: theme.text, border: "1px solid " + theme.border }}
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button style={styles.saveBtn} onClick={handleChangePassword}>
                Change Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const dark = { bg: "#0f0f0f", navbar: "#161616", cardBg: "#1e1e1e", border: "#2a2a2a", text: "#ffffff", subText: "#888", inputBg: "#252525" };
const light = { bg: "#f5f7fa", navbar: "#ffffff", cardBg: "#ffffff", border: "#e8eaed", text: "#202124", subText: "#5f6368", inputBg: "#f1f3f4" };

const styles = {
  container: { fontFamily: "sans-serif" },
  navbar: { padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 },
  logoSection: { display: "flex", alignItems: "center" },
  navRight: { display: "flex", gap: "12px" },
  backBtn: { padding: "8px 16px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "13px" },
  content: { display: "flex", gap: "24px", padding: "24px", maxWidth: "900px", margin: "0 auto" },
  sidebar: { width: "260px", flexShrink: 0, borderRadius: "16px", padding: "24px", height: "fit-content" },
  avatarSection: { textAlign: "center", marginBottom: "24px" },
  avatar: { width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 12px" },
  avatarPlaceholder: { width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: "700", color: "white", margin: "0 auto 12px" },
  profileName: { fontWeight: "700", fontSize: "16px", margin: "0 0 4px" },
  profileEmail: { fontSize: "13px", margin: "0 0 8px" },
  roleBadge: { background: "linear-gradient(135deg,#667eea,#764ba2)", color: "white", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" },
  nav: { display: "flex", flexDirection: "column", gap: "4px" },
  navItem: { padding: "10px 14px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "500", textAlign: "left", transition: "all 0.2s" },
  main: { flex: 1, borderRadius: "16px", padding: "28px" },
  title: { fontSize: "20px", fontWeight: "700", margin: "0 0 24px" },
  msg: { padding: "12px 16px", borderRadius: "10px", marginBottom: "20px", fontWeight: "600", fontSize: "14px" },
  formGroup: { marginBottom: "20px" },
  label: { display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px" },
  input: { width: "100%", padding: "12px 14px", borderRadius: "10px", fontSize: "14px", outline: "none", boxSizing: "border-box" },
  preview: { width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", marginTop: "10px" },
  saveBtn: { padding: "12px 28px", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 15px rgba(102,126,234,0.4)" },
};

export default Profile;
