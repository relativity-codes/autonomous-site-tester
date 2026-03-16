# Extended Architecture (User-Customizable AI)

```id="d8w0tq"
+--------------------------------------------------------------+
|                       Electron Desktop App                   |
|                                                              |
|  React Dashboard                                             |
|                                                              |
|  ├─ Test Runner                                              |
|  ├─ Agent Chat (Assistant Mode)                              |
|  ├─ AI Configuration                                         |
|  ├─ Prompt Editor                                            |
|  └─ Report Viewer                                            |
+----------------------------+---------------------------------+
                             |
                             | IPC
                             |
+--------------------------------------------------------------+
|                        Agent Runtime                         |
|                                                              |
|  Orchestrator                                                |
|  Task Planner                                                |
|  Context Memory                                              |
|  Agent Decision Engine                                       |
|                                                              |
|  +----------------------+                                    |
|  |  Prompt Manager      |                                    |
|  +----------------------+                                    |
|                                                              |
|  +----------------------+                                    |
|  |  Model Router        |                                    |
|  +----------------------+                                    |
+----------------------------+---------------------------------+
                             |
                   Specialized Testing Agents
                             |
             Browser + Computer Interaction Layer
                             |
                     Artifact & Data Storage
                             |
                      Report Engine
```

---

# New Components Required

Your requested features require **four additional modules**.

```id="e5ng0r"
Prompt Manager
Model Router
User Instruction Layer
Agent Memory Context
```

---

# 1. AI Configuration System

Users must configure:

```id="55p3aw"
Model provider
Model URL
API key
Model name
temperature
max tokens
```

### Dashboard Example

```id="u41wdu"
AI SETTINGS

Provider: Custom
Model URL: https://api.openai.com/v1
Model Name: gpt-4o
API Key: ************

Temperature: 0.2
Max Tokens: 4096
```

---

# Backend Storage

Save configuration locally.

Example database table:

```id="fnd7y7"
ai_config

id
model_url
model_name
api_key
temperature
max_tokens
updated_at
```

Use encryption for keys.

---

# 2. Model Router

The **Model Router** decides which AI model to call.

This allows:

* OpenAI
* self-hosted models
* OpenAI-compatible APIs
* local models

Architecture:

```id="y1szij"
Model Router
   |
   +---- OpenAI Adapter
   |
   +---- OpenAI-Compatible Adapter
   |
   +---- Local Model Adapter
```

Example interface:

```typescript id="ax1gku"
interface LLMProvider {
  chat(messages: Message[]): Promise<LLMResponse>
}
```

---

# 3. Prompt Manager

Users should be able to customize the **system prompt**.

But never directly replace the base prompt.

Instead use **prompt layering**.

---

### Prompt Layering Architecture

```id="0jj3i9"
Base System Prompt (locked)
        +
Testing Framework Instructions
        +
User System Prompt
        +
Agent Context
```

Example:

```id="bdn69q"
BASE PROMPT

You are an autonomous website QA testing agent.
You test websites visually and functionally.

USER PROMPT

Focus on accessibility and UX problems.
```

Combined at runtime.

---

### Prompt Editor UI

Example screen:

```id="yzxup3"
Prompt Editor

System Prompt (User Layer)
--------------------------------------

You are a strict QA engineer.
Focus heavily on accessibility and usability.
Report all contrast issues.
```

---

# 4. Assistant Chat Mode

This is your **secondary feature**.

Users can talk to the agent while a test runs.

Example UI:

```id="p8pr0k"
Agent Assistant

User:
"Focus on testing the checkout page."

Agent:
"Understood. I will prioritize checkout flow tests."
```

---

# Chat Architecture

```id="0om1ux"
User Message
      |
Context Builder
      |
Agent Memory
      |
Model Router
      |
Agent Response
```

The chat updates **agent context**.

---

# Context Injection

The instruction becomes **temporary agent memory**.

Example:

```id="p7t0pn"
Runtime Context

priority_pages:
  - checkout
  - signup

extra_tests:
  - accessibility
```

---

# 5. Agent Memory System

Memory keeps track of:

```id="q9h9c0"
user instructions
pages visited
test progress
detected issues
```

Architecture:

```id="yzj9ru"
Short Term Memory
     |
Vector Memory
     |
Persistent Memory
```

Memory can use:

```id="aax0a0"
SQLite
Redis
Vector DB
```

---

# 6. Instruction Interpreter

Chat messages must be converted into **structured instructions**.

Example:

User says:

```
Focus on mobile layout issues.
```

Interpreter converts to:

```id="cd6mkg"
{
  "priority_tests": ["mobile_layout"]
}
```

This feeds the testing agents.

---

# 7. Prompt Injection Protection

Since users edit prompts, guardrails are needed.

Protection rules:

```id="dksm3v"
no system override
no filesystem access
no network credentials
```

Filter user prompts before merging.

---

# 8. Agent Control Commands

Chat can also control the agent.

Examples:

```id="q5b8js"
pause test
resume test
skip page
focus on login
rerun accessibility
```

Command parser detects these.

---

# 9. Electron UI Screens

Final UI layout:

```id="mx5j2a"
Dashboard
  |
  + Test Runner
  + AI Settings
  + Prompt Editor
  + Agent Chat
  + Reports
```

---

# 10. Settings Persistence

Configuration stored locally.

Example file:

```id="t3khd3"
~/.ai-tester/config.json
```

Or database:

```id="quze1j"
SQLite
```

Sensitive values encrypted.

---

# 11. Production Security

Because users provide API keys.

Security practices:

```id="jkyb0y"
OS keychain storage
AES encryption
never log API keys
```

Electron can access system keychain.

---

# 12. Full Execution Flow

```id="kj7j34"
User starts test
        |
Agent runtime starts
        |
Load AI configuration
        |
Load user prompt
        |
Merge prompt layers
        |
Crawler discovers pages
        |
Workers execute tests
        |
User sends instruction
        |
Instruction added to context
        |
Agents adapt behavior
        |
Report generated
```

---

# What This Upgrade Enables

Your tool becomes **a customizable AI QA assistant**.

Capabilities:

```id="g4ak7h"
custom AI models
custom prompts
live AI chat control
adaptive testing
configurable behavior
```
