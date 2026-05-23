import axios from "axios";

const API_URL = "https://photocloud-backend-bw29.onrender.com";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

export const login = (email, password) => api.post("/auth/login", { email, password });
export const getPhotos = () => api.get("/photos/public");
export const getFavorites = () => api.get("/photos/favorites");
export const getPhotosByAlbum = (albumId) => api.get("/photos/album/" + albumId);
export const uploadMultiple = (formData, onProgress) => api.post("/admin/photos/upload-multiple", formData, { headers: { "Content-Type": "multipart/form-data" }, onUploadProgress: (e) => { if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total)); } });
export const toggleFavorite = (id) => api.put("/admin/photos/" + id + "/favorite");
export const deletePhoto = (id) => api.delete("/admin/photos/" + id);
export const getStorageStats = () => api.get("/admin/storage");
export const getAlbums = () => api.get("/albums");
export const createAlbum = (name, description) => api.post("/admin/albums", { name, description });
export const deleteAlbum = (id) => api.delete("/admin/albums/" + id);
export const moveToAlbum = (photoId, albumId) => api.put("/admin/photos/" + photoId + "/album/" + albumId);

export default api;
