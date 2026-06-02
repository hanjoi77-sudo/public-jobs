import { Badge, LocationBadge } from "./Badge";
import { getDdayLabel, formatDeadline } from "../utils/Helpers";

function DdayBadge({ type, label }) {
  const style =
    type === "urgent" ? { background: "#fcebeb", color: "#a32d2d" }
    : type === "soon"  ? { background: "#faeeda", color: "#854f0b" }
    : type === "closed"? { background: "#f1efe8", color: "#888780" }
    :                    { background: "#f1efe8", color: "#5f5e5a" };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 4, padding: "2px 7px", whiteSpace: "nowrap", ...style }}>
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
        borderRadius: 12, padding: "14px 18px 12px",
        cursor: isClosed ? "default" : "pointer",
        opacity: isClosed ? 0.55 : 1,
      }}>
        {/* 회사명 행 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", flex: 1, minWidth: 0 }}>
            {job.companyName}
          </span>
          {job.isNew && !isClosed && <Badge variant="new">NEW</Badge>}
          <DdayBadge type={dday.type} label={dday.label} />
          <button onClick={e => { e.stopPropagation(); onToggleFavorite(job.id); }} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 18, color: isFavorite ? "#e24b4a" : "#b4b2a9", padding: 0, lineHeight: 1, flexShrink: 0,
          }}>
            {isFavorite ? "♥" : "♡"}
          </button>
        </div>

        {/* 기관 유형 · 위치 */}
        <p style={{ fontSize: 12, color: "#aaa", margin: "0 0 10px" }}>
          {job.organizationType} · {job.headquarters}
        </p>

        {/* 직무명 */}
        <p style={{ fontSize: 13, fontWeight: 500, color: "#222", margin: "0 0 8px", lineHeight: 1.45 }}>
          {job.title}
        </p>

        {/* 배지 + 마감일 + 출처 */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          <CareerBadge job={job} />
          {job.workLocation
            .filter(l => ["서울", "경기", "인천"].some(r => l.includes(r)))
            .slice(0, 2)
            .map(l => <LocationBadge key={l} loc={l} />)}
          {job.jobCategory.slice(0, 2).map(j => <Badge key={j}>{j}</Badge>)}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: dday.type === "urgent" ? "#a32d2d" : "#aaa", whiteSpace: "nowrap" }}>
              ~ {formatDeadline(job.deadline)}
            </span>
            <span style={{ fontSize: 11, color: "#ccc" }}>출처: {job.source} →</span>
          </div>
        </div>
      </div>
    );
  }

  // 공고 2개 이상
  return (
    <div style={{ background: "#fff", border: "0.5px solid #e8e6e0", borderRadius: 12, overflow: "hidden" }}>
      {/* 회사 헤더 */}
      <div style={{ padding: "14px 18px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", flex: 1 }}>
            {rep.companyName}
          </span>
          {hasNew && <Badge variant="new">NEW</Badge>}
          <span style={{
            fontSize: 11, fontWeight: 600, color: "#5f5e5a",
            background: "#f1efe8", padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap",
          }}>
            {group.length}개 공고
          </span>
        </div>
        <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>
          {rep.organizationType} · {rep.headquarters}
        </p>
      </div>

      {/* 공고 행 */}
      {group.map(job => {
        const dday = getDdayLabel(job.deadline);
        const isClosed = dday.type === "closed";
        const isFavorite = favorites.includes(job.id);

        return (
          <div key={job.id}
            onClick={() => !isClosed && onSelect(job)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 18px",
              borderTop: "0.5px solid #f0f0ee",
              cursor: isClosed ? "default" : "pointer",
              opacity: isClosed ? 0.55 : 1,
            }}
          >
            <p style={{ flex: 1, minWidth: 0, fontSize: 13, color: "#222", margin: 0, fontWeight: 500, lineHeight: 1.35 }}>
              {job.title}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <CareerBadge job={job} />
              <DdayBadge type={dday.type} label={dday.label} />
              <span style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap" }}>
                ~ {formatDeadline(job.deadline)}
              </span>
              <button onClick={e => { e.stopPropagation(); onToggleFavorite(job.id); }} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 15, color: isFavorite ? "#e24b4a" : "#b4b2a9", padding: 0, lineHeight: 1,
              }}>
                {isFavorite ? "♥" : "♡"}
              </button>
            </div>
          </div>
        );
      })}

      {/* 출처 */}
      <div style={{
        padding: "7px 18px", borderTop: "0.5px solid #f0f0ee",
        display: "flex", justifyContent: "flex-end",
      }}>
        <span style={{ fontSize: 11, color: "#ccc" }}>출처: {rep.source} →</span>
      </div>
    </div>
  );
}
