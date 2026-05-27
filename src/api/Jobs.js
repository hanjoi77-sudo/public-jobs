const API_URL = "https://job-backend-brjv.onrender.com/api/jobs";

export async function fetchJobs() {
  const res = await fetch(API_URL);
  const data = await res.json();
  if (!data.success) throw new Error("데이터를 불러오지 못했습니다.");
  return data;
}