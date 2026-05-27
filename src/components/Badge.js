export function Badge({ children, variant = "default" }) {
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

export function LocationBadge({ loc }) {
  const v = loc === "서울" ? "seoul" : loc?.includes("경기") ? "gyeonggi" : "incheon";
  return <Badge variant={v}>{loc}</Badge>;
}