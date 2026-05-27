export function getDday(deadline) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(deadline);
  end.setHours(0, 0, 0, 0);
  return Math.round((end - today) / (1000 * 60 * 60 * 24));
}

export function getDdayLabel(deadline) {
  const d = getDday(deadline);
  if (d < 0) return { label: "마감", type: "closed" };
  if (d === 0) return { label: "오늘마감", type: "urgent" };
  if (d <= 3) return { label: `D-${d}`, type: "urgent" };
  if (d <= 7) return { label: `D-${d}`, type: "soon" };
  return { label: `D-${d}`, type: "normal" };
}

export function formatDeadline(date) {
  return date ? date.replace(/-/g, ".") : "";
}

export function copyToClipboard(job) {
  const dday = getDdayLabel(job.deadline);
  const text = `[${job.companyName}]
${job.title}
직무: ${job.jobCategory.join("/")}
근무지: ${job.workLocation.join(", ")}
마감: ${formatDeadline(job.deadline)} (${dday.label})
링크: ${job.sourceUrl}`;
  navigator.clipboard?.writeText(text).catch(() => {});
}