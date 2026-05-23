import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getPhotos, getAlbums, uploadMultiple, deletePhoto, toggleFavorite, createAlbum, deleteAlbum, moveToAlbum, getStorageStats } from "../services/api";

const Admin = () => {
  const [photos, setPhotos] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [storage, setStorage] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumDesc, setNewAlbumDesc] = useState("");
  const [showAlbumForm, setShowAlbumForm] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const fileInputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN") navigate("/home");
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
      setAlbums(albumsRes.data);
      setStorage(storageRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    setFiles(Array.from(e.dataTransfer.files));
  };

  const handleUpload = async () => {
    if (files.length === 0) { setMessage("error:Please select files!"); return; }
    setUploading(true);
    setProgress(0);
    setMessage("");
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      files.forEach((f) => formData.append("titles", f.name.split(".")[0]));
      if (selectedAlbumId) formData.append("albumId", selectedAlbumId);
      await uploadMultiple(formData, setProgress);
      setMessage("success:Uploaded successfully!");
      setFiles([]);
      setSelectedAlbumId("");
      fetchAll();
    } catch (err) {
      setMessage("error:Upload failed!");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName) { setMessage("error:Enter album name!"); return; }
    try {
      await createAlbum(newAlbumName, newAlbumDesc);
      setMessage("success:Album created!");
      setNewAlbumName("");
      setNewAlbumDesc("");
      setShowAlbumForm(false);
      fetchAll();
    } catch (err) {
      setMessage("error:Failed to create album!");
    }
  };

  const handleDeleteAlbum = async (id) => {
    if (!window.confirm("Delete this album?")) return;
    try {
      await deleteAlbum(id);
      setMessage("success:Album deleted!");
      fetchAll();
    } catch (err) {
      setMessage("error:Failed!");
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

  const handleToggleFavorite = async (id, e) => {
    e.stopPropagation();
    try {
      await toggleFavorite(id);
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToAlbum = async (photoId, albumId) => {
    try {
      await moveToAlbum(photoId, albumId);
      setMessage("success:Moved to album!");
      fetchAll();
    } catch (err) {
      setMessage("error:Failed to move!");
    }
  };

  const openPhoto = (photo, index) => {
    setSelected(photo);
    setSelectedIndex(index);
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    const newIndex = (selectedIndex - 1 + photos.length) % photos.length;
    setSelected(photos[newIndex]);
    setSelectedIndex(newIndex);
  };

  const nextPhoto = (e) => {
    e.stopPropagation();
    const newIndex = (selectedIndex + 1) % photos.length;
    setSelected(photos[newIndex]);
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
  }, [selected, selectedIndex, photos]);

  const storageUsedGB = storage ? (storage.storage ? (storage.storage.usage / 1024 / 1024 / 1024).toFixed(2) : 0) : 0;
  const storageLimitGB = 25;
  const storagePercent = Math.min((storageUsedGB / storageLimitGB) * 100, 100).toFixed(1);

  const msgType = message.split(":")[0];
  const msgText = message.split(":")[1];

  const theme = darkMode ? dark : light;

  return (
    <div style={{ ...styles.container, background: theme.bg, color: theme.text }}>
      <div style={{ ...styles.navbar, background: theme.navbar, borderBottom: "1px solid " + theme.border }}>
        <div style={styles.logoSection}>
          <img src="/logo.png" alt="Logo" style={{ height: "42px", objectFit: "contain" }} />
        </div>
        <div style={styles.navTabs}>
          {["upload", "photos", "albums"].map((tab) => (
            <button key={tab} style={{ ...styles.navTab, background: activeTab === tab ? "linear-gradient(135deg,#667eea,#764ba2)" : "transparent", color: activeTab === tab ? "white" : theme.text, border: "1px solid " + (activeTab === tab ? "transparent" : theme.border) }} onClick={() => setActiveTab(tab)}>
              {tab === "upload" ? "Upload" : tab === "photos" ? "All Photos" : "Albums"}
            </button>
          ))}
        </div>
        <div style={styles.navRight}>
          <button style={{ ...styles.iconBtn, background: theme.cardBg, color: theme.text }} onClick={() => {
            const newMode = !darkMode;
            setDarkMode(newMode);
            localStorage.setItem("darkMode", JSON.stringify(newMode));
          }}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button style={styles.galleryBtn} onClick={() => navigate("/home")}>Gallery</button>
          <button style={{ ...styles.logoutBtn, background: theme.cardBg, color: theme.text, border: "1px solid " + theme.border }} onClick={() => { localStorage.clear(); navigate("/"); }}>Logout</button>
        </div>
      </div>

      <div style={styles.content}>
        {message && (
          <div style={{ ...styles.msg, background: msgType === "success" ? "rgba(46,213,115,0.15)" : "rgba(255,71,87,0.15)", border: "1px solid " + (msgType === "success" ? "rgba(46,213,115,0.3)" : "rgba(255,71,87,0.3)"), color: msgType === "success" ? "#2ed573" : "#ff4757" }}>
            {msgText}
          </div>
        )}

        {activeTab === "upload" && (
          <div style={styles.uploadLayout}>
            <div style={styles.uploadMain}>
              <div style={{ ...styles.uploadCard, background: theme.cardBg, border: "1px solid " + theme.border }}>
                <h2 style={{ ...styles.cardTitle, color: theme.text }}>Upload Photos and Videos</h2>
                <div
                  style={{ ...styles.dropZone, borderColor: dragging ? "#667eea" : theme.border, background: dragging ? "rgba(102,126,234,0.08)" : theme.inputBg }}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                >
                  <div style={styles.dropIconBg}><span style={styles.dropPlus}>+</span></div>
                  <p style={{ ...styles.dropTitle, color: theme.text }}>Drop photos and videos here</p>
                  <p style={{ color: theme.subText, fontSize: "13px", margin: "4px 0" }}>or click to browse</p>
                  <p style={{ color: theme.subText, fontSize: "11px", margin: 0 }}>Supports JPG, PNG, GIF, MP4, MOV</p>
                  <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" style={{ display: "none" }} onChange={(e) => setFiles(Array.from(e.target.files))} />
                </div>

                {files.length > 0 && (
                  <div style={styles.previewSection}>
                    <div style={styles.previewHeader}>
                      <p style={{ color: theme.subText, margin: 0, fontSize: "13px" }}>{files.length} file(s) selected</p>
                      <button style={styles.clearBtn} onClick={() => setFiles([])}>Clear all</button>
                    </div>
                    <div style={styles.previewGrid}>
                      {files.map((f, i) => (
                        <div key={i} style={styles.previewItem}>
                          {f.type.startsWith("video") ? (
                            <div style={styles.videoPreview}>🎥</div>
                          ) : (
                            <img src={URL.createObjectURL(f)} alt={f.name} style={styles.previewImg} />
                          )}
                          <p style={{ color: theme.subText, fontSize: "10px", margin: "4px 0 0", textAlign: "center" }}>{f.name.substring(0, 10)}...</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={styles.albumSelect}>
                  <label style={{ color: theme.subText, fontSize: "13px", marginBottom: "6px", display: "block" }}>Upload to Album (optional)</label>
                  <select style={{ ...styles.select, background: theme.inputBg, color: theme.text, border: "1px solid " + theme.border }} value={selectedAlbumId} onChange={(e) => setSelectedAlbumId(e.target.value)}>
                    <option value="">No Album</option>
                    {albums.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                {uploading && (
                  <div style={styles.progressSection}>
                    <div style={{ ...styles.progressBar, background: theme.border }}>
                      <div style={{ ...styles.progressFill, width: progress + "%" }} />
                    </div>
                    <p style={{ color: "#667eea", fontSize: "13px", textAlign: "center", margin: "6px 0 0" }}>{progress}% uploaded</p>
                  </div>
                )}

                <button style={{ ...styles.uploadBtn, opacity: uploading ? 0.7 : 1 }} onClick={handleUpload} disabled={uploading}>
                  {uploading ? "Uploading " + progress + "%" : "Upload " + (files.length > 0 ? files.length + " file(s)" : "Photos")}
                </button>
              </div>
            </div>

            <div style={styles.uploadSide}>
              <div style={{ ...styles.storageCard, background: theme.cardBg, border: "1px solid " + theme.border }}>
                <h3 style={{ ...styles.cardTitle, color: theme.text }}>Storage Overview</h3>
                <div style={styles.storageCircle}>
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke={theme.border} strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="url(#grad)" strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 50}
                      strokeDashoffset={2 * Math.PI * 50 * (1 - storagePercent / 100)}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)" />
                    <defs>
                      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#667eea" />
                        <stop offset="100%" stopColor="#764ba2" />
                      </linearGradient>
                    </defs>
                    <text x="60" y="55" textAnchor="middle" fontSize="20" fontWeight="800" fill={theme.text}>{storagePercent}%</text>
                    <text x="60" y="72" textAnchor="middle" fontSize="10" fill={theme.subText}>used</text>
                  </svg>
                </div>
                <p style={{ color: theme.subText, fontSize: "13px", textAlign: "center", margin: "8px 0 12px" }}>{storageUsedGB} GB of {storageLimitGB} GB used</p>
                <div style={{ ...styles.storageBar, background: theme.border }}>
                  <div style={{ ...styles.storageFill, width: storagePercent + "%" }} />
                </div>
                <div style={styles.storageStats}>
                  <div style={styles.statItem}>
                    <p style={{ color: theme.subText, fontSize: "11px", margin: "0 0 2px" }}>Photos</p>
                    <p style={{ color: theme.text, fontWeight: "700", margin: 0 }}>{photos.filter(p => p.mediaType !== "video").length}</p>
                  </div>
                  <div style={styles.statItem}>
                    <p style={{ color: theme.subText, fontSize: "11px", margin: "0 0 2px" }}>Videos</p>
                    <p style={{ color: theme.text, fontWeight: "700", margin: 0 }}>{photos.filter(p => p.mediaType === "video").length}</p>
                  </div>
                  <div style={styles.statItem}>
                    <p style={{ color: theme.subText, fontSize: "11px", margin: "0 0 2px" }}>Albums</p>
                    <p style={{ color: theme.text, fontWeight: "700", margin: 0 }}>{albums.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "photos" && (
          <div>
            <div style={styles.sectionHeader}>
              <h2 style={{ ...styles.cardTitle, color: theme.text }}>All Media ({photos.length})</h2>
            </div>
            {loading ? (
              <div style={styles.photoGrid}>
                {[...Array(8)].map((_, i) => <div key={i} style={{ ...styles.skeleton, background: theme.skeleton }} />)}
              </div>
            ) : photos.length === 0 ? (
              <div style={{ ...styles.empty, color: theme.subText }}>
                <div style={styles.emptyIcon}>🖼️</div>
                <p>No media uploaded yet!</p>
              </div>
            ) : (
              <div style={styles.photoGrid}>
                {photos.map((photo, index) => (
                  <div key={photo.id} style={{ ...styles.photoCard, background: theme.cardBg }} onClick={() => openPhoto(photo, index)}>
                    {photo.mediaType === "video" ? (
                      <div style={styles.videoThumb}>
                        <video src={photo.imageUrl} style={styles.photoImg} />
                        <div style={styles.playIcon}>▶</div>
                      </div>
                    ) : (
                      <img src={photo.imageUrl} alt={photo.title} style={styles.photoImg} />
                    )}
                    <div style={styles.photoOverlay}>
                      <button style={{...styles.favBtn, cursor: "pointer"}} onClick={(e) => { e.stopPropagation(); handleToggleFavorite(photo.id, e); }}>
                        {photo.favorite ? "❤️" : "🤍"}
                      </button>
                      <div style={styles.photoActions}>
                        <a href={photo.imageUrl} target="_blank" rel="noreferrer" style={styles.actionBtn} onClick={(e) => e.stopPropagation()}>⬇️</a>
                        <button style={styles.actionBtnDel} onClick={(e) => handleDelete(photo.id, e)}>🗑️</button>
                      </div>
                    </div>
                    <div style={{ padding: "8px" }}>
                      <p style={{ color: theme.text, fontSize: "12px", fontWeight: "600", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{photo.title}</p>
                      <select style={{ ...styles.miniSelect, background: theme.inputBg, color: theme.subText, border: "1px solid " + theme.border }} onClick={(e) => e.stopPropagation()} onChange={(e) => { if (e.target.value) { handleMoveToAlbum(photo.id, e.target.value); e.target.value = ""; } }}>
                        <option value="">Move to album...</option>
                        {albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "albums" && (
          <div>
            <div style={styles.sectionHeader}>
              <h2 style={{ ...styles.cardTitle, color: theme.text }}>Albums ({albums.length})</h2>
              <button style={styles.createAlbumBtn} onClick={() => setShowAlbumForm(!showAlbumForm)}>+ New Album</button>
            </div>

            {showAlbumForm && (
              <div style={{ ...styles.albumForm, background: theme.cardBg, border: "1px solid " + theme.border }}>
                <input style={{ ...styles.formInput, background: theme.inputBg, color: theme.text, border: "1px solid " + theme.border }} placeholder="Album name" value={newAlbumName} onChange={(e) => setNewAlbumName(e.target.value)} />
                <input style={{ ...styles.formInput, background: theme.inputBg, color: theme.text, border: "1px solid " + theme.border }} placeholder="Description (optional)" value={newAlbumDesc} onChange={(e) => setNewAlbumDesc(e.target.value)} />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button style={styles.createBtn} onClick={handleCreateAlbum}>Create Album</button>
                  <button style={{ ...styles.cancelBtn, background: theme.inputBg, color: theme.text }} onClick={() => setShowAlbumForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {albums.length === 0 ? (
              <div style={{ ...styles.empty, color: theme.subText }}>
                <div style={styles.emptyIcon}>📁</div>
                <p>No albums yet — create one!</p>
              </div>
            ) : (
              <div style={styles.albumGrid}>
                {albums.map((album) => (
                  <div key={album.id} style={{ ...styles.albumCard, background: theme.cardBg, border: "1px solid " + theme.border }}>
                    <div style={styles.albumIconLg}>📁</div>
                    <p style={{ color: theme.text, fontWeight: "700", fontSize: "15px", margin: "0 0 4px" }}>{album.name}</p>
                    <p style={{ color: theme.subText, fontSize: "12px", margin: "0 0 12px" }}>{album.description || "No description"}</p>
                    <button style={styles.delAlbumBtn} onClick={() => handleDeleteAlbum(album.id)}>Delete Album</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
              <button style={styles.lbDelete} onClick={(e) => handleDelete(selected.id, e)}>🗑️ Delete</button>
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
          <p style={styles.counter}>{selectedIndex + 1} / {photos.length}</p>
        </div>
      )}

      <style>{`
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes fadeIn{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}
        select option{background:#1e1e1e}
        *::-webkit-scrollbar{width:6px}*::-webkit-scrollbar-thumb{background:#667eea;border-radius:3px}
      `}</style>
    </div>
  );
};

const dark = { bg: "#0f0f0f", navbar: "#161616", cardBg: "#1e1e1e", border: "#2a2a2a", text: "#ffffff", subText: "#888", inputBg: "#252525", skeleton: "#252525" };
const light = { bg: "#f5f7fa", navbar: "#ffffff", cardBg: "#ffffff", border: "#e8eaed", text: "#202124", subText: "#5f6368", inputBg: "#f1f3f4", skeleton: "#e8eaed" };

const styles = {
  container: { minHeight: "100vh", transition: "all 0.3s" },
  navbar: { padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)" },
  logoSection: { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
  logoIcon: { width: "38px", height: "38px", background: "linear-gradient(135deg,#667eea,#764ba2)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "900", color: "white", flexShrink: 0, lineHeight: "38px", textAlign: "center" },
  logo: { margin: 0, fontSize: "17px", fontWeight: "800" },
  logoSub: { color: "#667eea", fontSize: "9px", fontWeight: "700", margin: 0, letterSpacing: "0.5px" },
  navTabs: { display: "flex", gap: "8px" },
  navTab: { padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.2s" },
  navRight: { display: "flex", alignItems: "center", gap: "10px" },
  iconBtn: { border: "none", borderRadius: "8px", width: "36px", height: "36px", cursor: "pointer", fontSize: "16px" },
  galleryBtn: { padding: "8px 14px", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "13px" },
  logoutBtn: { padding: "8px 14px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "13px" },
  content: { padding: "24px", maxWidth: "1400px", margin: "0 auto" },
  msg: { padding: "12px 16px", borderRadius: "10px", marginBottom: "20px", fontWeight: "600", fontSize: "14px" },
  uploadLayout: { display: "flex", gap: "24px" },
  uploadMain: { flex: 1 },
  uploadSide: { width: "280px", flexShrink: 0 },
  uploadCard: { borderRadius: "16px", padding: "24px" },
  cardTitle: { fontSize: "18px", fontWeight: "700", margin: "0 0 20px" },
  dropZone: { border: "2px dashed", borderRadius: "14px", padding: "40px 24px", textAlign: "center", cursor: "pointer", transition: "all 0.3s", marginBottom: "20px" },
  dropIconBg: { width: "64px", height: "64px", background: "linear-gradient(135deg,#667eea,#764ba2)", borderRadius: "50%", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" },
  dropPlus: { color: "white", fontSize: "32px", fontWeight: "300", lineHeight: "1" },
  dropTitle: { fontSize: "16px", fontWeight: "600", margin: "0 0 4px" },
  previewSection: { marginBottom: "16px" },
  previewHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  clearBtn: { background: "rgba(255,71,87,0.15)", color: "#ff4757", border: "none", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontSize: "12px" },
  previewGrid: { display: "flex", gap: "8px", flexWrap: "wrap" },
  previewItem: { textAlign: "center" },
  previewImg: { width: "72px", height: "72px", objectFit: "cover", borderRadius: "8px" },
  videoPreview: { width: "72px", height: "72px", background: "rgba(102,126,234,0.2)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" },
  albumSelect: { marginBottom: "16px" },
  select: { width: "100%", padding: "10px 12px", borderRadius: "8px", fontSize: "14px", outline: "none", cursor: "pointer" },
  progressSection: { marginBottom: "14px" },
  progressBar: { height: "6px", borderRadius: "3px", overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(135deg,#667eea,#764ba2)", borderRadius: "3px", transition: "width 0.3s" },
  uploadBtn: { width: "100%", padding: "15px", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "white", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "700", cursor: "pointer", boxShadow: "0 8px 24px rgba(102,126,234,0.3)" },
  storageCard: { borderRadius: "16px", padding: "24px" },
  storageCircle: { display: "flex", justifyContent: "center", margin: "0 0 8px" },
  storageBar: { height: "6px", borderRadius: "3px", overflow: "hidden", marginBottom: "16px" },
  storageFill: { height: "100%", background: "linear-gradient(135deg,#667eea,#764ba2)", borderRadius: "3px" },
  storageStats: { display: "flex", justifyContent: "space-around" },
  statItem: { textAlign: "center" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  photoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "10px" },
  photoCard: { borderRadius: "12px", overflow: "hidden", cursor: "pointer", position: "relative", animation: "fadeIn 0.3s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" },
  photoImg: { width: "100%", height: "160px", objectFit: "cover", display: "block" },
  videoThumb: { position: "relative" },
  playIcon: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(0,0,0,0.7)", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "16px" },
  photoOverlay: { position: "absolute", top: 0, left: 0, right: 0, height: "160px", background: "linear-gradient(transparent 40%,rgba(0,0,0,0.7))", opacity: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px" },
  favBtn: { background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", fontSize: "13px" },
  photoActions: { display: "flex", gap: "4px" },
  actionBtn: { background: "rgba(0,0,0,0.5)", borderRadius: "6px", padding: "4px 8px", textDecoration: "none", fontSize: "13px" },
  actionBtnDel: { background: "rgba(255,71,87,0.8)", border: "none", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", fontSize: "13px" },
  miniSelect: { width: "100%", padding: "4px 6px", borderRadius: "6px", fontSize: "11px", outline: "none", cursor: "pointer" },
  skeleton: { height: "220px", borderRadius: "12px", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" },
  empty: { textAlign: "center", marginTop: "60px" },
  emptyIcon: { fontSize: "48px", marginBottom: "12px" },
  createAlbumBtn: { padding: "10px 18px", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "14px" },
  albumForm: { borderRadius: "12px", padding: "20px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" },
  formInput: { padding: "10px 14px", borderRadius: "8px", fontSize: "14px", outline: "none" },
  createBtn: { padding: "10px 20px", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" },
  cancelBtn: { padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
  albumGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "14px" },
  albumCard: { borderRadius: "14px", padding: "24px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  albumIconLg: { fontSize: "48px", marginBottom: "12px" },
  delAlbumBtn: { padding: "6px 14px", background: "rgba(255,71,87,0.15)", color: "#ff4757", border: "1px solid rgba(255,71,87,0.3)", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
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

export default Admin;
