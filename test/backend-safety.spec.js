const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");

const root = path.resolve(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

test.describe("backend trust and safety guardrails", () => {
  test("schema includes production risk, moderation, and admin-review hooks", () => {
    const schema = read("backend/supabase_schema.sql");

    expect(schema).toContain("create table if not exists public.security_events");
    expect(schema).toContain("device_id text");
    expect(schema).toContain("ip_hash text");
    expect(schema).toContain("requires_turnstile boolean");
    expect(schema).toContain("posting_restricted boolean");
    expect(schema).toContain("chat_restricted boolean");
    expect(schema).toContain("visibility_restricted boolean");
    expect(schema).toContain("create or replace function public.record_security_event");
    expect(schema).toContain("create or replace function public.apply_report_risk");
    expect(schema).toContain("create or replace function public.apply_moderation_risk");
    expect(schema).toContain("create or replace function public.log_job_risk_flags");
    expect(schema).toContain("create or replace function public.enforce_application_job_rules");
    expect(schema).toContain("create or replace function public.enforce_application_status_rules");
    expect(schema).toContain("create or replace function public.enforce_chat_unlock_rules");
    expect(schema).toContain("create table if not exists public.worker_swipe_limits");
    expect(schema).toContain("create table if not exists public.job_edit_history");
    expect(schema).toContain("create or replace function public.log_job_edit_history");
    expect(schema).toContain("after update on public.jobs");
    expect(schema).toContain('create policy "job_edit_history_select_own_or_admin"');
    expect(schema).toContain("cooldown_level integer");
    expect(schema).toContain("unique (user_id, swipe_date)");
    expect(schema).toContain("registration fee");
    expect(schema).toContain("security deposit");
    expect(schema).toContain("adult service");
    expect(schema).toContain("employer_posting_restricted");
    expect(schema).toContain("pending_review");
  });

  test("existing-project hardening patch can upgrade safety tables without weakening RLS", () => {
    const patch = read("backend/supabase_rls_hardening.sql");

    expect(patch).toContain("alter table public.users add column if not exists device_id text");
    expect(patch).toContain("create table if not exists public.security_events");
    expect(patch).toContain("create table if not exists public.worker_swipe_limits");
    expect(patch).toContain("create table if not exists public.job_edit_history");
    expect(patch).toContain("create or replace function public.log_job_edit_history");
    expect(patch).toContain('create policy "job_edit_history_select_own_or_admin"');
    expect(patch).toContain('create policy "worker_swipe_limits_select_own_or_admin"');
    expect(patch).toContain("alter table public.security_events enable row level security");
    expect(patch).toContain('create policy "security_events_admin"');
    expect(patch).toContain('create policy "security_events_insert_own"');
    expect(patch).not.toMatch(/for\s+select\s+using\s+\(true\)/i);
    expect(patch).not.toMatch(/for\s+all\s+using\s+\(true\)/i);
  });

  test("live job edit migration preserves strict ownership and server-side history", () => {
    const migration = read("backend/job_edit_feature.sql");

    expect(migration).toContain("create table if not exists public.job_edit_history");
    expect(migration).toContain("create or replace function public.log_job_edit_history");
    expect(migration).toContain("after update on public.jobs");
    expect(migration).toContain("old_values jsonb");
    expect(migration).toContain("new_values jsonb");
    expect(migration).toContain('create policy "job_edit_history_select_own_or_admin"');
    expect(migration).not.toMatch(/for\s+select\s+using\s+\(true\)/i);
    expect(migration).not.toMatch(/for\s+all\s+using\s+\(true\)/i);
  });

  test("Railway backend owns sensitive moderation and review actions", () => {
    const server = read("backend/server.js");
    const frontendFiles = fs
      .readdirSync(path.join(root, "kaam-karo-app", "js"))
      .filter((file) => file.endsWith(".js"))
      .map((file) => read(path.join("kaam-karo-app", "js", file)))
      .join("\n");

    expect(server).toContain('app.post("/security/signup-event"');
    expect(server).toContain('app.post("/moderation/check-job"');
    expect(server).toContain('app.post("/moderation/check-message"');
    expect(server).toContain('app.post("/reports"');
    expect(server).toContain('app.get("/admin/review-queue"');
    expect(server).toContain('app.post("/payments/create-order"');
    expect(server).toContain('app.post("/payments/verify"');
    expect(server).toContain('app.get("/locations/autocomplete"');
    expect(server).toContain("GOOGLE_PLACES_API_KEY");
    expect(server).toContain("razorpay_signature");
    expect(server).toContain("boosted: true");
    expect(server).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(frontendFiles).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(frontendFiles).not.toContain("SERVICE_ROLE_KEY");
  });

  test("production OTP and payment paths do not allow frontend demo success", () => {
    const auth = read("kaam-karo-app/js/auth.js");
    const payments = read("kaam-karo-app/js/payments.js");
    const jobs = read("kaam-karo-app/js/jobs.js");

    expect(auth).toContain("return isLocalPrototype() && cfg.devBypassOtp === true");
    expect(auth).toContain("Supabase auth is not configured");
    expect(payments).toContain("Payment backend is not configured");
    expect(payments).toContain("/payments/create-order");
    expect(payments).toContain("/payments/verify");
    expect(jobs).toContain("boosted: job.visibility === \"boost\" && job.paymentVerified === true");
  });
});
