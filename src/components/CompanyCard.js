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
      WebkitTextStroke: isFavorite ? "0px" : "1px #D1D5DB",
    }}>
      {isFavorite ? "❤" : "♡"}
    </button>
  );
}

const SOURCE_CONFIG = {
  "사람인":    { color: "#E8590C", bg: "#FFF4EE" },
  "잡알리오":  { color: "#1971C2", bg: "#E7F5FF" },
  "자소설닷컴": { color: "#0D9488", bg: "#F0FDFA" },
  "클린아이":  { color: "#7C3AED", bg: "#F5F3FF" },
  "캐치":      { color: "#0E7A6E", bg: "#DDF5F2" },
};

function SourceTag({ source, duplicates }) {
  const all = duplicates?.length ? [source, ...duplicates] : [source];
  return (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
      {all.map(s => {
        const { color, bg } = SOURCE_CONFIG[s] || { color: "#6B7280", bg: "#F3F4F6" };
        return (
          <span key={s} style={{ fontSize: 10, fontWeight: 600, color, background: bg, padding: "1px 6px", borderRadius: 4 }}>
            {s}
          </span>
        );
      })}
    </div>
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
          <SourceTag source={job.source} duplicates={job.duplicateSources} />
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
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>{rep.organizationType}</span>
          <span style={{ color: "#E5E7EB", fontSize: 10 }}>·</span>
          <SourceTag source={rep.source} duplicates={rep.duplicateSources} />
          {hasNew && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#2563EB", background: "#EFF6FF", padding: "1px 6px", borderRadius: 4 }}>
              NEW
            </span>
          )}
          <div style={{ marginLeft: "auto" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", background: "#F3F4F6", padding: "3px 9px", borderRadius: 6, whiteSpace: "nowrap" }}>
              {group.length}개 공고
            </span>
          </div>
        </div>
        <span style={{ fontSize: 17, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
          {rep.companyName}
        </span>
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>{rep.headquarters}</span>
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
              padding: "12px 20px",
              borderTop: "1px solid #F3F4F6",
              cursor: isClosed ? "default" : "pointer",
              opacity: isClosed ? 0.5 : 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
              <p style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, color: "#374151", margin: 0, lineHeight: 1.5 }}>
                {job.title}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                <DdayChip type={dday.type} label={dday.label} />
                <FavBtn isFavorite={isFavorite} onClick={() => onToggleFavorite(job.id)} size={15} />
              </div>
            </div>
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
              <span style={{ marginLeft: "auto", fontSize: 12, color: dday.type === "urgent" ? "#C92A2A" : "#9CA3AF", whiteSpace: "nowrap" }}>
                ~ {formatDeadline(job.deadline)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
