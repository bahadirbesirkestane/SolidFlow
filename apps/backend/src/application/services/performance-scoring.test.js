const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculatePerformanceProfile,
  parseBlockedReason,
} = require("./performance-scoring");

test("performance profile stays explainable and keeps blocked work neutral", () => {
  const profile = calculatePerformanceProfile({
    activeAssignments: [
      {
        stepId: "step-1",
        completionNote: "[BLOKE:MALZEME_BEKLIYOR] Stok bekleniyor",
      },
    ],
    completedAssignments: [
      {
        stepName: "Kalite Kontrol",
        workflowName: "WF-1",
        createdAt: "2026-07-10T08:00:00.000Z",
        completedAt: "2026-07-10T12:00:00.000Z",
        handoverTo: "",
      },
      {
        stepName: "Liste Kontrol",
        workflowName: "WF-2",
        createdAt: "2026-07-11T08:00:00.000Z",
        completedAt: "2026-07-11T11:00:00.000Z",
        handoverTo: "user-2",
      },
    ],
    manualAdjustments: [
      { delta: 3 },
    ],
  });

  assert.equal(profile.metrics.blockedActiveCount, 1);
  assert.equal(profile.metrics.blockedReasonSummary[0].code, "MALZEME_BEKLIYOR");
  assert.equal(profile.score.manualAdjustmentTotal, 3);
  assert.ok(profile.score.total >= profile.score.base);
  assert.ok(Array.isArray(profile.score.positiveReasons));
});

test("blocked note parser extracts code and note", () => {
  const parsed = parseBlockedReason("[BLOKE:DIS_ONAY_BEKLIYOR] Musteri geri donusu bekleniyor");
  assert.deepEqual(parsed, {
    code: "DIS_ONAY_BEKLIYOR",
    label: "Dis onay bekliyor",
    note: "Musteri geri donusu bekleniyor",
  });
});
