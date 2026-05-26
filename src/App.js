import { useState, useEffect, useMemo } from "react";

const API_URL = "https://job-backend-brjv.onrender.com/api/jobs";

// ── Utilities ──────────────────────────────────────────────────────────────
function getDday(deadline) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(deadline);
  end.setHours(0, 0, 0, 0);
  return Math.round((end - today) / (1000 * 60 * 60 * 24));
}

function getDdayLabel(deadline) {
  const d = getDday(deadline);
  if (d < 0) return { label: "마감", type: "closed" };
  if (d === 0) return { label: "오늘마감", type: "urgent" };
  if (d <= 3) return { label: `D-${d}`, type: "urgent" };
  if (d <= 7) return { label: `D-${d}`, type: "soon" };
  return { label: `D-${d}`, type: "normal" };
}

function formatDeadline(date) {
  return date ? date.replace(/-/g, ".") : "";
}

function copyToClipboard(job) {
  const dday = getDdayLabel(job.deadline);
  const text = `[${job.companyName}]
${job.title}
직무: ${job.jobCategory.join("/")}
근무지: ${job.workLocation.join(", ")}
마감: ${formatDeadline(job.deadline)} (${dday.label})
링크: ${job.sourceUrl}`;
  navigator.clipboard?.writeText(text).catch(() => {});
}

// ── Sub-components ─────────────────────────────────────────────────────────
function Badge({ children, variant = "default" }) {
  const styles = {
    default: { background: "#f0f0ee", color: "#5f5e5a", border: "0.5px solid #d3d1c7" },
    intern: { background: "#e1f5ee", color: "#0f6e56", border: "0.5px solid #9fe1cb" },
    new: { background: "#e6f1fb", color: "#185fa5", border: "0.5px solid #b5d4f4" },
    urgent: { background: "#fcebeb", color: "#a32d2d", border: "0.5px solid #f7c1c1" },
    soon: { background: "#faeeda", color: "#854f0b", border: "0.5px solid #fac775" },
    seoul: { background: "#eeedfe", color: "#534ab7", border: "0.5px solid #afa9ec" },
    gyeonggi: { background: "#eaf3de", color: "#3b6d11", border: "0.5px solid #c0dd97" },
    incheon: { background: "#fbeaf0", color: "#993556", border: "0.5px solid #f4c0d1" },
    career: { background: "#faeeda", color: "#854f0b", border: "0.5px solid #fac775" },
    newbie: { background: "#e6f1fb", color: "#185fa5", border: "0.5px solid #b5d4f4" },
  };
  const s = styles[variant] || styles.default;
  return (
    <span style={{
      ...s,
      fontSize: 11, fontWeight: 500, borderRadius: 4,
      padding: "2px 7px", display: "inline-block",
      lineHeight: 1.5, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function LocationBadge({ loc }) {
  const v = loc === "서울" ? "seoul" : loc?.includes("경기") ? "gyeonggi" : "incheon";
  return <Badge variant={v}>{loc}</Badge>;
}

function DetailModal({ job, onClose, onToggleFavorite, isFavorite }) {
  const dday = getDdayLabel(job.deadline);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    copyToClipboard(job);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "flex-end",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", background: "var(--color-background-primary)",
        borderRadius: "16px 16px 0 0", padding: "0 0 32px",
        maxHeight: "88vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border-tertiary)" }} />
        </div>

        <div style={{ padding: "8px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div style={{ flex: 1, paddingRight: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{job.organizationType}</span>
                {job.isNew && <Badge variant="new">NEW</Badge>}
              </div>
              <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 2px", color: "var(--color-text-primary)", lineHeight: 1.3 }}>
                {job.companyName}
              </p>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
                본사: {job.headquarters}
              </p>
            </div>
            <button onClick={onClose} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 4, color: "var(--color-text-secondary)", fontSize: 22, lineHeight: 1,
            }}>×</button>
          </div>

          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)", margin: "14px 0 12px", lineHeight: 1.4 }}>
            {job.title}
          </p>

          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 16 }}>
            {job.isConversionIntern ? <Badge variant="intern">채용형 인턴</Badge>
              : job.careerType === "신입" ? <Badge variant="newbie">신입</Badge>
              : <Badge variant="career">{job.careerType || "경력"}</Badge>}
            {job.workLocation.map(l => <LocationBadge key={l} loc={l} />)}
            {job.jobCategory.map(j => <Badge key={j}>{j}</Badge>)}
            {dday.type !== "normal" && dday.type !== "closed" && <Badge variant={dday.type}>{dday.label}</Badge>}
          </div>

          <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 14 }}>
            {[
              ["채용 구분", job.isConversionIntern ? "채용형 인턴" : job.careerType],
              ["고용 형태", job.employmentType],
              ["직무 분야", job.jobCategory.join(" · ")],
              ["근무 지역", job.workLocation.join(", ")],
              ["접수 마감", formatDeadline(job.deadline)],
              ["출처", job.source],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: "flex", gap: 12, padding: "7px 0",
                borderBottom: "0.5px solid var(--color-border-tertiary)",
              }}>
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)", minWidth: 72, flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 13, color: "var(--color-text-primary)", fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={() => window.open(job.sourceUrl, "_blank")} style={{
              flex: 2, padding: "13px 0", borderRadius: 10,
              background: "#1a1a1a", color: "#fff",
              border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500,
            }}>
              공고 원문 보기
            </button>
            <button onClick={handleCopy} style={{
              flex: 1, padding: "13px 0", borderRadius: 10,
              background: copied ? "#e1f5ee" : "var(--color-background-secondary)",
              color: copied ? "#0f6e56" : "var(--color-text-primary)",
              border: "0.5px solid var(--color-border-secondary)",
              cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.2s",
            }}>
              {copied ? "복사됨 ✓" : "복사하기"}
            </button>
            <button onClick={() => onToggleFavorite(job.id)} style={{
              width: 46, height: 46, borderRadius: 10, flexShrink: 0,
              background: isFavorite ? "#fcebeb" : "var(--color-background-secondary)",
              color: isFavorite ? "#a32d2d" : "var(--color-text-secondary)",
              border: "0.5px solid var(--color-border-secondary)",
              cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {isFavorite ? "♥" : "♡"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, onSelect, onToggleFavorite, isFavorite }) {
  const dday = getDdayLabel(job.deadline);
  const isClosed = dday.type === "closed";

  return (
    <div onClick={() => !isClosed && onSelect(job)} style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: 14, padding: "15px 16px 12px",
      cursor: isClosed ? "default" : "pointer",
      opacity: isClosed ? 0.55 : 1,
      position: "relative",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{job.organizationType}</span>
            {job.isNew && !isClosed && <Badge variant="new">NEW</Badge>}
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--color-text-primary)", lineHeight: 1.25 }}>
            {job.companyName}
          </p>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "2px 0 0" }}>
            {job.headquarters}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          <button onClick={e => { e.stopPropagation(); onToggleFavorite(job.id); }} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 18, color: isFavorite ? "#e24b4a" : "#b4b2a9", padding: 0, lineHeight: 1,
          }}>
            {isFavorite ? "♥" : "♡"}
          </button>
          <span style={{
            fontSize: 11, fontWeight: 600, borderRadius: 4, padding: "2px 7px",
            ...(dday.type === "urgent" ? { background: "#fcebeb", color: "#a32d2d" }
              : dday.type === "soon" ? { background: "#faeeda", color: "#854f0b" }
              : dday.type === "closed" ? { background: "#f1efe8", color: "#888780" }
              : { background: "#f1efe8", color: "#5f5e5a" }),
          }}>
            {dday.label}
          </span>
        </div>
      </div>

      <p style={{ fontSize: 13, color: "var(--color-text-primary)", margin: "0 0 10px", lineHeight: 1.4 }}>
        {job.title}
      </p>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
        {job.isConversionIntern ? <Badge variant="intern">채용형 인턴</Badge>
          : job.careerType === "신입" ? <Badge variant="newbie">신입</Badge>
          : <Badge variant="career">{job.careerType || "경력"}</Badge>}
        {job.workLocation.slice(0, 2).map(l => <LocationBadge key={l} loc={l} />)}
        {job.jobCategory.slice(0, 2).map(j => <Badge key={j}>{j}</Badge>)}
      </div>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 9,
      }}>
        <div>
          <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>접수마감 </span>
          <span style={{ fontSize: 12, fontWeight: 500, color: dday.type === "urgent" ? "#a32d2d" : "var(--color-text-primary)" }}>
            {formatDeadline(job.deadline)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>출처: {job.source}</span>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>자세히 →</span>
        </div>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
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

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (data.success) {
        setJobs(data.data);
        setLastUpdated(new Date(data.updatedAt).toLocaleTimeString("ko-KR"));
      } else {
        setError("데이터를 불러오지 못했습니다.");
      }
    } catch (e) {
      setError("서버에 연결할 수 없습니다. 백엔드 서버를 실행해주세요.");
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

    if (filterRegion !== "전체") {
      list = list.filter(j => j.workLocation.some(l => l.includes(filterRegion)));
    }
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

    list = [...list].sort((a, b) => {
      if (sortBy === "deadline") return new Date(a.deadline) - new Date(b.deadline);
      if (sortBy === "new") return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      if (sortBy === "name") return a.companyName.localeCompare(b.companyName, "ko");
      return 0;
    });

    return list;
  }, [jobs, filterCareer, filterRegion, filterExtra, searchQuery, sortBy, showFavoritesOnly, favorites]);

  const totalJobs = jobs.filter(j => getDday(j.deadline) >= 0).length;
  const urgentCount = jobs.filter(j => { const d = getDday(j.deadline); return d >= 0 && d <= 7; }).length;
  const newCount = jobs.filter(j => j.isNew && getDday(j.deadline) >= 0).length;

  return (
    <div style={{ fontFamily: "'Apple SD Gothic Neo', sans-serif", background: "#f7f6f3", minHeight: "100vh", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #e8e6e0", padding: "16px 20px 0", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 2px", color: "#1a1a1a", letterSpacing: "-0.3px" }}>
                수도권 공공기관 문과직 채용
              </h1>
              <p style={{ fontSize: 12, color: "#888", margin: 0 }}>서울·경기·인천 / 경영·회계·행정 중심</p>
            </div>
            <button onClick={fetchJobs} style={{
              fontSize: 12, padding: "5px 10px", borderRadius: 7,
              background: "#f1efe8", color: "#555",
              border: "0.5px solid #d3d1c7", cursor: "pointer",
            }}>
              새로고침
            </button>
          </div>
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

        <div style={{ position: "relative", marginBottom: 10 }}>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="기관명 또는 직무 키워드 검색"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "9px 36px 9px 12px",
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

        <div style={{ display: "flex", gap: 6, marginBottom: 8, overflowX: "auto", paddingBottom: 2 }}>
          {["전체", "신입", "경력", "채용형 인턴"].map(f => (
            <button key={f} onClick={() => setFilterCareer(f)} style={{
              whiteSpace: "nowrap", padding: "5px 12px", borderRadius: 7,
              fontSize: 12, fontWeight: 500, cursor: "pointer", border: "0.5px solid",
              background: filterCareer === f ? "#1a1a1a" : "#f7f6f3",
              color: filterCareer === f ? "#fff" : "#555",
              borderColor: filterCareer === f ? "#1a1a1a" : "#d3d1c7",
            }}>{f}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
          {["전체", "서울", "경기", "인천"].map(f => (
            <button key={f} onClick={() => setFilterRegion(f)} style={{
              padding: "4px 11px", borderRadius: 6, fontSize: 12, fontWeight: 500,
              cursor: "pointer", border: "0.5px solid",
              background: filterRegion === f
                ? (f === "서울" ? "#534ab7" : f === "경기" ? "#3b6d11" : f === "인천" ? "#993556" : "#1a1a1a")
                : "#f7f6f3",
              color: filterRegion === f ? "#fff" : "#555",
              borderColor: filterRegion === f ? "transparent" : "#d3d1c7",
            }}>{f}</button>
          ))}
          <div style={{ width: "0.5px", height: 16, background: "#d3d1c7", margin: "0 2px" }} />
          {[{ key: "urgent", label: "마감임박" }, { key: "new", label: "새공고" }].map(({ key, label }) => (
            <button key={key} onClick={() => setFilterExtra(p => p === key ? null : key)} style={{
              padding: "4px 11px", borderRadius: 6, fontSize: 12, fontWeight: 500,
              cursor: "pointer", border: "0.5px solid",
              background: filterExtra === key ? (key === "urgent" ? "#fcebeb" : "#e6f1fb") : "#f7f6f3",
              color: filterExtra === key ? (key === "urgent" ? "#a32d2d" : "#185fa5") : "#555",
              borderColor: filterExtra === key ? (key === "urgent" ? "#f7c1c1" : "#b5d4f4") : "#d3d1c7",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Sort & count */}
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

      {/* Job list */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
            <p style={{ fontSize: 14 }}>공고를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div style={{ background: "#fff", borderRadius: 14, padding: "40px 20px", textAlign: "center", border: "0.5px solid #e8e6e0" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
            <p style={{ fontSize: 14, color: "#a32d2d", margin: 0 }}>{error}</p>
            <button onClick={fetchJobs} style={{
              marginTop: 16, padding: "8px 20px", borderRadius: 8,
              background: "#1a1a1a", color: "#fff", border: "none", cursor: "pointer", fontSize: 13,
            }}>다시 시도</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 14, padding: "40px 20px", textAlign: "center", border: "0.5px solid #e8e6e0" }}>
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

      {/* Footer */}
      <div style={{ padding: "28px 20px 0", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "#aaa", lineHeight: 1.7, margin: 0 }}>
          본 페이지는 공공기관/공기업 문과직 채용공고를 빠르게 확인하기 위한 개인용 큐레이션 도구입니다.<br />
          지원 전 반드시 원문 공고를 확인하세요.
        </p>
      </div>

      {selectedJob && (
        <DetailModal job={selectedJob} onClose={() => setSelectedJob(null)}
          onToggleFavorite={toggleFavorite} isFavorite={favorites.includes(selectedJob.id)} />
      )}
    </div>
  );
}