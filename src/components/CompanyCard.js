import { Badge, LocationBadge } from "./Badge";
import { getDdayLabel, formatDeadline } from "../utils/Helpers";

function DdayChip({ type, label }) {
  const s = {
    urgent: { background: "#FFECEC", color: "#C92A2A" },
    soon:   { background: "#FFF9DB", color: "#B45309" },
    closed: { background: "#F1F3F5", color: "#9CA3AF" },
    normal: { background: "#F1F3F5", color: "#6B7280" },
  }[type] || { background: "#F1F3F5", color: "#6B7280" };
  return (
    <span style={{ ...s, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function FavBtn({ isFavorite, onClick, size = 17 }) {
  return (
    <button onClick={e => { e.stopPropagation(); onClick(); }} style={{
      background: "none", border: "none", cursor: "pointer", padding: 2,
      fontSize: size, color: isFavorite ? "#EF4444" : "#D1D5DB", lineHeight: 1, flexShrink: 0,
    }}>
      {isFavorite ? "♥" : "♡"}
    </button>
  );
}

function SourceTag({ source }) {
  const color = source === "사람인" ? "#E8590C" : "#1971C2";
  const bg    = source === "사람인" ? "#FFF4EE" : "#E7F5FF";
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color, background: bg, padding: "1px 6px", borderRadius: 4 }}>
      {source}
    </span>
  );
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
        background: "#fff", borderRadius: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
        padding: "18px 20px", cursor: isClosed ? "default" : "pointer", opacity: isClosed ? 0.5 : 1,
      }}>
        {/* 상단: 메타 + D-day + 즐겨찾기 */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>{job.organizationType}</span>
          <span style={{ color: "#E5E7EB", fontSize: 10 }}>·</span>
          <SourceTag source={job.source} />
          {job.isNew && !isClosed && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#2563EB", background: "#EFF6FF", padding: "1px 6px", borderRadius: 4 }}>
              NEW
            </span>
          )}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <DdayChip type={dday.type} label={dday.label} />
            <FavBtn isFavorite={isFavorite} onClick={() => onToggleFavorite(job.id)} />
          </div>
        </div>

        {/* 기관명 */}
        <p style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: "0 0 2px", lineHeight: 1.3 }}>
          {job.companyName}
        </p>

        {/* 위치 */}
        <p style={{ fontSize: 12, color: "#9CA3AF", margin: "0 0 12px" }}>{job.headquarters}</p>

        {/* 공고 제목 */}
        <p style={{ fontSize: 14, fontWeight: 500, color: "#374151", margin: "0 0 14px", lineHeight: 1.55 }}>
          {job.title}
        </p>

        {/* 뱃지 + 마감일 */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          {job.isConversionIntern ? <Badge variant="intern">채용형 인턴</Badge>
            : job.careerType === "신입" ? <Badge variant="newbie">신입</Badge>
            : <Badge variant="career">{job.careerType || "경력"}</Badge>}
          {job.recruitCount && (
            <span style={{ fontSize: 11, fontWeight: 600, color: "#2563EB", background: "#EFF6FF", padding: "2px 7px", borderRadius: 4 }}>
              {job.recruitCount}명
            </span>
          )}
          {job.workLocation
            .filter(l => ["서울", "경기", "인천"].some(r => l.includes(r)))
            .slice(0, 2)
            .map(l => <LocationBadge key={l} loc={l} />)}
          <span style={{ marginLeft: "auto", fontSize: 12, color: dday.type === "urgent" ? "#C92A2A" : "#9CA3AF" }}>
            ~ {formatDeadline(job.deadline)}
          </span>
        </div>
      </div>
    );
  }

  // 다중 공고 카드
  return (
    <div style={{
      background: "#fff", borderRadius: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
      overflow: "hidden",
    }}>
      {/* 기관 헤더 */}
      <div style={{ padding: "18px 20px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#111827", flex: 1, lineHeight: 1.3 }}>
            {rep.companyName}
          </span>
          {hasNew && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#2563EB", background: "#EFF6FF", padding: "2px 7px", borderRadius: 4 }}>
              NEW
            </span>
          )}
          <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", background: "#F3F4F6", padding: "3px 9px", borderRadius: 6, whiteSpace: "nowrap" }}>
            {group.length}개 공고
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>{rep.organizationType} · {rep.headquarters}</span>
        </div>
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
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "11px 20px",
              borderTop: "1px solid #F9FAFB",
              cursor: isClosed ? "default" : "pointer",
              opacity: isClosed ? 0.5 : 1,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#1F2937", margin: "0 0 6px", lineHeight: 1.45 }}>
                {job.title}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                {job.isConversionIntern ? <Badge variant="intern">채용형 인턴</Badge>
                  : job.careerType === "신입" ? <Badge variant="newbie">신입</Badge>
                  : <Badge variant="career">{job.careerType || "경력"}</Badge>}
                {job.recruitCount && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#2563EB", background: "#EFF6FF", padding: "1px 5px", borderRadius: 3 }}>
                    {job.recruitCount}명
                  </span>
                )}
                <span style={{ marginLeft: "auto", fontSize: 11, color: dday.type === "urgent" ? "#C92A2A" : "#9CA3AF", whiteSpace: "nowrap" }}>
                  ~ {formatDeadline(job.deadline)}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0, paddingTop: 1 }}>
              <DdayChip type={dday.type} label={dday.label} />
              <FavBtn isFavorite={isFavorite} onClick={() => onToggleFavorite(job.id)} size={15} />
            </div>
          </div>
        );
      })}

      {/* 출처 */}
      <div style={{ padding: "8px 20px", borderTop: "1px solid #F9FAFB", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
        <SourceTag source={rep.source} />
        <span style={{ fontSize: 11, color: "#D1D5DB" }}>출처</span>
      </div>
    </div>
  );
}
