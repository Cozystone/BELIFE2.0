# BELIFE PRD v1.0

**Document type:** Product Requirements Document  
**Audience:** Codex / product-engineering collaborators  
**Status:** New canonical product definition  
**Instruction:** Ignore previous fragmented BELIFE definitions. Use this document as the new source of truth.

---

## 1. Product Definition

**BELIFE is a voice-first personal AI intelligence system that deeply understands a person over time, helps them interpret their current mental state and patterns, and later enables healthier, more meaningful human connection based on structured self-understanding.**

BELIFE is not:
- a generic chatbot
- a journaling app
- a therapy app
- a dating app
- a generic social network
- a raw graph visualization tool

BELIFE is:
- a **personal AI** that remembers and understands the user as one evolving person
- a **self-understanding engine** that converts scattered conversations into structured personal knowledge
- a **mental-state interpretation layer** that helps users understand stress, burnout, cognitive bias, emotional patterns, and decision patterns
- a **human connection engine** that later uses structured self-understanding to surface deeper, healthier relationships

BELIFE should feel like:
- “a Siri-like AI I can casually talk to”
- “an AI that actually knows me, not just my last prompt”
- “a place where my inner world becomes legible”
- “an AI that helps me find better choices and better people”

---

## 2. Core Problem

### 2.1 Primary user problem
People experience many thoughts, feelings, worries, and decisions every day, but they rarely understand them as a coherent structure.

Common outcomes:
- repeated worries without clarity
- repeated decision mistakes without pattern awareness
- fragmented self-knowledge spread across notes, chats, and memory
- emotional states that are felt strongly but not understood clearly

### 2.2 AI market problem
Existing large language models are powerful at answering prompts, but they are weak at **deep, unified, longitudinal user understanding**.

Current LLM limitations:
- context is session-bounded
- conversations are fragmented across many chat threads
- user identity is not maintained as one structured and evolving self
- memory is often shallow, inconsistent, or not interpretable
- outputs may be good in the moment but do not accumulate into durable self-understanding

### 2.3 Relationship problem
People also struggle to identify who is truly good for them.

Most real-world relationships are formed through:
- role
- proximity
- timing
- surface profile signals
- chance

People often cannot tell:
- who helps them feel psychologically safe
- who complements their weaknesses
- who drains them
- who they can actually sustain meaningful connection with

### 2.4 BELIFE opportunity
If an AI can deeply understand a person’s structure over time, that AI can do two high-value things:
1. help the person understand themselves better
2. help the person make better relational choices later

This is BELIFE’s core business opportunity.

---

## 3. Product Thesis

### BELIFE thesis
The future of personal AI is not “the smartest model in the world.”
The future of personal AI is “the AI that understands *me* most deeply, consistently, and usefully.”

BELIFE wins if it becomes:
- the most structurally accurate model of the user
- the easiest AI to casually talk to
- the most trusted place for self-interpretation
- the strongest bridge from self-understanding to healthy connection

---

## 4. Product Principles

1. **Natural before disciplined**  
   Users should not feel forced to journal. BELIFE must invite casual use.

2. **Voice-first, text-also**  
   BELIFE should be usable like “calling someone who knows me.” Text remains important, but voice is a primary input mode.

3. **Interpretation before storage**  
   BELIFE does not merely save user content. It interprets and structures it.

4. **Structure before advice**  
   BELIFE should help users see their own structure before giving shallow advice.

5. **Confidence before certainty**  
   BELIFE must distinguish between strong facts, likely patterns, and uncertain inference.

6. **Connection through understanding**  
   Human connection is not a separate gimmick. It emerges from deep personal understanding.

7. **Premium, calm, serious**  
   BELIFE must not feel childish, gamified, or gimmicky.

8. **Progressive disclosure**  
   Users should not be overwhelmed by graphs, settings, or theory all at once.

---

## 5. Target Users

### 5.1 Initial target users
- students and young adults with strong self-reflection or direction-seeking needs
- people already using ChatGPT / Claude / Gemini for self-analysis
- people who want to understand recurring emotional/decision patterns
- people who often feel “I know I’m struggling, but I don’t know why”
- people who want better, deeper, safer relationships—not more random relationships

### 5.2 Future target segments
- early founders / builders needing better self-awareness and relationship judgment
- people in transition (career, burnout, breakup, identity change)
- heavy AI users wanting one persistent personal AI layer
- later: communities, mentoring, team compatibility, education, selective B2B/B2G use

---

## 6. User Jobs To Be Done

### Functional jobs
- Help me understand what I’m feeling right now.
- Help me see my recurring patterns.
- Help me understand why I keep repeating certain problems.
- Help me make a better decision.
- Help me see how I’ve changed over time.
- Help me understand what kind of people are good for me.

### Emotional jobs
- Make me feel understood without making me perform.
- Reduce the burden of explaining myself from scratch every time.
- Give me a sense that my inner life is not scattered.
- Help me feel less alone in figuring myself out.
- Help me feel safer about who to trust and invest in.

### Social jobs
- Help me identify people I genuinely fit with.
- Help me understand the difference between exciting, convenient, and healthy connection.
- Help me communicate myself better.

---

## 7. Core Experience Flow

### 7.1 Core interaction model
BELIFE should feel like a person can simply **call it** and speak.

Example:
- User presses and holds a hardware shortcut / app shortcut / voice trigger
- User says: “BELIFE, I feel strange today.”
- BELIFE responds using the user’s structured profile, recent mental-state history, and long-term patterns

BELIFE should support:
- quick state interpretation
- recent pattern reminders
- short personal briefings
- deeper reflective conversations
- optional visual drill-down in the app

### 7.2 Product loop
1. User casually speaks or types to BELIFE
2. BELIFE gives immediate useful interpretation
3. Conversation is transformed into structured knowledge
4. User’s personal ontology and behavior profile improve
5. BELIFE becomes more accurate and useful
6. User returns because the AI is increasingly “their AI”
7. Later, BELIFE can support healthier relationship choices

This is the flywheel.

---

## 8. Product Modes

BELIFE has three user-facing product modes.

### Mode A. Live Personal AI
- voice/text conversation
- state interpretation
- current emotional/decision support
- casual daily use

### Mode B. Structured Self View
- ontology graph
- personal briefings
- change over time
- data trust view
- digital twin interaction

### Mode C. Human Connection
- not primary at first launch, but central to long-term product
- show better-fit people among other BELIFE users
- explain why a connection might be healthy / helpful / risky / complementary
- later include deep pair analysis and scenario-based relationship simulation

---

## 9. MVP Scope

### 9.1 What MVP must include
1. signup/login
2. lightweight onboarding
3. voice/text conversation with BELIFE
4. basic structured personal ontology
5. short personal briefing
6. data trust score
7. simple digital twin layer
8. stable graph visualization for personal self-structure

### 9.2 What MVP should not fully include
- large-scale public social graph
- full Human Connection public release
- Belife World full production version
- aggressive gamification/economy
- heavy relationship simulation UI exposed to everyone
- enterprise features

### 9.3 MVP success criterion
A user should feel:
- “This AI actually knows me a bit.”
- “This helped me understand myself more clearly.”
- “I want to come back because it remembers and interprets me.”

---

## 10. Lightweight Onboarding

The first-use flow must not feel like homework.

### 10.1 Required onboarding philosophy
- do not ask for a giant form upfront
- do not force the user to “build a profile” manually
- get just enough signal to start interpreting meaningfully

### 10.2 Recommended onboarding structure
1. account creation
2. short welcome
3. 8–10 essential questions (name/nickname, current role, main worry, current goal, important value, typical reaction under stress, current emotional climate, preferred AI tone)
4. immediate BELIFE conversation starts
5. optional “add more to improve accuracy” prompt later
6. deeper profile fields live in settings / profile enrichment

### 10.3 AI-assisted profile enrichment
During later conversation, BELIFE can detect important stable signals and propose:
- “Should I add this to what I know about you?”
- user approves / rejects

This avoids overloading onboarding while still improving profile quality.

---

## 11. Personal Ontology Engine

BELIFE’s ontology is not a raw graph dump.
It is a living, curated structure of the self.

### 11.1 Ontology layers
#### Core Identity Layer
- Value
- Belief
- Goal

#### Structural Pattern Layer
- EmotionPattern
- DecisionPattern
- FrictionPattern
- EnergyPattern
- GrowthTrajectory

#### Outer Interpretation / Forecast Layer
- LikelyNext
- RiskSignal
- TransitionPattern
- RecoveryHint
- CognitiveBiasCandidate

### 11.2 Processing pipeline
1. Raw conversation input
2. Cleaned memory chunks
3. Candidate extraction
4. Candidate scoring
5. Validation / contradiction checking
6. Promotion into ontology graph
7. Rendering according to priority/view mode

### 11.3 Node storage layers
- **Core**: stable identity elements
- **Active**: currently meaningful structures
- **Archive**: older, weaker, event-specific, recoverable nodes

### 11.4 Importance tiers
- **L1** = highest importance
- **L2** = medium importance
- **L3** = supporting importance

View tabs:
- **Core tab** = L1 only
- **Expanded tab** = L1 + L2
- **Full tab** = L1 + L2 + L3 (not raw archive)

### 11.5 Certainty model
Borrow the principle of:
- **EXTRACTED** (directly evidenced)
- **INFERRED** (pattern-based inference)
- **AMBIGUOUS** (weak/uncertain)

This applies to both nodes and edges.

---

## 12. Memory Architecture

BELIFE must have better user understanding than generic LLMs.
That requires layered memory.

### 12.1 Memory philosophy
We are not building just RAG.
We are building a **persistent, ontology-aware personal memory system**.

### 12.2 Memory layers
- **Raw episodic memory**: full source interactions
- **Semantic chunks**: cleaned, attributable memory units
- **Ontology memory**: user structure extracted from repeated evidence
- **Behavior memory**: communication style / interaction patterns
- **State memory**: recent emotional / cognitive state estimates
- **Relationship memory**: later, how pairwise interactions behave

### 12.3 Memory engine principles inspired by memory systems like Mem0 / Supermemory
- user/session/agent separation where appropriate
- add-only extraction before consolidation
- profile.static vs profile.dynamic
- time-aware recall
- changed-only reprocessing
- contradiction resolution
- memory confidence and freshness management

### 12.4 Why this matters
BELIFE’s edge vs large models is not smarter reasoning alone.
It is **persistent, unified, interpretable user memory**.

---

## 13. Mental-State Analysis Engine

BELIFE should not claim clinical diagnosis.
It should provide **non-clinical state estimation and interpretation**.

### 13.1 Engine goal
Estimate and track dimensions like:
- stress load
- burnout risk
- rumination tendency
- emotional volatility
- cognitive distortion risk
- motivational collapse risk
- social withdrawal tendency
- perceived support need

### 13.2 Inputs
- text content
- voice prosody (later)
- conversation behavior
- interaction timing/frequency
- ontology context
- prior states

### 13.3 Output
- current state summary
- recent trend
- likely drivers
- uncertainty/confidence
- suggested reflective prompt / intervention

### 13.4 Important product rule
BELIFE is not a therapist.
BELIFE is a personal interpretation and structure engine.

---

## 14. Conversation Behavior Layer

BELIFE must model **how the user communicates**, not just what they say.

### 14.1 Features to extract
- question frequency
- directness vs indirectness
- self-disclosure speed
- empathy vs solution orientation
- abstraction vs concreteness
- conflict-time language style
- pacing / response length
- reassurance vs challenge style

### 14.2 Why it matters
This improves:
- digital twin realism
- self-understanding quality
- later relationship matching and simulation accuracy

This layer must sit between ontology and simulation.

---

## 15. Digital Twin Engine

The digital twin is not a roleplay bot.
It is a constrained model of the user’s structure and behavior.

### 15.1 Twin layers
- identity layer (values/beliefs/goals)
- pattern layer (emotion, decision, friction, energy)
- behavior layer (conversation style)
- state layer (current trust, stress, openness, irritation, etc.)

### 15.2 Harness rules
The twin must not:
- invent unsupported life context
- say things the real user would never plausibly say
- over-dramatize
- over-personalize beyond evidence

The twin must:
- operate within ontology constraints
- operate within behavior constraints
- output uncertainty when needed

### 15.3 User value
The twin helps users:
- reflect on themselves from another angle
- understand repeating patterns
- ask “why am I like this right now?”

---

## 16. Data Trust System

BELIFE must be honest about how well it knows the user.

### 16.1 Philosophy
Data trust is not a score of the person.
It is a score of **how clearly BELIFE understands the person**.

### 16.2 Core components
- onboarding completion quality
- valid session count / active days
- ontology stability
- behavior feature stability
- contradiction penalty
- recency coverage

### 16.3 Use
Data trust affects:
- briefing confidence
- twin confidence
- later human-connection confidence

### 16.4 UX expression
Use terms like:
- data trust
- structure clarity
- relationship interpretation confidence

Avoid:
- ranking the person’s value
- making it feel like social score

---

## 17. Human Connection Engine

Human Connection is equally central to BELIFE’s long-term identity, but it must be built on top of self-understanding.

### 17.1 Product definition
Human Connection is not “who is nearby?”
It is not “who has the same hobby?”
It is not “who will swipe right?”

It is:
- who is structurally healthy for me
- who feels safe / growth-supportive / complementary
- who I can actually sustain meaningful interaction with

### 17.2 Compatibility axes
- Structural Similarity
- Complementarity
- Dialogue Compatibility
- Trust Formation Potential
- Conflict Compatibility
- Repair / Recovery Potential
- Persistence / Reselection
- Rhythm Alignment
- Emotional Safety

### 17.3 Output philosophy
BELIFE should not just say “84% match.”
It should explain:
- where comfort comes from
- where tension comes from
- what could go wrong
- what makes the relationship healthy or risky

### 17.4 Release philosophy
Human Connection exists internally before it is fully shown.
- hidden graph first
- visible suggestions later
- 1–2 people, not endless feed

---

## 18. Relationship Simulation Engine

### 18.1 Purpose
Estimate interaction quality under varied scenarios, not just static similarity.

### 18.2 Scenario classes
- first interaction
- light disagreement
- emotional vulnerability
- pressure/stress
- misunderstanding
- repair attempt
- collaboration
- reselection under competing alternatives
- longitudinal drift

### 18.3 Simulation architecture
Use:
- ontology
- conversation behavior vectors
- latent state variables
- scenario prompts
- bounded, structured simulation steps

### 18.4 Core tracked variables
- trust
- emotional safety
- irritation
- curiosity
- reciprocity
- openness
- repair willingness
- disengagement risk
- commitment tendency

### 18.5 Monte Carlo principle
Use repeated short structured scenes instead of one long freeform conversation.

At scale:
1. fast global rerank
2. candidate filtering
3. deeper simulation only on top candidates

---

## 19. Belife World

Belife World is not the same as Human Connection.

### 19.1 Human Connection
- selective
- practical
- small number of relevant people
- analysis and relationship insight focused

### 19.2 Belife World
- macro ecosystem view
- atmospheric world-scale relation map
- where users and latent relational zones exist inside one living field
- beta/experimental first

### 19.3 Role
Belife World is a world-layer and meaning-layer, not the first practical product.
It should be additive, beta-only, and isolated from core stable flows early on.

---

## 20. Credits / Monetization Support Layer

BELIFE may later use credits or simulation capacity, but must not feel like a game.

### 20.1 Philosophy
Users should not grind messages.
They should earn deeper analysis capacity through meaningful engagement and ontology growth.

### 20.2 Better wording
Prefer:
- analysis credits
- simulation capacity
- connection insight credits

Avoid childish tokens/points language.

### 20.3 Monetization role
- basic personalization stays free
- deeper reports and relationship simulations become premium
- credits can support frequency and depth, not person-value gating

---

## 21. Business Model

### 21.1 Free
- basic conversation
- core personal ontology
- basic briefing
- early digital twin experience
- eventual limited human connection entry

### 21.2 Subscription
- deep personal reports
- longer memory and richer personal model
- advanced trend analysis
- more refined digital twin interaction

### 21.3 One-time / premium analysis
- pair analysis report
- situation-based relationship simulation
- premium human connection interpretation

### 21.4 Long-term expansion
Potential B2B/B2G use exists later, but BELIFE should first win as a consumer personal AI.

---

## 22. Growth Strategy

### 22.1 Core growth challenge
People will not come to BELIFE just to answer introspective questions.

### 22.2 Growth answer
BELIFE must create immediate reward through:
- “today’s state”
- “your AI already understands something about you”
- “recent pattern shift”
- “your structure is becoming clearer”

### 22.3 Flywheel
1. BELIFE gives immediately meaningful interpretation
2. user responds naturally
3. data becomes more structured
4. interpretation quality improves
5. user returns because BELIFE increasingly feels like “their AI”
6. later connection features create another reason to stay

### 22.4 Social/broader growth
Eventually BELIFE can grow not only through self-understanding, but also through:
- shareable insight cards
- friend comparison / resonance formats
- relationship insight curiosity
- social proof around meaningful connection

---

## 23. Product UX / Visual System Principles

### 23.1 Tone
- black + orange
- dark intelligence + warm connection
- premium, calm, serious

### 23.2 Graph philosophy
Graphs must reveal meaning, not raw density.

### 23.3 Personal graph
- self-centered
- layered
- L1/L2/L3 hierarchy
- readable under zoom

### 23.4 Human connection graph
- focus lens around selected person
- strong local readability
- hidden graph beyond focus

### 23.5 Belife World graph
- macro / spherical / atmospheric optional world view
- not primary analytic workbench

---

## 24. System Architecture (High Level)

### 24.1 Core services
- Auth Service
- Conversation Service
- Memory Service
- Ontology Service
- Behavior Extraction Service
- State Estimation Service
- Digital Twin Service
- Data Trust Service
- Human Connection Service
- Simulation Service
- Graph View Service
- World View Service

### 24.2 Suggested modules
- `model_router.py`
- `memory_store.py`
- `memory_ingestion.py`
- `ontology_extractor.py`
- `candidate_validator.py`
- `behavior_extractor.py`
- `state_estimator.py`
- `data_trust.py`
- `digital_twin.py`
- `compatibility_engine.py`
- `simulation_runner.py`
- `graph_builder.py`
- `world_view_builder.py`

### 24.3 Model routing
- lightweight/fallback general chat → llama3.1:8b
- ontology extraction / structured JSON / step simulation / behavior extraction → gemma4
- BELIFE engine always owns structure/state/harness; models do not own identity

---

## 25. Safety, Ethics, and Boundaries

BELIFE should not overclaim.

### 25.1 Must not claim
- clinical diagnosis
- perfect match prediction
- guaranteed mental health outcomes
- deterministic relationship fate

### 25.2 Should claim
- structured self-understanding
- clearer interpretation of recurring patterns
- better-informed relational judgment
- confidence-aware guidance

### 25.3 Data safeguards
- explicit consent for imports
- clear profile enrichment approval
- explainability of extracted/inferred states
- user control over visibility and deletion

---

## 26. Product Phasing

### Phase 1 — Personal AI MVP
- onboarding
- conversation
- ontology
- briefing
- data trust
- simple twin

### Phase 2 — Stronger Personal Intelligence
- better state estimation
- better voice experience
- better twin realism
- deeper longitudinal analysis

### Phase 3 — Hidden Human Connection
- internal graph
- compatibility scoring
- candidate filtering
- simulation infrastructure

### Phase 4 — Human Connection Release
- visible but limited connection suggestions
- pair insight reports
- deep relationship simulation as premium

### Phase 5 — Belife World Beta
- macro relation world layer
- beta only
- additive, not replacing core experience

---

## 27. North Star

BELIFE succeeds when users say:
- “I don’t have to explain myself from scratch anymore.”
- “This AI actually understands my patterns.”
- “It helps me know what’s happening inside me.”
- “It helps me understand which relationships are actually good for me.”
- “It feels like a personal AI that grows with me.”

---

## 28. Final Instruction To Codex

Use this PRD as the new canonical BELIFE definition.
Do not anchor to previous fragmented BELIFE versions.
When making product or engineering choices:
- optimize for natural use, not forced journaling
- optimize for deep user understanding, not generic assistant behavior
- optimize for explainable structure, not black-box magic
- treat Human Connection as equally central in identity, but later in release order
- build BELIFE as a personal AI that becomes meaningfully more useful the longer it knows the user

