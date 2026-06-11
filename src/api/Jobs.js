const BASE_URL = "https://job-backend-brjv.onrender.com";

export async function fetchJobs() {
  const res = await fetch(`${BASE_URL}/api/jobs`);
  const data = await res.json();
  if (!data.success) throw new Error("데이터를 불러오지 못했습니다.");
  return data;
}

export async function fetchLargeCompanyJobs() {
  const res = await fetch(`${BASE_URL}/api/large-company-jobs`);
  const data = await res.json();
  if (!data.success) throw new Error("데이터를 불러오지 못했습니다.");
  return data;
}

export async function triggerRefresh() {
  const res = await fetch(`${BASE_URL}/api/refresh`);
  return res.json();
}
