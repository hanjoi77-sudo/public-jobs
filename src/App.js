import { useState, useEffect, useMemo } from "react";
import { JobCard } from "./components/JobCard";
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

export default function App() {
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
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
    } catch (e) {
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
    if (filterCareer === "신입") list = list.filter(j => j.careerType === "신입" && !j.isConversionIntern);
    else if (filterCareer === "경력") list = list.filter(j => j.careerType === "경력");
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

  const totalJobs = jobs.filter(j => getDday(j.deadline) >= 0).length;
  const urgentCount = jobs.filter(j => { const d = getDday(j.deadline); return d >= 0 && d <= 7; }).length;
  const newCount = jobs.filter(j => j.isNew && getDday(j.deadline) >= 0).length;

  // ── 필터 UI (공통) ────────────────────────────────────────────────────────
  const FilterSection = () => (
    <div>
      {/* 검색 */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="기관명 또는 직무 키워드 검색"
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "10px 36px 10px 12px",
            border: "0.5px solid #d3d1c7", borderRadius: 9,
            fontSize: 13, background: "#f7f6f3", color: "#1a1a1a", outline: "none",
          }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 16,
          }}>×</button>
        )}
      </div>

      {/* 채용구분 */}
      {isPC && <p style={{ fontSize: 11, fontWeight: 600, color: "#888", margin: "0 0 8px", letterSpacing: "0.5px" }}>채용 구분</p>}
      <div style={{ display: "flex", gap: 6, flexWrap: isPC ? "wrap" : "nowrap", overflowX: isPC ? "visible" : "auto", marginBottom: 10, paddingBottom: 2 }}>
        {["전체", "신입", "경력", "채용형 인턴"].map(f => (
          <button key={f} onClick={() => setFilterCareer(f)} style={{
            whiteSpace: "nowrap", padding: isPC ? "7px 14px" : "5px 12px",
            borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "0.5px solid",
            background: filterCareer === f ? "#1a1a1a" : "#f7f6f3",
            color: filterCareer === f ? "#fff" : "#555",
            borderColor: filterCareer === f ? "#1a1a1a" : "#d3d1c7",
            width: isPC ? "100%" : "auto",
          }}>{f}</button>
        ))}
      </div>

      {/* 지역 */}
      {isPC && <p style={{ fontSize: 11, fontWeight: 600, color: "#888", margin: "0 0 8px", letterSpacing: "0.5px" }}>지역</p>}
      <div style={{ display: "flex", gap: 6, flexWrap: isPC ? "wrap" : "nowrap", overflowX: isPC ? "visible" : "auto", marginBottom: 10, paddingBottom: 2 }}>
        {["전체", "서울", "경기", "인천"].map(f => (
          <button key={f} onClick={() => setFilterRegion(f)} style={{
            whiteSpace: "nowrap", padding: isPC ? "7px 14px" : "4px 11px",
            borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "0.5px solid",
            background: filterRegion === f
              ? (f === "서울" ? "#534ab7" : f === "경기" ? "#3b6d11" : f === "인천" ? "#993556" : "#1a1a1a")
              : "#f7f6f3",
            color: filterRegion === f ? "#fff" : "#555",
            borderColor: filterRegion === f ? "transparent" : "#d3d1c7",
            width: isPC ? "calc(50% - 3px)" : "auto",
          }}>{f}</button>
        ))}
      </div>

      {/* 추가 필터 */}
      {isPC && <p style={{ fontSize: 11, fontWeight: 600, color: "#888", margin: "0 0 8px", letterSpacing: "0.5px" }}>빠른 필터</p>}
      <div style={{ display: "flex", gap: 6, flexWrap: isPC ? "wrap" : "nowrap", overflowX: isPC ? "visible" : "auto", marginBottom: isPC ? 16 : 10 }}>
        {[{ key: "urgent", label: "⚡ 마감임박" }, { key: "new", label: "🆕 새공고" }].map(({ key, label }) => (
          <button key={key} onClick={() => setFilterExtra(p => p === key ? null : key)} style={{
            whiteSpace: "nowrap", padding: isPC ? "7px 14px" : "4px 11px",
            borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "0.5px solid",
            background: filterExtra === key ? (key === "urgent" ? "#fcebeb" : "#e6f1fb") : "#f7f6f3",
            color: filterExtra === key ? (key === "urgent" ? "#a32d2d" : "#185fa5") : "#555",
            borderColor: filterExtra === key ? (key === "urgent" ? "#f7c1c1" : "#b5d4f4") : "#d3d1c7",
            width: isPC ? "100%" : "auto",
          }}>{label}</button>
        ))}
      </div>

      {/* 관심공고 (PC 사이드바) */}
      {isPC && (
        <button onClick={() => setShowFavoritesOnly(p => !p)} style={{
          width: "100%", padding: "10px 14px", borderRadius: 8, cursor: "pointer",
          background: showFavoritesOnly ? "#fcebeb" : "#f7f6f3",
          color: showFavoritesOnly ? "#a32d2d" : "#5f5e5a",
          border: "0.5px solid " + (showFavoritesOnly ? "#f7c1c1" : "#d3d1c7"),
          fontSize: 13, fontWeight: 500, textAlign: "left",
        }}>
          {showFavoritesOnly ? "♥ 관심공고만 보기" : "♡ 관심공고 보기"}
        </button>
      )}
    </div>
  );

  return (
    <div style={{ fontFamily: "'Apple SD Gothic Neo', sans-serif", background: "#f7f6f3", minHeight: "100vh" }}>

      {/* ── PC 레이아웃 ── */}
      {isPC && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
          {/* PC 헤더 */}
          <div style={{ padding: "24px 0 20px", borderBottom: "0.5px solid #e8e6e0", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px", color: "#1a1a1a", letterSpacing: "-0.5px" }}>
                수도권 공공기관 문과직 채용
              </h1>
              <p style={{ fontSize: 13, color: "#888", margin: 0 }}>서울·경기·인천 / 경영·회계·행정 중심</p>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#555" }}>
                <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{totalJobs}</span>개 공고
              </span>
              <span style={{ fontSize: 13, color: "#a32d2d" }}>⚡ 마감임박 <strong>{urgentCount}</strong>개</span>
              <span style={{ fontSize: 13, color: "#185fa5" }}>🆕 신규 <strong>{newCount}</strong>개</span>
              <button onClick={loadJobs} style={{
                fontSize: 12, padding: "7px 14px", borderRadius: 7,
                background: "#f1efe8", color: "#555", border: "0.5px solid #d3d1c7", cursor: "pointer",
              }}>새로고침</button>
            </div>
          </div>

          {/* PC 본문 */}
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            {/* 사이드바 */}
            <div style={{
              width: 220, flexShrink: 0,
              background: "#fff", borderRadius: 14,
              padding: 20, border: "0.5px solid #e8e6e0",
              position: "sticky", top: 24,
            }}>
              <FilterSection />
            </div>

            {/* 메인 콘텐츠 */}
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 40 }}>
              {/* 정렬 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 14, color: "#555" }}>
                  <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{filtered.length}</span>개 공고
                  {lastUpdated && <span style={{ fontSize: 11, color: "#aaa", marginLeft: 8 }}>({lastUpdated} 기준)</span>}
                </span>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
                  fontSize: 12, border: "0.5px solid #d3d1c7", borderRadius: 6,
                  padding: "6px 10px", background: "#fff", color: "#555", cursor: "pointer",
                }}>
                  <option value="deadline">마감 임박순</option>
                  <option value="new">최신 공고순</option>
                  <option value="name">기관명 가나다순</option>
                </select>
              </div>

              {/* 3열 그리드 */}
              {loading ? (
                <div style={{ textAlign: "center", padding: "80px 20px", color: "#888" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                  <p style={{ fontSize: 15 }}>공고를 불러오는 중...</p>
                </div>
              ) : error ? (
                <div style={{ background: "#fff", borderRadius: 14, padding: "60px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 14, color: "#a32d2d" }}>{error}</p>
                  <button onClick={loadJobs} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, background: "#1a1a1a", color: "#fff", border: "none", cursor: "pointer" }}>다시 시도</button>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: 14, padding: "60px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                  <p style={{ fontSize: 14, color: "#888" }}>조건에 맞는 공고가 없습니다</p>
                </div>
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                  gap: 16,
                }}>
                  {filtered.map(job => (
                    <JobCard key={job.id} job={job} onSelect={setSelectedJob}
                      onToggleFavorite={toggleFavorite} isFavorite={favorites.includes(job.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 모바일/태블릿 레이아웃 ── */}
      {!isPC && (
        <div style={{ paddingBottom: 40 }}>
          {/* 모바일 헤더 */}
          <div style={{ background: "#fff", borderBottom: "0.5px solid #e8e6e0", padding: "16px 20px 0", position: "sticky", top: 0, zIndex: 50 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <h1 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 2px", color: "#1a1a1a", letterSpacing: "-0.3px" }}>
                  수도권 공공기관 문과직 채용
                </h1>
                <p style={{ fontSize: 12, color: "#888", margin: 0 }}>서울·경기·인천 / 경영·회계·행정 중심</p>
              </div>
              <button onClick={loadJobs} style={{
                fontSize: 12, padding: "5px 10px", borderRadius: 7,
                background: "#f1efe8", color: "#555", border: "0.5px solid #d3d1c7", cursor: "pointer",
              }}>새로고침</button>
            </div>

            <div style={{ display: "flex", gap: 14, marginBottom: 12, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#555" }}>
                <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{totalJobs}</span>개 공고
              </span>
              <span style={{ fontSize: 12, color: "#a32d2d" }}>⚡ 마감임박 <strong>{urgentCount}</strong>개</span>
              <span style={{ fontSize: 12, color: "#185fa5" }}>🆕 신규 <strong>{newCount}</strong>개</span>
              <button onClick={() => setShowFavoritesOnly(p => !p)} style={{
                marginLeft: "auto", fontSize: 11, fontWeight: 500,
                padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                background: showFavoritesOnly ? "#fcebeb" : "#f1efe8",
                color: showFavoritesOnly ? "#a32d2d" : "#5f5e5a",
                border: "0.5px solid " + (showFavoritesOnly ? "#f7c1c1" : "#d3d1c7"),
              }}>
                {showFavoritesOnly ? "♥ 관심공고만" : "♡ 관심공고"}
              </button>
            </div>

            <FilterSection />
          </div>

          {/* 결과 수 & 정렬 */}
          <div style={{ padding: "12px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#555" }}>
              <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{filtered.length}</span>개 공고
              {lastUpdated && <span style={{ fontSize: 11, color: "#aaa", marginLeft: 8 }}>({lastUpdated} 기준)</span>}
            </span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              fontSize: 12, border: "0.5px solid #d3d1c7", borderRadius: 6,
              padding: "4px 8px", background: "#fff", color: "#555", cursor: "pointer",
            }}>
              <option value="deadline">마감 임박순</option>
              <option value="new">최신 공고순</option>
              <option value="name">기관명 가나다순</option>
            </select>
          </div>

          {/* 카드 목록 */}
          <div style={{
            padding: "0 16px",
            display: isTablet ? "grid" : "flex",
            gridTemplateColumns: isTablet ? "repeat(2, 1fr)" : undefined,
            flexDirection: isTablet ? undefined : "column",
            gap: 10,
          }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#888", gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
                <p style={{ fontSize: 14 }}>공고를 불러오는 중...</p>
              </div>
            ) : error ? (
              <div style={{ background: "#fff", borderRadius: 14, padding: "40px 20px", textAlign: "center", border: "0.5px solid #e8e6e0", gridColumn: "1 / -1" }}>
                <p style={{ fontSize: 14, color: "#a32d2d" }}>{error}</p>
                <button onClick={loadJobs} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, background: "#1a1a1a", color: "#fff", border: "none", cursor: "pointer", fontSize: 13 }}>다시 시도</button>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 14, padding: "40px 20px", textAlign: "center", border: "0.5px solid #e8e6e0", gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
                <p style={{ fontSize: 14, color: "#888", margin: 0 }}>조건에 맞는 공고가 없습니다</p>
              </div>
            ) : (
              filtered.map(job => (
                <JobCard key={job.id} job={job} onSelect={setSelectedJob}
                  onToggleFavorite={toggleFavorite} isFavorite={favorites.includes(job.id)} />
              ))
            )}
          </div>

          {/* 푸터 */}
          <div style={{ padding: "28px 20px 0", textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#aaa", lineHeight: 1.7, margin: 0 }}>
              본 페이지는 공공기관/공기업 문과직 채용공고를 빠르게 확인하기 위한 개인용 큐레이션 도구입니다.<br />
              지원 전 반드시 원문 공고를 확인하세요.
            </p>
          </div>
        </div>
      )}

      {/* PC 푸터 */}
      {isPC && (
        <div style={{ textAlign: "center", padding: "20px 0 40px", maxWidth: 1400, margin: "0 auto" }}>
          <p style={{ fontSize: 11, color: "#aaa", lineHeight: 1.7, margin: 0 }}>
            본 페이지는 공공기관/공기업 문과직 채용공고를 빠르게 확인하기 위한 개인용 큐레이션 도구입니다.
            지원 전 반드시 원문 공고를 확인하세요.
          </p>
        </div>
      )}

      {/* 슬라이드 상세 화면 */}
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