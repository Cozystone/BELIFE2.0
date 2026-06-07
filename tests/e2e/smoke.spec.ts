import { expect, test } from "@playwright/test";

test.setTimeout(60_000);

test("mobile BELIFE shell routes protected app to native sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "BELIFE" })).toBeVisible();
  await page.getByRole("link", { name: "Talk now" }).click();
  await expect(page.getByRole("heading", { name: "Sign in to BELIFE" })).toBeVisible();
});

test("public start flow goes through sign-up before onboarding", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Start/ }).click();
  await expect(page.getByRole("heading", { name: "Create your BELIFE" })).toBeVisible();
});

test("native sign-up keeps a session for protected app APIs", async ({ page }, testInfo) => {
  const unauthorizedUrls: string[] = [];
  page.on("response", (response) => {
    if (response.status() === 401) unauthorizedUrls.push(response.url());
  });

  await page.goto("/sign-up");
  await expect(page.getByRole("heading", { name: "Create your BELIFE" })).toBeVisible();

  const uniqueEmail = `e2e-debug-${testInfo.project.name}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}@belife.test`;
  await page.getByPlaceholder("BELIFE에서 불릴 이름").fill("E2E Debug");
  await page.getByPlaceholder("you@example.com").fill(uniqueEmail);
  await page.getByPlaceholder("8자 이상").fill("debugpass123");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("heading", { name: "처음부터 완벽한 프로필은 필요 없어요" })).toBeVisible();
  const onboardingStatus = await page.evaluate(async () => {
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: "E2E Debug",
        role: "제품을 만드는 사람",
        mainWorry: "요즘 같은 걱정을 반복해서 생각합니다.",
        currentGoal: "BELIFE가 나의 패턴을 더 잘 이해하게 만들고 싶습니다.",
        importantValue: "정직함과 장기적인 신뢰",
        stressReaction: "스트레스를 받으면 혼자 오래 생각합니다.",
        emotionalClimate: "조용하지만 조금 예민합니다.",
        preferredTone: "차분하고 솔직하게",
        relationshipHope: "안전하고 오래 갈 수 있는 관계",
      }),
    });
    return response.status;
  });
  expect(onboardingStatus).toBe(200);

  const briefingStatus = await page.evaluate(async () => {
    const response = await fetch("/api/briefing");
    return response.status;
  });

  expect(briefingStatus).toBe(200);
  await page.goto("/app/today");
  await expect(page.getByRole("main").getByText("Today")).toBeVisible();
  await page.goto("/app/self-map");
  await expect(page.getByRole("heading", { name: "Memory Timeline" })).toBeVisible();
  const timelineResult = await page.evaluate(async () => {
    const response = await fetch("/api/memory/timeline?limit=12");
    const body = await response.json();
    return {
      status: response.status,
      itemCount: body.timeline.items.length,
      kinds: body.timeline.items.map((item: { kind: string }) => item.kind),
    };
  });

  expect(timelineResult.status).toBe(200);
  expect(timelineResult.itemCount).toBeGreaterThan(0);
  expect(timelineResult.kinds).toContain("memory");

  await page.goto("/app/settings");
  await expect(page.getByRole("heading", { name: "Data Trust Center" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Data Controls" })).toBeVisible();
  const exportResult = await page.evaluate(async () => {
    const response = await fetch("/api/memory/export");
    const body = await response.json();
    return {
      status: response.status,
      schemaVersion: body.schemaVersion,
      hasProfile: Boolean(body.profile),
      messageCount: body.inventory.counts.messages,
      ontologyNodeCount: body.inventory.counts.ontologyNodes,
    };
  });

  expect(exportResult).toMatchObject({
    status: 200,
    schemaVersion: 1,
    hasProfile: true,
  });
  expect(exportResult.messageCount).toBeGreaterThanOrEqual(0);
  expect(exportResult.ontologyNodeCount).toBeGreaterThanOrEqual(0);
  expect(unauthorizedUrls).toEqual([]);
});
