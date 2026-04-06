const BASE = "http://localhost:5001";

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
  if (type)     params.set("type", type);
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

// ── Image upload ──────────────────────────────────────────────────────────────
export const apiUploadImage = async (file) => {
  // convert file to base64
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return request("/items/upload", {
    method: "POST",
    body: JSON.stringify({
      base64,
      mimeType: file.type,
      fileName: file.name,
    }),
  });
};