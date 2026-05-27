import { useState, useEffect, useRef } from "react";
import { Badge, LocationBadge } from "./Badge";
import { getDdayLabel, formatDeadline, copyToClipboard } from "../utils/Helpers";

// ─────────────────────────────────────────────
// 수정 포인트 3가지:
//  1) keywordSearch → addressSearch (주소 변환이 더 정확)
//  2) window.kakao 없을 때 300ms 간격으로 최대 10회 재시도
//  3) 지도 인스턴스를 mapInstanceRef에 보관해 중복 생성 방지
// ─────────────────────────────────────────────
function KakaoMap({ address, companyName }) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [status, setStatus] = useState("loading"); // "loading" | "ok" | "error"

  useEffect(() => {
    if (!address) { setStatus("error"); return; }

    // SDK 로드 대기 (최대 3초)
    const tryInit = (retries = 10) => {
      if (!window.kakao?.maps) {
        if (retries <= 0) { setStatus("error"); return; }
        setTimeout(() => tryInit(retries - 1), 300);
        return;
      }
      window.kakao.maps.load(initMap);
    };

    const initMap = () => {
      const container = containerRef.current;
      if (!container) return;

      // 지도 인스턴스가 없을 때만 생성
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780),
          level: 5,
        });
      }

      // headquarters가 "서울", "경기" 같은 지역명이라
      // addressSearch가 실패함 → keywordSearch(회사명) 우선 사용
      const ps = new window.kakao.maps.services.Places();

      // 1차: 회사명으로 검색 (가장 정확)
      ps.keywordSearch(companyName, (result, kwStatus) => {
        if (kwStatus === window.kakao.maps.services.Status.OK) {
          placeMarker(new window.kakao.maps.LatLng(result[0].y, result[0].x));
          return;
        }

        // 2차: "회사명 + 지역" 조합으로 재시도
        ps.keywordSearch(`${companyName} ${address}`, (result2, kwStatus2) => {
          if (kwStatus2 === window.kakao.maps.services.Status.OK) {
            placeMarker(new window.kakao.maps.LatLng(result2[0].y, result2[0].x));
            return;
          }

          // 3차: 지역명만으로 addressSearch (마지막 수단)
          const geocoder = new window.kakao.maps.services.Geocoder();
          geocoder.addressSearch(address, (result3, geoStatus) => {
            if (geoStatus !== window.kakao.maps.services.Status.OK) {
              setStatus("error");
              return;
            }
            placeMarker(new window.kakao.maps.LatLng(result3[0].y, result3[0].x));
          });
        });
      });
    };

    const placeMarker = (coords) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // 기존 마커 제거
      if (markerRef.current) markerRef.current.setMap(null);

      markerRef.current = new window.kakao.maps.Marker({ position: coords });
      markerRef.current.setMap(map);

      if (companyName) {
        const infowindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:5px 10px;font-size:12px;font-weight:600;white-space:nowrap">${companyName}</div>`,
        });
        infowindow.open(map, markerRef.current);
      }

      map.setCenter(coords);
      map.setLevel(5);   
      setStatus("ok");
    };

    tryInit();

    return () => {
      if (markerRef.current) markerRef.current.setMap(null);
    };
  }, [address, companyName]);

  return (
    <div style={{ position: "relative" }}>
      {/* height 명시 필수 — 없으면 지도 렌더링 안 됨 */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: 180,
          borderRadius: 10,
          overflow: "hidden",
          background: "#f0f0ee",
        }}
      />

      {status === "loading" && (
        <div style={overlayStyle}>
          <span style={{ color: "#aaa", fontSize: 13 }}>지도 불러오는 중…</span>
        </div>
      )}

      {status === "error" && (
        <div style={overlayStyle}>
          <span style={{ color: "#aaa", fontSize: 13 }}>위치를 찾을 수 없습니다</span>
        </div>
      )}

      {status === "ok" && (
        <a
          href={`https://map.kakao.com/link/search/${encodeURIComponent(address)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            color: "#185fa5",
            display: "block",
            marginTop: 6,
            textAlign: "right",
          }}
        >
          카카오맵에서 보기 →
        </a>
      )}
    </div>
  );
}

const overlayStyle = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f5f5f3",
  borderRadius: 10,
};

// ─────────────────────────────────────────────
// DetailScreen — KakaoMap 호출부만 수정
//   address: "한국보훈복지의료공단 경기" 같은 문자열 대신
//   job.headquarters 주소를 직접 넘기는 게 더 정확
// ─────────────────────────────────────────────
export function DetailScreen({ job, onClose, onToggleFavorite, isFavorite }) {
  const dday = getDdayLabel(job.deadline);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleCopy() {
    copyToClipboard(job);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex" }}>
      <div onClick={onClose} style={{
        position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.3)",
        animation: "fadeIn 0.25s ease",
      }} />

      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0,
        width: "100%", maxWidth: 480,
        background: "#fff",
        overflowY: "auto",
        animation: "slideIn 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        display: "flex", flexDirection: "column",
      }}>
        {/* 헤더 */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "0.5px solid #e8e6e0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, background: "#fff", zIndex: 10,
        }}>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#555", fontSize: 14, padding: 0,
          }}>
            ← 목록으로
          </button>
          <button onClick={() => onToggleFavorite(job.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 22, color: isFavorite ? "#e24b4a" : "#b4b2a9", padding: 0,
          }}>
            {isFavorite ? "♥" : "♡"}
          </button>
        </div>

        {/* 기관 정보 */}
        <div style={{ padding: "24px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 4,
              background: "#f0f0ee", color: "#5f5e5a", border: "0.5px solid #d3d1c7",
            }}>
              {job.organizationType}
            </span>
            {job.isNew && <Badge variant="new">NEW</Badge>}
            {dday.type !== "normal" && dday.type !== "closed" && (
              <Badge variant={dday.type}>{dday.label}</Badge>
            )}
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: "#1a1a1a", lineHeight: 1.25 }}>
            {job.companyName}
          </h2>
          <p style={{ fontSize: 13, color: "#888", margin: "0 0 16px" }}>본사: {job.headquarters}</p>

          <h3 style={{ fontSize: 16, fontWeight: 500, color: "#1a1a1a", margin: "0 0 16px", lineHeight: 1.5 }}>
            {job.title}
          </h3>

          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 24 }}>
            {job.isConversionIntern ? <Badge variant="intern">채용형 인턴</Badge>
              : job.careerType === "신입" ? <Badge variant="newbie">신입</Badge>
              : <Badge variant="career">{job.careerType || "경력"}</Badge>}
            {job.workLocation
              .filter(l => ["서울","경기","인천"].some(r => l.includes(r)))
              .map(l => <LocationBadge key={l} loc={l} />)}
            {job.jobCategory.slice(0, 3).map(j => <Badge key={j}>{j}</Badge>)}
          </div>
        </div>

        {/* 구분선 */}
        <div style={{ height: 8, background: "#f7f6f3" }} />

        {/* 상세 정보 */}
        <div style={{ padding: "20px 20px 0" }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: "#888", margin: "0 0 12px", letterSpacing: "0.5px" }}>
            채용 정보
          </h4>
          {[
            ["채용 구분", job.isConversionIntern ? "채용형 인턴" : job.careerType],
            ["고용 형태", job.employmentType],
            ["직무 분야", job.jobCategory.join(" · ")],
            ["근무 지역", job.workLocation.join(", ")],
            ["접수 마감", formatDeadline(job.deadline)],
            ["출처", job.source],
          ].map(([label, value]) => (
            <div key={label} style={{
              display: "flex", padding: "12px 0",
              borderBottom: "0.5px solid #f0f0ee",
            }}>
              <span style={{ fontSize: 13, color: "#888", width: 80, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 500, flex: 1 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* 카카오맵 — companyName 추가로 말풍선 표시 */}
        {job.headquarters && (
          <div style={{ padding: "20px 20px 0" }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#888", margin: "0 0 12px", letterSpacing: "0.5px" }}>
              본사 위치
            </h4>
            {/* 변경: address를 headquarters만 넘기는 게 addressSearch에 더 정확 */}
            <KakaoMap
              address={job.headquarters}
              companyName={job.companyName}
            />
          </div>
        )}

        {/* 하단 버튼 */}
        <div style={{
          padding: "20px",
          marginTop: "auto",
          display: "flex", gap: 10,
          position: "sticky", bottom: 0,
          background: "#fff",
          borderTop: "0.5px solid #e8e6e0",
        }}>
          <button onClick={() => window.open(job.sourceUrl, "_blank")} style={{
            flex: 2, padding: "14px 0", borderRadius: 12,
            background: "#1a1a1a", color: "#fff",
            border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600,
          }}>
            공고 원문 보기
          </button>
          <button onClick={handleCopy} style={{
            flex: 1, padding: "14px 0", borderRadius: 12,
            background: copied ? "#e1f5ee" : "#f7f6f3",
            color: copied ? "#0f6e56" : "#555",
            border: "0.5px solid #d3d1c7",
            cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.2s",
          }}>
            {copied ? "복사됨 ✓" : "복사"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}