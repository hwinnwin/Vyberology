# THE VYBER - Executive Handover Document

**Product**: THE VYBER - AI-Native Browser
**Date**: January 2026
**Status**: Production Ready (PWA) / Desktop Build Ready (Tauri)

---

## Executive Summary

THE VYBER is an AI-powered browser built for the Vybe ecosystem. It combines modern browser functionality with AI-assisted search, summarization, and task automation. The browser is deployed as a Progressive Web App (PWA) with optional native desktop builds via Tauri 2.0.

### Key Value Propositions
- **AI-First Search**: Natural language queries powered by Claude
- **Cross-Device Sync Ready**: Architecture supports Supabase sync
- **Privacy-Focused**: No tracking, local-first design
- **Split View Browsing**: Side-by-side web content viewing
- **Persistent Sessions**: Tabs, bookmarks, and history survive restarts

---

## Current Deployment

| Environment | URL | Status |
|-------------|-----|--------|
| Production (PWA) | https://vyber.thevybe.global | Active |
| Staging | Netlify preview deploys | Active |
| Desktop (Mac) | Tauri DMG | Manual install |

### Infrastructure
- **Hosting**: Netlify (PWA + Serverless Functions)
- **AI Backend**: Netlify Functions proxying to Anthropic Claude API
- **CDN**: Netlify Edge
- **Analytics**: Plausible (privacy-focused) + optional GA4

---

## Feature Overview

### Core Browser Features
| Feature | Status | Shortcut |
|---------|--------|----------|
| Multi-tab browsing | Complete | Cmd+T (new), Cmd+W (close) |
| Tab persistence | Complete | Auto-saved to localStorage |
| Back/Forward navigation | Complete | Browser controls |
| URL bar with search | Complete | Cmd+L (focus) |
| Bookmarks | Complete | Cmd+D (toggle) |
| History tracking | Complete | Auto-tracked |
| Reopen closed tabs | Complete | Cmd+Shift+T |
| Duplicate tab | Complete | Cmd+Shift+D |
| Tab pinning | Complete | Context menu |
| Tab groups | Infrastructure ready | - |

### Split View
| Feature | Status | Shortcut |
|---------|--------|----------|
| Enable split view | Complete | Cmd+Shift+S |
| Resize panes | Complete | Drag divider |
| Swap panes | Complete | Control bar |
| Horizontal/Vertical toggle | Complete | Control bar |
| Switch active pane | Complete | Cmd+[ / Cmd+] |

### AI Features
| Feature | Status | Shortcut |
|---------|--------|----------|
| AI Command Palette | Complete | Cmd+Shift+K |
| AI Search queries | Complete | Address bar |
| Agent Panel | Complete | Cmd+Shift+A |
| Page summarization | Planned | - |
| Form automation | Planned | - |
| Browsing memory | Planned | - |

### Agentic Engine (NEW)
| Component | Status | Purpose |
|-----------|--------|---------|
| AgentRuntime | Complete | Core execution environment for agents |
| TaskQueue | Complete | Priority-based task queuing system |
| AgentRegistry | Complete | Central registry for agent types |
| DOMAgent | Complete | DOM interaction (click, type, extract) |
| TaskQueuePanel | Complete | UI for viewing task queue |
| agents store | Complete | Zustand state for agent management |

### PWA Features
| Feature | Status |
|---------|--------|
| Offline support | Complete |
| Install prompts | Complete |
| Service worker caching | Complete |
| Update notifications | Complete |
| Background sync | Complete |

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    THE VYBER - App Shell                     │
├─────────────────────────────────────────────────────────────┤
│  React 19 + TypeScript + Tailwind + Zustand (Frontend)      │
├─────────────────────────────────────────────────────────────┤
│  Vite Build + PWA Plugin (Build System)                     │
├─────────────────────────────────────────────────────────────┤
│  Netlify Functions (AI Proxy, Web Search)                   │
├─────────────────────────────────────────────────────────────┤
│  Optional: Tauri 2.0 + Rust (Native Desktop)                │
├─────────────────────────────────────────────────────────────┤
│  Supabase Ready (Auth, Sync, Memory Layer)                  │
└─────────────────────────────────────────────────────────────┘
```

### Key Files
| File | Purpose |
|------|---------|
| `src/stores/tabs.ts` | Tab state, history, bookmarks, persistence |
| `src/stores/agents.ts` | Agentic engine state management |
| `src/components/browser/` | Browser UI components |
| `src/components/ai/` | AI command palette, agent panel |
| `src/agents/` | Agentic engine core |
| `src/agents/core/` | Runtime, TaskQueue, Registry |
| `src/agents/web/` | Web automation agents (DOMAgent) |
| `netlify/functions/` | Serverless API endpoints |

---

## Environment Variables

### Required for Production (Netlify)
```
ANTHROPIC_API_KEY=sk-ant-...        # Claude API key
ALLOWED_ORIGINS=https://vyber.thevybe.global
AI_RATE_LIMIT_MAX=30
AI_RATE_LIMIT_WINDOW_MS=60000
```

### Optional Analytics
```
VITE_PLAUSIBLE_DOMAIN=vyber.thevybe.global
VITE_SENTRY_DSN=https://...@sentry.io/...
```

---

## Keyboard Shortcuts Reference

### Navigation
| Action | Mac | Windows |
|--------|-----|---------|
| New Tab | Cmd+T | Ctrl+T |
| Close Tab | Cmd+W | Ctrl+W |
| Reopen Closed Tab | Cmd+Shift+T | Ctrl+Shift+T |
| Focus Address Bar | Cmd+L | Ctrl+L |
| Refresh | Cmd+R | Ctrl+R |

### Features
| Action | Mac | Windows |
|--------|-----|---------|
| AI Commands | Cmd+Shift+K | Ctrl+Shift+K |
| Toggle Split View | Cmd+Shift+S | Ctrl+Shift+S |
| Toggle Bookmark | Cmd+D | Ctrl+D |
| Duplicate Tab | Cmd+Shift+D | Ctrl+Shift+D |
| Agent Panel | Cmd+Shift+A | Ctrl+Shift+A |
| Settings | Cmd+, | Ctrl+, |

### Split View
| Action | Mac | Windows |
|--------|-----|---------|
| Switch to Left Pane | Cmd+[ | Ctrl+[ |
| Switch to Right Pane | Cmd+] | Ctrl+] |

### Tab Switching
| Action | Mac | Windows |
|--------|-----|---------|
| Switch to Tab 1-9 | Cmd+1-9 | Ctrl+1-9 |

---

## Security Measures

1. **Rate Limiting**: 30 requests/minute per IP on AI endpoints
2. **CORS**: Strict origin allowlist for API endpoints
3. **CSP Headers**: Configured in netlify.toml
4. **No Telemetry**: Zero tracking by default
5. **Sandboxed iframes**: Web content isolated from app shell

---

## Deployment Workflow

### PWA (Automatic)
1. Push to main branch
2. Netlify auto-builds and deploys
3. Service worker updates on next user visit

### Desktop (Manual)
```bash
cd apps/vyber
npm run tauri build
# Outputs DMG to src-tauri/target/release/bundle/
```

---

## Roadmap

### Phase 2 (In Progress)
- [x] Agentic Engine foundation (AgentRuntime, TaskQueue, Registry)
- [x] DOMAgent for web automation
- [x] Task queue UI panel
- [ ] FormAgent for intelligent form filling
- [ ] NavigationAgent for multi-page workflows
- [ ] WorkflowEngine for chained actions
- [ ] RecordingAgent for action replay

### Phase 3 (Next)
- [ ] Supabase integration for cross-device sync
- [ ] AI page summarization
- [ ] Semantic search over browsing history
- [ ] Research agents (SearchAgent, SummaryAgent)
- [ ] Monitor agents (WatchAgent, AlertAgent)

### Phase 4 (Future)
- [ ] App platform layer
- [ ] Chrome extension compatibility layer
- [ ] Mobile apps (Tauri 2.0 mobile targets)
- [ ] Lumen Orca integration for multi-agent orchestration

---

## Support & Resources

- **Repository**: ecosystems/vyberology-core/apps/vyber
- **Launch Checklist**: docs/launch-checklist.md
- **README**: README.md
- **Plan Document**: .claude/plans/ancient-sprouting-parrot.md

---

## Key Contacts

| Role | Team |
|------|------|
| Development | AIlliance |
| Product | Vybe Executive Team |
| Infrastructure | DevOps |

---

*Document generated January 2026*
