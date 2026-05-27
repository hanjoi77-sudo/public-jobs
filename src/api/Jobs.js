app.get("/api/jobs", async (req, res) => {
  try {
    console.log("채용공고 수집 시작...");
    const jobs = await fetchAllJobs();
    const deduplicated = deduplicateJobs(jobs);
    deduplicated.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    console.log(`총 ${deduplicated.length}개 공고 수집 완료`);
    res.json({
      success: true,
      count: deduplicated.length,
      data: deduplicated,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("서버 오류:", error.message);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});