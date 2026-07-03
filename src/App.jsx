import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Nyora } from 'nyora-sdk';
import { createMangaViewer } from '@yui540/comimi';
import './App.css';

function App() {
  const [mangaList, setMangaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  
  // State buat baca
  const [selectedManga, setSelectedManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [pageUrls, setPageUrls] = useState([]);
  const [isReading, setIsReading] = useState(false);
  const [loadingPages, setLoadingPages] = useState(false);
  const viewerRef = useRef(null);
  const viewerInstanceRef = useRef(null);

  const genres = [
    { value: '', label: 'all genres' },
    { value: 'Action', label: 'action' },
    { value: 'Adventure', label: 'adventure' },
    { value: 'Comedy', label: 'comedy' },
    { value: 'Drama', label: 'drama' },
    { value: 'Fantasy', label: 'fantasy' },
    { value: 'Horror', label: 'horror' },
    { value: 'Mystery', label: 'mystery' },
    { value: 'Romance', label: 'romance' },
    { value: 'Sci-Fi', label: 'sci-fi' },
    { value: 'Slice of Life', label: 'slice of life' },
    { value: 'Sports', label: 'sports' },
    { value: 'Supernatural', label: 'supernatural' },
    { value: 'Thriller', label: 'thriller' },
  ];

  const sortOptions = [
    { value: 'popularity', label: 'most popular' },
    { value: 'score', label: 'top rated' },
    { value: 'favorites', label: 'most favorited' },
    { value: 'members', label: 'most members' },
    { value: 'title', label: 'title a-z' },
  ];

  // Fetch manga dari Jikan API (tetap pake ini buat catalog)
  const fetchManga = useCallback(async (page = 1) => {
    setLoading(true);
    let url = `https://api.jikan.moe/v4/manga?limit=24&page=${page}`;
    if (searchTerm.trim()) url += `&q=${encodeURIComponent(searchTerm.trim())}`;
    if (selectedGenre) url += `&genres=${encodeURIComponent(selectedGenre)}`;
    if (sortBy === 'popularity') url += '&order_by=popularity&sort=desc';
    else if (sortBy === 'score') url += '&order_by=score&sort=desc';
    else if (sortBy === 'favorites') url += '&order_by=favorites&sort=desc';
    else if (sortBy === 'members') url += '&order_by=members&sort=desc';
    else if (sortBy === 'title') url += '&order_by=title&sort=asc';

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('failed to fetch');
      const data = await res.json();
      setMangaList(data.data || []);
      setTotalPages(data.pagination?.last_visible_page || 1);
    } catch (err) {
      console.warn('jikan error:', err);
      setMangaList([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedGenre, sortBy]);

  useEffect(() => {
    fetchManga(currentPage);
  }, [fetchManga, currentPage]);

  // Cleanup viewer saat unmount
  useEffect(() => {
    return () => {
      if (viewerInstanceRef.current) {
        try {
          viewerInstanceRef.current.destroy();
        } catch (e) {
          console.warn('viewer destroy error:', e);
        }
      }
    };
  }, []);

  // Handler buka manga (ambil chapters pake Nyora)
  const handleOpenManga = async (manga) => {
    setSelectedManga(manga);
    setIsReading(true);
    setLoadingPages(true);
    setChapters([]);
    setSelectedChapter(null);
    setPageUrls([]);

    const client = new Nyora();
    try {
      const source = client.sources.find('mangadex');
      const searchResults = await client.manga.search(source.id, { query: manga.title });
      
      if (searchResults.length === 0) {
        alert('Manga not found on MangaDex');
        setIsReading(false);
        setLoadingPages(false);
        return;
      }

      const mangaId = searchResults[0].url;
      const details = await client.manga.details(source.id, mangaId);
      
      const chapterList = details.chapters || [];
      setChapters(chapterList);
      
      if (chapterList.length > 0) {
        setSelectedChapter(chapterList[0]);
        await loadChapterPages(client, source.id, chapterList[0].url);
      } else {
        alert('No chapters found');
        setIsReading(false);
        setLoadingPages(false);
      }
    } catch (error) {
      console.error('Error fetching manga:', error);
      alert('Failed to load manga: ' + error.message);
      setIsReading(false);
      setLoadingPages(false);
    } finally {
      try { client.close(); } catch (e) {}
    }
  };

  // Load halaman chapter pake Nyora
  const loadChapterPages = async (client, sourceId, chapterUrl) => {
    setLoadingPages(true);
    try {
      const pages = await client.manga.pages(sourceId, chapterUrl);
      const urls = pages.map(p => p.url);
      setPageUrls(urls);
      
      setTimeout(() => {
        if (viewerRef.current && urls.length > 0) {
          if (viewerInstanceRef.current) {
            try {
              viewerInstanceRef.current.destroy();
            } catch (e) {}
          }
          
          const pagesData = urls.map((url, index) => ({
            id: `page-${index}`,
            type: 'image',
            src: url,
          }));

          try {
            viewerInstanceRef.current = createMangaViewer(viewerRef.current, {
              manga: {
                id: selectedManga?.mal_id?.toString() || 'manga',
                title: selectedManga?.title || 'Manga',
                pages: pagesData,
              },
              settings: {
                backgroundColor: '#1f1712',
                direction: 'ltr',
              },
            });
          } catch (e) {
            console.error('Viewer creation error:', e);
          }
        }
      }, 200);
    } catch (error) {
      console.error('Error loading pages:', error);
      alert('Failed to load pages: ' + error.message);
    } finally {
      setLoadingPages(false);
    }
  };

  // Ganti chapter
  const handleChapterChange = async (chapter) => {
    setSelectedChapter(chapter);
    setLoadingPages(true);
    
    const client = new Nyora();
    try {
      const source = client.sources.find('mangadex');
      await loadChapterPages(client, source.id, chapter.url);
    } catch (error) {
      console.error('Error changing chapter:', error);
    } finally {
      try { client.close(); } catch (e) {}
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchTerm(inputValue.trim());
      setCurrentPage(1);
    } else {
      setSearchTerm('');
      setCurrentPage(1);
    }
  };

  const handleGenreChange = (e) => {
    setSelectedGenre(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setIsReading(false);
    setSelectedManga(null);
    setChapters([]);
    setSelectedChapter(null);
    setPageUrls([]);
    if (viewerInstanceRef.current) {
      try {
        viewerInstanceRef.current.destroy();
      } catch (e) {}
      viewerInstanceRef.current = null;
    }
  };

  // RENDER READER
  if (isReading) {
    return (
      <div className="app">
        <header className="header">
          <div className="site-name">sirkel-<span>wibu</span></div>
          <div className="header-sub">reading mode</div>
        </header>

        <div className="reader-controls">
          <button className="back-btn" onClick={handleBack}>← back</button>
          <span className="reader-title">{selectedManga?.title || 'Manga'}</span>
          <select 
            className="chapter-select"
            value={selectedChapter?.url || ''}
            onChange={(e) => {
              const chapter = chapters.find(c => c.url === e.target.value);
              if (chapter) handleChapterChange(chapter);
            }}
            disabled={loadingPages || chapters.length === 0}
          >
            {chapters.length === 0 ? (
              <option value="">no chapters</option>
            ) : (
              chapters.map((ch, idx) => (
                <option key={idx} value={ch.url}>
                  {ch.title || `Chapter ${ch.number || idx + 1}`}
                </option>
              ))
            )}
          </select>
        </div>

        {loadingPages ? (
          <div className="loading-pages">
            <div className="spinner"></div>
            <p>loading pages...</p>
          </div>
        ) : pageUrls.length === 0 ? (
          <div className="loading-pages">
            <p>no pages available</p>
          </div>
        ) : (
          <div ref={viewerRef} className="reader-container" />
        )}
      </div>
    );
  }

  // RENDER CATALOG
  return (
    <div className="app">
      <header className="header">
        <div className="site-name">sirkel-<span>wibu</span></div>
        <div className="header-sub">manga archive · chill</div>
      </header>

      <div className="controls-section">
        <form className="search-wrapper" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="cari manga ... (ex: one piece, solo leveling)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="search-btn">cari</button>
        </form>

        <div className="filters-wrapper">
          <div className="filter-group">
            <label className="filter-label">genre</label>
            <select className="filter-select" value={selectedGenre} onChange={handleGenreChange}>
              {genres.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">sort by</label>
            <select className="filter-select" value={sortBy} onChange={handleSortChange}>
              {sortOptions.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <button className="reset-btn" onClick={() => {
            setSearchTerm('');
            setInputValue('');
            setSelectedGenre('');
            setSortBy('popularity');
            setCurrentPage(1);
          }}>
            reset all
          </button>
        </div>
      </div>

      {!loading && (
        <div className="results-info">
          {mangaList.length > 0 ? (
            <span>showing {mangaList.length} manga · page {currentPage} of {totalPages}</span>
          ) : (
            <span>no manga found ... try another title</span>
          )}
        </div>
      )}

      {loading ? (
        <div className="manga-grid">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="loading-placeholder" />
          ))}
        </div>
      ) : (
        <>
          <div className="manga-grid">
            {mangaList.length === 0 ? (
              <div className="empty-state">
                <p>no manga found ... try another title</p>
                <p className="empty-hint">check your spelling or try a different genre</p>
              </div>
            ) : (
              mangaList.map((item) => (
                <div key={item.mal_id} className="manga-card" onClick={() => handleOpenManga(item)}>
                  <img
                    className="card-cover"
                    src={item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || ''}
                    alt={item.title || 'manga cover'}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%233d2c21'/%3E%3Ctext x='20' y='160' fill='%238a6f5b' font-family='sans-serif' font-size='16'%3Eno cover%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="card-body">
                    <div className="card-title">{item.title || 'untitled'}</div>
                    <div className="card-meta">
                      <span className="card-score">{item.score ? `★ ${item.score.toFixed(1)}` : '—'}</span>
                      <span>{item.published?.prop?.from?.year || item.published?.from?.slice(0, 4) || ''}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && mangaList.length > 0 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                ← prev
              </button>
              <div className="page-numbers">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button key={pageNum} className={`page-num ${currentPage === pageNum ? 'active' : ''}`} onClick={() => handlePageChange(pageNum)}>
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span className="page-dots">…</span>
                )}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <button className="page-num" onClick={() => handlePageChange(totalPages)}>
                    {totalPages}
                  </button>
                )}
              </div>
              <button className="page-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                next →
              </button>
            </div>
          )}
        </>
      )}

      <footer className="footer">
        <span>sirkel-wibu · 2026</span>
        <span>data from jikan api · reader by nyora + comimi</span>
      </footer>
    </div>
  );
}

export default App;
