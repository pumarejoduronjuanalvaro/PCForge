"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from 'next/image';
import "./storage.css";

// Icono Storage
const StorageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="7" width="18" height="10" rx="2" />
    <rect x="7" y="11" width="2" height="2" />
    <rect x="15" y="11" width="2" height="2" />
    <rect x="11" y="11" width="2" height="2" />
    <path d="M1 17v2a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-2" />
  </svg>
);

// Tipos
interface Storage {
  id: string;
  name: string;
  manufacturer?: string;
  series?: string;
  part_numbers?: string[];
  variant?: string;
  release_year?: number;
  storage_type?: string;
  capacity_tb?: number;
  interface_type?: string;
  form_factor?: string;
  power_consumption_watts?: number;
  best_price?: number;
  best_price_store?: string;
  best_price_url?: string;
  image?: string;
}

// Fetch Storages desde la API y mapea al formato Storage
const fetchStoragesFromApi = async (): Promise<Storage[]> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const imgFolder = 'STORAGE_IMG';
  const res = await fetch(`${apiUrl}/api/storages`);
  if (!res.ok) throw new Error("Error al obtener storages");
  const data = await res.json();
  return data.map((item: Record<string, unknown>) => {
    const name = typeof item.name === 'string' ? item.name : '';
    const brand = typeof item.manufacturer === 'string' ? item.manufacturer : '';
    // const rawData = typeof item.raw_data === 'object' && item.raw_data !== null ? item.raw_data as { price?: number } : undefined; // Removed unused variable
    // const price = item.best_price !== undefined && item.best_price !== null
    //   ? Number(item.best_price)
    //   : (rawData?.price ?? 0); // Removed unused variable
    return {
      id: typeof item.id === 'string' ? item.id : '',
      name,
      manufacturer: brand,
      series: item.series || '',
      part_numbers: item.part_numbers || [],
      variant: item.variant || '',
      release_year: item.release_year || undefined,
      storage_type: item.storage_type || '',
      capacity_tb: item.capacity_tb || undefined,
      interface_type: item.interface_type || '',
      form_factor: item.form_factor || '',
      power_consumption_watts: item.power_consumption_watts || undefined,
      best_price: item.best_price !== undefined && item.best_price !== null ? Number(item.best_price) : undefined,
      best_price_store: item.best_price_store || '',
      best_price_url: item.best_price_url || '',
      image: `${apiUrl}/images/${imgFolder}/${encodeURIComponent(name)}.jpg`,
    };
  });
};

const storageFilters = [
  { key: "manufacturer", label: "Marca" },
  { key: "series", label: "Serie" },
  { key: "storage_type", label: "Tipo" },
  { key: "capacity_tb", label: "Capacidad (GB/TB)" },
  { key: "interface_type", label: "Interfaz" },
  { key: "form_factor", label: "Factor de forma" },
  { key: "power_consumption_watts", label: "Consumo (W)" },
  { key: "release_year", label: "Año" },
];

const StoragePage: React.FC = () => {
  useEffect(() => {
    document.title = "Almacenamiento - PC Forge";
  }, []);
  const [storages, setStorages] = useState<Storage[]>([]);
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
    fetchStoragesFromApi()
      .then((data) => {
        setStorages(data);
        setError(null);
      })
      .catch(() => setError("Error al cargar storages"))
      .finally(() => setLoading(false));
  }, []);

  // Obtener valores únicos para cada filtro y marcas
  const filterOptions = useMemo(() => {
    const options: Record<string, unknown[]> = {};
    storageFilters.forEach((f) => {
      options[f.key] = Array.from(new Set(storages.map((storage) => (storage as Storage)[f.key as keyof Storage]).filter((v) => v !== undefined && v !== null)));
    });
    return options;
  }, [storages]);

  const brands = useMemo(() => {
    return [...new Set(storages.map((storage) => storage.manufacturer).filter((b): b is string => typeof b === "string" && b.length > 0))];
  }, [storages]);

  // Filtrar storages
  const filteredStorages = useMemo(() => {
    let result = storages.filter((storage) => {
      if (search && typeof storage.name === 'string' && !storage.name.toLowerCase().includes(search.toLowerCase())) return false;
      for (const key in filters) {
        if (!filters[key]) continue;
        const value = storage[key as keyof Storage];
        if (typeof value === "number") {
          if (value !== Number(filters[key])) return false;
        } else {
          if (value !== filters[key]) return false;
        }
      }
      if (brandFilter.length > 0 && !brandFilter.includes(storage.manufacturer || "")) return false;
      if (onlyStock && storage.best_price === 0) return false;
      return true;
    });
    if (sortBy === "menor_precio") {
      result = result.sort((a, b) => (a.best_price ?? 0) - (b.best_price ?? 0));
    } else if (sortBy === "mayor_precio") {
      result = result.sort((a, b) => (b.best_price ?? 0) - (a.best_price ?? 0));
    }
    return result;
  }, [storages, filters, search, brandFilter, onlyStock, sortBy]);

  // Paginación
  const totalPages = Math.ceil(filteredStorages.length / componentsPerPage);
  const paginatedStorages = useMemo(() => {
    const start = (currentPage - 1) * componentsPerPage;
    return filteredStorages.slice(start, start + componentsPerPage);
  }, [filteredStorages, currentPage]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="cpu-page-wrapper">
      <header className="cpu-header">
        <div className="cpu-header-content">
          <StorageIcon />
          <h1>Almacenamiento</h1>
          <span className="cpu-header-count">{filteredStorages.length} Productos</span>
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
              {storageFilters.filter(f => f.key !== "manufacturer").map((filter) => (
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

        {/* Listado de storages */}
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
            <div className="cpu-loading">Cargando almacenamiento...</div>
          ) : error ? (
            <div className="cpu-error">{error}</div>
          ) : paginatedStorages.length === 0 ? (
            <div className="cpu-no-results">No se encontró almacenamiento con los filtros seleccionados.</div>
          ) : (
            <div className="cpu-cards-grid">
              {paginatedStorages.map((storage) => (
                <div key={storage.id} className="cpu-card">
                  <div className="cpu-card-image">
                    <Image
                      src={storage.image || "/placeholder.svg"}
                      alt={storage.name}
                      width={250}
                      height={200}
                      className="cpu-image"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <div className="cpu-card-content">
                    <h3 className="cpu-card-title">{storage.name}</h3>
                    <p className="cpu-card-brand">{storage.manufacturer}</p>
                    <div className="cpu-card-specs">
                      <span>Capacidad: {storage.capacity_tb ? `${storage.capacity_tb} TB` : "-"}</span>
                      <span>Tipo: {storage.storage_type || "-"}</span>
                    </div>
                  </div>
                  <div className="cpu-card-footer">
                    {storage.best_price && storage.best_price > 0 ? (
                      <span className="cpu-card-price">${storage.best_price.toLocaleString()}</span>
                    ) : (
                      <span className="cpu-card-no-price">Sin precio</span>
                    )}
                    {/* Botón de compra con logo del vendedor */}
                    {storage.best_price_url && (
                      <a
                        href={storage.best_price_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="buy-btn"
                        style={{ display: 'inline-flex', alignItems: 'center', marginTop: 8 }}
                      >
                        {/* Detectar dominio y mostrar logo correspondiente */}
                        {(() => {
                          const url = storage.best_price_url || '';
                          if (url.includes('amazon.')) {
                            return (
                              <Image src="/Amazon_logo.svg" alt="Amazon" width={32} height={32} style={{objectFit:'contain', background:'white', borderRadius:4}} />
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

export default StoragePage;
