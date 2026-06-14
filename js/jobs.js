(function () {
  "use strict";

  function client() {
    return window.KaamKaroSupabase && window.KaamKaroSupabase.client ? window.KaamKaroSupabase.client() : null;
  }

  async function session() {
    var supabase = client();
    if (!supabase) return null;
    var result = await supabase.auth.getSession();
    if (result.error) throw result.error;
    return result.data && result.data.session ? result.data.session : null;
  }

  function parseSalary(pay) {
    var text = String(pay || "");
    var amount = Number((text.match(/\d+/g) || ["0"]).join(""));
    var lower = text.toLowerCase();
    var salaryType = lower.indexOf("day") >= 0 ? "day" : lower.indexOf("week") >= 0 ? "week" : lower.indexOf("year") >= 0 ? "year" : "month";
    return { amount: amount || null, salaryType: salaryType };
  }

  function statusToRemote(status) {
    if (status === "approved") return "active";
    if (status === "Expired") return "expired";
    if (status === "rejected") return "rejected";
    if (status === "pending_review") return "pending_review";
    return status || "active";
  }

  function statusFromRemote(status) {
    if (status === "active") return "approved";
    if (status === "expired") return "Expired";
    return status || "approved";
  }

  function rowToJob(row, appState) {
    appState.businessProfiles = appState.businessProfiles || {};
    var publicEmployer = row.employer_profiles || row.employer_profile || null;
    if (publicEmployer) {
      appState.businessProfiles[row.employer_id] = Object.assign(appState.businessProfiles[row.employer_id] || {}, {
        businessId: row.employer_id,
        businessName: publicEmployer.business_name || "Employer",
        city: publicEmployer.city || "",
        trustBadge: publicEmployer.trust_badge || "New Employer",
        ratingAvg: publicEmployer.rating_avg || 0,
        hiresCompleted: publicEmployer.hires_completed || 0,
        createdAt: publicEmployer.created_at ? new Date(publicEmployer.created_at).getTime() : Date.now()
      });
    }
    var business = appState.businessProfiles && appState.businessProfiles[row.employer_id];
    var company = business ? business.businessName : "Employer";
    var salary = row.salary ? "Rs " + Number(row.salary).toLocaleString("en-IN") + " " + row.salary_type : "Pay not added";
    return {
      id: row.id,
      businessId: row.employer_id,
      employerId: row.employer_id,
      companyName: company,
      title: row.title,
      pay: salary,
      city: row.city || "",
      district: row.district || "",
      state: row.state || "",
      country: row.country || "India",
      formatted_location: row.formatted_location || row.city || "",
      place_id: row.place_id || "",
      lat: row.lat == null ? null : Number(row.lat),
      lng: row.lng == null ? null : Number(row.lng),
      distance: row.is_remote ? "Remote" : "Nearby",
      type: row.job_type || (row.is_remote ? "Remote" : "Full Time"),
      shift: row.work_timing || "",
      openings: Number(row.openings || 1),
      requirements: row.requirements || "",
      employer: company,
      badge: row.boosted ? "Urgent" : "New",
      visibility: row.post_type === "boosted" ? "boost" : "free",
      remote: !!row.is_remote,
      desc: row.description || "",
      status: statusFromRemote(row.status),
      boosted: !!row.boosted,
      paymentVerified: !!row.boosted,
      riskScore: row.risk_score || 0,
      reportCount: row.reports_count || 0,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null,
      repostedFromJobId: row.reposted_from_job_id || "",
      repostCount: Number(row.repost_count || 0)
    };
  }

  async function hydrateJobs(appState) {
    var supabase = client();
    var activeSession = await session();
    if (!supabase || !activeSession || !activeSession.user) return null;
    var result = await supabase
      .from("jobs")
      .select("*, employer_profiles:employer_id(id,business_name,city,trust_badge,rating_avg,hires_completed,created_at)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (result.error) throw result.error;
    appState.jobs = (result.data || []).map(function (row) { return rowToJob(row, appState); });
    return result.data || [];
  }

  async function saveJob(appState, job) {
    var supabase = client();
    var activeSession = await session();
    if (!supabase || !activeSession || !activeSession.user || !job || !appState.defaultBusinessId) return null;
    var salary = parseSalary(job.pay);
    var payload = {
      employer_id: appState.defaultBusinessId,
      title: job.title,
      description: job.desc || "",
      salary: salary.amount,
      salary_type: salary.salaryType,
      city: job.city || "",
      district: job.district || "",
      state: job.state || "",
      country: job.country || "India",
      formatted_location: job.formatted_location || job.city || "",
      place_id: job.place_id || "",
      lat: job.lat || null,
      lng: job.lng || null,
      is_remote: !!job.remote,
      job_type: job.type || "Full Time",
      work_timing: job.shift || "",
      openings: Number(job.openings || 1),
      requirements: job.requirements || "",
      status: statusToRemote(job.status),
      boosted: job.visibility === "boost" && job.paymentVerified === true,
      post_type: job.visibility === "boost" ? "boosted" : "free",
      risk_score: job.riskScore || 0,
      reports_count: job.reportCount || 0,
      expires_at: job.paymentVerified === false ? null : (job.expiresAt ? new Date(job.expiresAt).toISOString() : new Date(Date.now() + (job.visibility === "boost" ? 28 : 15) * 86400000).toISOString()),
      reposted_from_job_id: /^[0-9a-f-]{36}$/i.test(String(job.repostedFromJobId || "")) ? job.repostedFromJobId : null,
      repost_count: Number(job.repostCount || 0)
    };
    var query = supabase.from("jobs");
    var result = /^[0-9a-f-]{36}$/i.test(String(job.id || ""))
      ? await query.update(payload).eq("id", job.id).select("*").single()
      : await query.insert(payload).select("*").single();
    if (result.error) throw result.error;
    var remoteJob = rowToJob(result.data, appState);
    Object.assign(job, remoteJob);
    return result.data;
  }

  window.KaamKaroJobs = {
    hydrateJobs: hydrateJobs,
    saveJob: saveJob
  };
})();
