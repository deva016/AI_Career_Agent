# AI Career Agent — UI/UX Design Document
## Human-in-the-Loop (HITL) Command Center Interface

---

## 1. Design Philosophy
The interface is designed as a **Command Center** for supervising autonomous AI agents. The goal is not a traditional dashboard but a **Human-in-the-Loop (HITL) oversight system** where users collaborate with agents rather than merely observe outputs.

Core principles:
- Visibility of agent state over static metrics
- Traceability of AI reasoning
- Low cognitive load via high-contrast status design
- Action-first UX (Approve / Regenerate / Edit)

---

## 2. Information Architecture
### Primary Navigation
- Mission Log (default home)
- Resume Workbench
- Jobs & Applications
- LinkedIn Studio
- Insights (Skill Gap, Metrics)
- Settings

### Layout Pattern
- Left Sidebar: Navigation + Agent status
- Center Panel: Active mission timeline
- Right Panel: Contextual artifacts and actions

---

## 3. The "State of Play" Overview
A top KPI strip provides real-time summary:
- Applications Sent
- Time Saved (Hours)
- Token Usage / Model Mode (Free vs Paid)
- Active Agents Count

Below this, a grid/list of **Active Missions**:
Each mission card shows:
- Agent name (Job Finder, Resume Writer, Apply Bot)
- Current status: Thinking, Scraping, Executing, Needs Review
- Timestamp and progress indicator

Visual system:
- Dark theme base
- Green: autonomous progress
- Amber: human input required
- Blue: informational

---

## 4. Multi-Agent Orchestration (Swarm View)
The Mission Log displays a **threaded timeline**:
- Job Finder → passes JD to Resume Agent
- Resume Agent → produces draft → triggers HITL
- Apply Agent → executes after approval

A resource widget shows:
- Model mode toggle: Slow/Free vs Fast/Paid
- Priority level per mission

---

## 5. Human-in-the-Loop (HITL) Interaction Model
When agent confidence is below threshold:

### Side-by-Side Review
- Original Resume vs Tailored Resume
- Inline highlights of changed sections

### Action Chips
Floating contextual buttons:
- Approve
- Regenerate
- Edit Manually

These appear only at decision points.

---

## 6. Reasoning & Traceability
Each mission step has a "Show Logic" toggle:
- Displays reasoning trace
- Shows which resume chunks matched JD via vector similarity
- Explains why certain skills were emphasized

---

## 7. Artifact System
All outputs are treated as movable objects:
- Resume PDFs
- Scraped job screenshots
- Cover letters
- LinkedIn post drafts

Artifacts can be:
- Previewed
- Downloaded
- Reused in other missions

---

## 8. Resume Workbench
Dedicated screen for resume optimization:
- AI suggestions appear as swipeable cards
- Accept (swipe right) or reject (swipe left)
- Live preview of final resume

---

## 9. Empty State Experience
Instead of blank screens, show suggested missions:
- "12 new jobs match your profile. Start Scrape Mission?"
- "Your LinkedIn has been inactive for 5 days. Generate a post?"

---

## 10. Component Design Specs
| Component | Purpose | Interaction |
|---|---|---|
| Mission Card | Show agent task | Click to expand timeline |
| Action Chips | HITL controls | Contextual, floating |
| KPI Strip | System overview | Static, real-time updates |
| Artifact Card | Output object | Drag, preview, reuse |
| Logic Panel | Reasoning trace | Expand/collapse |
| Resume Diff View | Compare resumes | Inline highlights |

---

## 11. Visual Style Guide
- Theme: High-contrast dark
- Accent colors: Green (active), Amber (review), Blue (info)
- Font: Modern sans-serif (Inter / Geist)
- Card radius: 12–16px
- Soft shadows and glassmorphism panels

---

## 12. Interaction States
| State | Meaning |
|---|---|
| Thinking | Agent processing |
| Executing | Automation in progress |
| Needs Review | Awaiting user action |
| Completed | Mission done |

---

## 13. Accessibility
- High contrast ratios
- Keyboard navigable action chips
- Clear status labels, not color-only

---

## 14. Outcome
This UI transforms the AI Career Agent into a collaborative control room where users supervise, approve, and understand agent actions rather than passively consuming outputs.

