const { test, expect } = require("@playwright/test");
const {
  attachErrorGuards,
  openFresh,
  expectNoBrowserErrors,
  expectActiveScreen,
  seedEmployer,
  go
} = require("./helpers");

const VALID_DESCRIPTION = "Daily tasks include helping customers, handling stock, keeping the area clean, and supporting the team during busy hours.";

test.describe("employer live job edit and repost lifecycle", () => {
  test("live edit updates the same job without resetting expiry or applicants", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page);
    await seedEmployer(page);
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("kkState"));
      state.applications = [{
        id: "qa-app-1",
        jobId: "qa-job-1",
        workerId: "qa-worker-applicant",
        employerId: "qa-biz",
        status: "Interested",
        createdAt: Date.now()
      }];
      localStorage.setItem("kkState", JSON.stringify(state));
    });
    await page.reload();
    await go(page, "employerDash");

    const before = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("kkState"));
      return { jobs: state.jobs.length, expiresAt: state.jobs[0].expiresAt, apps: state.applications.length };
    });

    await page.locator('[data-job-detail="qa-job-1"]').first().click();
    await expectActiveScreen(page, "employerJobDetail");
    await page.locator('#jobDetailActions [data-edit-job="qa-job-1"]').click();
    await expectActiveScreen(page, "postJob");
    await expect(page.locator("#postJobHeading")).toHaveText("Edit live job");
    await expect(page.locator("#postEditWarning")).toContainText("Editing will not extend your post duration");
    await expect(page.locator("#postTitle")).toHaveValue("Office Clerk");

    await page.locator("#postPayAmount").fill("19000");
    await page.locator("#postShift").fill("Morning shift");
    await page.locator("#postOpenings").fill("3");
    await page.locator("#postDesc").fill(VALID_DESCRIPTION);
    await page.locator("#postRequirements").fill("Basic customer service and stock handling.");
    await page.locator("[data-review-job]").click();

    await expectActiveScreen(page, "employerJobDetail");
    await expect(page.locator("#toast")).toContainText("Job updated.");
    const after = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("kkState"));
      const job = state.jobs.find((item) => item.id === "qa-job-1");
      return {
        jobs: state.jobs.length,
        expiresAt: job.expiresAt,
        apps: state.applications.length,
        pay: job.pay,
        shift: job.shift,
        openings: job.openings,
        requirements: job.requirements,
        history: state.jobEditHistory
      };
    });
    expect(after.jobs).toBe(before.jobs);
    expect(after.expiresAt).toBe(before.expiresAt);
    expect(after.apps).toBe(before.apps);
    expect(after.pay).toContain("19000");
    expect(after.shift).toBe("Morning shift");
    expect(after.openings).toBe(3);
    expect(after.requirements).toContain("customer service");
    expect(after.history).toHaveLength(1);
    expect(after.history[0].jobId).toBe("qa-job-1");
    expect(after.history[0].changeType).toBe("minor");
    await expectNoBrowserErrors(errors);
  });

  test("expired job shows repost and creates a fresh record without carrying applicants", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page);
    await seedEmployer(page);
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("kkState"));
      const job = state.jobs[0];
      job.status = "Expired";
      job.createdAt = Date.now() - 40 * 86400000;
      job.expiresAt = Date.now() - 25 * 86400000;
      state.applications = [{ id: "qa-old-app", jobId: job.id, workerId: "qa-worker-applicant", employerId: "qa-biz", status: "Interested" }];
      localStorage.setItem("kkState", JSON.stringify(state));
    });
    await page.reload();
    await go(page, "employerJobs");

    await expect(page.locator('[data-edit-job="qa-job-1"]')).toHaveCount(0);
    await page.locator('#employerJobsList [data-repost-job="qa-job-1"]').click();
    await expectActiveScreen(page, "postJob");
    await expect(page.locator("#postJobHeading")).toHaveText("Repost job");
    await expect(page.locator("#postTitle")).toHaveValue("Office Clerk");

    await page.locator("#postDesc").fill(VALID_DESCRIPTION);
    await page.locator("[data-review-job]").click();
    await expectActiveScreen(page, "jobVisibility");
    await page.locator('[data-visibility="free"]').click();
    await page.locator("#jobRules").check();
    await page.locator("[data-post-job]").click();
    await page.locator("[data-confirm-post-job]").click();
    await expectActiveScreen(page, "published");

    const result = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("kkState"));
      const employerJobs = state.jobs.filter((item) => item.businessId === "qa-biz");
      const fresh = employerJobs.find((item) => item.repostedFromJobId === "qa-job-1");
      return {
        jobs: employerJobs.length,
        repostedFromJobId: fresh && fresh.repostedFromJobId,
        expiresAt: fresh && fresh.expiresAt,
        freshApplicants: state.applications.filter((app) => fresh && app.jobId === fresh.id).length,
        oldApplicants: state.applications.filter((app) => app.jobId === "qa-job-1").length
      };
    });
    expect(result.jobs).toBe(2);
    expect(result.repostedFromJobId).toBe("qa-job-1");
    expect(result.expiresAt).toBeGreaterThan(Date.now());
    expect(result.freshApplicants).toBe(0);
    expect(result.oldApplicants).toBe(1);
    await expectNoBrowserErrors(errors);
  });

  test("another employer job is not exposed in the employer manage list", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page);
    await seedEmployer(page);
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("kkState"));
      state.jobs.push({
        id: "other-employer-job",
        businessId: "another-business",
        employerId: "another-business",
        title: "Private Job",
        pay: "Rs 20000 month",
        city: "Delhi",
        type: "Full Time",
        desc: "This job belongs to a different employer and must never appear in the current employer manage list.",
        status: "approved",
        createdAt: Date.now(),
        expiresAt: Date.now() + 15 * 86400000
      });
      localStorage.setItem("kkState", JSON.stringify(state));
    });
    await page.reload();
    await go(page, "employerJobs");
    await expect(page.locator('[data-job-detail="other-employer-job"]')).toHaveCount(0);
    await expect(page.locator('[data-edit-job="other-employer-job"]')).toHaveCount(0);
    await expectNoBrowserErrors(errors);
  });
});
