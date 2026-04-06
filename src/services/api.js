const BASE = "https://lostfound-backend-seven.vercel.app";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

// ── Items ─────────────────────────────────────────────────────────────────────
export const apiGetItems = ({ type, category } = {}) => {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (category) params.set("category", category);
  const qs = params.toString();
  return request(`/items${qs ? `?${qs}` : ""}`);
};

export const apiGetItem = (id) => request(`/items/${id}`);

export const apiCreateItem = (item) =>
  request("/items", {
    method: "POST",
    body: JSON.stringify(item),
  });

export const apiResolveItem = (id) =>
  request(`/items/${id}/resolve`, { method: "PATCH" });

// ── Image compression helper ──────────────────────────────────────────────────
/**
 * Compresses and resizes an image File using a Canvas element.
 * Keeps the longest side under `maxDimension` px and compresses to JPEG
 * at the given quality (0–1). Returns a base64 string (without the data: prefix).
 *
 * Typical camera photo: 5–10 MB  →  after compression: ~200–600 KB
 * Well within Vercel's 4.5 MB serverless payload limit.
 */
function compressImage(file, { maxDimension = 1280, quality = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calculate scaled dimensions, preserving aspect ratio
      let { width, height } = img;
      if (width > height) {
        if (width > maxDimension) { height = Math.round(height * maxDimension / width); width = maxDimension; }
      } else {
        if (height > maxDimension) { width = Math.round(width * maxDimension / height); height = maxDimension; }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG and strip the "data:image/jpeg;base64," prefix
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl.split(",")[1]);
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Failed to load image")); };
    img.src = objectUrl;
  });
}

// ── Image upload ──────────────────────────────────────────────────────────────
export const apiUploadImage = async (file) => {
  // Compress the image before encoding — fixes "Failed to fetch" on large
  // camera photos caused by Vercel's 4.5 MB serverless payload limit.
  const base64 = await compressImage(file, { maxDimension: 1280, quality: 0.8 });

  return request("/items/upload", {
    method: "POST",
    body: JSON.stringify({
      base64,
      mimeType: "image/jpeg",   // canvas always outputs JPEG here
      fileName: file.name.replace(/\.[^.]+$/, ".jpg"), // update extension
    }),
  });
};