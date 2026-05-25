const { test, expect } = require("@playwright/test");
const {
  attachErrorGuards,
  openFresh,
  expectNoBrowserErrors,
  expectActiveScreen,
  seedWorker,
  go
} = require("./helpers");

async function skipVisibleJob(page) {
  await page.locator("#jobFeed [data-next-job]").filter({ visible: true }).click();
}

async function currentSwipeRecord(page) {
  return page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("kkState") || "{}");
    const records = Object.values(state.workerSwipeLimits || {});
    return records.find((record) => record && record.user_id === state.user.id) || records[records.length - 1] || null;
  });
}

async function setSwipeRecord(page, patch) {
  await page.evaluate((patchValue) => {
    const state = JSON.parse(localStorage.getItem("kkState") || "{}");
    state.workerSwipeLimits = state.workerSwipeLimits || {};
    const keys = Object.keys(state.workerSwipeLimits);
    const key = keys.find((item) => state.workerSwipeLimits[item] && state.workerSwipeLimits[item].user_id === state.user.id) || keys[keys.length - 1];
    if (!key) throw new Error("Swipe limit record was not created");
    Object.assign(state.workerSwipeLimits[key], patchValue);
    localStorage.setItem("kkState", JSON.stringify(state));
  }, patch);
  await page.reload();
  await go(page, "jobs");
}

test.describe("worker daily swipe limit and cooldown", () => {
  test("skip swipes consume the daily balance and persist cooldown through refresh", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page, 390);
    await seedWorker(page);
    await go(page, "jobs");

    await expect(page.locator("#jobFeed")).toContainText("25 swipes available today");
    await page.locator("#jobFeed .job-card").first().click();
    await expect(page.locator("#appModal")).toHaveClass(/show/);
    await page.locator("[data-close-modal]").click();
    await expect(page.locator("#jobFeed")).toContainText("25 swipes available today");

    await skipVisibleJob(page);
    await expect(page.locator("#jobFeed")).toContainText("24 swipes left today");

    await setSwipeRecord(page, { daily_swipe_count: 20, cooldown_until: null, cooldown_level: 0 });
    await expect(page.locator("#jobFeed")).toContainText("5 swipes left today");
    await expect(page.locator("#jobFeed")).toContainText("Choose the best jobs.");

    for (let i = 0; i < 5; i += 1) {
      await skipVisibleJob(page);
    }

    await expect(page.locator("#jobFeed")).toContainText("You've used today's fast apply limit.");
    await expect(page.locator("#jobFeed")).toContainText("More jobs unlock in");
    await expect(page.locator("#jobFeed [data-next-job]")).toHaveCount(0);
    await expect(page.locator("#jobFeed [data-apply-job]")).toHaveCount(0);

    let record = await currentSwipeRecord(page);
    expect(record.cooldown_level).toBe(1);
    expect(new Date(record.cooldown_until).getTime()).toBeGreaterThan(Date.now() + 100 * 60000);
    expect(new Date(record.cooldown_until).getTime()).toBeLessThan(Date.now() + 130 * 60000);

    await page.reload();
    await go(page, "jobs");
    await expect(page.locator("#jobFeed")).toContainText("You've used today's fast apply limit.");

    await page.locator("#jobFeed [data-go='applications']").click();
    await expectActiveScreen(page, "applications");
    await go(page, "jobs");
    await page.locator("#jobFeed [data-go='profile']").click();
    await expectActiveScreen(page, "profile");

    await expectNoBrowserErrors(errors);
  });

  test("second and third limit hits escalate cooldown level", async ({ page }) => {
    await openFresh(page, 390);
    await seedWorker(page);
    await go(page, "jobs");
    await skipVisibleJob(page);

    await setSwipeRecord(page, { daily_swipe_count: 24, cooldown_level: 1, cooldown_until: null });
    await skipVisibleJob(page);
    let record = await currentSwipeRecord(page);
    expect(record.cooldown_level).toBe(2);
    expect(new Date(record.cooldown_until).getTime()).toBeGreaterThan(Date.now() + 7 * 3600000);

    await setSwipeRecord(page, { daily_swipe_count: 24, cooldown_level: 2, cooldown_until: null });
    await skipVisibleJob(page);
    record = await currentSwipeRecord(page);
    expect(record.cooldown_level).toBe(3);
    expect(new Date(record.cooldown_until).getTime()).toBeGreaterThan(Date.now());
    await expect(page.locator("#jobFeed")).toContainText("You've used today's fast apply limit.");
  });

  test("new India day resets the swipe cycle", async ({ page }) => {
    await openFresh(page, 390);
    await seedWorker(page);
    await go(page, "jobs");
    await skipVisibleJob(page);

    await setSwipeRecord(page, {
      swipe_date: "2000-01-01",
      daily_swipe_count: 24,
      total_swipes_today: 74,
      cooldown_level: 3,
      cooldown_until: new Date(Date.now() + 8 * 3600000).toISOString(),
      reset_at: "2000-01-01T18:30:00.000Z"
    });
    await expect(page.locator("#jobFeed")).toContainText("25 swipes available today");
    const record = await currentSwipeRecord(page);
    expect(record.cooldown_level).toBe(0);
    expect(record.daily_swipe_count).toBe(0);
  });

  test("apply swipes count once and duplicate apply attempts do not spend balance", async ({ page }) => {
    await openFresh(page, 390);
    await seedWorker(page);
    await go(page, "jobs");

    await page.locator("#jobFeed [data-apply-job]").filter({ visible: true }).click();
    await expectActiveScreen(page, "applied");
    let record = await currentSwipeRecord(page);
    expect(record.total_swipes_today).toBe(1);

    await go(page, "jobs");
    await page.locator("#jobFeed [data-apply-job]").filter({ visible: true }).click();
    record = await currentSwipeRecord(page);
    expect(record.total_swipes_today).toBe(1);
  });
});
