const API_URL = import.meta.env.VITE_API_URL || "https://backend-de-peliculas.onrender.com";

export const movieService = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/movies`);
    return await res.json();
  },

  add: async (movieData: any) => {
    const res = await fetch(`${API_URL}/movies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movieData),
    });
    return await res.json();
  },

  update: async (id: string, movieData: any) => {
    const res = await fetch(`${API_URL}/movies/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movieData),
    });
    return await res.json();
  },

  remove: async (id: string) => {
    const res = await fetch(`${API_URL}/movies/${id}`, { method: "DELETE" });
    return await res.json();
  },
};
