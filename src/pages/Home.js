import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPhotos, getFavorites, getAlbums, getPhotosByAlbum, toggleFavorite, deletePhoto, getStorageStats } from "../services/api";

const Home = () => {
  const [photos, setPhotos] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [storage, setStorage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("photos");
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const [currentPhotos, setCurrentPhotos] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const email = localStorage.getItem("email");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [photosRes, albumsRes, storageRes] = await Promise.all([
        getPhotos(),
        getAlbums(),
        getStorageStats()
      ]);
      setPhotos(photosRes.data);
      setCurrentPhotos(photosRes.data);
      setAlbums(albumsRes.data);
      setStorage(storageRes.data);
      setRecentActivity(photosRes.data.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = async (tab, albumId) => {
    setActiveTab(tab);
    setLoading(true);
    try {
      if (tab === "photos") {
        const res = await getPhotos();
        setCurrentPhotos(res.data);
      } else if (tab === "favorites") {
        const res = await getFavorites();
        setCurrentPhotos(res.data);
      } else if (tab === "album" && albumId) {
        const res = await getPhotosByAlbum(albumId);
        setCurrentPhotos(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (id, e) => {
    e.stopPropagation();
    try {
      await toggleFavorite(id);
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this photo?")) return;
    try {
      await deletePhoto(id);
      if (selected && selected.id === id) setSelected(null);
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const openPhoto = (photo, index) => {
    setSelected(photo);
    setSelectedIndex(index);
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    const newIndex = (selectedIndex - 1 + filtered.length) % filtered.length;
    setSelected(filtered[newIndex]);
    setSelectedIndex(newIndex);
  };

  const nextPhoto = (e) => {
    e.stopPropagation();
    const newIndex = (selectedIndex + 1) % filtered.length;
    setSelected(filtered[newIndex]);
    setSelectedIndex(newIndex);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (!selected) return;
      if (e.key === "ArrowLeft") prevPhoto(e);
      if (e.key === "ArrowRight") nextPhoto(e);
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selected, selectedIndex, currentPhotos]);

  const filtered = currentPhotos.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const storageUsedGB = storage ? (storage.storage ? (storage.storage.usage / 1024 / 1024 / 1024).toFixed(2) : 0) : 0;
  const storageLimitGB = 25;
  const storagePercent = Math.min((storageUsedGB / storageLimitGB) * 100, 100).toFixed(1);

  const theme = darkMode ? dark : light;

  return (
    <div style={{ ...styles.container, background: theme.bg, color: theme.text }}>
      <div style={{ ...styles.navbar, background: theme.navbar, borderBottom: "1px solid " + theme.border }}>
        <div style={styles.logoSection}>
          <img src="/logo.png" alt="Logo" style={{ height: "42px", objectFit: "contain" }} />
        </div>
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>&#128269;</span>
          <input style={{ ...styles.searchInput, background: theme.inputBg, color: theme.text, border: "1px solid " + theme.border }} placeholder="Search your photos..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={styles.navRight}>
          <button style={{ ...styles.iconBtn, background: theme.cardBg, color: theme.text }} onClick={() => {
            const newMode = !darkMode;
            setDarkMode(newMode);
            localStorage.setItem("darkMode", JSON.stringify(newMode));
          }}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          <span style={{ color: theme.subText, fontSize: "13px" }}>{email}</span>
          {role === "ADMIN" && (
            <button style={styles.adminBtn} onClick={() => navigate("/admin")}>Admin Panel</button>
          )}
          <button style={{ ...styles.logoutBtn, background: theme.cardBg, color: theme.text, border: "1px solid " + theme.border }} onClick={() => { localStorage.clear(); navigate("/"); }}>Logout</button>
        </div>
      </div>

      <div style={styles.layout}>
        <div style={{ ...styles.sidebar, background: theme.sidebar, borderRight: "1px solid " + theme.border }}>
          <nav style={styles.nav}>
            {[
              { id: "photos", label: "Photos", icon: "🖼️" },
              { id: "favorites", label: "Favorites", icon: "❤️" },
              { id: "albums", label: "Albums", icon: "📁" },
              { id: "shared", label: "Shared", icon: "👥" },
              { id: "trash", label: "Trash", icon: "🗑️" },
            ].map((item) => (
              <button
                key={item.id}
                style={{ ...styles.navItem, background: activeTab === item.id ? theme.activeNav : "transparent", color: activeTab === item.id ? "#667eea" : theme.text }}
                onClick={() => handleTabChange(item.id)}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div style={styles.sidebarDivider} />

          <div style={{ ...styles.storageCard, background: theme.cardBg, border: "1px solid " + theme.border }}>
            <p style={{ ...styles.storageTitle, color: theme.text }}>Storage</p>
            <div style={styles.storageCircle}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke={theme.border} strokeWidth="8" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="#667eea" strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - storagePercent / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)" />
                <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="700" fill={theme.text}>{storagePercent}%</text>
              </svg>
            </div>
            <p style={{ ...styles.storageText, color: theme.subText }}>{storageUsedGB} GB of {storageLimitGB} GB used</p>
            <div style={styles.storageBar}>
              <div style={{ ...styles.storageBarFill, width: storagePercent + "%" }} />
            </div>
          </div>

          {albums.length > 0 && (
            <div style={styles.albumList}>
              <p style={{ ...styles.albumsTitle, color: theme.subText }}>Albums</p>
              {albums.map((album) => (
                <button key={album.id} style={{ ...styles.albumItem, color: theme.text }} onClick={() => handleTabChange("album", album.id)}>
                  <span>📁</span>
                  <span style={styles.albumName}>{album.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={styles.main}>
          {activeTab === "photos" && (
            <div style={{ ...styles.heroCard, background: "linear-gradient(135deg, #667eea22, #764ba222)", border: "1px solid #667eea33" }}>
              <div style={styles.heroText}>
                <h2 style={{ ...styles.heroTitle, color: theme.text }}>Your memories, safe in the cloud</h2>
                <p style={{ ...styles.heroSub, color: theme.subText }}>Upload, access, and share your photos anytime, anywhere.</p>
                {role === "ADMIN" && (
                  <button style={styles.uploadHeroBtn} onClick={() => navigate("/admin")}>Upload Photos</button>
                )}
              </div>
              <div style={styles.heroIcon}>☁️</div>
            </div>
          )}

          <div style={styles.contentArea}>
            {activeTab === "photos" && (
              <div style={styles.twoCol}>
                <div style={styles.mainCol}>
                  <div style={styles.sectionHeader}>
                    <h3 style={{ ...styles.sectionTitle, color: theme.text }}>Today</h3>
                    <span style={{ color: theme.subText, fontSize: "13px" }}>{filtered.length} photos</span>
                  </div>
                  {loading ? (
                    <div style={styles.skeletonGrid}>
                      {[...Array(8)].map((_, i) => (
                        <div key={i} style={{ ...styles.skeleton, background: theme.skeleton }} />
                      ))}
                    </div>
                  ) : filtered.length === 0 ? (
                    <div style={{ ...styles.empty, color: theme.subText }}>
                      <div style={styles.emptyIcon}>🖼️</div>
                      <p>No photos yet</p>
                    </div>
                  ) : (
                    <div style={styles.photoGrid}>
                      {filtered.map((photo, index) => (
                        <div key={photo.id} style={{ ...styles.photoCard, background: theme.cardBg }} onClick={() => openPhoto(photo, index)}>
                          {photo.mediaType === "video" ? (
                            <video src={photo.imageUrl} style={styles.photoImg} />
                          ) : (
                            <img src={photo.imageUrl} alt={photo.title} style={styles.photoImg} />
                          )}
                          <div style={styles.photoOverlay}>
                            <button style={{...styles.favBtn, cursor: "pointer"}} onClick={(e) => { e.stopPropagation(); handleToggleFavorite(photo.id, e); }}>
                              {photo.favorite ? "❤️" : "🤍"}
                            </button>
                            <div style={styles.photoActions}>
                              <a href={photo.imageUrl} target="_blank" rel="noreferrer" style={styles.actionBtn} onClick={(e) => e.stopPropagation()}>⬇️</a>
                              {role === "ADMIN" && (
                                <button style={styles.actionBtnDel} onClick={(e) => handleDelete(photo.id, e)}>🗑️</button>
                              )}
                            </div>
                          </div>
                          <p style={{ ...styles.photoTitle, color: theme.subText }}>{photo.title}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={styles.rightCol}>
                  <div style={{ ...styles.activityCard, background: theme.cardBg, border: "1px solid " + theme.border }}>
                    <h3 style={{ ...styles.activityTitle, color: theme.text }}>Recent Activity</h3>
                    {recentActivity.map((photo) => (
                      <div key={photo.id} style={styles.activityItem}>
                        <img src={photo.imageUrl} alt={photo.title} style={styles.activityThumb} />
                        <div style={styles.activityInfo}>
                          <p style={{ ...styles.activityName, color: theme.text }}>{photo.title}</p>
                          <p style={{ ...styles.activityTime, color: theme.subText }}>Uploaded recently</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "favorites" && (
              <div>
                <h3 style={{ ...styles.sectionTitle, color: theme.text }}>Favorites</h3>
                {loading ? (
                  <div style={styles.skeletonGrid}>
                    {[...Array(6)].map((_, i) => <div key={i} style={{ ...styles.skeleton, background: theme.skeleton }} />)}
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ ...styles.empty, color: theme.subText }}>
                    <div style={styles.emptyIcon}>❤️</div>
                    <p>No favorites yet — click the heart icon on photos!</p>
                  </div>
                ) : (
                  <div style={styles.photoGrid}>
                    {filtered.map((photo, index) => (
                      <div key={photo.id} style={{ ...styles.photoCard, background: theme.cardBg }} onClick={() => openPhoto(photo, index)}>
                        <img src={photo.imageUrl} alt={photo.title} style={styles.photoImg} />
                        <div style={styles.photoOverlay}>
                          <button style={{...styles.favBtn, cursor: "pointer"}} onClick={(e) => { e.stopPropagation(); handleToggleFavorite(photo.id, e); }}>❤️</button>
                        </div>
                        <p style={{ ...styles.photoTitle, color: theme.subText }}>{photo.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "albums" && (
              <div>
                <h3 style={{ ...styles.sectionTitle, color: theme.text }}>Albums</h3>
                {albums.length === 0 ? (
                  <div style={{ ...styles.empty, color: theme.subText }}>
                    <div style={styles.emptyIcon}>📁</div>
                    <p>No albums yet — create one from Admin Panel!</p>
                  </div>
                ) : (
                  <div style={styles.albumGrid}>
                    {albums.map((album) => (
                      <div key={album.id} style={{ ...styles.albumCard, background: theme.cardBg, border: "1px solid " + theme.border }} onClick={() => handleTabChange("album", album.id)}>
                        <div style={styles.albumIcon}>📁</div>
                        <p style={{ ...styles.albumCardName, color: theme.text }}>{album.name}</p>
                        <p style={{ ...styles.albumCardDesc, color: theme.subText }}>{album.description || "No description"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(activeTab === "shared" || activeTab === "trash") && (
              <div style={{ ...styles.empty, color: theme.subText }}>
                <div style={styles.emptyIcon}>{activeTab === "shared" ? "👥" : "🗑️"}</div>
                <p>{activeTab === "shared" ? "No shared photos yet" : "Trash is empty"}</p>
              </div>
            )}

            {activeTab === "album" && (
              <div>
                <h3 style={{ ...styles.sectionTitle, color: theme.text }}>Album Photos</h3>
                {loading ? (
                  <div style={styles.skeletonGrid}>
                    {[...Array(6)].map((_, i) => <div key={i} style={{ ...styles.skeleton, background: theme.skeleton }} />)}
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ ...styles.empty, color: theme.subText }}>
                    <div style={styles.emptyIcon}>📁</div>
                    <p>No photos in this album</p>
                  </div>
                ) : (
                  <div style={styles.photoGrid}>
                    {filtered.map((photo, index) => (
                      <div key={photo.id} style={{ ...styles.photoCard, background: theme.cardBg }} onClick={() => openPhoto(photo, index)}>
                        <img src={photo.imageUrl} alt={photo.title} style={styles.photoImg} />
                        <p style={{ ...styles.photoTitle, color: theme.subText }}>{photo.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {selected && (
        <div style={styles.lightbox} onClick={() => setSelected(null)}>
          <div style={styles.lightboxHeader}>
            <p style={styles.lightboxTitle}>{selected.title}</p>
            <div style={styles.lightboxActions}>
              <button style={styles.favBtnLb} onClick={(e) => handleToggleFavorite(selected.id, e)}>
                {selected.favorite ? "❤️" : "🤍"}
              </button>
              <a href={selected.imageUrl} target="_blank" rel="noreferrer" style={styles.lbDownload} onClick={(e) => e.stopPropagation()}>⬇️ Download</a>
              {role === "ADMIN" && (
                <button style={styles.lbDelete} onClick={(e) => handleDelete(selected.id, e)}>🗑️ Delete</button>
              )}
              <button style={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
            </div>
          </div>
          <button style={styles.prevBtn} onClick={prevPhoto}>❮</button>
          <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            {selected.mediaType === "video" ? (
              <video src={selected.imageUrl} style={styles.lightboxMedia} controls autoPlay />
            ) : (
              <img src={selected.imageUrl} alt={selected.title} style={styles.lightboxMedia} />
            )}
          </div>
          <button style={styles.nextBtn} onClick={nextPhoto}>❯</button>
          <p style={styles.counter}>{selectedIndex + 1} / {filtered.length}</p>
        </div>
      )}

      <style>{`
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes fadeIn{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}
        *::-webkit-scrollbar{width:6px}*::-webkit-scrollbar-thumb{background:#667eea;border-radius:3px}
        input::placeholder{color:rgba(128,128,128,0.6)}
      `}</style>
    </div>
  );
};

const dark = { bg: "#0f0f0f", navbar: "#161616", sidebar: "#161616", cardBg: "#1e1e1e", border: "#2a2a2a", text: "#ffffff", subText: "#888", inputBg: "#252525", activeNav: "#667eea22", skeleton: "#252525" };
const light = { bg: "#f5f7fa", navbar: "#ffffff", sidebar: "#ffffff", cardBg: "#ffffff", border: "#e8eaed", text: "#202124", subText: "#5f6368", inputBg: "#f1f3f4", activeNav: "#e8eeff", skeleton: "#e8eaed" };

const styles = {
  container: { minHeight: "100vh", display: "flex", flexDirection: "column", transition: "all 0.3s" },
  navbar: { padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)" },
  logoSection: { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
  logoIcon: { width: "38px", height: "38px", background: "linear-gradient(135deg,#667eea,#764ba2)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "900", color: "white", flexShrink: 0, lineHeight: "38px", textAlign: "center" },
  logo: { margin: 0, fontSize: "17px", fontWeight: "800", letterSpacing: "-0.3px" },
  logoSub: { color: "#667eea", fontSize: "9px", fontWeight: "700", margin: 0, letterSpacing: "0.5px" },
  searchBox: { flex: 1, maxWidth: "480px", position: "relative", display: "flex", alignItems: "center" },
  searchIcon: { position: "absolute", left: "12px", fontSize: "15px", opacity: 0.5 },
  searchInput: { width: "100%", padding: "9px 16px 9px 38px", borderRadius: "24px", fontSize: "14px", outline: "none", boxSizing: "border-box", transition: "all 0.2s" },
  navRight: { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
  iconBtn: { border: "none", borderRadius: "8px", width: "36px", height: "36px", cursor: "pointer", fontSize: "16px" },
  adminBtn: { padding: "8px 14px", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "13px", whiteSpace: "nowrap" },
  logoutBtn: { padding: "8px 14px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "13px" },
  layout: { display: "flex", flex: 1, overflow: "hidden" },
  sidebar: { width: "220px", flexShrink: 0, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto", height: "calc(100vh - 62px)", position: "sticky", top: "62px" },
  nav: { display: "flex", flexDirection: "column", gap: "2px" },
  navItem: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "500", textAlign: "left", transition: "all 0.2s" },
  navIcon: { fontSize: "16px" },
  sidebarDivider: { height: "1px", background: "rgba(128,128,128,0.15)", margin: "12px 0" },
  storageCard: { borderRadius: "12px", padding: "16px", textAlign: "center" },
  storageTitle: { fontWeight: "700", fontSize: "13px", margin: "0 0 12px", textAlign: "left" },
  storageCircle: { display: "flex", justifyContent: "center", marginBottom: "8px" },
  storageText: { fontSize: "11px", margin: "0 0 8px" },
  storageBar: { height: "4px", background: "rgba(128,128,128,0.2)", borderRadius: "2px", overflow: "hidden" },
  storageBarFill: { height: "100%", background: "linear-gradient(135deg,#667eea,#764ba2)", borderRadius: "2px", transition: "width 0.5s" },
  albumList: { marginTop: "12px" },
  albumsTitle: { fontSize: "11px", fontWeight: "700", letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 8px 4px" },
  albumItem: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "13px", width: "100%", textAlign: "left", background: "transparent", transition: "background 0.2s" },
  albumName: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  main: { flex: 1, overflowY: "auto", padding: "20px 24px" },
  heroCard: { borderRadius: "16px", padding: "28px 32px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  heroText: { flex: 1 },
  heroTitle: { fontSize: "20px", fontWeight: "700", margin: "0 0 6px" },
  heroSub: { fontSize: "14px", margin: "0 0 16px" },
  uploadHeroBtn: { padding: "10px 20px", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "14px" },
  heroIcon: { fontSize: "64px", marginLeft: "24px" },
  contentArea: { flex: 1 },
  twoCol: { display: "flex", gap: "24px" },
  mainCol: { flex: 1 },
  rightCol: { width: "280px", flexShrink: 0 },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  sectionTitle: { fontSize: "18px", fontWeight: "700", margin: 0 },
  skeletonGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "8px" },
  skeleton: { height: "160px", borderRadius: "10px", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" },
  empty: { textAlign: "center", marginTop: "60px" },
  emptyIcon: { fontSize: "48px", marginBottom: "12px" },
  photoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "8px" },
  photoCard: { borderRadius: "10px", overflow: "hidden", cursor: "pointer", position: "relative", animation: "fadeIn 0.3s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  photoImg: { width: "100%", height: "160px", objectFit: "cover", display: "block" },
  photoOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(transparent 50%,rgba(0,0,0,0.6))", opacity: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px" },
  favBtn: { background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "14px" },
  photoActions: { display: "flex", gap: "4px" },
  actionBtn: { background: "rgba(0,0,0,0.5)", borderRadius: "6px", padding: "4px 8px", textDecoration: "none", fontSize: "14px" },
  actionBtnDel: { background: "rgba(255,71,87,0.8)", border: "none", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", fontSize: "14px" },
  photoTitle: { fontSize: "12px", padding: "6px 8px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  activityCard: { borderRadius: "12px", padding: "16px" },
  activityTitle: { fontWeight: "700", fontSize: "15px", margin: "0 0 16px" },
  activityItem: { display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px" },
  activityThumb: { width: "44px", height: "44px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 },
  activityInfo: { flex: 1, overflow: "hidden" },
  activityName: { fontSize: "13px", fontWeight: "600", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  activityTime: { fontSize: "11px", margin: 0 },
  albumGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "12px" },
  albumCard: { borderRadius: "12px", padding: "20px", cursor: "pointer", textAlign: "center", transition: "transform 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  albumIcon: { fontSize: "40px", marginBottom: "10px" },
  albumCardName: { fontWeight: "700", fontSize: "15px", margin: "0 0 4px" },
  albumCardDesc: { fontSize: "12px", margin: 0 },
  lightbox: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.96)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  lightboxHeader: { position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", background: "linear-gradient(rgba(0,0,0,0.8),transparent)", zIndex: 10 },
  lightboxTitle: { color: "white", fontWeight: "600", margin: 0, fontSize: "15px" },
  lightboxActions: { display: "flex", gap: "8px", alignItems: "center" },
  favBtnLb: { background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontSize: "16px" },
  lbDownload: { padding: "8px 14px", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "white", borderRadius: "8px", textDecoration: "none", fontWeight: "600", fontSize: "13px" },
  lbDelete: { padding: "8px 14px", background: "rgba(255,71,87,0.9)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
  closeBtn: { background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontSize: "16px", color: "white" },
  prevBtn: { position: "absolute", left: "16px", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "48px", height: "48px", cursor: "pointer", fontSize: "20px", color: "white", zIndex: 10 },
  nextBtn: { position: "absolute", right: "16px", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "48px", height: "48px", cursor: "pointer", fontSize: "20px", color: "white", zIndex: 10 },
  lightboxContent: { maxWidth: "90vw", maxHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" },
  lightboxMedia: { maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain", borderRadius: "8px" },
  counter: { position: "absolute", bottom: "20px", color: "rgba(255,255,255,0.4)", fontSize: "13px" },
};

export default Home;
