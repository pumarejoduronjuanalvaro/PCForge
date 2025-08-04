"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from 'next/image';
import "./motherboard.css";

// Icono Motherboard
const MotherboardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <rect x="7" y="9" width="2" height="2" />
    <rect x="11" y="9" width="2" height="2" />
    <rect x="15" y="9" width="2" height="2" />
    <rect x="7" y="13" width="2" height="2" />
    <rect x="11" y="13" width="2" height="2" />
    <rect x="15" y="13" width="2" height="2" />
  </svg>
);

// Tipos
interface Motherboard {
  id: string;
  name: string;
  manufacturer?: string;
  chipset?: string;
  socket?: string;
  form_factor?: string;
  memory_type?: string;
  memory_slots?: number;
  max_memory?: number;
  release_year?: number;
  tdp?: number;
  best_price?: number;
  best_price_store?: string;
  best_price_url?: string;
  image?: string;
}

// Fetch Motherboards desde la API y mapea al formato Motherboard
const fetchMotherboardsFromApi = async (): Promise<Motherboard[]> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const imgFolder = 'MOTHERBOARD_IMG';
  const res = await fetch(`${apiUrl}/api/motherboards`);
  if (!res.ok) throw new Error("Error al obtener motherboards");
  const data = await res.json();
  return data.map((item: Record<string, unknown>) => {
    const name = typeof item.name === 'string' ? item.name : '';
    const brand = typeof item.manufacturer === 'string' ? item.manufacturer : '';
    const rawData = typeof item.raw_data === 'object' && item.raw_data !== null ? item.raw_data as { price?: number } : undefined;
    const price = item.best_price !== undefined && item.best_price !== null
      ? Number(item.best_price)
      : (rawData?.price ?? 0);
    return {
      id: typeof item.id === 'string' ? item.id : '',
      name,
      manufacturer: brand,
      chipset: item.chipset || '',
      socket: item.socket || '',
      form_factor: item.form_factor || '',
      memory_type: item.memory_type || '',
      memory_slots: item.memory_slots || undefined,
      max_memory: item.max_memory || undefined,
      release_year: item.release_year || undefined,
      tdp: item.tdp || undefined,
      best_price: item.best_price !== undefined && item.best_price !== null ? Number(item.best_price) : undefined,
      best_price_store: item.best_price_store || '',
      best_price_url: item.best_price_url || '',
      image: `${apiUrl}/images/${imgFolder}/${encodeURIComponent(name)}.jpg`,
    };
  });
};

const motherboardFilters = [
  { key: "manufacturer", label: "Marca" },
  { key: "chipset", label: "Chipset" },
  { key: "socket", label: "Socket" },
  { key: "form_factor", label: "Factor de forma" },
  { key: "memory_type", label: "Tipo de Memoria" },
  { key: "memory_slots", label: "Slots de Memoria" },
  { key: "max_memory", label: "Memoria Máxima (GB)" },
  { key: "tdp", label: "TDP (W)" },
  { key: "release_year", label: "Año" },
];

const MotherboardPage: React.FC = () => {
  useEffect(() => {
    document.title = "Motherboards - PC Forge";
  }, []);
  const [motherboards, setMotherboards] = useState<Motherboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const componentsPerPage = 10;
  const [onlyStock, setOnlyStock] = useState(false);
  const [sortBy, setSortBy] = useState("menor_precio");

  useEffect(() => {
    setLoading(true);
    fetchMotherboardsFromApi()
      .then((data) => {
        setMotherboards(data);
        setError(null);
      })
      .catch(() => setError("Error al cargar motherboards"))
      .finally(() => setLoading(false));
  }, []);

  // Obtener valores únicos para cada filtro y marcas
  const filterOptions = useMemo(() => {
    const options: Record<string, unknown[]> = {};
    motherboardFilters.forEach((f) => {
      options[f.key] = Array.from(new Set(motherboards.map((mb) => (mb as Motherboard)[f.key as keyof Motherboard]).filter((v) => v !== undefined && v !== null)));
    });
    return options;
  }, [motherboards]);

  const brands = useMemo(() => {
    return [...new Set(motherboards.map((mb) => mb.manufacturer).filter((b): b is string => typeof b === "string" && b.length > 0))];
  }, [motherboards]);

  // Filtrar motherboards
  const filteredMotherboards = useMemo(() => {
    let result = motherboards.filter((mb) => {
      if (search && typeof mb.name === 'string' && !mb.name.toLowerCase().includes(search.toLowerCase())) return false;
      for (const key in filters) {
        if (!filters[key]) continue;
        const value = mb[key as keyof Motherboard];
        if (typeof value === "number") {
          if (value !== Number(filters[key])) return false;
        } else {
          if (value !== filters[key]) return false;
        }
      }
      if (brandFilter.length > 0 && !brandFilter.includes(mb.manufacturer || "")) return false;
      if (onlyStock && mb.best_price === 0) return false;
      return true;
    });
    if (sortBy === "menor_precio") {
      result = result.sort((a, b) => (a.best_price ?? 0) - (b.best_price ?? 0));
    } else if (sortBy === "mayor_precio") {
      result = result.sort((a, b) => (b.best_price ?? 0) - (a.best_price ?? 0));
    }
    return result;
  }, [motherboards, filters, search, brandFilter, onlyStock, sortBy]);

  // Paginación
  const totalPages = Math.ceil(filteredMotherboards.length / componentsPerPage);
  const paginatedMotherboards = useMemo(() => {
    const start = (currentPage - 1) * componentsPerPage;
    return filteredMotherboards.slice(start, start + componentsPerPage);
  }, [filteredMotherboards, currentPage]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="cpu-page-wrapper">
      <header className="cpu-header">
        <div className="cpu-header-content">
          <MotherboardIcon />
          <h1>Motherboards</h1>
          <span className="cpu-header-count">{filteredMotherboards.length} Productos</span>
        </div>
      </header>

      <div className="cpu-main-layout">
        {/* Sidebar de filtros */}
        <aside className="cpu-sidebar">
          <div className="cpu-sidebar-section">
            <h2 className="cpu-sidebar-title">Ordena por</h2>
            <select className="cpu-sidebar-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="menor_precio">Menor precio</option>
              <option value="mayor_precio">Mayor precio</option>
            </select>
            
          </div>
          <div className="cpu-sidebar-section">
            <h2 className="cpu-sidebar-title">Filtros</h2>
            <div className="cpu-sidebar-filters">
              <button
                className="cpu-sidebar-brand-btn"
                style={{ marginBottom: '0.5rem', background: '#f3f4f6', color: '#1f2937', fontWeight: 600 }}
                onClick={() => {
                  setFilters({});
                  setBrandFilter([]);
                  setOnlyStock(false);
                  setSortBy('menor_precio');
                }}
              >
                Limpiar filtros
              </button>
              {/* Filtro de marca tipo botón */}
              <div className="cpu-sidebar-filter-item">
                <label className="cpu-sidebar-filter-label">Marca</label>
                <div className="cpu-sidebar-brand-btns">
                  {brands.map((brand) => (
                    <button
                      key={brand}
                      className={`cpu-sidebar-brand-btn${brandFilter.includes(brand) ? " cpu-sidebar-brand-btn-selected" : ""}`}
                      onClick={() => setBrandFilter((prev) => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand])}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
              {/* Filtros select */}
              {motherboardFilters.filter(f => f.key !== "manufacturer").map((filter) => (
                <div key={filter.key} className="cpu-sidebar-filter-item">
                  <label className="cpu-sidebar-filter-label">{filter.label}</label>
                  <select
                    value={typeof filters[filter.key] === 'string' || typeof filters[filter.key] === 'number' ? String(filters[filter.key]) : ""}
                    onChange={(e) => setFilters((prev) => ({ ...prev, [filter.key]: e.target.value }))}
                    className="cpu-sidebar-filter-select"
                  >
                    <option value="">Todos</option>
                    {filterOptions[filter.key]?.map((option) => (
                      <option key={String(option)} value={String(option)}>{String(option)}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Listado de motherboards */}
        <main className="cpu-list-section">
          <div className="cpu-search-bar">
            <input
              type="text"
              placeholder="Buscar componentes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="cpu-search-input"
            />
          </div>
          {loading ? (
            <div className="cpu-loading">Cargando motherboards...</div>
          ) : error ? (
            <div className="cpu-error">{error}</div>
          ) : paginatedMotherboards.length === 0 ? (
            <div className="cpu-no-results">No se encontraron motherboards con los filtros seleccionados.</div>
          ) : (
            <div className="cpu-cards-grid">
              {paginatedMotherboards.map((mb) => (
                <div key={mb.id} className="cpu-card">
                  <div className="cpu-card-image">
                    <Image
                      src={mb.image || "/placeholder.svg"}
                      alt={mb.name}
                      width={250}
                      height={200}
                      className="cpu-image"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <div className="cpu-card-content">
                    <h3 className="cpu-card-title">{mb.name}</h3>
                    <p className="cpu-card-brand">{mb.manufacturer}</p>
                    <div className="cpu-card-specs">
                      <span>Socket: {mb.socket || "-"}</span>
                      <span>Chipset: {mb.chipset || "-"}</span>
                    </div>
                  </div>
                  <div className="cpu-card-footer">
                    {mb.best_price && mb.best_price > 0 ? (
                      <span className="cpu-card-price">${mb.best_price.toLocaleString()}</span>
                    ) : (
                      <span className="cpu-card-no-price">Sin precio</span>
                    )}
                    {/* Botón de compra con logo del vendedor */}
                    {mb.best_price_url && (
                      <a
                        href={mb.best_price_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="buy-btn"
                        style={{ display: 'inline-flex', alignItems: 'center', marginTop: 8 }}
                      >
                        {/* Detectar dominio y mostrar logo correspondiente */}
                        {(() => {
                          const url = mb.best_price_url || '';
                          if (url.includes('amazon.')) {
                            return (
                              <img src="/Amazon_logo.svg" alt="Amazon" width={32} height={32} style={{objectFit:'contain', background:'white', borderRadius:4}} />
                            );
                          } else if (url.includes('newegg.')) {
                            return (
                              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <ellipse cx="16" cy="16" rx="16" ry="16" fill="#fff"/>
                                <ellipse cx="20" cy="16" rx="8" ry="6" fill="#F5A623"/>
                                <ellipse cx="16" cy="16" rx="6" ry="5" fill="#0055A4"/>
                                <ellipse cx="12" cy="16" rx="4" ry="3" fill="#fff"/>
                              </svg>
                            );
                          } else if (url.includes('bestbuy.')) {
                            return (
                              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <ellipse cx="16" cy="16" rx="16" ry="16" fill="#fff"/>
                                <rect x="8" y="10" width="16" height="12" rx="2" fill="#FFE000" stroke="#000" strokeWidth="1.5"/>
                                <text x="16" y="20" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#000">BB</text>
                              </svg>
                            );
                          } else {
                            // Logo genérico
                            return (
                              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <ellipse cx="16" cy="16" rx="16" ry="16" fill="#eee"/>
                                <path d="M10 16h12M16 10v12" stroke="#888" strokeWidth="2"/>
                              </svg>
                            );
                          }
                        })()}
                        <span style={{ marginLeft: 6, fontWeight: 500, fontSize: 14 }}>Comprar</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Paginación */}
          {!loading && !error && totalPages > 1 && (
            <div className="cpu-pagination">
              <button
                className="cpu-pagination-btn"
                onClick={() => {
                  if (currentPage !== 1) {
                    setCurrentPage(1);
                  }
                  window.scrollTo({ top: 0 });
                }}
                disabled={currentPage === 1}
              >
                {'<<'}
              </button>
              <button
                className="cpu-pagination-btn"
                onClick={() => {
                  setCurrentPage((p) => {
                    const newPage = Math.max(1, p - 1);
                    if (newPage !== p) {
                      scrollToTop();
                    }
                    return newPage;
                  });
                }}
                disabled={currentPage === 1}
              >
                {'‹'}
              </button>
              <span className="cpu-pagination-info">
                {currentPage} de {totalPages}
              </span>
              <button
                className="cpu-pagination-btn"
                onClick={() => {
                  setCurrentPage((p) => {
                    const newPage = Math.min(totalPages, p + 1);
                    if (newPage !== p) {
                      scrollToTop();
                    }
                    return newPage;
                  });
                }}
                disabled={currentPage === totalPages}
              >
                {'›'}
              </button>
              <button
                className="cpu-pagination-btn"
                onClick={() => {
                  if (currentPage !== totalPages) {
                    setCurrentPage(totalPages);
                  }
                  window.scrollTo({ top: 0 });
                }}
                disabled={currentPage === totalPages}
              >
                {'>>'}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MotherboardPage;
