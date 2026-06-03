import { useState, useEffect, useMemo } from "react";
import { CompanyCard } from "./components/CompanyCard";
import { DetailScreen } from "./components/DetailScreen";
import { fetchJobs } from "./api/Jobs";
import { getDday } from "./utils/Helpers";

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

const CAREER_FILTERS = ["전체", "신입", "경력", "채용형 인턴"];
const REGION_FILTERS = [
  { label: "전체", value: "전체", color: "#1F2937" },
  { label: "서울", value: "서울", color: "#4338CA" },
  { label: "경기", value: "경기", color: "#166534" },
  { label: "인천", value: "인천", color: "#9D174D" },
];

function FilterChip({ label, active, onClick, activeColor }) {
  return (
    <button onClick={onClick} style={{
      whiteSpace: "nowrap", padding: "6px 14px", borderRadius: 20,
      fontSize: 13, fontWeight: 500, cursor: "pointer", border: "none",
      background: active ? (activeColor || "#1F2937") : "#F3F4F6",
      color: active ? "#fff" : "#6B7280",
      transition: "all 0.15s",
    }}>
      {label}
    </button>
  );
}

export default function App() {
  const width = useWindowWidth();
  const isPC = width >= 1024;

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pub_job_favorites") || "[]"); }
    catch { return []; }
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [filterCareer, setFilterCareer] = useState("전체");
  const [filterRegion, setFilterRegion] = useState("전체");
  const [filterExtra, setFilterExtra] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("deadline");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => { loadJobs(); }, []);

  async function loadJobs() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobs();
      setJobs(data.data);
      setLastUpdated(new Date(data.updatedAt).toLocaleTimeString("ko-KR"));
    } catch {
      setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try { localStorage.setItem("pub_job_favorites", JSON.stringify(favorites)); }
    catch {}
  }, [favorites]);

  function toggleFavorite(id) {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }

  const filtered = useMemo(() => {
    let list = jobs.filter(j => getDday(j.deadline) >= 0);
    if (showFavoritesOnly) list = list.filter(j => favorites.includes(j.id));
    if (filterCareer === "신입") list = list.filter(j =>
      (j.careerType === "신입" || j.careerType === "신입+경력") && !j.isConversionIntern
    );
    else if (filterCareer === "경력") list = list.filter(j =>
      j.careerType === "경력" || j.careerType === "신입+경력"
    );
    else if (filterCareer === "채용형 인턴") list = list.filter(j => j.isConversionIntern);
    if (filterRegion !== "전체") list = list.filter(j => j.workLocation.some(l => l.includes(filterRegion)));
    if (filterExtra === "urgent") list = list.filter(j => { const d = getDday(j.deadline); return d >= 0 && d <= 7; });
    else if (filterExtra === "new") list = list.filter(j => j.isNew);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(j =>
        j.companyName.toLowerCase().includes(q) ||
        j.title.toLowerCase().includes(q) ||
        j.jobCategory.some(c => c.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      if (sortBy === "deadline") return new Date(a.deadline) - new Date(b.deadline);
      if (sortBy === "new") return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      if (sortBy === "name") return a.companyName.localeCompare(b.companyName, "ko");
      return 0;
    });
  }, [jobs, filterCareer, filterRegion, filterExtra, searchQuery, sortBy, showFavoritesOnly, favorites]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const job of filtered) {
      if (!map.has(job.companyName)) map.set(job.companyName, []);
      map.get(job.companyName).push(job);
    }
    return Array.from(map.values());
  }, [filtered]);

  const totalJobs = jobs.filter(j => getDday(j.deadline) >= 0).length;
  const urgentCount = jobs.filter(j => { const d = getDday(j.deadline); return d >= 0 && d <= 7; }).length;
  const newCount = jobs.filter(j => j.isNew && getDday(j.deadline) >= 0).length;

  const Filters = () => (
    <div>
      {/* 검색 */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: 15 }}>🔍</span>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="기관명 또는 키워드 검색"
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "10px 36px 10px 36px",
            border: "1.5px solid #E5E7EB", borderRadius: 12,
            fontSize: 13, background: "#fff", color: "#111827", outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={e => e.target.style.borderColor = "#6366F1"}
          onBlur={e => e.target.style.borderColor = "#E5E7EB"}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 16,
          }}>×</button>
        )}
      </div>

      {/* 채용 구분 */}
      {isPC && <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", margin: "0 0 8px", letterSpacing: "0.6px", textTransform: "uppercase" }}>채용 구분</p>}
      <div style={{ display: "flex", gap: 6, flexWrap: isPC ? "wrap" : "nowrap", overflowX: isPC ? "visible" : "auto", marginBottom: 12, paddingBottom: 2 }}>
        {CAREER_FILTERS.map(f => (
          <FilterChip key={f} label={f} active={filterCareer === f} onClick={() => setFilterCareer(f)}
            style={isPC ? { width: "100%" } : {}} />
        ))}
      </div>

      {/* 지역 */}
      {isPC && <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", margin: "0 0 8px", letterSpacing: "0.6px", textTransform: "uppercase" }}>지역</p>}
      <div style={{ display: "flex", gap: 6, flexWrap: isPC ? "wrap" : "nowrap", overflowX: isPC ? "visible" : "auto", marginBottom: 12, paddingBottom: 2 }}>
        {REGION_FILTERS.map(({ label, value, color }) => (
          <FilterChip key={value} label={label} active={filterRegion === value} onClick={() => setFilterRegion(value)} activeColor={color} />
        ))}
      </div>

      {/* 빠른 필터 */}
      {isPC && <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", margin: "0 0 8px", letterSpacing: "0.6px", textTransform: "uppercase" }}>빠른 필터</p>}
      <div style={{ display: "flex", gap: 6, flexWrap: isPC ? "wrap" : "nowrap", overflowX: isPC ? "visible" : "auto", marginBottom: isPC ? 16 : 0 }}>
        {[{ key: "urgent", label: "⚡ 마감임박", activeColor: "#DC2626" }, { key: "new", label: "✨ 신규", activeColor: "#2563EB" }].map(({ key, label, activeColor }) => (
          <FilterChip key={key} label={label} active={filterExtra === key}
            onClick={() => setFilterExtra(p => p === key ? null : key)} activeColor={activeColor} />
        ))}
      </div>

      {isPC && (
        <button onClick={() => setShowFavoritesOnly(p => !p)} style={{
          width: "100%", marginTop: 8, padding: "10px 14px", borderRadius: 10, cursor: "pointer",
          background: showFavoritesOnly ? "#FEF2F2" : "#F9FAFB",
          color: showFavoritesOnly ? "#DC2626" : "#6B7280",
          border: "1.5px solid " + (showFavoritesOnly ? "#FECACA" : "#E5E7EB"),
          fontSize: 13, fontWeight: 500, textAlign: "left", transition: "all 0.15s",
        }}>
          {showFavoritesOnly ? "♥ 관심공고만 보기" : "♡ 관심공고 보기"}
        </button>
      )}
    </div>
  );

  const EmptyState = ({ icon, message }) => (
    <div style={{ background: "#fff", borderRadius: 16, padding: "60px 20px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 14, color: "#9CA3AF", margin: 0 }}>{message}</p>
    </div>
  );

  const CardList = () => {
    if (loading) return (
      <div style={{ textAlign: "center", padding: "80px 20px", color: "#9CA3AF" }}>
        <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 1s linear infinite" }}>⏳</div>
        <p style={{ fontSize: 14 }}>공고를 불러오는 중...</p>
      </div>
    );
    if (error) return (
      <div style={{ background: "#fff", borderRadius: 16, padding: "60px 20px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <p style={{ fontSize: 14, color: "#DC2626", marginBottom: 16 }}>{error}</p>
        <button onClick={loadJobs} style={{ padding: "10px 24px", borderRadius: 10, background: "#1F2937", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>다시 시도</button>
      </div>
    );
    if (filtered.length === 0) return <EmptyState icon="🔍" message="조건에 맞는 공고가 없습니다" />;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {grouped.map(group => (
          <CompanyCard key={group[0].companyName} group={group}
            onSelect={setSelectedJob} onToggleFavorite={toggleFavorite} favorites={favorites} />
        ))}
      </div>
    );
  };

  const StatsRow = () => (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontSize: 13, color: "#6B7280" }}>
        <strong style={{ color: "#111827" }}>{totalJobs}</strong>개 공고
      </span>
      <span style={{ color: "#E5E7EB" }}>·</span>
      <span style={{ fontSize: 13, color: "#DC2626" }}>⚡ 마감임박 <strong>{urgentCount}</strong>개</span>
      <span style={{ color: "#E5E7EB" }}>·</span>
      <span style={{ fontSize: 13, color: "#2563EB" }}>✨ 신규 <strong>{newCount}</strong>개</span>
      {lastUpdated && <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 4 }}>{lastUpdated} 기준</span>}
    </div>
  );

  const SortSelect = () => (
    <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
      fontSize: 12, border: "1.5px solid #E5E7EB", borderRadius: 8,
      padding: "6px 10px", background: "#fff", color: "#374151", cursor: "pointer", outline: "none",
    }}>
      <option value="deadline">마감 임박순</option>
      <option value="new">최신 공고순</option>
      <option value="name">기관명순</option>
    </select>
  );

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Pretendard', 'Apple SD Gothic Neo', sans-serif", background: "#F7F6F3", minHeight: "100vh" }}>

      {/* ── PC ── */}
      {isPC && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px" }}>
          {/* 헤더 */}
          <div style={{ padding: "28px 0 24px", borderBottom: "1px solid #E5E7EB", marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: "#111827", letterSpacing: "-0.5px" }}>
                수도권 공공기관 문과직 채용
              </h1>
              <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>서울 · 경기 · 인천 / 경영 · 행정 · 사무 중심</p>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <StatsRow />
              <button onClick={loadJobs} style={{
                fontSize: 12, padding: "8px 16px", borderRadius: 8,
                background: "#fff", color: "#374151", border: "1.5px solid #E5E7EB", cursor: "pointer", fontWeight: 500,
              }}>새로고침</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            {/* 사이드바 */}
            <div style={{
              width: 230, flexShrink: 0,
              background: "#fff", borderRadius: 16,
              padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              position: "sticky", top: 24,
            }}>
              <Filters />
            </div>

            {/* 메인 */}
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 48 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 14, color: "#6B7280" }}>
                  <strong style={{ color: "#111827" }}>{grouped.length}</strong>개 기관 ·{" "}
                  <strong style={{ color: "#111827" }}>{filtered.length}</strong>개 공고
                </span>
                <SortSelect />
              </div>
              <CardList />
            </div>
          </div>

          <div style={{ textAlign: "center", padding: "24px 0 48px" }}>
            <p style={{ fontSize: 11, color: "#D1D5DB", lineHeight: 1.8, margin: 0 }}>
              공공기관/공기업 문과직 채용공고 개인 큐레이션 도구입니다. 지원 전 반드시 원문 공고를 확인하세요.
            </p>
          </div>
        </div>
      )}

      {/* ── 모바일/태블릿 ── */}
      {!isPC && (
        <div style={{ paddingBottom: 48 }}>
          {/* 헤더 */}
          <div style={{ background: "#fff", borderBottom: "1px solid #F3F4F6", padding: "16px 20px 0", position: "sticky", top: 0, zIndex: 50 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 3px", color: "#111827", letterSpacing: "-0.3px" }}>
                  수도권 공공기관 문과직
                </h1>
                <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>서울 · 경기 · 인천 / 행정 · 사무 중심</p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => setShowFavoritesOnly(p => !p)} style={{
                  padding: "5px 11px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 500,
                  background: showFavoritesOnly ? "#FEF2F2" : "#F3F4F6",
                  color: showFavoritesOnly ? "#DC2626" : "#6B7280",
                  border: "1.5px solid " + (showFavoritesOnly ? "#FECACA" : "#E5E7EB"),
                }}>
                  {showFavoritesOnly ? "♥" : "♡"}
                </button>
                <button onClick={loadJobs} style={{
                  padding: "5px 11px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                  background: "#F3F4F6", color: "#6B7280", border: "1.5px solid #E5E7EB", cursor: "pointer",
                }}>↺</button>
              </div>
            </div>

            {/* 통계 */}
            <div style={{ marginBottom: 12 }}>
              <StatsRow />
            </div>

            {/* 필터 */}
            <div style={{ paddingBottom: 12 }}>
              <Filters />
            </div>
          </div>

          {/* 결과 헤더 */}
          <div style={{ padding: "14px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#6B7280" }}>
              <strong style={{ color: "#111827" }}>{grouped.length}</strong>개 기관 ·{" "}
              <strong style={{ color: "#111827" }}>{filtered.length}</strong>개 공고
            </span>
            <SortSelect />
          </div>

          {/* 카드 목록 */}
          <div style={{ padding: "0 16px" }}>
            <CardList />
          </div>

          <div style={{ padding: "28px 20px 0", textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#D1D5DB", lineHeight: 1.8, margin: 0 }}>
              공공기관/공기업 문과직 채용공고 개인 큐레이션 도구입니다.<br />지원 전 반드시 원문 공고를 확인하세요.
            </p>
          </div>
        </div>
      )}

      {selectedJob && (
        <DetailScreen
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onToggleFavorite={toggleFavorite}
          isFavorite={favorites.includes(selectedJob.id)}
        />
      )}
    </div>
  );
}
