# EngineerOS Design System (Phase 7)

> **"The Complete Operating System for an Engineering Student"**  
> *A high-velocity, disciplined, developer-grade interface tailored for engineers.*

---

## 1. Design Direction & Core Philosophy

EngineerOS is designed for **engineering students**: ambitious, focused, technical, and practical. It bridges academic rigor (GPA, university syllabi, GATE) with modern software engineering craft (DSA, live execution, system architecture, peer code reviews).

### The Golden Rule
> **"Spend boldness in one place."**  
> The **Profile Card** is the vibrant, memorable showcase that students customize, share, and export. The surrounding operating system remains calm, disciplined, dark-mode first, and hyper-legible—like Linear, GitHub, and VS Code.

---

## 2. Design Tokens

### 2.1 Color Palette
A compact 5-color core palette complemented by structured neutrals and precise semantic tokens.

| Token | Hex | Name | Role |
| :--- | :--- | :--- | :--- |
| `--brand-500` | `#2563EB` | **Blueprint Cobalt** | Primary brand color, primary actions, active tabs, link states |
| `--brand-600` | `#1D4ED8` | **Deep Cobalt** | Button hover states, high-contrast borders |
| `--emerald-500` | `#10B981` | **Compiler Green** | Success states, solved DSA problems, active streak, passing tests |
| `--amber-500` | `#F59E0B` | **Signal Amber** | Medium difficulty, pending review, GATE accuracy cues |
| `--rose-500` | `#EF4444` | **Fault Rose** | Hard difficulty, runtime errors, proctoring warnings |
| `--violet-500` | `#8B5CF6` | **Alumni Violet** | Senior mentorship, AI tutor, verified badges |
| `--cyan-500` | `#06B6D4` | **Logic Cyan** | GATE formulas, algorithmic hints, architecture tags |

#### Neutrals (Dark-Mode Primary, Light-Mode Adaptive)
```css
/* Surface & Layering (Dark Mode) */
--surface-950: #0B0F17;  /* Canvas background (deep obsidian) */
--surface-900: #111827;  /* Card base / sidebar background */
--surface-850: #162032;  /* Elevated panel / dropdowns */
--surface-800: #1F2937;  /* Card borders / secondary button background */
--surface-700: #374151;  /* Dividers, input borders, hover states */
--surface-500: #6B7280;  /* Muted metadata, helper text, icons */
--surface-300: #D1D5DB;  /* Secondary text */
--surface-100: #F3F4F6;  /* Primary headers, high-contrast typography */
--surface-50:  #FFFFFF;  /* Maximum contrast elements */
```

### 2.2 Typography Scale
Two font families with distinct responsibilities:
1. **Sans-Serif (`font-sans`):** `Inter, system-ui, -apple-system, sans-serif`  
   *Role:* Primary UI typography, instructions, dialogs, button labels, and readability-critical summaries.
2. **Monospace (`font-mono`):** `JetBrains Mono, Fira Code, Menlo, monospace`  
   *Role:* Code editor, terminal outputs, execution times, memory limits, test cases, formulas, streaks, and numeric badges.

| Scale Token | Font Size | Line Height | Tracking | Recommended Use |
| :--- | :--- | :--- | :--- | :--- |
| `text-xs` | 0.75rem (12px) | 1.00rem (16px) | `+0.01em` | Badge text, table metadata, keyboard shortcuts (`Ctrl+K`) |
| `text-sm` | 0.875rem (14px)| 1.25rem (20px) | `0em` | Body text, input text, table cells, secondary actions |
| `text-base` | 1.00rem (16px) | 1.50rem (24px) | `-0.01em`| Card titles, article paragraphs, prominent buttons |
| `text-lg` | 1.125rem (18px)| 1.75rem (28px) | `-0.015em`| Section headers, modal titles, stat metrics |
| `text-xl` | 1.25rem (20px) | 1.75rem (28px) | `-0.02em`| Page widget titles, hero subheaders |
| `text-2xl` | 1.50rem (24px) | 2.00rem (32px) | `-0.025em`| Stat numbers, module titles |
| `text-3xl` | 1.875rem (30px)| 2.25rem (36px) | `-0.03em`| Page titles, Profile Card student name |

### 2.3 Spacing Scale
4px baseline grid (`rem` based):
- `0.5` = 2px (Hairline margins)
- `1` = 4px (Icon offsets, badge padding)
- `1.5` = 6px (Compact button padding)
- `2` = 8px (Form field internal gaps)
- `3` = 12px (Compact card padding, icon button padding)
- `4` = 16px (Standard card padding, component margins)
- `6` = 24px (Widget gutters, modal padding)
- `8` = 32px (Section gaps)
- `12` = 48px (Major layout columns)

### 2.4 Radius and Elevation Rules
- **Radius-sm (`rounded-md`, 6px):** Badges, tooltips, tags, dropdown items.
- **Radius-md (`rounded-xl`, 12px):** Buttons, inputs, tab items, stat chips.
- **Radius-lg (`rounded-2xl`, 16px):** Standard dashboard widgets, modal containers, coding editor frames.
- **Radius-full (`rounded-full`, 9999px):** Avatars, progress rings, pill toggles.
- **Elevation:**
  - *Base:* Crisp 1px border (`border-surface-800`) with subtle backdrop blur (`backdrop-blur-md`).
  - *Hover:* Slight border highlight (`hover:border-surface-700`) and soft ambient shadow (`shadow-md shadow-black/20`).
  - *Overlay/Modal:* High contrast border (`border-surface-700`), deep shadow (`shadow-2xl shadow-black/60`).

### 2.5 Motion & Animation Rules
- **Orchestrated Entrance:** When the Dashboard or Profile Card mounts, elements stagger in once (`fade-in-up`, 250ms duration, 40ms stagger per section).
- **Interactive Feedback:** Buttons and interactive elements use micro-transitions (150ms `ease-out`, active `scale-[0.98]`).
- **Reduced Motion:** Every animation is enclosed in `@media (prefers-reduced-motion: reduce)` which disables translateY/scale transforms and limits motion to instant opacity shifts.

---

## 3. Profile Card: 5 Distinct Themes

The EngineerOS Profile Card is the user's visual passport. It supports 5 distinct layout aesthetics:

1. **Terminal (`theme-terminal`):**
   - *Aesthetic:* Monospaced hacker terminal, matrix/phosphor accents.
   - *Palette:* Carbon black background (`#0A0D12`), green `#22C55E` & cyan `#06B6D4` highlights, scanline border accents, `user@engineeros:~$` title bar.
2. **Minimalist (`theme-minimalist`):**
   - *Aesthetic:* Swiss modernist architectural typography.
   - *Palette:* High-contrast monochrome (`#09090B` surface, `#FAFAFA` text), hairline borders (`#27272A`), zero-radius or subtle 4px geometry, pure typographic hierarchy.
3. **Silicon Neon (`theme-silicon`):**
   - *Aesthetic:* High-energy developer studio glow.
   - *Palette:* Deep twilight canvas (`#0D111A`), dual gradient borders (Cobalt `#2563EB` to Violet `#8B5CF6`), subtle back-glow blur, vibrant accent pills.
4. **Varsity Academic (`theme-varsity`):**
   - *Aesthetic:* Prestige engineering university credentials.
   - *Palette:* Deep collegiate navy (`#091E36`), gold `#F59E0B` foil accents, formal branch crest badge, structured two-column layout.
5. **Technical Blueprint (`theme-brutal`):**
   - *Aesthetic:* Raw engineering CAD / hardware schematic.
   - *Palette:* Blueprint slate (`#0F172A`), sharp 2px solid geometric borders, technical measurement marks (`[DATA:OK]`, `ID//8942`), high-density stat grid.

---

## 4. Critique Against Generic Template Defaults

### What we explicitly rejected:
1. ❌ **Identical grey rounded cards everywhere:** Generic SaaS dashboards look like a wall of identical 12px grey boxes with identical padding.
   - *Our Revision:* We implement a deliberate visual hierarchy: the **Profile Card Hero** commands immediate visual authority, the **"What Should I Do Today?"** panel features dynamic high-contrast urgency cues, and the **Module Strip** is rendered as a slim, horizontal telemetry strip with sparklines.
2. ❌ **Gradient-wash decoration:** Random pastel or neon blobs behind cards that have no functional meaning.
   - *Our Revision:* Backgrounds remain solid, calm, deep obsidian. Color is strictly functional (green for passing/solved, amber for medium/attention, rose for errors/critical deadlines).
3. ❌ **All-caps tracked eyebrow labels over every heading (`OVERVIEW`, `STATS`):**
   - *Our Revision:* Direct, clear sentence-case titles with semantic icons (`What should I do today?`, `Recent activity`, `Academic curriculum`).
4. ❌ **"->" or chevron on every button:**
   - *Our Revision:* Buttons state direct, active verbs without cliché arrows ("Solve next problem", "Download card", "Start mock test").
5. ❌ **Fake or static sample graphs:**
   - *Our Revision:* Real 365-day SVG activity heatmap, exact solved problem splits (Easy/Medium/Hard with exact counts), and zero-state illustrations when data is empty.

---

## 5. ASCII Wireframes

### 5.1 Redesigned Dashboard
```text
+-----------------------------------------------------------------------------------------------------------------+
| EngineerOS  [Search or press Ctrl+K...]                     [Today: 4 Tasks]  [Streak: 12🔥]  [🔔 2]  [Avatar] |
+-----------------------------------------------------------------------------------------------------------------+
|                                                                                                                 |
| +-----------------------------------------------+  +----------------------------------------------------------+ |
| | [HERO PROFILE CARD]                           |  | WHAT SHOULD I DO TODAY?                   [3 of 4 done] | |
| | +-------------------------------------------+ |  +----------------------------------------------------------+ |
| | | [Avatar] Alex Chen (@alexchen)            | |  | [x] 1. Daily DSA: Implement LRU Cache (25 min)   [Solved] | |
| | | B.Tech Computer Science * 6th Sem         | |  | [ ] 2. GATE Revision: Database Normalization     [Start]  | |
| | | IIT Bombay * Class of 2027                | |  |     Target: 15 questions * Est. 20 min    [Snooze]        | |
| | | "Building distributed systems & algorithms"| |  | [ ] 3. Submit Operating Systems Lab 4           [Open]   | |
| | +-------------------------------------------+ |  |     Due in 4 hours * Prof. K. Sharma              | |
| | | Coding: 142 Solved (E:60 | M:65 | H:17)   | |  +----------------------------------------------------------+ |
| | | GATE Mock Avg: 68.5% | Readiness: 82/100  | |                                                               |
| | | Current Streak: 12 Days 🔥 | Badges: 8 🏆 | |  +----------------------------------------------------------+ |
| | +-------------------------------------------+ |  | 365-DAY ACTIVITY HEATMAP            Total Active: 184 Days| |
| | [ Customize Card ]   [ Share ]   [ Download ]| |  | [][][][][■][■][■][][][][■][■][■][■][■][■][■]  Less ■■■ More| |
| +-----------------------------------------------+  +----------------------------------------------------------+ |
|                                                                                                                 |
| +-------------------------------------------------------------------------------------------------------------+ |
| | MODULE TELEMETRY STRIP                                                                                      | |
| | +----------------+  +----------------+  +----------------+  +----------------+  +-------------------------+ | |
| | | ACADEMIC HUB   |  | CODING / DSA   |  | GATE HUB       |  | ASSESSMENTS    |  | MOCK INTERVIEWS         | | |
| | | 78% Completed  |  | 142 Solved     |  | 68.5% Avg Score|  | 2 Scheduled    |  | 82/100 Readiness        | | |
| | | 5 Subjects     |  | Rank #42       |  | Rank: Top 5%   |  | Next: Tomorrow |  | Last: System Design      | | |
| | | [Open Hub]     |  | [Solve Next]   |  | [Take Mock]    |  | [View Test]    |  | [Practice Now]          | | |
| | +----------------+  +----------------+  +----------------+  +----------------+  +-------------------------+ | |
| +-------------------------------------------------------------------------------------------------------------+ |
|                                                                                                                 |
| +-----------------------------------------------+  +----------------------------------------------------------+ |
| | UPCOMING DEADLINES & EXAMS                    |  | STRENGTHS & WEAK SPOTS REVISION                          | |
| | - Tomorrow, 10:00 AM: Mid-Sem Algorithms      |  | * Dynamic Programming (Accuracy: 42% - Needs Practice)   | |
| | - Friday, 11:59 PM: DBMS Assignment 3         |  | * Computer Networks: TCP Congestion (Accuracy: 55%)      | |
| | - Sunday, 02:00 PM: GATE CS Full Mock #3      |  | ✓ Binary Trees & Heaps (Accuracy: 91% - Mastered)        | |
| +-----------------------------------------------+  +----------------------------------------------------------+ |
+-----------------------------------------------------------------------------------------------------------------+
```

### 5.2 EngineerOS Profile Card (Shared / Downloadable)
```text
+-----------------------------------------------------------------------+
|  ENGINEEROS // VERIFIED STUDENT PASSPORT                   [THEME: CAD]
+-----------------------------------------------------------------------+
|  +-------------+  ALEX CHEN                                           |
|  |             |  @alexchen  *  Class of 2027                         |
|  |   [PHOTO]   |  B.Tech Computer Science & Engineering               |
|  |             |  Indian Institute of Technology, Bombay              |
|  +-------------+  "Systems enthusiast, competitive programmer, GATE CS"
+-----------------------------------------------------------------------+
|  CODING STATS            GATE PREPARATION        SYSTEM READINESS     |
|  142 Problems Solved     68.5% Mock Average      82/100 Readiness     |
|  Easy: 60  Med: 65  H: 17 Top 5% Percentile      Level: Strong        |
|  Accuracy: 78.4%         6 Tests Completed       4 Sessions Practiced |
+-----------------------------------------------------------------------+
|  TOP VERIFIED SKILLS                             ACTIVE STREAK        |
|  [Graphs: 88%]  [DP: 72%]  [OS: 91%]  [DBMS: 84%] 12 Days 🔥 (Max: 45) |
+-----------------------------------------------------------------------+
|  RECENT BADGES                                                        |
|  [🏆 50 Problems]  [⚡ 7-Day Streak]  [🎯 GATE Debut]  [🎓 5th Sem Done] |
+-----------------------------------------------------------------------+
|  ACTIVITY SPECTRUM (PAST 365 DAYS)                                    |
|  [■][■][ ][■][■][■][■][ ][■][■][■][ ][■][■][■][■][■][■][■][■][■][■]   |
+-----------------------------------------------------------------------+
|  [QR CODE]  verify: engineeros.dev/u/alexchen       Issued: Oct 2026   |
+-----------------------------------------------------------------------+
```

### 5.3 Module Workspace (Coding Platform with Monaco & Real Split)
```text
+-----------------------------------------------------------------------------------------------------------------+
| < Back to Catalogue  |  #42. LRU Cache  [Medium]  [Algorithms / Data Structures]   [🔥 Solved by 1.2k students] |
+-----------------------------------------------------------------------------------------------------------------+
| PROBLEM SPECIFICATION                           | MONACO CODE EDITOR             [JavaScript v20] [Reset] [Save]|
| Description:                                    | 1  class LRUCache {                                           |
| Design a data structure that follows the        | 2    constructor(capacity) {                                  |
| constraints of a Least Recently Used cache.     | 3      this.capacity = capacity;                              |
|                                                 | 4      this.map = new Map();                                  |
| Constraints:                                    | 5    }                                                        |
| * 1 <= capacity <= 3000                         | 6    get(key) { ... }                                         |
| * Both get and put in O(1) time complexity.     | 7    put(key, value) { ... }                                  |
|                                                 | 8  }                                                          |
| Test Cases: [Case 1] [Case 2] [Custom]          |---------------------------------------------------------------|
| Input: ["LRUCache", [2], "put", [1, 1]...]      | TERMINAL & EXECUTION RESULTS                   [Run] [Submit] |
| Expected: [null, null, 1...]                    | Status: Passed (3/3 test cases) * Runtime: 42ms * Memory: 18MB|
+-----------------------------------------------------------------------------------------------------------------+
```

---

## 6. Component Library Specification

The component library lives in `client/src/components/`. All components support dark mode, accessible keyboard navigation, and consistent tokens.

1. **`Button`:**
   - Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`.
   - Sizes: `sm`, `md`, `lg`.
   - Props: `isLoading`, `leftIcon`, `rightIcon`, `disabled`.
2. **`IconButton`:**
   - Square/circular action buttons for toolbars and actions (`size="sm"|"md"|"lg"`, `variant`, `aria-label`).
3. **`Card`:**
   - Structural container (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`).
   - Supports `hover`, `interactive`, and `glow` variants.
4. **`StatCard`:**
   - Metric callout with title, primary value, trend badge, icon, and optional sparkline/subtitle.
5. **`ProgressRing`:**
   - SVG circular progress indicator with percentage readout, custom colors (`brand`, `emerald`, `amber`), stroke width, and animation.
6. **`Heatmap`:**
   - 365-day compact activity calendar (GitHub/GitLab style) with tooltip hover and intensity levels 0–4.
7. **`Badge`:**
   - Status chips: `default`, `brand`, `success`, `warning`, `danger`, `violet`, `cyan`.
8. **`Avatar`:**
   - Circular profile image with fallback initials, online/offline status dot, and size scale (`xs` to `2xl`).
9. **`Tabs`:**
   - Accessible tab navigation (`TabsList`, `TabsTrigger`, `TabsContent`) with active indicator animation.
10. **`Table`:**
    - High-density data table (`TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`) with hover highlights and striped support.
11. **`Modal` & `Drawer`:**
    - Modal: Centered dialog with backdrop blur, Escape listener, focus trapping, and enter animation.
    - Drawer: Slide-over side sheet from right/bottom for filters and mobile workflows.
12. **`Toast`:**
    - ToastProvider + `useToast()` hook. Toast alerts (`success`, `error`, `info`, `warning`) with auto-dismiss and action button.
13. **`Skeleton`:**
    - Shimmer animation placeholder for text, cards, tables, and avatar profiles.
14. **`EmptyState`:**
    - Clean illustration/icon, actionable prompt, and primary CTA.
15. **`ErrorState`:**
    - Error message with retry action button and technical details foldout.
16. **`Tooltip`:**
    - Accessible hover/focus micro-dialog with arrow.
17. **`CommandPalette`:**
    - Global `Ctrl+K` searchable dialog with instant keyboard navigation across all modules and actions.

