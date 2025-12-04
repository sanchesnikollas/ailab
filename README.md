# IA Lab

Enterprise platform for specifying, versioning, testing and operating AI agents using PRD + FSM + tools + external memory.

## Overview

IA Lab provides a structured approach to building production-ready AI agents:

- **PRD-First Design**: Define agent purpose, scope, and requirements as the source of truth
- **FSM State Management**: Model agent behavior as finite state machines with explicit transitions
- **Tool Gating**: Control which tools are available in each state with policy enforcement
- **External Memory**: Integrate knowledge bases and persistent memory with retrieval by IDs
- **Enterprise Features**: Versioning, approvals, audit trails, and safety testing

## Architecture

```
ia-lab/
├── packages/
│   ├── ia-lab-agentkit/    # Core schemas, compiler, runtime FSM, tool-gating, eval runner
│   ├── ia-lab-api/         # Fastify API for agents, versions, runs, ingest, auth
│   └── ia-lab-console/     # Next.js marketing homepage + console UI
├── examples/               # Example AgentManifests
├── data/                   # Ingested data (raw JSON)
└── docker-compose.yml      # Postgres + pgvector, Redis
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker and Docker Compose

### Setup

```bash
# Clone and install dependencies
cd ia-lab
pnpm install

# Start infrastructure (Postgres + Redis)
docker compose up -d

# Run database migrations
pnpm db:migrate

# (Optional) Import PrototipeAI documentation
pnpm ingest:prototipe

# Start development servers (API + Console)
pnpm dev
```

### Access

- **Console**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/docs

## Core Concepts

### Agent Manifest

The `AgentManifest` is the source of truth for an agent, defined in JSON with Zod validation:

```json
{
  "manifest_version": "1.0",
  "metadata": {
    "id": "uuid",
    "name": "My Agent",
    "slug": "my-agent",
    "domain": "healthcare",
    "risk_level": "medium",
    "data_classification": "confidential"
  },
  "prd": {
    "purpose": "Why this agent exists",
    "scope": "What it does and doesn't do",
    "context_problem": "The problem being solved",
    "requirements": [
      { "id": "RF1", "title": "...", "description": "..." }
    ]
  },
  "fsm": {
    "initial_state": "start",
    "states": [...],
    "fallback_state": "help"
  },
  "tools": { "tools": [...] },
  "memory": { ... },
  "evals": { ... },
  "deployments": { ... }
}
```

### FSM States

Each state defines:
- **prompt_blocks**: System prompts and instructions for that state
- **allowed_tools**: Which tools can be used (enforced by Policy Gate)
- **memory_writes**: What gets persisted
- **transitions**: When to move to another state

```json
{
  "id": "triage",
  "name": "Symptom Triage",
  "prompt_blocks": [
    { "role": "system", "content": "Collect symptoms..." }
  ],
  "allowed_tools": ["symptoms.analyze", "urgency.classify"],
  "transitions": [
    { "when": { "type": "condition", "value": "urgency == high" }, "to_state": "escalation" }
  ]
}
```

### Tool Gating

Tools are gated per state. The Policy Gate ensures enforcement even when model providers ignore constraints:

1. **Native support**: Use `tool_choice` parameter when provider supports it
2. **Policy Gate**: Validate and block unauthorized tool calls, re-prompting the model

### External Memory

Instead of copying documents into context:
- Use `kb.search(query, topK)` to find relevant documents
- Use `kb.open(docId, chunkIds)` to retrieve specific content
- Use `notes.write(path, content)` and `notes.read(path)` for agent notes

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/agents` | GET | List all agents |
| `/agents` | POST | Create new agent |
| `/agents/:id` | GET | Get agent by ID |
| `/agents/:id/versions` | POST | Create new version |
| `/runs` | POST | Start agent run |
| `/runs/:id` | GET | Get run with steps |
| `/catalog` | GET | List imported documents |
| `/docs/:slug` | GET | Get document content |
| `/ingest/prototipe` | POST | Trigger PrototipeAI ingest |

## How to Add a New Agent

1. **Create manifest**: Start from `examples/saude-conecta-manifest.json`

2. **Define PRD**: Document purpose, scope, and requirements

3. **Design FSM**: Map out states and transitions

4. **Register tools**: Add HTTP, MCP, or internal tools

5. **Write evals**: Create golden tests and safety tests

6. **Deploy**: Submit for approval and deploy to staging/production

```bash
# Create via API
curl -X POST http://localhost:3001/agents \
  -H "Content-Type: application/json" \
  -d @examples/my-agent-manifest.json
```

## How to Create a Tool Connector

### HTTP Tool

```json
{
  "type": "http",
  "name": "patient.verify",
  "description": "Verify patient in system",
  "endpoint": "https://api.example.com/patients/verify",
  "method": "POST",
  "parameters": {
    "cpf": { "type": "string", "required": true }
  }
}
```

### MCP Tool

```json
{
  "type": "mcp",
  "name": "agent.inventory.search",
  "description": "Search inventory via MCP",
  "server": "inventory-agent",
  "tool_name": "search_availability",
  "parameters": {
    "query": { "type": "object", "required": true }
  }
}
```

### Internal Tool

```json
{
  "type": "internal",
  "name": "kb.search",
  "description": "Search knowledge base",
  "parameters": {
    "query": { "type": "string", "required": true },
    "topK": { "type": "number", "required": false }
  }
}
```

## Examples

### Saúde Conecta

Healthcare agent with 8 states (RF1-RF7):
- Welcome → Triage → Scheduling → Pre-appointment → Follow-up → Closure
- Escalation path for emergencies
- PII handling and consent management

See: `examples/saude-conecta-manifest.json`

### Accommodation Capacity Flow

Multi-agent orchestration for hotel bookings:
- Orchestrator coordinates InventoryAgent, PricingAgent, BookingAgent
- Conflict resolution for availability issues
- Waitlist management

See: `examples/accommodation-flow-manifest.json`

## Development

```bash
# Run all packages in dev mode
pnpm dev

# Build all packages
pnpm build

# Type check
pnpm typecheck

# Run ingestor
pnpm ingest:prototipe --verbose
```

## Configuration

Environment variables (`.env`):

```bash
# Database
DATABASE_URL=postgresql://ialab:ialab_password@localhost:5432/ialab
REDIS_URL=redis://localhost:6379

# API
API_PORT=3001

# Model Provider
MODEL_PROVIDER=openai
MODEL_API_KEY=your_key
MODEL_NAME=gpt-4-turbo-preview

# Auth (stub)
API_KEY=dev_api_key_12345
```

## Roadmap

- [ ] Vector embeddings for semantic search
- [ ] Full SSO/RBAC authentication
- [ ] OpenTelemetry observability
- [ ] Visual FSM editor
- [ ] Eval runner with CI integration
- [ ] Multi-tenant support

## License

MIT
