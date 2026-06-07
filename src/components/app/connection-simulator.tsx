"use client";

import { Activity, PlayCircle, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { belifeFetch } from "@/lib/client/auth-fetch";
import type {
  CompatibilityAxes,
  ConnectionRelationshipMode,
  ConnectionScenarioType,
  ConnectionSimulationHorizon,
  ConnectionSimulationResult,
} from "@/lib/engines/types";
import { ScoreBar } from "./score-bar";

const scenarioOptions: Array<{ value: ConnectionScenarioType; label: string }> = [
  { value: "first_contact", label: "First contact" },
  { value: "light_disagreement", label: "Light disagreement" },
  { value: "emotional_vulnerability", label: "Emotional vulnerability" },
  { value: "pressure", label: "Pressure" },
  { value: "misunderstanding", label: "Misunderstanding" },
  { value: "repair_attempt", label: "Repair attempt" },
  { value: "collaboration", label: "Collaboration" },
  { value: "reselection", label: "Reselection" },
  { value: "longitudinal_drift", label: "Longitudinal drift" },
];

const modeOptions: Array<{ value: ConnectionRelationshipMode; label: string }> = [
  { value: "friendship", label: "Friendship" },
  { value: "collaboration", label: "Collaboration" },
  { value: "mentorship", label: "Mentorship" },
];

const horizonOptions: Array<{ value: ConnectionSimulationHorizon; label: string }> = [
  { value: "immediate", label: "Now" },
  { value: "next_month", label: "Next month" },
  { value: "long_term", label: "Long term" },
];

function percent(value: number) {
  return Math.round(value * 100);
}

export function ConnectionSimulator({ initialPreview }: { initialPreview: CompatibilityAxes }) {
  const [scene, setScene] = useState(
    "I want to talk about a repeated misunderstanding without making the other person defensive.",
  );
  const [scenarioType, setScenarioType] = useState<ConnectionScenarioType>("misunderstanding");
  const [relationshipMode, setRelationshipMode] = useState<ConnectionRelationshipMode>("friendship");
  const [timeHorizon, setTimeHorizon] = useState<ConnectionSimulationHorizon>("immediate");
  const [pressure, setPressure] = useState(0.48);
  const [vulnerability, setVulnerability] = useState(0.52);
  const [simulation, setSimulation] = useState<ConnectionSimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runSimulation() {
    setLoading(true);
    setError("");
    try {
      const response = await belifeFetch("/api/connection/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene, scenarioType, relationshipMode, timeHorizon, pressure, vulnerability }),
      });
      const body = (await response.json()) as { simulation?: ConnectionSimulationResult; error?: string };
      if (!response.ok || !body.simulation) {
        throw new Error(body.error || "Unable to run relationship simulation.");
      }
      setSimulation(body.simulation);
    } catch (simulationError) {
      setError(simulationError instanceof Error ? simulationError.message : "Unable to run relationship simulation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-md border border-white/[0.08] bg-[#090909] p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-400/10 text-teal-200">
          <SlidersHorizontal className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Custom Scenario Simulation</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Run a private rehearsal against the current BELIFE hidden connection graph.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="text-zinc-400">Scene</span>
            <textarea
              value={scene}
              onChange={(event) => setScene(event.target.value)}
              className="mt-2 min-h-28 w-full resize-none rounded-md border border-white/10 bg-black/50 p-3 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-orange-400/50"
              maxLength={1200}
            />
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="block text-sm">
              <span className="text-zinc-400">Scenario</span>
              <select
                value={scenarioType}
                onChange={(event) => setScenarioType(event.target.value as ConnectionScenarioType)}
                className="mt-2 h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 text-sm text-zinc-100 outline-none focus:border-orange-400/50"
              >
                {scenarioOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-zinc-400">Mode</span>
              <select
                value={relationshipMode}
                onChange={(event) => setRelationshipMode(event.target.value as ConnectionRelationshipMode)}
                className="mt-2 h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 text-sm text-zinc-100 outline-none focus:border-orange-400/50"
              >
                {modeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-zinc-400">Horizon</span>
              <select
                value={timeHorizon}
                onChange={(event) => setTimeHorizon(event.target.value as ConnectionSimulationHorizon)}
                className="mt-2 h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 text-sm text-zinc-100 outline-none focus:border-orange-400/50"
              >
                {horizonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block rounded-md border border-white/[0.08] bg-black/30 p-3 text-sm">
              <span className="flex items-center justify-between text-zinc-400">
                Pressure <span className="font-mono text-orange-200">{percent(pressure)}</span>
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={pressure}
                onChange={(event) => setPressure(Number(event.target.value))}
                className="mt-3 w-full accent-orange-400"
              />
            </label>
            <label className="block rounded-md border border-white/[0.08] bg-black/30 p-3 text-sm">
              <span className="flex items-center justify-between text-zinc-400">
                Vulnerability <span className="font-mono text-teal-200">{percent(vulnerability)}</span>
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={vulnerability}
                onChange={(event) => setVulnerability(Number(event.target.value))}
                className="mt-3 w-full accent-teal-300"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={runSimulation} disabled={loading || !scene.trim()}>
              <PlayCircle className="h-4 w-4" />
              {loading ? "Running" : "Run simulation"}
            </Button>
            {error ? <p className="text-sm text-red-200">{error}</p> : null}
          </div>
        </div>

        <aside className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-orange-300" />
            <h3 className="font-medium">Current graph baseline</h3>
          </div>
          <div className="mt-4 space-y-3">
            <ScoreBar label="Friendship" value={initialPreview.hiddenEdge.modeScores.friendship} tone="teal" />
            <ScoreBar label="Collaboration" value={initialPreview.hiddenEdge.modeScores.collaboration} />
            <ScoreBar label="Mentorship" value={initialPreview.hiddenEdge.modeScores.mentorship} tone="zinc" />
            <ScoreBar label="Repair" value={initialPreview.repairPotential} tone="teal" />
          </div>
        </aside>
      </div>

      {simulation ? (
        <div className="mt-5 rounded-md border border-teal-300/10 bg-teal-400/[0.04] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">Simulation result</h3>
              <p className="mt-1 text-sm text-zinc-500">{simulation.scenario.title}</p>
            </div>
            <span className="rounded-md border border-white/[0.08] bg-black/40 px-2 py-1 font-mono text-xs text-teal-200">
              confidence {percent(simulation.scenario.confidence)}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <ScoreBar label="Readiness" value={simulation.readiness} tone="teal" />
            <ScoreBar label="Mode fit" value={simulation.modeFit} />
            <ScoreBar label="Stress load" value={simulation.stressLoad} tone="zinc" />
          </div>

          <p className="mt-4 text-sm leading-7 text-zinc-300">{simulation.scenario.likelyDynamic}</p>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-md border border-white/[0.08] bg-black/30 p-3">
              <p className="text-xs font-medium uppercase text-teal-200">Opening move</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{simulation.guidance.openingMove}</p>
            </div>
            <div className="rounded-md border border-orange-300/10 bg-black/30 p-3">
              <p className="text-xs font-medium uppercase text-orange-200">Risk to watch</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{simulation.guidance.riskToWatch}</p>
            </div>
            <div className="rounded-md border border-white/[0.08] bg-black/30 p-3">
              <p className="text-xs font-medium uppercase text-zinc-400">Repair move</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{simulation.guidance.repairMove}</p>
            </div>
            <div className="rounded-md border border-white/[0.08] bg-black/30 p-3">
              <p className="text-xs font-medium uppercase text-zinc-400">Simulation spread</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                {simulation.scenario.simulation.riskBand} band, {simulation.scenario.simulation.iterations} samples,
                stability {percent(simulation.scenario.simulation.stability)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-md border border-white/[0.08] bg-black/30 p-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
            <p className="text-xs leading-5 text-zinc-500">{simulation.guardrail}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
