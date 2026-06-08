import { expect, test, type Page } from "@playwright/test";

test.setTimeout(180_000);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exactMessage(page: Page, content: string) {
  return page.locator("p.whitespace-pre-wrap").filter({ hasText: new RegExp(`^${escapeRegExp(content)}$`) });
}

test("mobile BELIFE shell routes protected app to native sign-in", async ({ page }) => {
  const unauthorizedUrls: string[] = [];
  page.on("response", (response) => {
    if (response.status() === 401) unauthorizedUrls.push(response.url());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "BELIFE" })).toBeVisible();
  await page.getByRole("link", { name: "Talk now" }).click();
  await expect(page.getByRole("heading", { name: "Sign in to BELIFE" })).toBeVisible();
  expect(unauthorizedUrls).toEqual([]);
});

test("public start flow goes through sign-up before onboarding", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Start/ }).click();
  await expect(page.getByRole("heading", { name: "Create your BELIFE" })).toBeVisible();
});

test("native sign-up keeps a session for protected app APIs", async ({ page }, testInfo) => {
  const unauthorizedUrls: string[] = [];
  const hydrationErrors: string[] = [];
  const ontologyApiUrls: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("A tree hydrated")) {
      hydrationErrors.push(message.text());
    }
  });
  page.on("response", (response) => {
    if (response.status() === 401) unauthorizedUrls.push(response.url());
    if (response.url().includes("/api/ontology")) ontologyApiUrls.push(response.url());
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
  const onboardingValues = [
    "E2E Debug",
    "제품을 만드는 사람",
    "요즘 같은 걱정을 반복해서 생각합니다.",
    "BELIFE가 나의 패턴을 더 잘 이해하게 만들고 싶습니다.",
    "정직함과 장기적인 신뢰",
    "스트레스를 받으면 혼자 오래 생각합니다.",
    "조용하지만 조금 예민합니다.",
    "차분하고 솔직하게",
    "안전하고 오래 갈 수 있는 관계",
  ];
  const onboardingInputs = page.locator("main input");
  await expect(onboardingInputs).toHaveCount(onboardingValues.length);
  for (const [index, value] of onboardingValues.entries()) {
    await onboardingInputs.nth(index).fill(value);
  }
  const onboardingResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/onboarding") && response.request().method() === "POST",
    { timeout: 45_000 },
  );
  await page.getByRole("button", { name: "Start BELIFE" }).click();
  expect((await onboardingResponsePromise).status()).toBe(200);
  await page.waitForURL(/\/app\/talk\?conversation=new&draft=/, { timeout: 30_000 });
  await expect(page.locator("textarea")).toHaveValue(/BELIFE 첫 대화/);

  const briefingStatus = await page.evaluate(async () => {
    const response = await fetch("/api/briefing");
    const body = await response.json();
    return {
      status: response.status,
      evidenceLedgerCount: body.briefing?.evidenceLedger?.length ?? 0,
    };
  });

  expect(briefingStatus.status).toBe(200);
  expect(briefingStatus.evidenceLedgerCount).toBeGreaterThan(0);
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
  await expect(page.getByText("Evidence Ledger")).toBeVisible();
  await expect(page.getByRole("heading", { name: "State Dynamics" })).toBeVisible();
  const remindersSection = page.locator("section", { hasText: "Pattern reminders" });
  await expect(remindersSection).toBeVisible();
  await remindersSection.getByRole("link").first().click();
  await expect(page).toHaveURL(/\/app\/talk\?conversation=new&draft=/);
  await expect(page.locator("textarea")).toHaveValue(/정리해줘|물어봐줘|조정하면|해석해줘/);
  await page.goto("/app/today");
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
  const stateDynamicsResult = await page.evaluate(async () => {
    const response = await fetch("/api/state/dynamics?limit=12");
    const body = await response.json();
    return {
      status: response.status,
      modelKind: body.dynamics?.modelKind,
      sampleSize: body.dynamics?.sampleSize,
      couplingCount: body.dynamics?.couplings?.length ?? 0,
      guardrail: body.dynamics?.guardrail ?? "",
      baselineLevel: body.dynamics?.baselineShift?.level,
    };
  });

  expect(stateDynamicsResult.status).toBe(200);
  expect(stateDynamicsResult.modelKind).toMatch(/lagged-delta|early-heuristic/);
  expect(stateDynamicsResult.sampleSize).toBeGreaterThan(0);
  expect(stateDynamicsResult.couplingCount).toBeGreaterThan(0);
  expect(stateDynamicsResult.guardrail).toContain("not diagnosis");
  expect(stateDynamicsResult.baselineLevel).toMatch(/low|moderate|high/);

  const ontologyCallsBeforeSelfMap = ontologyApiUrls.length;
  await page.goto("/app/self-map");
  await expect(page.getByRole("heading", { name: "Memory Timeline" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ontology Edges" })).toBeVisible();
  expect(ontologyApiUrls.length).toBe(ontologyCallsBeforeSelfMap);
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
    const response = await fetch("/api/memory/timeline?limit=24");
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
  expect(timelineResult.kinds).toContain("ontology_edge");

  await page.goto("/app/twin");
  await expect(page.getByRole("heading", { name: "Digital Twin" })).toBeVisible();
  const twinResult = await page.evaluate(async (question) => {
    const response = await fetch("/api/twin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const body = await response.json();
    return {
      status: response.status,
      hasAnswer: Boolean(body.answer),
      evidenceCount: body.reflection.evidence.length,
      evidenceSources: body.reflection.evidence.map((item: { source: string }) => item.source),
      confidenceLabel: body.reflection.confidenceLabel,
      trustGateScore: body.reflection.trustGate?.score,
      trustGateCeiling: body.reflection.trustGate?.ceiling,
    };
  }, `Why did I say ${continuityFollowup}, and what memory evidence supports it?`);

  expect(twinResult.status).toBe(200);
  expect(twinResult.hasAnswer).toBe(true);
  expect(twinResult.evidenceCount).toBeGreaterThan(0);
  expect(twinResult.evidenceSources.some((source: string) => source === "memory" || source === "message")).toBe(true);
  expect(twinResult.confidenceLabel).toMatch(/early|forming|grounded|strong/);
  expect(twinResult.trustGateScore).toBeGreaterThanOrEqual(0);
  expect(twinResult.trustGateCeiling).toBeGreaterThan(0);
  const twinUiResponse = page.waitForResponse(
    (response) => response.request().method() === "POST" && response.url().includes("/api/twin"),
    { timeout: 45_000 },
  );
  await page.getByRole("button", { name: "Ask Twin" }).click();
  expect((await twinUiResponse).status()).toBe(200);
  await expect(page.getByText("Data trust gate")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Evidence" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Uncertainty" })).toBeVisible();

  await page.goto("/app/connection");
  await expect(page.getByRole("heading", { name: "Human Connection Preview" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hidden Graph" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Incremental Reranking" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Candidate Filters" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Relationship Memory" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Connection Quality Lens" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dyadic Coping Lens" })).toBeVisible();
  await expect(page.getByText("Edge strength", { exact: true })).toBeVisible();
  const rerankingResult = await page.evaluate(async () => {
    const response = await fetch("/api/connection/reranking");
    const body = await response.json();
    return {
      status: response.status,
      modeCount: body.report?.modeRanking?.length ?? 0,
      signalCount: body.report?.signals?.length ?? 0,
      guardrail: body.report?.guardrail ?? "",
      directions: body.report?.signals?.map((signal: { direction: string }) => signal.direction) ?? [],
    };
  });

  expect(rerankingResult.status).toBe(200);
  expect(rerankingResult.modeCount).toBe(3);
  expect(rerankingResult.signalCount).toBeGreaterThan(0);
  expect(rerankingResult.guardrail).toContain("not public matching");
  expect(rerankingResult.directions.some((direction: string) => ["new", "up", "down", "stable"].includes(direction))).toBe(true);
  const candidateFilterResult = await page.evaluate(async () => {
    const response = await fetch("/api/connection/candidates");
    const body = await response.json();
    return {
      status: response.status,
      candidateCount: body.report?.candidates?.length ?? 0,
      guardrail: body.report?.guardrail ?? "",
      statuses: body.report?.candidates?.map((candidate: { status: string }) => candidate.status) ?? [],
    };
  });

  expect(candidateFilterResult.status).toBe(200);
  expect(candidateFilterResult.candidateCount).toBeGreaterThan(0);
  expect(candidateFilterResult.guardrail).toContain("not public matching");
  expect(candidateFilterResult.statuses.some((status: string) => ["prioritize", "watch", "defer"].includes(status))).toBe(true);
  const relationshipMemoryResult = await page.evaluate(async () => {
    const saved = await fetch("/api/connection/relationship-memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personLabel: "E2E relationship context",
        relationshipType: "friendship",
        interactionNote:
          "This person listened carefully, reflected what mattered, and a small misunderstanding became calmer after we clarified it.",
        interactionQuality: 0.74,
        emotionalSafety: 0.7,
        reciprocity: 0.68,
        repairAttempted: true,
        consent: true,
      }),
    });
    const savedBody = await saved.json();
    const listed = await fetch("/api/connection/relationship-memory?personLabel=E2E%20relationship%20context");
    const listedBody = await listed.json();
    return {
      saveStatus: saved.status,
      ok: savedBody.ok,
      savedChunks: savedBody.extracted?.memoryChunks,
      listStatus: listed.status,
      pairCount: listedBody.report?.pairCount,
      totalInteractions: listedBody.report?.totalInteractions,
      guardrail: listedBody.report?.guardrail ?? "",
      firstPair: listedBody.report?.pairs?.[0],
    };
  });

  expect(relationshipMemoryResult.saveStatus).toBe(200);
  expect(relationshipMemoryResult.ok).toBe(true);
  expect(relationshipMemoryResult.savedChunks).toBeGreaterThan(0);
  expect(relationshipMemoryResult.listStatus).toBe(200);
  expect(relationshipMemoryResult.pairCount).toBe(1);
  expect(relationshipMemoryResult.totalInteractions).toBeGreaterThan(0);
  expect(relationshipMemoryResult.guardrail).toContain("not public matching");
  expect(relationshipMemoryResult.firstPair.personLabel).toBe("E2E relationship context");
  expect(relationshipMemoryResult.firstPair.interactionCount).toBeGreaterThan(0);
  const connectionQualityResult = await page.evaluate(async () => {
    const response = await fetch("/api/connection/quality?personLabel=E2E%20relationship%20context");
    const body = await response.json();
    return {
      status: response.status,
      axisCount: body.report?.axes?.length ?? 0,
      guardrail: body.report?.guardrail ?? "",
      axisKeys: body.report?.axes?.map((axis: { key: string }) => axis.key) ?? [],
      pairCount: body.report?.memoryCoverage?.pairCount,
      totalInteractions: body.report?.memoryCoverage?.totalInteractions,
    };
  });

  expect(connectionQualityResult.status).toBe(200);
  expect(connectionQualityResult.axisCount).toBe(4);
  expect(connectionQualityResult.guardrail).toContain("not public matching");
  expect(connectionQualityResult.axisKeys).toEqual([
    "sharedReality",
    "partnerResponsiveness",
    "participantInterest",
    "affectiveExperience",
  ]);
  expect(connectionQualityResult.pairCount).toBe(1);
  expect(connectionQualityResult.totalInteractions).toBeGreaterThan(0);
  const dyadicCopingResult = await page.evaluate(async () => {
    const response = await fetch("/api/connection/dyadic-coping?personLabel=E2E%20relationship%20context");
    const body = await response.json();
    return {
      status: response.status,
      axisCount: body.report?.axes?.length ?? 0,
      guardrail: body.report?.guardrail ?? "",
      axisKeys: body.report?.axes?.map((axis: { key: string }) => axis.key) ?? [],
      pairCount: body.report?.memoryCoverage?.pairCount,
      supportMoveCount: body.report?.supportMoves?.length ?? 0,
      riskSignalCount: body.report?.riskSignals?.length ?? 0,
      vsaCounts: [
        body.report?.vsa?.enduringVulnerabilities?.length ?? 0,
        body.report?.vsa?.stressfulEvents?.length ?? 0,
        body.report?.vsa?.adaptiveProcesses?.length ?? 0,
      ],
    };
  });

  expect(dyadicCopingResult.status).toBe(200);
  expect(dyadicCopingResult.axisCount).toBe(5);
  expect(dyadicCopingResult.guardrail).toContain("not public matching");
  expect(dyadicCopingResult.axisKeys).toEqual([
    "stressCommunication",
    "supportiveResponse",
    "jointRegulation",
    "repairAfterStress",
    "withdrawalRisk",
  ]);
  expect(dyadicCopingResult.pairCount).toBe(1);
  expect(dyadicCopingResult.supportMoveCount).toBeGreaterThan(0);
  expect(dyadicCopingResult.riskSignalCount).toBeGreaterThan(0);
  expect(dyadicCopingResult.vsaCounts.every((count: number) => count > 0)).toBe(true);
  await expect(page.getByRole("heading", { name: "Custom Scenario Simulation" })).toBeVisible();
  await page.getByRole("button", { name: "Run simulation" }).click();
  await expect(page.getByRole("heading", { name: "Simulation result" })).toBeVisible();
  await expect(page.getByText(/not a prediction/)).toBeVisible();
  const connectionTimelineResult = await page.evaluate(async () => {
    const response = await fetch("/api/memory/timeline?limit=24");
    const body = await response.json();
    return {
      status: response.status,
      kinds: body.timeline.items.map((item: { kind: string }) => item.kind),
    };
  });

  expect(connectionTimelineResult.status).toBe(200);
  expect(connectionTimelineResult.kinds).toContain("connection");
  await page.getByRole("link", { name: "Rehearse in Talk" }).first().click();
  await expect(page).toHaveURL(/\/app\/talk\?conversation=new&draft=/);
  await expect(page.locator("textarea")).toHaveValue(/관계 장면을 연습하고 싶어/);

  await page.goto("/app/settings");
  await expect(page.getByRole("heading", { name: "Data Trust Center" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Memory Health" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Privacy Preferences" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Memory Import" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Memory Correction" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Data Controls" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Profile Enrichment" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI Runtime" })).toBeVisible();
  await expect(page.getByText("Interpretation guardrail")).toBeVisible();
  await expect(page.getByText("Next trust gains")).toBeVisible();
  await expect(page.getByText(/Live Ollama|Deterministic fallback/)).toBeVisible();
  await expect(page.getByText("Ontology edges")).toBeVisible();
  const aiHealthResult = await page.evaluate(async () => {
    const response = await fetch("/api/health/ai");
    const body = await response.json();
    return {
      status: response.status,
      mode: body.runtime?.mode,
      requiredEnv: body.runtime?.requiredEnv,
      chatModel: body.runtime?.chatModel,
      healthPath: body.runtime?.healthPath,
    };
  });

  expect(aiHealthResult.status).toBe(200);
  expect(aiHealthResult.mode).toMatch(/live|fallback/);
  expect(aiHealthResult.requiredEnv).toContain("OLLAMA_BASE_URL");
  expect(aiHealthResult.chatModel).toBeTruthy();
  expect(aiHealthResult.healthPath).toBe("/api/health/ai");
  const dataTrustApiResult = await page.evaluate(async () => {
    const response = await fetch("/api/data-trust");
    const body = await response.json();
    return {
      status: response.status,
      score: body.dataTrust?.score,
      weakestCount: body.audit?.weakestSignals?.length,
      actionCount: body.audit?.nextActions?.length,
    };
  });

  expect(dataTrustApiResult.status).toBe(200);
  expect(dataTrustApiResult.score).toBeGreaterThanOrEqual(0);
  expect(dataTrustApiResult.weakestCount).toBe(3);
  expect(dataTrustApiResult.actionCount).toBe(3);
  const memoryHealthResult = await page.evaluate(async () => {
    const response = await fetch("/api/memory/health");
    const body = await response.json();
    return {
      status: response.status,
      score: body.report?.score,
      label: body.report?.label,
      guardrail: body.report?.guardrail ?? "",
      windowCount: body.report?.freshness?.windows?.length ?? 0,
      anchorCount: body.report?.episodicAnchors?.length ?? 0,
      nextActionCount: body.report?.nextActions?.length ?? 0,
    };
  });

  expect(memoryHealthResult.status).toBe(200);
  expect(memoryHealthResult.score).toBeGreaterThanOrEqual(0);
  expect(memoryHealthResult.score).toBeLessThanOrEqual(1);
  expect(memoryHealthResult.label).toMatch(/thin|building|healthy|rich/);
  expect(memoryHealthResult.guardrail).toContain("append-only");
  expect(memoryHealthResult.windowCount).toBe(3);
  expect(memoryHealthResult.anchorCount).toBeGreaterThan(0);
  expect(memoryHealthResult.nextActionCount).toBeGreaterThan(0);
  const privacyResult = await page.evaluate(async () => {
    const initial = await fetch("/api/privacy");
    const initialBody = await initial.json();
    const disabled = await fetch("/api/privacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        showEvidenceLedger: false,
        connectionPreviewEnabled: false,
      }),
    });
    const disabledBody = await disabled.json();
    const hiddenBriefing = await fetch("/api/briefing");
    const hiddenBriefingBody = await hiddenBriefing.json();
    const blockedConnection = await fetch("/api/connection/preview");
    const blockedConnectionBody = await blockedConnection.json();
    const blockedCandidates = await fetch("/api/connection/candidates");
    const blockedCandidatesBody = await blockedCandidates.json();
    const blockedReranking = await fetch("/api/connection/reranking");
    const blockedRerankingBody = await blockedReranking.json();
    const blockedRelationshipMemory = await fetch("/api/connection/relationship-memory");
    const blockedRelationshipMemoryBody = await blockedRelationshipMemory.json();
    const blockedConnectionQuality = await fetch("/api/connection/quality");
    const blockedConnectionQualityBody = await blockedConnectionQuality.json();
    const blockedDyadicCoping = await fetch("/api/connection/dyadic-coping");
    const blockedDyadicCopingBody = await blockedDyadicCoping.json();
    const enabled = await fetch("/api/privacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        showEvidenceLedger: true,
        connectionPreviewEnabled: true,
      }),
    });
    const enabledBody = await enabled.json();
    const visibleBriefing = await fetch("/api/briefing");
    const visibleBriefingBody = await visibleBriefing.json();
    const allowedConnection = await fetch("/api/connection/preview");
    const allowedReranking = await fetch("/api/connection/reranking");
    const allowedRelationshipMemory = await fetch("/api/connection/relationship-memory");
    const allowedConnectionQuality = await fetch("/api/connection/quality");
    const allowedDyadicCoping = await fetch("/api/connection/dyadic-coping");

    return {
      initialStatus: initial.status,
      initialPreferences: initialBody.preferences,
      disabledStatus: disabled.status,
      disabledPreferences: disabledBody.preferences,
      hiddenBriefingStatus: hiddenBriefing.status,
      hiddenEvidenceCount: hiddenBriefingBody.briefing?.evidenceLedger?.length ?? -1,
      hiddenPrivacy: hiddenBriefingBody.briefing?.privacy,
      blockedConnectionStatus: blockedConnection.status,
      blockedConnectionCode: blockedConnectionBody.code,
      blockedCandidatesStatus: blockedCandidates.status,
      blockedCandidatesCode: blockedCandidatesBody.code,
      blockedRerankingStatus: blockedReranking.status,
      blockedRerankingCode: blockedRerankingBody.code,
      blockedRelationshipMemoryStatus: blockedRelationshipMemory.status,
      blockedRelationshipMemoryCode: blockedRelationshipMemoryBody.code,
      blockedConnectionQualityStatus: blockedConnectionQuality.status,
      blockedConnectionQualityCode: blockedConnectionQualityBody.code,
      blockedDyadicCopingStatus: blockedDyadicCoping.status,
      blockedDyadicCopingCode: blockedDyadicCopingBody.code,
      enabledStatus: enabled.status,
      enabledPreferences: enabledBody.preferences,
      visibleBriefingStatus: visibleBriefing.status,
      visibleEvidenceCount: visibleBriefingBody.briefing?.evidenceLedger?.length ?? 0,
      allowedConnectionStatus: allowedConnection.status,
      allowedRerankingStatus: allowedReranking.status,
      allowedRelationshipMemoryStatus: allowedRelationshipMemory.status,
      allowedConnectionQualityStatus: allowedConnectionQuality.status,
      allowedDyadicCopingStatus: allowedDyadicCoping.status,
    };
  });

  expect(privacyResult.initialStatus).toBe(200);
  expect(privacyResult.initialPreferences).toMatchObject({
    showEvidenceLedger: true,
    connectionPreviewEnabled: true,
  });
  expect(privacyResult.disabledStatus).toBe(200);
  expect(privacyResult.disabledPreferences).toMatchObject({
    showEvidenceLedger: false,
    connectionPreviewEnabled: false,
  });
  expect(privacyResult.hiddenBriefingStatus).toBe(200);
  expect(privacyResult.hiddenEvidenceCount).toBe(0);
  expect(privacyResult.hiddenPrivacy).toMatchObject({
    showEvidenceLedger: false,
    connectionPreviewEnabled: false,
  });
  expect(privacyResult.blockedConnectionStatus).toBe(403);
  expect(privacyResult.blockedConnectionCode).toBe("CONNECTION_PREVIEW_DISABLED");
  expect(privacyResult.blockedCandidatesStatus).toBe(403);
  expect(privacyResult.blockedCandidatesCode).toBe("CONNECTION_PREVIEW_DISABLED");
  expect(privacyResult.blockedRerankingStatus).toBe(403);
  expect(privacyResult.blockedRerankingCode).toBe("CONNECTION_PREVIEW_DISABLED");
  expect(privacyResult.blockedRelationshipMemoryStatus).toBe(403);
  expect(privacyResult.blockedRelationshipMemoryCode).toBe("CONNECTION_PREVIEW_DISABLED");
  expect(privacyResult.blockedConnectionQualityStatus).toBe(403);
  expect(privacyResult.blockedConnectionQualityCode).toBe("CONNECTION_PREVIEW_DISABLED");
  expect(privacyResult.blockedDyadicCopingStatus).toBe(403);
  expect(privacyResult.blockedDyadicCopingCode).toBe("CONNECTION_PREVIEW_DISABLED");
  expect(privacyResult.enabledStatus).toBe(200);
  expect(privacyResult.enabledPreferences).toMatchObject({
    showEvidenceLedger: true,
    connectionPreviewEnabled: true,
  });
  expect(privacyResult.visibleBriefingStatus).toBe(200);
  expect(privacyResult.visibleEvidenceCount).toBeGreaterThan(0);
  expect(privacyResult.allowedConnectionStatus).toBe(200);
  expect(privacyResult.allowedRerankingStatus).toBe(200);
  expect(privacyResult.allowedRelationshipMemoryStatus).toBe(200);
  expect(privacyResult.allowedConnectionQualityStatus).toBe(200);
  expect(privacyResult.allowedDyadicCopingStatus).toBe(200);
  const importResult = await page.evaluate(async () => {
    const response = await fetch("/api/memory/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "E2E imported journal",
        sourceType: "journal",
        content:
          "Imported journal note: I often make better decisions when BELIFE slows down and asks for evidence before offering an interpretation.",
        consent: true,
      }),
    });
    const body = await response.json();
    return {
      status: response.status,
      ok: body.ok,
      memoryChunks: body.imported?.memoryChunks,
      ontologyUpdates: body.imported?.ontologyUpdates,
      dataTrustScore: body.dataTrust?.score,
    };
  });

  expect(importResult.status).toBe(200);
  expect(importResult.ok).toBe(true);
  expect(importResult.memoryChunks).toBeGreaterThan(0);
  expect(importResult.ontologyUpdates).toBeGreaterThanOrEqual(0);
  expect(importResult.dataTrustScore).toBeGreaterThanOrEqual(0);
  const correctionResult = await page.evaluate(async () => {
    const response = await fetch("/api/memory/corrections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: "E2E self-understanding correction",
        correction: "Actually, BELIFE should remember that this user values slow, evidence-based interpretation.",
        consent: true,
      }),
    });
    const body = await response.json();
    return {
      status: response.status,
      ok: body.ok,
      ontologyUpdates: body.ontologyUpdates?.length ?? 0,
      dataTrustScore: body.dataTrust?.score,
    };
  });

  expect(correctionResult.status).toBe(200);
  expect(correctionResult.ok).toBe(true);
  expect(correctionResult.ontologyUpdates).toBeGreaterThanOrEqual(0);
  expect(correctionResult.dataTrustScore).toBeGreaterThanOrEqual(0);
  const skipSuggestion = page.getByRole("button", { name: "Skip for now" }).first();
  await expect(skipSuggestion).toBeVisible();
  await skipSuggestion.click();
  await expect(page.getByText("이번 제안은 다시 띄우지 않을게요.")).toBeVisible();
  const exportResult = await page.evaluate(async () => {
    const response = await fetch("/api/memory/export");
    const body = await response.json();
    const hasSkippedEnrichmentMemory = body.memoryChunks.some((chunk: { tags?: string[] }) =>
      chunk.tags?.includes("profile-enrichment-dismissal"),
    );
    const hasCorrectionMemory = body.memoryChunks.some((chunk: { tags?: string[] }) =>
      chunk.tags?.includes("user-correction"),
    );
    const hasImportedMemory = body.memoryChunks.some((chunk: { tags?: string[] }) =>
      chunk.tags?.includes("user-import") && chunk.tags?.includes("explicit-consent"),
    );
    const previewPayloads = body.connectionPreviews.map((item: { preview?: unknown }) => item.preview ?? item);
    const hasHiddenEdge = previewPayloads.some(
      (preview: { hiddenEdge?: { status?: string; edgeStrength?: number } }) =>
        preview.hiddenEdge?.status === "latent" && typeof preview.hiddenEdge.edgeStrength === "number",
    );
    return {
      status: response.status,
      schemaVersion: body.schemaVersion,
      hasProfile: Boolean(body.profile),
      messageCount: body.inventory.counts.messages,
      ontologyNodeCount: body.inventory.counts.ontologyNodes,
      ontologyEdgeCount: body.inventory.counts.ontologyEdges,
      exportedOntologyEdgeCount: body.ontologyEdges.length,
      connectionPreviewCount: body.inventory.counts.connectionPreviews,
      hasSkippedEnrichmentMemory,
      hasCorrectionMemory,
      hasImportedMemory,
      hasHiddenEdge,
    };
  });

  expect(exportResult).toMatchObject({
    status: 200,
    schemaVersion: 1,
    hasProfile: true,
    hasSkippedEnrichmentMemory: true,
    hasCorrectionMemory: true,
    hasImportedMemory: true,
    hasHiddenEdge: true,
  });
  expect(exportResult.messageCount).toBeGreaterThanOrEqual(0);
  expect(exportResult.ontologyNodeCount).toBeGreaterThanOrEqual(0);
  expect(exportResult.ontologyEdgeCount).toBeGreaterThan(0);
  expect(exportResult.exportedOntologyEdgeCount).toBe(exportResult.ontologyEdgeCount);
  expect(exportResult.connectionPreviewCount).toBeGreaterThan(0);

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
  expect(hydrationErrors).toEqual([]);
});
