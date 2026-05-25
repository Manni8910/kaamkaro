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

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
  }

  function rowToRecord(row) {
    if (!row) return null;
    return {
      id: row.id || "",
      user_id: row.user_id || "",
      worker_id: row.worker_id || "",
      swipe_date: row.swipe_date || "",
      daily_swipe_count: Number(row.daily_swipe_count || 0),
      total_swipes_today: Number(row.total_swipes_today || 0),
      daily_limit: Number(row.daily_limit || 25),
      cooldown_level: Number(row.cooldown_level || 0),
      cooldown_until: row.cooldown_until || null,
      reset_at: row.reset_at || null,
      plan: row.plan || "free",
      worker_plus_enabled: !!row.worker_plus_enabled,
      created_at: row.created_at || null,
      updated_at: row.updated_at || null
    };
  }

  async function loadSwipeLimit(identity, swipeDate) {
    var supabase = client();
    var activeSession = await session();
    if (!supabase || !activeSession || !activeSession.user || !identity || !swipeDate) return null;
    var userId = identity.userId || activeSession.user.id;
    if (!isUuid(userId)) return null;
    var result = await supabase
      .from("worker_swipe_limits")
      .select("*")
      .eq("user_id", userId)
      .eq("swipe_date", swipeDate)
      .maybeSingle();
    if (result.error) throw result.error;
    return rowToRecord(result.data);
  }

  async function saveSwipeLimit(record) {
    var supabase = client();
    var activeSession = await session();
    if (!supabase || !activeSession || !activeSession.user || !record) return null;
    var userId = record.user_id || activeSession.user.id;
    if (!isUuid(userId)) return null;
    var workerId = isUuid(record.worker_id) ? record.worker_id : null;
    var payload = {
      user_id: userId,
      worker_id: workerId,
      swipe_date: record.swipe_date,
      daily_swipe_count: Number(record.daily_swipe_count || 0),
      total_swipes_today: Number(record.total_swipes_today || 0),
      daily_limit: Number(record.daily_limit || 25),
      cooldown_level: Number(record.cooldown_level || 0),
      cooldown_until: record.cooldown_until || null,
      reset_at: record.reset_at,
      plan: record.plan || "free",
      worker_plus_enabled: !!record.worker_plus_enabled
    };
    var result = await supabase
      .from("worker_swipe_limits")
      .upsert(payload, { onConflict: "user_id,swipe_date" })
      .select("*")
      .single();
    if (result.error) throw result.error;
    return rowToRecord(result.data);
  }

  window.KaamKaroSwipeLimits = {
    loadSwipeLimit: loadSwipeLimit,
    saveSwipeLimit: saveSwipeLimit
  };
})();
