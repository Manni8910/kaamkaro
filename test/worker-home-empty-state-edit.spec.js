const { test, expect } = require("@playwright/test");
const {
  attachErrorGuards,
  openFresh,
  expectNoBrowserErrors,
  expectActiveScreen,
  seedWorker,
  go
} = require("./helpers");

async function forceNoJobs(page) {
  await page.evaluate(() => {
    localStorage.setItem("kkDisableDemoData", "true");
    const state = JSON.parse(localStorage.getItem("kkState") || "{}");
    state.jobs = [];
    localStorage.setItem("kkState", JSON.stringify(state));
  });
  await page.reload();
  await go(page, "jobs");
  await expect(page.locator("#jobFeed")).toContainText("No jobs right now");
}

async function chooseLocation(page, query, expectedText) {
  await page.locator("#profileEditInput").fill(query);
  const option = page.locator(".location-autocomplete.show button").filter({ hasText: expectedText }).first();
  await expect(option).toBeVisible();
  await option.click();
}

async function expectNoOnboarding(page) {
  const activeId = await page.evaluate(() => document.querySelector(".screen.active") && document.querySelector(".screen.active").id);
  expect(["landing", "otp", "otpCode", "role", "workerBasic", "workerWork", "workerSkills", "workerLocation", "workerTrust", "verifyId", "verifyProgress"]).not.toContain(activeId);
}

test.describe("worker home empty-state quick edits", () => {
  test("Update availability opens standalone edit and returns to Job Feed", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page, 390);
    await seedWorker(page);
    await forceNoJobs(page);

    await page.locator('[data-worker-home-edit="availability"]').click();
    await expectActiveScreen(page, "profileEdit");
    await expect(page.locator("#profileEdit #profileEditTitle")).toContainText("Update availability");
    await expect(page.locator("#profileEdit #profileEditHint")).toContainText("Choose when you're available for work.");
    await expect(page.locator("#profileEditBody [data-save-profile-edit]")).toContainText("Save availability");
    await page.locator("#profileEditBody [data-cancel-profile-edit]").click();
    await expectActiveScreen(page, "jobs");
    await expectNoOnboarding(page);

    await page.locator('[data-worker-home-edit="availability"]').click();
    await page.locator('[data-edit-start="On Demand"]').click();
    await page.locator("#profileEditBody [data-save-profile-edit]").click();
    await expectActiveScreen(page, "jobs");
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem("kkState")));
    expect(state.worker.startAvailability).toBe("On Demand");
    await expect(page.locator("#jobFeed")).toContainText("No jobs right now");
    await expectNoBrowserErrors(errors);
  });

  test("Search another city opens location edit, requires structured save, and returns to Job Feed", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page, 390);
    await seedWorker(page);
    await forceNoJobs(page);

    await page.locator('[data-worker-home-edit="location"]').click();
    await expectActiveScreen(page, "profileEdit");
    await expect(page.locator("#profileEdit #profileEditTitle")).toContainText("Search another city");
    await expect(page.locator("#profileEdit #profileEditHint")).toContainText("Choose a city, village or area to find nearby jobs.");
    await expect(page.locator("#profileEditBody [data-save-profile-edit]")).toContainText("Save location");
    await page.locator("#profileEditBody [data-cancel-profile-edit]").click();
    await expectActiveScreen(page, "jobs");
    await expectNoOnboarding(page);

    await page.locator('[data-worker-home-edit="location"]').click();
    await page.locator("#profileEditInput").fill("Random Wrong Place");
    await page.locator("#profileEditBody [data-save-profile-edit]").click();
    await expect(page.locator("#toast")).toContainText("Please select a location from the list.");
    await chooseLocation(page, "Bainsa", "Bainsa, Shaheed Bhagat Singh Nagar, Punjab");
    await page.locator("#profileEditBody [data-save-profile-edit]").click();
    await expectActiveScreen(page, "jobs");

    const result = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("kkState"));
      return {
        city: state.worker.city,
        district: state.worker.district,
        state: state.worker.state,
        formatted: state.worker.formatted_location,
        activeCity: localStorage.getItem("kkActiveCity")
      };
    });
    expect(result.city).toBe("Bainsa");
    expect(result.district).toBe("Shaheed Bhagat Singh Nagar");
    expect(result.state).toBe("Punjab");
    expect(result.formatted).toContain("Bainsa, Shaheed Bhagat Singh Nagar, Punjab");
    expect(result.activeCity).toBe("Bainsa");
    await expect(page.locator("#jobFeed")).toContainText("No jobs right now");
    await expectNoBrowserErrors(errors);
  });
});
