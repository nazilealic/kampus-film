// App.js - Kampüs Film Kulübü (localStorage ile kalıcı kayıt)
import React, { useEffect, useReducer, useMemo } from "react";
import axios from "axios";

/******************** REDUCER & ACTIONS ********************/
const ACTIONS = {
  FETCH_INIT: "FETCH_INIT",
  FETCH_SUCCESS: "FETCH_SUCCESS",
  FETCH_FAILURE: "FETCH_FAILURE",
  SET_QUERY: "SET_QUERY",
  SET_FILTERS: "SET_FILTERS",
  RESET_FILTERS: "RESET_FILTERS",
  ADD_WATCHLIST: "ADD_WATCHLIST",
  REMOVE_WATCHLIST: "REMOVE_WATCHLIST",
  CLEAR_WATCHLIST: "CLEAR_WATCHLIST",
  SET_PAGE_SIZE: "SET_PAGE_SIZE",
  SET_PAGE: "SET_PAGE",
  SET_SELECTED: "SET_SELECTED",
};

// localStorage'dan başlangıç verisi yükle
const loadInitialWatchlist = () => {
  try {
    const saved = localStorage.getItem('kampus-watchlist');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const initialState = {
  loading: false,
  error: null,
  query: "friends",
  filters: { genre: "All", language: "All", minRating: 0 },
  results: [],
  watchlist: loadInitialWatchlist(),
  pageSize: 6,
  page: 1,
  selectedShow: null,
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.FETCH_INIT:
      return { ...state, loading: true, error: null };
    case ACTIONS.FETCH_SUCCESS:
      return { ...state, loading: false, results: action.payload, error: null, page: 1 };
    case ACTIONS.FETCH_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case ACTIONS.SET_QUERY:
      return { ...state, query: action.payload };
    case ACTIONS.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload }, page: 1 };
    case ACTIONS.RESET_FILTERS:
      return { ...state, filters: { genre: "All", language: "All", minRating: 0 }, page: 1 };
    case ACTIONS.ADD_WATCHLIST:
      if (state.watchlist.find((s) => s.id === action.payload.id)) return state;
      return { ...state, watchlist: [...state.watchlist, action.payload] };
    case ACTIONS.REMOVE_WATCHLIST:
      return { ...state, watchlist: state.watchlist.filter((s) => s.id !== action.payload) };
    case ACTIONS.CLEAR_WATCHLIST:
      return { ...state, watchlist: [] };
    case ACTIONS.SET_PAGE_SIZE:
      return { ...state, pageSize: action.payload, page: 1 };
    case ACTIONS.SET_PAGE:
      return { ...state, page: action.payload };
    case ACTIONS.SET_SELECTED:
      return { ...state, selectedShow: action.payload };
    default:
      return state;
  }
}

/******************** HELPERS ********************/
function uniqueGenres(results) {
  const set = new Set();
  results.forEach((r) => {
    const genres = r.show?.genres || [];
    genres.forEach((g) => set.add(g));
  });
  return ["All", ...Array.from(set).sort()];
}

/******************** STYLES ********************/
const styles = {
  button: {
    background: "linear-gradient(135deg, #ff6b9d 0%, #c94b7d 100%)",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.3s",
    boxShadow: "0 4px 10px rgba(255, 107, 157, 0.3)",
  },
  input: {
    padding: "10px 15px",
    border: "2px solid #ffb3d9",
    borderRadius: "20px",
    outline: "none",
    fontSize: "14px",
    transition: "all 0.3s",
  },
  select: {
    padding: "6px 12px",
    border: "2px solid #ffb3d9",
    borderRadius: "15px",
    outline: "none",
    background: "white",
    cursor: "pointer",
  },
  card: {
    background: "white",
    border: "3px solid #ffb3d9",
    padding: 15,
    borderRadius: 20,
    boxShadow: "0 8px 20px rgba(255, 107, 157, 0.2)",
    transition: "all 0.3s",
  }
};

/******************** COMPONENTS ********************/
function SearchBox({ query, onChange, onSearch }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
      <input
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
        placeholder="🍓 Dizi ara (Enter'a bas)"
        style={{ ...styles.input, flex: 1 }}
      />
      <button onClick={onSearch} style={styles.button}>
        🔍 Ara
      </button>
    </div>
  );
}

function Filters({ genres, filters, onChange, onReset }) {
  return (
    <div style={{ 
      display: "flex", 
      gap: 12, 
      alignItems: "center", 
      flexWrap: "wrap",
      background: "rgba(255, 255, 255, 0.7)",
      padding: 15,
      borderRadius: 20,
      marginBottom: 20,
    }}>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: "600", color: "#c94b7d" }}>
        🎬 Tür:
        <select
          value={filters.genre}
          onChange={(e) => onChange({ genre: e.target.value })}
          style={styles.select}
        >
          {genres.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: "600", color: "#c94b7d" }}>
        🌍 Dil:
        <select
          value={filters.language}
          onChange={(e) => onChange({ language: e.target.value })}
          style={styles.select}
        >
          <option>All</option>
          <option>English</option>
          <option>Turkish</option>
          <option>Spanish</option>
          <option>French</option>
          <option>Japanese</option>
        </select>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: "600", color: "#c94b7d" }}>
        ⭐ Min Puan:
        <input
          type="number"
          min={0}
          max={10}
          step={0.1}
          value={filters.minRating}
          onChange={(e) => onChange({ minRating: Number(e.target.value) })}
          style={{ ...styles.input, width: 80 }}
        />
      </label>
      <button onClick={onReset} style={{ ...styles.button, background: "linear-gradient(135deg, #ffd1e3 0%, #ffb3d9 100%)", color: "#c94b7d" }}>
        🔄 Sıfırla
      </button>
    </div>
  );
}

function TVCard({ show, onAdd, onRemove, isInWatchlist, onShowDetail }) {
  const img = show.image?.medium || show.image?.original || "";
  const rating = show.rating?.average ?? "—";
  const genres = (show.genres || []).join(", ");
  const summary = show.summary ? show.summary.replace(/<[^>]+>/g, "") : "Özet yok";

  return (
    <div
      style={{
        ...styles.card,
        width: 250,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 12px 30px rgba(255, 107, 157, 0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(255, 107, 157, 0.2)";
      }}
    >
      {img ? (
        <img src={img} alt={show.name} style={{ width: "100%", borderRadius: 15, border: "3px solid #ffb3d9" }} />
      ) : (
        <div style={{ 
          height: 300, 
          background: "linear-gradient(135deg, #ffe0f0 0%, #ffd1e3 100%)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          borderRadius: 15,
          fontWeight: "600",
          color: "#c94b7d",
        }}>
          🍓 Resim yok
        </div>
      )}
      <h3 style={{ margin: 0, color: "#c94b7d", fontSize: 18 }}>{show.name}</h3>
      <div style={{ fontSize: 13, color: "#ff6b9d", fontWeight: "500" }}>
        {genres} • {show.language} • ⭐ {rating}
      </div>
      <p style={{ fontSize: 13, color: "#666" }}>{summary.slice(0, 100)}...</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onShowDetail(show)} style={{ ...styles.button, flex: 1, fontSize: 13 }}>
          📖 Detay
        </button>
        {isInWatchlist ? (
          <button onClick={() => onRemove(show.id)} style={{ ...styles.button, background: "linear-gradient(135deg, #ffd1e3 0%, #ffb3d9 100%)", color: "#c94b7d", flex: 1, fontSize: 13 }}>
            ❌ Kaldır
          </button>
        ) : (
          <button onClick={() => onAdd(show)} style={{ ...styles.button, flex: 1, fontSize: 13 }}>
            ➕ Ekle
          </button>
        )}
      </div>
    </div>
  );
}

function TVList({ items, watchlistIds, onAdd, onRemove, onShowDetail }) {
  if (!items.length) return <div style={{ textAlign: "center", color: "#c94b7d", fontSize: 18, padding: 40 }}>🍓 Sonuç bulunamadı.</div>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px,1fr))", gap: 20 }}>
      {items.map((r) => (
        <TVCard
          key={r.show.id}
          show={r.show}
          onAdd={onAdd}
          onRemove={onRemove}
          isInWatchlist={watchlistIds.includes(r.show.id)}
          onShowDetail={onShowDetail}
        />
      ))}
    </div>
  );
}

function WatchlistPanel({ items, onRemove, onClear, onShowDetail }) {
  return (
    <div style={{ 
      width: 300, 
      background: "rgba(255, 255, 255, 0.9)",
      borderRadius: 20,
      padding: 20,
      boxShadow: "0 8px 20px rgba(255, 107, 157, 0.2)",
    }}>
      <h3 style={{ color: "#c94b7d", display: "flex", alignItems: "center", gap: 8 }}>
        🍓 Gösterime Girecekler ({items.length})
      </h3>
      {items.length === 0 && <div style={{ color: "#ff6b9d", fontSize: 14 }}>Henüz eklenmiş dizi yok.</div>}
      {items.map((s) => (
        <div key={s.id} style={{ 
          marginBottom: 12, 
          padding: 12, 
          background: "linear-gradient(135deg, #fff5fa 0%, #ffe0f0 100%)",
          border: "2px solid #ffb3d9",
          borderRadius: 15,
        }}>
          <strong style={{ color: "#c94b7d" }}>{s.name}</strong>
          <div style={{ fontSize: 12, color: "#ff6b9d", marginTop: 4 }}>{s.language}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button onClick={() => onShowDetail(s)} style={{ ...styles.button, fontSize: 12, padding: "6px 12px" }}>
              📖
            </button>
            <button onClick={() => onRemove(s.id)} style={{ ...styles.button, fontSize: 12, padding: "6px 12px", background: "linear-gradient(135deg, #ffd1e3 0%, #ffb3d9 100%)", color: "#c94b7d" }}>
              ❌
            </button>
          </div>
        </div>
      ))}
      {items.length > 0 && (
        <button onClick={onClear} style={{ ...styles.button, width: "100%", marginTop: 12 }}>
          🗑️ Listeyi Temizle
        </button>
      )}
    </div>
  );
}

function Pagination({ totalItems, pageSize, page, onSetPage }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button onClick={() => onSetPage(1)} disabled={currentPage === 1} style={{ ...styles.button, opacity: currentPage === 1 ? 0.5 : 1 }}>
        ⏮️ İlk
      </button>
      <button onClick={() => onSetPage(currentPage - 1)} disabled={currentPage === 1} style={{ ...styles.button, opacity: currentPage === 1 ? 0.5 : 1 }}>
        ◀️ Geri
      </button>
      <div style={{ fontWeight: "600", color: "#c94b7d", padding: "0 10px" }}>
        Sayfa {currentPage}/{totalPages}
      </div>
      <button onClick={() => onSetPage(currentPage + 1)} disabled={currentPage === totalPages} style={{ ...styles.button, opacity: currentPage === totalPages ? 0.5 : 1 }}>
        İleri ▶️
      </button>
      <button onClick={() => onSetPage(totalPages)} disabled={currentPage === totalPages} style={{ ...styles.button, opacity: currentPage === totalPages ? 0.5 : 1 }}>
        Son ⏭️
      </button>
    </div>
  );
}

function ShowDetail({ show, onClose }) {
  const [episodes, setEpisodes] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    axios
      .get(`https://api.tvmaze.com/shows/${show.id}/episodes`)
      .then((res) => setEpisodes(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [show]);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(201, 75, 125, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #fff5fa 100%)",
          borderRadius: 25,
          padding: 30,
          maxWidth: 800,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          border: "4px solid #ffb3d9",
          boxShadow: "0 15px 40px rgba(255, 107, 157, 0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: "#c94b7d", marginBottom: 15 }}>🍓 {show.name}</h2>
        <div dangerouslySetInnerHTML={{ __html: show.summary || "" }} style={{ color: "#666", lineHeight: 1.6 }} />
        <h4 style={{ color: "#ff6b9d", marginTop: 20 }}>📺 Bölümler</h4>
        {loading && <div style={{ color: "#ff6b9d" }}>Yükleniyor...</div>}
        {error && <div style={{ color: "#c94b7d" }}>Hata: {error}</div>}
        {!loading && !error && (
          <ul style={{ maxHeight: 300, overflow: "auto" }}>
            {episodes.map((ep) => (
              <li key={ep.id} style={{ color: "#666", marginBottom: 8 }}>
                <strong style={{ color: "#ff6b9d" }}>{ep.season}x{ep.number}</strong> — {ep.name}
              </li>
            ))}
          </ul>
        )}
        <button onClick={onClose} style={{ ...styles.button, marginTop: 20, width: "100%" }}>
          ❌ Kapat
        </button>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer style={{ 
      textAlign: "center", 
      marginTop: 30, 
      paddingTop: 20,
      color: "#c94b7d",
      fontWeight: "600",
    }}>
      <small>🍓 Hazırlayan: Nazile (Kampüs Film Kulübü Ödevi) 🍓</small>
    </footer>
  );
}

/******************** HOME PAGE ********************/
function Home({ state, dispatch }) {
  const { loading, error, query, filters, results, watchlist, pageSize, page, selectedShow } = state;

  const filtered = useMemo(() => {
    return results.filter((r) => {
      const s = r.show;
      if (filters.genre !== "All" && !(s.genres || []).includes(filters.genre)) return false;
      if (filters.language !== "All" && s.language !== filters.language) return false;
      const rate = s.rating?.average ?? 0;
      if (rate < filters.minRating) return false;
      return true;
    });
  }, [results, filters]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);
  const genres = uniqueGenres(results);
  const watchlistIds = watchlist.map((s) => s.id);

  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ flex: 1 }}>
        <SearchBox
          query={query}
          onChange={(q) => dispatch({ type: ACTIONS.SET_QUERY, payload: q })}
          onSearch={() => fetchByQuery(dispatch, query)}
        />
        <Filters
          genres={genres}
          filters={filters}
          onChange={(f) => dispatch({ type: ACTIONS.SET_FILTERS, payload: f })}
          onReset={() => dispatch({ type: ACTIONS.RESET_FILTERS })}
        />

        {loading && <div style={{ textAlign: "center", color: "#c94b7d", fontSize: 18 }}>🍓 Yükleniyor...</div>}
        {error && (
          <div style={{ textAlign: "center", color: "#c94b7d" }}>
            Hata oluştu: {error} <button onClick={() => fetchByQuery(dispatch, query)} style={styles.button}>Tekrar dene</button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && <div style={{ textAlign: "center", color: "#c94b7d", fontSize: 18 }}>🍓 Sonuç bulunamadı.</div>}
        {!loading && !error && filtered.length > 0 && (
          <>
            <TVList
              items={pageItems}
              watchlistIds={watchlistIds}
              onAdd={(s) => dispatch({ type: ACTIONS.ADD_WATCHLIST, payload: s })}
              onRemove={(id) => dispatch({ type: ACTIONS.REMOVE_WATCHLIST, payload: id })}
              onShowDetail={(s) => dispatch({ type: ACTIONS.SET_SELECTED, payload: s })}
            />
            <div style={{ 
              marginTop: 20, 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.7)",
              padding: 15,
              borderRadius: 20,
            }}>
              <Pagination
                totalItems={totalItems}
                pageSize={pageSize}
                page={currentPage}
                onSetPage={(p) => dispatch({ type: ACTIONS.SET_PAGE, payload: p })}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: "600", color: "#c94b7d" }}>
                📄 Sayfa boyutu:
                <select
                  value={pageSize}
                  onChange={(e) => dispatch({ type: ACTIONS.SET_PAGE_SIZE, payload: Number(e.target.value) })}
                  style={styles.select}
                >
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      <WatchlistPanel
        items={watchlist}
        onRemove={(id) => dispatch({ type: ACTIONS.REMOVE_WATCHLIST, payload: id })}
        onClear={() => dispatch({ type: ACTIONS.CLEAR_WATCHLIST })}
        onShowDetail={(s) => dispatch({ type: ACTIONS.SET_SELECTED, payload: s })}
      />

      {selectedShow && <ShowDetail show={selectedShow} onClose={() => dispatch({ type: ACTIONS.SET_SELECTED, payload: null })} />}
    </div>
  );
}

/******************** FETCH HELPER ********************/
function fetchByQuery(dispatch, query) {
  dispatch({ type: ACTIONS.FETCH_INIT });
  axios
    .get(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`)
    .then((res) => dispatch({ type: ACTIONS.FETCH_SUCCESS, payload: res.data }))
    .catch((err) => dispatch({ type: ACTIONS.FETCH_FAILURE, payload: err.message }));
}

/******************** APP ROOT ********************/
export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Watchlist değiştiğinde localStorage'a kaydet
  useEffect(() => {
    try {
      localStorage.setItem('kampus-watchlist', JSON.stringify(state.watchlist));
      console.log('✅ Kaydedildi! Watchlist:', state.watchlist.length, 'dizi');
    } catch (error) {
      console.error('❌ Kaydetme hatası:', error);
    }
  }, [state.watchlist]);

  useEffect(() => {
    fetchByQuery(dispatch, state.query);
  }, []);

  return (
    <div style={{ 
      minHeight: "100vh",
      background: "linear-gradient(135deg, #ffc0e0 0%, #ffb3d9 25%, #ff9ec8 50%, #ffb3d9 75%, #ffc0e0 100%)",
      padding: 30,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      <header style={{ 
        textAlign: "center", 
        marginBottom: 30,
        background: "rgba(255, 255, 255, 0.9)",
        padding: 30,
        borderRadius: 25,
        boxShadow: "0 8px 20px rgba(255, 107, 157, 0.3)",
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: 42, 
          background: "linear-gradient(135deg, #ff6b9d 0%, #c94b7d 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          🍓 Kampüs Film Kulübü 🍓
        </h1>
        <p style={{ color: "#ff6b9d", margin: "10px 0 0 0", fontSize: 16, fontWeight: "600" }}>
          React + TVMaze API Ödevi
        </p>
      </header>
      <Home state={state} dispatch={dispatch} />
      <Footer />
    </div>
  );
}