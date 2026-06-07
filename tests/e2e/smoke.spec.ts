import { expect, test, type Page } from "@playwright/test";

test.setTimeout(60_000);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exactMessage(page: Page, content: string) {
  return page.locator("p.whitespace-pre-wrap").filter({ hasText: new RegExp(`^${escapeRegExp(content)}$`) });
}

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
  await page.addInitScript(() => {
    class MockSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: { results: Array<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;

      start() {
        window.setTimeout(() => {
          this.onresult?.({
            results: [{ 0: { transcript: "voice transcript e2e" }, isFinal: true }],
          });
        }, 0);
      }

      stop() {
        window.setTimeout(() => this.onend?.(), 0);
      }

      abort() {
        window.setTimeout(() => this.onend?.(), 0);
      }
    }

    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: MockSpeechRecognition,
    });
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
  const staleContent = `stale-conversation-${Date.now()}`;
  const staleConversationResult = await page.evaluate(async (content) => {
    const created = await fetch("/api/conversations", { method: "POST" });
    const createdBody = await created.json();
    const message = await fetch(`/api/conversations/${createdBody.conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, source: "text" }),
    });
    return {
      createStatus: created.status,
      messageStatus: message.status,
      conversationId: createdBody.conversationId as string,
    };
  }, staleContent);
  expect(staleConversationResult.createStatus).toBe(200);
  expect(staleConversationResult.messageStatus).toBe(200);

  const ownerConversationId = await page.evaluate(async () => {
    const response = await fetch("/api/conversations", { method: "POST" });
    const body = await response.json();
    return body.conversationId as string;
  });
  expect(ownerConversationId).toBeTruthy();
  const continuitySeed = `continuity-seed-${Date.now()}`;
  const continuityFollowup = `continuity-followup-${Date.now()}`;
  const seedMessageResult = await page.evaluate(
    async ({ conversationId, content }) => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, source: "text" }),
      });
      const body = await response.json();
      return {
        status: response.status,
        conversationId: body.userMessage?.conversationId,
      };
    },
    { conversationId: ownerConversationId, content: continuitySeed },
  );
  expect(seedMessageResult).toMatchObject({
    status: 200,
    conversationId: ownerConversationId,
  });

  await page.goto("/app/talk");
  await expect(exactMessage(page, continuitySeed)).toBeVisible();
  await expect(exactMessage(page, staleContent)).toHaveCount(0);
  const talkInput = page.locator("textarea");
  const voiceButton = page.getByRole("button", { name: "Voice" });
  await voiceButton.dispatchEvent("pointerdown", {
    pointerId: 1,
    pointerType: "touch",
    isPrimary: true,
    buttons: 1,
  });
  await expect(talkInput).toHaveValue("voice transcript e2e");
  await page.getByRole("button", { name: "Stop" }).dispatchEvent("pointerup", {
    pointerId: 1,
    pointerType: "touch",
    isPrimary: true,
    buttons: 0,
  });
  await expect(talkInput).toHaveValue("voice transcript e2e");
  await talkInput.fill("");
  const staleConversationLink = page.locator(`a[href="/app/talk?conversation=${staleConversationResult.conversationId}"]`);
  const activeConversationLink = page.locator(`a[href="/app/talk?conversation=${ownerConversationId}"]`);
  await expect(staleConversationLink).toBeVisible();
  await expect(activeConversationLink).toBeVisible();
  await Promise.all([
    page.waitForURL(`**/app/talk?conversation=${staleConversationResult.conversationId}`),
    staleConversationLink.click(),
  ]);
  await expect(exactMessage(page, staleContent)).toBeVisible();
  await expect(exactMessage(page, continuitySeed)).toHaveCount(0);
  await Promise.all([
    page.waitForURL(`**/app/talk?conversation=${ownerConversationId}`),
    page.locator(`a[href="/app/talk?conversation=${ownerConversationId}"]`).click(),
  ]);
  await expect(exactMessage(page, continuitySeed)).toBeVisible();
  await expect(exactMessage(page, staleContent)).toHaveCount(0);
  await talkInput.fill(continuityFollowup);
  const followupResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes(`/api/conversations/${ownerConversationId}/messages`),
  );
  await page.getByRole("button", { name: "Send" }).click();
  expect((await followupResponse).status()).toBe(200);
  await expect(exactMessage(page, continuityFollowup)).toBeVisible();
  const continuityExportResult = await page.evaluate(
    async ({ seed, followup }) => {
      const response = await fetch("/api/memory/export");
      const body = await response.json();
      const matches = body.messages
        .filter((message: { content: string }) => message.content === seed || message.content === followup)
        .map((message: { content: string; conversationId: string }) => ({
          content: message.content,
          conversationId: message.conversationId,
        }));
      return { status: response.status, matches };
    },
    { seed: continuitySeed, followup: continuityFollowup },
  );
  expect(continuityExportResult.status).toBe(200);
  expect(continuityExportResult.matches).toEqual(
    expect.arrayContaining([
      { content: continuitySeed, conversationId: ownerConversationId },
      { content: continuityFollowup, conversationId: ownerConversationId },
    ]),
  );

  await page.goto("/app/today");
  await expect(page.getByRole("main").getByText("Today")).toBeVisible();
  await page.getByRole("link", { name: /반복 생각 풀기/ }).click();
  await expect(page).toHaveURL(/\/app\/talk\?conversation=new&draft=/);
  await expect(page.locator("textarea")).toHaveValue(/반복해서 떠오르는 생각/);
  await page.goto("/app/today");
  await expect(page.getByRole("heading", { name: "State History" })).toBeVisible();
  const stateHistoryResult = await page.evaluate(async () => {
    const response = await fetch("/api/state/history?limit=8");
    const body = await response.json();
    return {
      status: response.status,
      hasCurrent: Boolean(body.history.current),
      itemCount: body.history.items.length,
    };
  });

  expect(stateHistoryResult).toMatchObject({
    status: 200,
    hasCurrent: true,
  });
  expect(stateHistoryResult.itemCount).toBeGreaterThan(0);

  await page.goto("/app/self-map");
  await expect(page.getByRole("heading", { name: "Memory Timeline" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ontology Edges" })).toBeVisible();
  const ontologyResult = await page.evaluate(async () => {
    const response = await fetch("/api/ontology?view=expanded");
    const body = await response.json();
    return {
      status: response.status,
      nodeCount: body.nodes.length,
      edgeCount: body.edges.length,
      graphEdgeCount: body.graph.edges.length,
    };
  });

  expect(ontologyResult.status).toBe(200);
  expect(ontologyResult.nodeCount).toBeGreaterThan(0);
  expect(ontologyResult.edgeCount).toBeGreaterThan(0);
  expect(ontologyResult.graphEdgeCount).toBe(ontologyResult.edgeCount);
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

  await page.goto("/app/twin");
  await expect(page.getByRole("heading", { name: "Digital Twin" })).toBeVisible();
  const twinResult = await page.evaluate(async () => {
    const response = await fetch("/api/twin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "왜 같은 걱정이 반복되는지 알려줘" }),
    });
    const body = await response.json();
    return {
      status: response.status,
      hasAnswer: Boolean(body.answer),
      evidenceCount: body.reflection.evidence.length,
      confidenceLabel: body.reflection.confidenceLabel,
    };
  });

  expect(twinResult.status).toBe(200);
  expect(twinResult.hasAnswer).toBe(true);
  expect(twinResult.evidenceCount).toBeGreaterThan(0);
  expect(twinResult.confidenceLabel).toMatch(/early|forming|grounded|strong/);
  await page.getByRole("button", { name: "Ask Twin" }).click();
  await expect(page.getByRole("heading", { name: "Evidence" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Uncertainty" })).toBeVisible();

  await page.goto("/app/settings");
  await expect(page.getByRole("heading", { name: "Data Trust Center" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Data Controls" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Profile Enrichment" })).toBeVisible();
  const skipSuggestion = page.getByRole("button", { name: "Skip for now" }).first();
  await expect(skipSuggestion).toBeVisible();
  await skipSuggestion.click();
  await expect(page.getByText("이번 제안은 건너뛰었습니다.")).toBeVisible();
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

  const crossUserResult = await page.evaluate(async (conversationId) => {
    await fetch("/api/auth/native/sign-out", { method: "POST" });
    const email = `e2e-intruder-${Date.now()}-${Math.random().toString(36).slice(2)}@belife.test`;
    const signUp = await fetch("/api/auth/native/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "debugpass123",
        displayName: "E2E Intruder",
      }),
    });
    const attack = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "남의 대화에 쓰면 안 됩니다.", source: "text" }),
    });
    const body = await attack.json();
    return {
      signUpStatus: signUp.status,
      intruderEmail: email,
      attackStatus: attack.status,
      code: body.code,
    };
  }, ownerConversationId);

  expect(crossUserResult).toMatchObject({
    signUpStatus: 200,
    attackStatus: 404,
    code: "CONVERSATION_NOT_FOUND",
  });

  const wrongSignInResult = await page.evaluate(async (email) => {
    const response = await fetch("/api/auth/native/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "wrongpass123" }),
    });
    const body = await response.json();
    return {
      status: response.status,
      ok: body.ok,
      error: body.error,
    };
  }, crossUserResult.intruderEmail);

  expect(wrongSignInResult).toMatchObject({
    status: 200,
    ok: false,
    error: "Invalid email or password.",
  });
  expect(unauthorizedUrls).toEqual([]);
});
