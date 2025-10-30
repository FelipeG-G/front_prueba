import { useState, useEffect } from "react";
import "../styles/Movies.scss";
import { FaStar, FaSearch, FaFilter, FaPlay, FaHeart, FaRegHeart, FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface PexelsVideo {
  id: number;
  image: string;
  duration: number;
  user: { name: string };
  video_files: Array<{
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }>;
  video_pictures: Array<{ id: number; picture: string }>;
}

interface Movie {
  id: number;
  title: string;
  description: string;
  year: number;
  duration: string;
  rating: number;
  genre: string;
  image: string;
  videoUrl: string;
}

const Movies = () => {
  const API_URL = import.meta.env.VITE_API_URL || "https://back-pruebav1.onrender.com/api/v1";
  const userId = localStorage.getItem("userId") || "defaultUser";

  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  const genres = ["Todos", "Acción", "Drama", "Comedia", "Terror", "Ciencia Ficción"];

  const genreQueries: { [key: string]: string } = {
    "Acción": "action movie",
    "Drama": "drama film",
    "Comedia": "comedy movie",
    "Terror": "horror movie",
    "Ciencia Ficción": "sci-fi movie",
    "Todos": "cinema movie",
  };

  // Verificar si el usuario está logueado
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      setUserName("Usuario"); // Placeholder
    }
  }, []);

  // 🔥 Cargar favoritos desde el backend y las películas desde Pexels
  useEffect(() => {
    const loadData = async () => {
      try {
        const favRes = await fetch(`${API_URL}/favorites/${userId}`);
        const favData = await favRes.json();
        setFavorites(favData);
      } catch (error) {
        console.error("Error cargando favoritos:", error);
      }

      fetchMovies("cinema movie");
    };

    loadData();
  }, []);

  // 🔹 Cargar películas desde la API de Pexels
  const fetchMovies = async (query: string = "cinema movie") => {
    setLoading(true);
    setError("");

    const PEXELS_API_KEY =
      import.meta.env.VITE_PEXELS_API_KEY ||
      "pjVKkdHUWxAeb3NyKhEXk7j6kP1kv85b67dbekeZaWW2MYoLIuBZuCZN";

    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=15`;

    try {
      const response = await fetch(url, {
        headers: { Authorization: PEXELS_API_KEY },
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const data = await response.json();

      if (data.videos && data.videos.length > 0) {
        const transformedMovies: Movie[] = data.videos.map((video: PexelsVideo, index: number) => {
          const hdVideo = video.video_files.find((file) => file.quality === "hd") || video.video_files[0];
          const durationMinutes = Math.floor(video.duration / 60);

          return {
            id: video.id,
            title: `${query.split(" ")[0]} ${index + 1}`,
            description: `Video creado por ${video.user.name}`,
            year: 2024,
            duration: `${durationMinutes} min`,
            rating: parseFloat((4.0 + Math.random() * 1).toFixed(1)),
            genre: getGenreFromQuery(query),
            image: video.video_pictures[0]?.picture || video.image,
            videoUrl: hdVideo?.link || "",
          };
        });

        setMovies(transformedMovies);
        setFilteredMovies(transformedMovies);
      } else {
        setError("No se encontraron videos");
        setMovies([]);
        setFilteredMovies([]);
      }
    } catch (error: any) {
      console.error("Error al cargar videos:", error);
      setError("Error al cargar los videos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const getGenreFromQuery = (query: string): string => {
    for (const [genre, searchQuery] of Object.entries(genreQueries)) {
      if (searchQuery === query) return genre;
    }
    return "Todos";
  };

  // 🔍 Filtrado dinámico
  useEffect(() => {
    filterMovies();
  }, [searchTerm, selectedGenre, movies, favorites, showFavorites]);

  const filterMovies = () => {
    let filtered = showFavorites
      ? favorites.map((fav: any) => ({
          id: fav.pexelsId || fav.movieId,
          title: fav.title,
          description: "Película favorita",
          year: 2024,
          duration: "Desconocido",
          rating: 5,
          genre: "Favorito",
          image: fav.thumbnail,
          videoUrl: "",
        }))
      : movies;

    if (selectedGenre !== "Todos") filtered = filtered.filter((movie) => movie.genre === selectedGenre);

    if (searchTerm)
      filtered = filtered.filter(
        (movie) =>
          movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movie.description.toLowerCase().includes(searchTerm.toLowerCase())
      );

    setFilteredMovies(filtered);
  };

  const handleGenreClick = (genre: string) => {
    setSelectedGenre(genre);
    if (!showFavorites) {
      const query = genreQueries[genre] || "cinema movie";
      fetchMovies(query);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim() && !showFavorites) fetchMovies(searchTerm);
  };

  const handlePlayVideo = (videoUrl: string) => setSelectedVideo(videoUrl);
  const handleCloseVideo = () => setSelectedVideo(null);

  const isFavorite = (movieId: number): boolean => {
    return favorites.some((fav: any) => fav.pexelsId === movieId || fav.movieId === movieId);
  };

  // ❤️ Agregar o eliminar favorito
  const toggleFavorite = async (movie: Movie) => {
    try {
      if (isFavorite(movie.id)) {
        await fetch(`${API_URL}/favorites/${userId}?pexelsId=${movie.id}`, { method: "DELETE" });
        setFavorites(favorites.filter((fav) => fav.pexelsId !== movie.id));
      } else {
        const res = await fetch(`${API_URL}/favorites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            pexelsId: movie.id,
            title: movie.title,
            thumbnail: movie.image,
          }),
        });
        const data = await res.json();
        setFavorites([...favorites, data]);
      }
    } catch (error) {
      console.error("Error al actualizar favorito:", error);
    }
  };

  const toggleShowFavorites = () => {
    setShowFavorites(!showFavorites);
    setSearchTerm("");
    setSelectedGenre("Todos");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/");
  };

  if (loading) {
    return (
      <div className="movies-container">
        <div className="loading">Cargando películas...</div>
      </div>
    );
  }

  return (
    <div className="movies-container">
      {/* HEADER */}
      <header className="movies-header">
        <div className="logo">
          <img src="/logo.png" alt="MovieNest Logo" />
        </div>
        <nav className="nav-menu">
          <a href="/#/homemovies">Home</a>
          <a href="/#/movies">Películas</a>
          <a href="/#/about">Sobre Nosotros</a>
        </nav>
        <div className="auth-buttons">
          <button className={`favorites-btn ${showFavorites ? "active" : ""}`} onClick={toggleShowFavorites}>
            <FaHeart /> Favoritos ({favorites.length})
          </button>

          {isLoggedIn ? (
            <div className="user-menu">
              <button className="user-button" onClick={() => setShowDropdown(!showDropdown)}>
                <div className="user-avatar-small">
                  <FaUser />
                </div>
                <span>{userName}</span>
              </button>
              {showDropdown && (
                <div className="dropdown-menu">
                  <a href="/#/profile" className="dropdown-item">
                    <FaCog /> Editar Perfil
                  </a>
                  <button onClick={handleLogout} className="dropdown-item">
                    <FaSignOutAlt /> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <a href="/#/" className="login-btn">
                Ingreso
              </a>
              <a href="/#/register" className="signup-btn">
                Registro
              </a>
            </>
          )}
        </div>
      </header>

      {/* CONTENIDO */}
      <div className="movies-content">
        <div className="movies-hero">
          <h1>{showFavorites ? "Mis Favoritos" : "Buscar películas"}</h1>
          <p>
            {showFavorites
              ? `Tienes ${favorites.length} película${favorites.length !== 1 ? "s" : ""} en favoritos`
              : "Explora nuestra colección de películas increíbles"}
          </p>
        </div>

        {/* BUSCADOR Y FILTRO */}
        <div className="search-filter-section">
          <form onSubmit={handleSearch} className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder={
                showFavorites ? "Buscar en favoritos..." : "Buscar películas por título o descripción..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {!showFavorites && (
              <button type="submit" className="search-button" disabled={loading}>
                {loading ? "Buscando..." : "Buscar"}
              </button>
            )}
          </form>

          <div className="filter-buttons">
            <button className="filter-toggle">
              <FaFilter /> Género
            </button>
            {genres.map((genre) => (
              <button
                key={genre}
                className={`genre-btn ${selectedGenre === genre ? "active" : ""}`}
                onClick={() => handleGenreClick(genre)}
                disabled={loading}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* MENSAJES DE ERROR */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => fetchMovies("cinema movie")}>Intentar de nuevo</button>
          </div>
        )}

        {/* GRID DE PELÍCULAS */}
        <div className="movies-grid">
          {filteredMovies.map((movie) => (
            <div key={movie.id} className="movie-card">
              <div className="movie-image">
                <img src={movie.image} alt={movie.title} />
                <div className="movie-overlay" onClick={() => handlePlayVideo(movie.videoUrl)}>
                  <button className="play-btn">
                    <FaPlay />
                  </button>
                </div>
                <button
                  className={`favorite-btn ${isFavorite(movie.id) ? "is-favorite" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(movie);
                  }}
                >
                  {isFavorite(movie.id) ? <FaHeart /> : <FaRegHeart />}
                </button>
                <div className="movie-badges">
                  <span className="genre-badge">{movie.genre}</span>
                  <span className="rating-badge">
                    <FaStar /> {movie.rating}
                  </span>
                </div>
              </div>
              <div className="movie-info">
                <h3>{movie.title}</h3>
                <p className="movie-description">{movie.description}</p>
                <div className="movie-meta">
                  <span>{movie.year}</span>
                  <span>{movie.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMovies.length === 0 && !loading && !error && (
          <div className="no-results">
            <p>
              {showFavorites
                ? "No tienes películas en favoritos aún. ¡Agrega algunas!"
                : "No se encontraron películas que coincidan con tus criterios."}
            </p>
          </div>
        )}
      </div>

      {/* MODAL DE VIDEO */}
      {selectedVideo && (
        <div className="video-modal" onClick={handleCloseVideo}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={handleCloseVideo}>
              ✕
            </button>
            <video controls autoPlay src={selectedVideo} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Movies;
