import { Badge, LocationBadge } from "./Badge";
import { getDdayLabel, formatDeadline } from "../utils/Helpers";

export function JobCard({ job, onSelect, onToggleFavorite, isFavorite }) {
  const dday = getDdayLabel(job.deadline);
  const isClosed = dday.type === "closed";

  return (
    <div onClick={() => !isClosed && onSelect(job)} style={{
      background: "#fff",
      border: "0.5px solid #e8e6e0",
      borderRadius: 14, padding: "15px 16px 12px",
      cursor: isClosed ? "default" : "pointer",
      opacity: isClosed ? 0.55 : 1,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: "#888" }}>{job.organizationType}</span>
            <span style={{ fontSize: 11, color: "#bbb" }}>·</span>
            <span style={{ fontSize: 11, color: "#bbb" }}>{job.source}</span>
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

      <p style={{ fontSize: 13, color: "#333", margin: "0 0 10px", lineHeight: 1.4 }}>
        {job.title}
      </p>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
        {job.isConversionIntern ? <Badge variant="intern">채용형 인턴</Badge>
          : job.careerType === "신입" ? <Badge variant="newbie">신입</Badge>
          : <Badge variant="career">{job.careerType || "경력"}</Badge>}
        {job.workLocation
          .filter(l => ["서울","경기","인천"].some(r => l.includes(r)))
          .slice(0, 2)
          .map(l => <LocationBadge key={l} loc={l} />)}
        {job.jobCategory.slice(0, 2).map(j => <Badge key={j}>{j}</Badge>)}
      </div>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderTop: "0.5px solid #f0f0ee", paddingTop: 9,
      }}>
        <div>
          <span style={{ fontSize: 11, color: "#888" }}>접수마감 </span>
          <span style={{ fontSize: 12, fontWeight: 500, color: dday.type === "urgent" ? "#a32d2d" : "#1a1a1a" }}>
            {formatDeadline(job.deadline)}
          </span>
        </div>
        {job.recruitCount && (
          <span style={{ fontSize: 12, fontWeight: 600, color: "#2a5fc9" }}>
            {job.recruitCount}명 채용
          </span>
        )}
      </div>
    </div>
  );
}