import { Badge, LocationBadge } from "./Badge";
import { getDdayLabel, formatDeadline } from "../utils/Helpers";

function DdayBadge({ type, label }) {
  const style =
    type === "urgent" ? { background: "#fcebeb", color: "#a32d2d" }
    : type === "soon"  ? { background: "#faeeda", color: "#854f0b" }
    : type === "closed"? { background: "#f1efe8", color: "#888780" }
    :                    { background: "#f1efe8", color: "#5f5e5a" };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 4, padding: "2px 7px", ...style }}>
      {label}
    </span>
  );
}

function CareerBadge({ job }) {
  if (job.isConversionIntern) return <Badge variant="intern">채용형 인턴</Badge>;
  if (job.careerType === "신입") return <Badge variant="newbie">신입</Badge>;
  return <Badge variant="career">{job.careerType || "경력"}</Badge>;
}

export function CompanyCard({ group, onSelect, onToggleFavorite, favorites }) {
  const rep = group[0];
  const hasNew = group.some(j => j.isNew);

  if (group.length === 1) {
    const job = rep;
    const dday = getDdayLabel(job.deadline);
    const isClosed = dday.type === "closed";
    const isFavorite = favorites.includes(job.id);

    return (
      <div onClick={() => !isClosed && onSelect(job)} style={{
        background: "#fff", border: "0.5px solid #e8e6e0",
        borderRadius: 14, padding: "15px 16px 12px",
        cursor: isClosed ? "default" : "pointer",
        opacity: isClosed ? 0.55 : 1,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: "#888" }}>{job.organizationType}</span>
              {job.isNew && !isClosed && <Badge variant="new">NEW</Badge>}
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "#1a1a1a", lineHeight: 1.25 }}>
              {job.companyName}
            </p>
            <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>{job.headquarters}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
            <button onClick={e => { e.stopPropagation(); onToggleFavorite(job.id); }} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 18, color: isFavorite ? "#e24b4a" : "#b4b2a9", padding: 0, lineHeight: 1,
            }}>
              {isFavorite ? "♥" : "♡"}
            </button>
            <DdayBadge type={dday.type} label={dday.label} />
          </div>
        </div>

        <p style={{ fontSize: 13, color: "#333", margin: "0 0 10px", lineHeight: 1.4 }}>{job.title}</p>

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
          <CareerBadge job={job} />
          {job.workLocation
            .filter(l => ["서울", "경기", "인천"].some(r => l.includes(r)))
            .slice(0, 2)
            .map(l => <LocationBadge key={l} loc={l} />)}
          {job.jobCategory.slice(0, 2).map(j => <Badge key={j}>{j}</Badge>)}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "0.5px solid #f0f0ee", paddingTop: 9 }}>
          <div>
            <span style={{ fontSize: 11, color: "#888" }}>접수마감 </span>
            <span style={{ fontSize: 12, fontWeight: 500, color: dday.type === "urgent" ? "#a32d2d" : "#1a1a1a" }}>
              {formatDeadline(job.deadline)}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#aaa" }}>출처: {job.source} →</span>
        </div>
      </div>
    );
  }

  // 공고 2개 이상 — 회사 헤더 + 공고 목록
  return (
    <div style={{ background: "#fff", border: "0.5px solid #e8e6e0", borderRadius: 14, overflow: "hidden" }}>
      {/* 회사 헤더 */}
      <div style={{ padding: "14px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
          <span style={{ fontSize: 11, color: "#888" }}>{rep.organizationType}</span>
          {hasNew && <Badge variant="new">NEW</Badge>}
          <span style={{
            marginLeft: "auto", fontSize: 11, fontWeight: 600,
            color: "#5f5e5a", background: "#f1efe8",
            padding: "2px 8px", borderRadius: 4,
          }}>
            {group.length}개 공고
          </span>
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "#1a1a1a", lineHeight: 1.25 }}>
          {rep.companyName}
        </p>
        <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>{rep.headquarters}</p>
      </div>

      {/* 공고 목록 */}
      {group.map(job => {
        const dday = getDdayLabel(job.deadline);
        const isClosed = dday.type === "closed";
        const isFavorite = favorites.includes(job.id);

        return (
          <div key={job.id}
            onClick={() => !isClosed && onSelect(job)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "11px 16px",
              borderTop: "0.5px solid #f0f0ee",
              cursor: isClosed ? "default" : "pointer",
              opacity: isClosed ? 0.55 : 1,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, color: "#333", margin: "0 0 5px", lineHeight: 1.3, fontWeight: 500 }}>
                {job.title}
              </p>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <CareerBadge job={job} />
                <span style={{ fontSize: 11, color: "#aaa" }}>~ {formatDeadline(job.deadline)}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <DdayBadge type={dday.type} label={dday.label} />
              <button onClick={e => { e.stopPropagation(); onToggleFavorite(job.id); }} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 16, color: isFavorite ? "#e24b4a" : "#b4b2a9", padding: 0, lineHeight: 1,
              }}>
                {isFavorite ? "♥" : "♡"}
              </button>
            </div>
          </div>
        );
      })}

      {/* 출처 */}
      <div style={{
        padding: "8px 16px", borderTop: "0.5px solid #f0f0ee",
        display: "flex", justifyContent: "flex-end",
      }}>
        <span style={{ fontSize: 12, color: "#aaa" }}>출처: {rep.source} →</span>
      </div>
    </div>
  );
}
