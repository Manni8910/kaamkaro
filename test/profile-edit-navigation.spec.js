const { test, expect } = require("@playwright/test");
const {
  attachErrorGuards,
  openFresh,
  expectNoBrowserErrors,
  expectActiveScreen,
  seedWorker,
  seedEmployer,
  go
} = require("./helpers");

async function clickSave(page) {
  await page.locator("#profileEditBody [data-save-profile-edit]").filter({ visible: true }).click();
}

async function clickEditBack(page) {
  await page.locator("#appHeader [data-menu-back], #profileEdit [data-menu-back]").filter({ visible: true }).first().click();
}

async function chooseLocation(page, inputSelector, query, expectedText) {
  await page.locator(inputSelector).fill(query);
  const option = page.locator(".location-autocomplete.show button").filter({ hasText: expectedText }).first();
  await expect(option).toBeVisible();
  await option.click();
}

async function expectNoAuthOrSetupScreen(page) {
  const activeId = await page.evaluate(() => document.querySelector(".screen.active") && document.querySelector(".screen.active").id);
  expect(["landing", "otp", "otpCode", "role", "workerBasic", "workerWork", "workerSkills", "workerLocation", "workerTrust", "verifyId", "verifyProgress", "employerSetup"]).not.toContain(activeId);
}

test.describe("profile/settings edit mode navigation", () => {
  test("worker profile edits return to profile/settings and never onboarding", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page, 390);
    await seedWorker(page);
    await go(page, "profile");

    await page.locator('#profile [data-edit-profile="workerAge"]').click();
    await expectActiveScreen(page, "profileEdit");
    await expect(page.locator("#profileEditInput")).toHaveValue("25");
    await expect(page.locator("#profileEditBody [data-save-profile-edit]")).toContainText("Save Changes");
    await expect(page.locator("#profileEditBody [data-cancel-profile-edit]")).toContainText("Cancel");
    await page.locator("#profileEditInput").fill("30");
    await clickSave(page);
    await expectActiveScreen(page, "profile");
    await expect(page.locator("#workerProfileAgeText")).toContainText("30 years");
    let state = await page.evaluate(() => JSON.parse(localStorage.getItem("kkState")));
    expect(state.worker.age).toBe("30");

    await page.locator('#profile [data-edit-profile="workerAge"]').click();
    await expect(page.locator("#profileEditInput")).toHaveValue("30");
    await page.locator("#profileEditInput").fill("31");
    await clickEditBack(page);
    await expectActiveScreen(page, "profile");
    await expectNoAuthOrSetupScreen(page);
    state = await page.evaluate(() => JSON.parse(localStorage.getItem("kkState")));
    expect(state.worker.age).toBe("30");

    await go(page, "accountSettings");
    await page.locator('#accountSettings [data-edit-profile="accountName"]').click();
    await expectActiveScreen(page, "profileEdit");
    await page.locator("#profileEditInput").fill("Aman Updated");
    await clickSave(page);
    await expectActiveScreen(page, "accountSettings");
    await expect(page.locator("#accountNameView")).toContainText("Aman Updated");
    await expectNoAuthOrSetupScreen(page);

    await go(page, "profile");
    await page.locator('#profile [data-edit-profile="workerLocation"]').click();
    await chooseLocation(page, "#profileEditInput", "Bainsa", "Bainsa, Shaheed Bhagat Singh Nagar, Punjab");
    await clickSave(page);
    await expectActiveScreen(page, "profile");
    state = await page.evaluate(() => JSON.parse(localStorage.getItem("kkState")));
    expect(state.worker.city).toBe("Bainsa");
    expect(state.worker.district).toBe("Shaheed Bhagat Singh Nagar");
    expect(state.worker.state).toBe("Punjab");

    const beforeSkills = state.worker.skills.slice();
    await page.locator('#profile [data-edit-profile="workerSkills"]').click();
    await page.locator('[data-edit-suggest-skill="Driving"]').click();
    await clickEditBack(page);
    await expectActiveScreen(page, "profile");
    state = await page.evaluate(() => JSON.parse(localStorage.getItem("kkState")));
    expect(state.worker.skills).toEqual(beforeSkills);
    await expectNoBrowserErrors(errors);
  });

  test("employer profile edits return to employer profile and never setup/auth", async ({ page }) => {
    const errors = attachErrorGuards(page);
    await openFresh(page, 390);
    await seedEmployer(page);
    await go(page, "employerProfile");

    await page.locator('#employerProfile [data-edit-profile="businessName"]').click();
    await expectActiveScreen(page, "profileEdit");
    await page.locator("#profileEditInput").fill("New Business Name");
    await clickEditBack(page);
    await expectActiveScreen(page, "employerProfile");
    await expectNoAuthOrSetupScreen(page);
    let state = await page.evaluate(() => JSON.parse(localStorage.getItem("kkState")));
    expect(state.employer.business).toBe("QA Retail");

    await page.locator('#employerProfile [data-edit-profile="employerLocation"]').click();
    await chooseLocation(page, "#profileEditInput", "Chandigarh", "Chandigarh");
    await clickSave(page);
    await expectActiveScreen(page, "employerProfile");
    state = await page.evaluate(() => JSON.parse(localStorage.getItem("kkState")));
    expect(state.employer.city).toBe("Chandigarh");
    expect(state.employer.district).toBe("Chandigarh");
    expect(state.employer.state).toBe("Chandigarh");

    await page.locator('#employerProfile [data-edit-profile="businessType"]').click();
    await page.locator("#profileEditInput").fill("Restaurant");
    await clickEditBack(page);
    await expectActiveScreen(page, "employerProfile");
    state = await page.evaluate(() => JSON.parse(localStorage.getItem("kkState")));
    expect(state.employer.type).toBe("Retail Shop");
    await expectNoBrowserErrors(errors);
  });
});
