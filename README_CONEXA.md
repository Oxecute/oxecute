# Conexa — Execution Intelligence AI Layer

Conexa is the specialized execution intelligence AI integrated into Oxecute. Conexa is designed not as an encouraging coach or friendly assistant, but as an objective, data-driven system that analyzes a founder's baseline calibration and execution ledger. It highlights contradictions, identifies avoidance patterns, issues directives, and forecasts potential execution stalls.

---

## Architecture & Code Map

The Conexa subsystem consists of the following key files:

*   **[src/lib/conexa/prompts.ts](file:///d:/oxe-cute/src/lib/conexa/prompts.ts)**: Contains system and user prompt definitions (Onboarding Synthesis, Baseline Activation, Day 14 Mid-Point Review, and Interactive Chat) along with response parsers.
*   **[src/lib/conexa/anthropic.ts](file:///d:/oxe-cute/src/lib/conexa/anthropic.ts)**: Handles raw HTTP requests to the Anthropic API. Uses the model identifier `claude-sonnet-4-6` and handles latency tracking and token counting.
*   **[src/lib/speculation.ts](file:///d:/oxe-cute/src/lib/speculation.ts)**: Implements regex-based detection for "speculative questions" and safeguards to prevent AI identity disclosures.
*   **[src/app/api/conexa/activation/route.ts](file:///d:/oxe-cute/src/app/api/conexa/activation/route.ts)**: API endpoint that generates the initial 6-tab calibration baseline report on Day 1.
*   **[src/app/api/conexa/chat/route.ts](file:///d:/oxe-cute/src/app/api/conexa/chat/route.ts)**: API endpoint for interactive chat messages with Conexa on the dashboard.

---

## 1. Onboarding Activation Flow

When a founder completes onboarding calibration, their baseline details are submitted to `/api/conexa/activation` to generate a structured activation report.

### Input Mapping
Due to schema evolutions, UX labels are mapped to specific database columns on the `users` table:
*   **Recent Activity (Q1)**: `cal_q1_shipped`
*   **Avoided Action (Q2)**: `cal_q3_didnt_work` (legacy column name)
*   **30-Day Success Definition (Q3)**: `cal_q5_unknown` (legacy column name)
*   **MRR / Stage / Blocker**: `mrr`, `stage`, `blocker_text`

### Prompt & Sections
Conexa uses `ACTIVATION_SYSTEM_PROMPT_V1` which instructs Claude to compare these answers across the **Signal Triangle** (Goal vs. Action, Avoidance vs. Goal, Avoidance vs. Action) and output exactly six tabs and a final personal insight:
1.  **Tab 1 - The Reality Check**: Behavioral requirements vs. last week's actions.
2.  **Tab 2 - The Blindspot**: Self-reported avoidance vs. stated goals.
3.  **Tab 3 - Shipping vs. Noise**: Activity classification (signal or noise).
4.  **Tab 4 - The Next Move**: A single, immediate, actionable directive.
5.  **Tab 5 - The Integrity Forecast**: The most probable week and trigger for an execution stall.
6.  **Tab 6 - Executive Synthesis**: An assessment of who the founder is as an operator based on data.
7.  **Personal Insight**: Direct reflection to the founder on execution baselines.

### The Response Parser
The output from Claude is parsed in `parseActivationResponse()`. It searches for sections using canonical headings and known formatting variations (e.g. handling em-dashes `—`, en-dashes `–`, hyphens `-`, and markdown wrapping).
*   If a tab is missing, it injects a placeholder.
*   All tab bodies are validated, clamped in length, and sentence-capped (up to 5 sentences maximum) to maintain a concise, premium visual style.

---

## 2. Interactive Chat Flow

Founders can converse with Conexa on the dashboard. Chat is handled at `/api/conexa/chat` using these steps:

### A. Speculation Interception
Conexa refuses to predict future outcomes.
*   The system tests the incoming message against `SPECULATION_TRIGGERS` (e.g. *"what if"*, *"will this work"*, *"predict my chances"*).
*   If a match occurs, Conexa **blocks the Anthropic API call** entirely.
*   Instead, it immediately returns a random pre-configured response (e.g. *"I don't predict outcomes. Your record does. Stop imagining results - start generating them. Your execution count is 8 days. What's the one action you can submit proof for today?"*).
*   Both the user prompt and speculation rejection are inserted into `conexa_messages` for transcript history.

### B. Context Ingestion
If the message is not speculative, the endpoint queries the database for:
*   User baseline fields (MRR, stage, blocker, avoidance pattern).
*   User statistics (execution count, break count, computed execution rate).
*   The **last 10 entries** from the ledger (day number, category, tier, validation URLs, and text declarations).
*   Recent conversation history (up to 20 messages).
This context is compiled and injected into the user prompt to ground Claude's response in the founder's active record.

### C. AI-Identity Safeguards
Conexa must not identify as Claude or Anthropic.
*   `responseHasForbiddenIdentity()` checks the API response for forbidden phrases (e.g. *"claude"*, *"anthropic"*, *"large language model"*, *"as an AI"*).
*   If a violation is found, the backend makes **one retry request** instructing Claude to remove AI markers.
*   If the retry still fails, it falls back to: *"Conexa is processing your record. Send your question again."*
