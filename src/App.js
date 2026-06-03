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
  const [filterSource, setFilterSource] = useState("전체");
  const [filterExtra, setFilterExtra] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
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
    if (filterSource !== "전체") list = list.filter(j => j.source === filterSource);
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
  }, [jobs, filterCareer, filterRegion, filterSource, filterExtra, searchQuery, sortBy, showFavoritesOnly, favorites]);

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

  const activeFilterCount = [
    filterCareer !== "전체",
    filterRegion !== "전체",
    filterSource !== "전체",
    filterExtra !== null,
    showFavoritesOnly,
  ].filter(Boolean).length;

  const SOURCE_COLORS = { "잡알리오": "#1971C2", "사람인": "#E8590C", "자소설닷컴": "#0D9488" };
  const REGION_COLORS = { "서울": "#4338CA", "경기": "#166534", "인천": "#9D174D" };

  const activeChips = [
    filterCareer !== "전체" && { label: filterCareer, onRemove: () => setFilterCareer("전체"), color: "#1F2937" },
    filterRegion !== "전체" && { label: filterRegion, onRemove: () => setFilterRegion("전체"), color: REGION_COLORS[filterRegion] },
    filterSource !== "전체" && { label: filterSource, onRemove: () => setFilterSource("전체"), color: SOURCE_COLORS[filterSource] },
    filterExtra === "urgent" && { label: "⚡ 마감임박", onRemove: () => setFilterExtra(null), color: "#DC2626" },
    filterExtra === "new" && { label: "✨ 신규", onRemove: () => setFilterExtra(null), color: "#2563EB" },
    showFavoritesOnly && { label: "♥ 관심공고", onRemove: () => setShowFavoritesOnly(false), color: "#DC2626" },
  ].filter(Boolean);

  const Filters = ({ sheet = false }) => {
    const wrap = isPC || sheet;
    const label = (text) => wrap && (
      <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", margin: "0 0 8px", letterSpacing: "0.6px", textTransform: "uppercase" }}>{text}</p>
    );
    const row = (children, mb = 12) => (
      <div style={{ display: "flex", gap: 6, flexWrap: wrap ? "wrap" : "nowrap", overflowX: wrap ? "visible" : "auto", marginBottom: mb, paddingBottom: 2 }}>
        {children}
      </div>
    );
    return (
      <div>
        {/* 검색 — PC + 시트에만 표시 */}
        {wrap && (
          <div style={{ position: "relative", marginBottom: 16 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: 15 }}>🔍</span>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="기관명 또는 키워드 검색"
              style={{
                width: "100%", boxSizing: "border-box", padding: "10px 36px 10px 36px",
                border: "1.5px solid #E5E7EB", borderRadius: 12, fontSize: 13,
                background: "#fff", color: "#111827", outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = "#6366F1"}
              onBlur={e => e.target.style.borderColor = "#E5E7EB"}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 16 }}>×</button>
            )}
          </div>
        )}

        {label("채용 구분")}
        {row(CAREER_FILTERS.map(f => (
          <FilterChip key={f} label={f} active={filterCareer === f} onClick={() => setFilterCareer(f)} />
        )))}

        {label("지역")}
        {row(REGION_FILTERS.map(({ label: l, value, color }) => (
          <FilterChip key={value} label={l} active={filterRegion === value} onClick={() => setFilterRegion(value)} activeColor={color} />
        )))}

        {label("출처")}
        {row([
          { label: "전체", value: "전체", color: "#1F2937" },
          { label: "잡알리오", value: "잡알리오", color: "#1971C2" },
          { label: "사람인", value: "사람인", color: "#E8590C" },
          { label: "자소설닷컴", value: "자소설닷컴", color: "#0D9488" },
        ].map(({ label: l, value, color }) => (
          <FilterChip key={value} label={l} active={filterSource === value} onClick={() => setFilterSource(value)} activeColor={color} />
        )))}

        {label("빠른 필터")}
        {row([
          { key: "urgent", label: "⚡ 마감임박", activeColor: "#DC2626" },
          { key: "new", label: "✨ 신규", activeColor: "#2563EB" },
        ].map(({ key, label: l, activeColor }) => (
          <FilterChip key={key} label={l} active={filterExtra === key}
            onClick={() => setFilterExtra(p => p === key ? null : key)} activeColor={activeColor} />
        )), wrap ? 16 : 0)}

        {wrap && (
          <button onClick={() => setShowFavoritesOnly(p => !p)} style={{
            width: "100%", marginTop: 4, padding: "10px 14px", borderRadius: 10, cursor: "pointer",
            background: showFavoritesOnly ? "#FEF2F2" : "#F9FAFB",
            color: showFavoritesOnly ? "#DC2626" : "#6B7280",
            border: "1.5px solid " + (showFavoritesOnly ? "#FECACA" : "#E5E7EB"),
            fontSize: 13, fontWeight: 500, textAlign: "left",
          }}>
            {showFavoritesOnly ? "♥ 관심공고만 보기" : "♡ 관심공고 보기"}
          </button>
        )}
      </div>
    );
  };

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
        <div style={{ paddingBottom: 60 }}>
          {/* 슬림 헤더 */}
          <div style={{ background: "#fff", borderBottom: "1px solid #F3F4F6", position: "sticky", top: 0, zIndex: 50 }}>
            {/* 타이틀 + 버튼 */}
            <div style={{ padding: "14px 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h1 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 2px", color: "#111827", letterSpacing: "-0.3px" }}>
                  수도권 공공기관 문과직
                </h1>
                <StatsRow />
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                <button onClick={() => setShowFavoritesOnly(p => !p)} style={{
                  width: 34, height: 34, borderRadius: 10, cursor: "pointer", fontSize: 15,
                  background: showFavoritesOnly ? "#FEF2F2" : "#F3F4F6",
                  color: showFavoritesOnly ? "#DC2626" : "#6B7280",
                  border: "1.5px solid " + (showFavoritesOnly ? "#FECACA" : "#E5E7EB"),
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {showFavoritesOnly ? "♥" : "♡"}
                </button>
                <button onClick={loadJobs} style={{
                  width: 34, height: 34, borderRadius: 10, fontSize: 15, cursor: "pointer",
                  background: "#F3F4F6", color: "#6B7280", border: "1.5px solid #E5E7EB",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>↺</button>
              </div>
            </div>

            {/* 검색 + 필터 버튼 */}
            <div style={{ padding: "0 16px 10px", display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: 13 }}>🔍</span>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="기관명 또는 키워드"
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "9px 28px 9px 30px",
                    border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 13,
                    background: "#F9FAFB", color: "#111827", outline: "none",
                  }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 15 }}>×</button>
                )}
              </div>
              <button onClick={() => setFilterOpen(true)} style={{
                flexShrink: 0, padding: "9px 14px", borderRadius: 10, cursor: "pointer",
                fontSize: 13, fontWeight: 600,
                background: activeFilterCount > 0 ? "#1F2937" : "#F3F4F6",
                color: activeFilterCount > 0 ? "#fff" : "#374151",
                border: "1.5px solid " + (activeFilterCount > 0 ? "#1F2937" : "#E5E7EB"),
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <span>필터</span>
                {activeFilterCount > 0 && (
                  <span style={{ background: "#fff", color: "#1F2937", borderRadius: 10, fontSize: 11, fontWeight: 700, padding: "1px 6px" }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* 활성 필터 칩 */}
            {activeChips.length > 0 && (
              <div style={{ display: "flex", gap: 6, padding: "0 16px 10px", overflowX: "auto" }}>
                {activeChips.map(chip => (
                  <button key={chip.label} onClick={chip.onRemove} style={{
                    flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
                    padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: chip.color + "18", color: chip.color,
                    border: "1px solid " + chip.color + "44", cursor: "pointer",
                  }}>
                    {chip.label} <span style={{ fontSize: 14, lineHeight: 1 }}>×</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 결과 수 + 정렬 */}
          <div style={{ padding: "12px 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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

      {/* 모바일 바텀시트 필터 */}
      {!isPC && filterOpen && (
        <>
          <div onClick={() => setFilterOpen(false)} style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200,
          }} />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201,
            background: "#fff", borderRadius: "20px 20px 0 0",
            maxHeight: "88vh", overflowY: "auto",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
          }}>
            {/* 핸들 + 헤더 */}
            <div style={{ padding: "12px 20px 0", position: "sticky", top: 0, background: "#fff", borderBottom: "1px solid #F3F4F6", zIndex: 1 }}>
              <div style={{ width: 36, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 14px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>필터</span>
                <button onClick={() => {
                  setFilterCareer("전체"); setFilterRegion("전체");
                  setFilterSource("전체"); setFilterExtra(null); setShowFavoritesOnly(false);
                }} style={{ fontSize: 13, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
                  초기화
                </button>
              </div>
            </div>

            {/* 필터 내용 */}
            <div style={{ padding: "16px 20px 0" }}>
              <Filters sheet />
            </div>

            {/* 적용 버튼 */}
            <div style={{ padding: "16px 20px 32px", position: "sticky", bottom: 0, background: "#fff", borderTop: "1px solid #F3F4F6" }}>
              <button onClick={() => setFilterOpen(false)} style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none", cursor: "pointer",
                background: "#111827", color: "#fff", fontSize: 15, fontWeight: 700,
              }}>
                공고 {filtered.length}개 보기
              </button>
            </div>
          </div>
        </>
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
