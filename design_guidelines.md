# Advanced Hackathon LMS - Design Guidelines

## Design Approach

**Selected Approach**: Design System Foundation with Educational Platform Optimization

This LMS requires a utility-focused design prioritizing clarity, efficiency, and learning workflows. Drawing inspiration from Google Classroom's educational focus and Notion's organized content structure, the design emphasizes information hierarchy, task completion, and progress visualization.

**Core Principles**:
- Clarity over decoration: Every element serves a functional purpose
- Progressive disclosure: Show relevant information based on user role and context
- Achievement visibility: Make progress and accomplishments immediately apparent
- Cognitive ease: Reduce mental load through consistent patterns and clear CTAs

---

## Core Design Elements

### A. Color Palette

**Light Mode**:
- Primary: 221 83% 53% (Professional blue - trust and education)
- Primary Hover: 221 83% 45%
- Background: 0 0% 100% (Pure white)
- Surface: 220 13% 97% (Subtle card backgrounds)
- Border: 220 13% 91%
- Text Primary: 222 47% 11%
- Text Secondary: 215 14% 34%
- Success: 142 71% 45% (Assignment completion, grades)
- Warning: 38 92% 50% (Pending submissions)
- Error: 0 84% 60% (Failed submissions, overdue)

**Dark Mode**:
- Primary: 217 91% 60% (Brighter for dark backgrounds)
- Primary Hover: 217 91% 70%
- Background: 222 47% 11%
- Surface: 217 33% 17%
- Border: 217 33% 24%
- Text Primary: 210 40% 98%
- Text Secondary: 215 20% 65%
- Success: 142 71% 45%
- Warning: 48 96% 53%
- Error: 0 72% 51%

**Accent Colors** (Sparingly):
- Student Role Indicator: 271 81% 56% (Purple)
- Teacher Role Indicator: 142 76% 36% (Green)
- Grade Highlight: 48 96% 53% (Amber for attention)

### B. Typography

**Font Stack**:
- Primary: 'Inter', -apple-system, system-ui, sans-serif
- Monospace (code submissions): 'JetBrains Mono', 'Fira Code', monospace

**Type Scale**:
- Display (Dashboard headers): text-4xl (36px), font-bold, tracking-tight
- Heading 1 (Page titles): text-3xl (30px), font-semibold
- Heading 2 (Section headers): text-2xl (24px), font-semibold
- Heading 3 (Card titles): text-xl (20px), font-medium
- Body Large (Important info): text-base (16px), font-normal
- Body (Default): text-sm (14px), font-normal
- Caption (Metadata): text-xs (12px), font-medium, text-secondary

**Reading Optimization**:
- Body text line-height: leading-relaxed (1.625)
- Max content width: max-w-4xl for long-form content
- Course descriptions: max-w-2xl for optimal reading

### C. Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16 for consistent rhythm
- Component padding: p-4, p-6, p-8
- Section spacing: space-y-6, space-y-8
- Card gaps: gap-4, gap-6
- Page margins: mx-4 (mobile), mx-8 (tablet), mx-auto max-w-7xl (desktop)

**Grid System**:
- Dashboard cards: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Course list: grid grid-cols-1 lg:grid-cols-2 gap-4
- Assignment grid: grid grid-cols-1 gap-4 (stack vertically for focus)
- Stats overview: grid grid-cols-2 md:grid-cols-4 gap-4

**Container Widths**:
- Main dashboard: max-w-7xl
- Form pages: max-w-2xl
- Reading content: max-w-4xl

### D. Component Library

**Navigation**:
- Top navbar: Fixed header with logo, role indicator, notifications icon, user avatar
- Sidebar navigation (desktop): Collapsible left sidebar with primary actions (Dashboard, Courses, Assignments, Grades)
- Mobile navigation: Bottom tab bar with 4 primary actions
- Breadcrumbs: Show course > assignment hierarchy

**Cards**:
- Course cards: Elevated (shadow-md), rounded-lg, p-6, hover:shadow-lg transition
- Assignment cards: Border style (border-2), rounded-md, p-4, status indicator on left edge
- Grade cards: Compact, border style, flex layout with score prominently displayed
- Stat cards: Minimal border, large number display, icon in corner

**Forms**:
- Input fields: Consistent height (h-11), rounded-md, border-2, focus:ring-2 focus:ring-primary
- Textareas: min-h-32 for assignment descriptions
- File upload: Drag-drop zone with dashed border, p-8, centered icon and text
- Buttons: Primary (bg-primary, text-white), Secondary (border-2 border-primary, text-primary), Destructive (bg-error)

**Data Display**:
- Tables: Striped rows, sticky header, responsive scroll on mobile
- Progress bars: Rounded-full, h-2, gradient fill for visual interest
- Badge system: Rounded-full pills for status (Enrolled, Pending, Graded, Overdue)
- Enrollment roster: Avatar list with student names, truncate on small screens

**Empty States**:
- Illustrative: Simple SVG icon, primary heading, secondary description, CTA button
- No courses: "Start by creating your first course" with + Create button
- No assignments: "No assignments yet" with supportive messaging

**Modals & Overlays**:
- Modal dialogs: Centered, max-w-lg, rounded-xl, shadow-2xl, backdrop-blur
- Confirmation dialogs: Clear action buttons (Cancel + Confirm), danger actions in red
- Assignment submission modal: Full-screen on mobile, large textarea + file upload

### E. Dashboard Layouts

**Student Dashboard**:
- Hero section: Welcome message, current course progress ring chart, quick stats (enrolled courses, pending assignments)
- Enrolled courses grid: Card view with progress indicator, next assignment due date
- Upcoming assignments: Timeline view sorted by due date with urgency indicators
- Recent grades: Compact list with course name, assignment, score

**Teacher Dashboard**:
- Overview stats: Total courses, total students, pending submissions count
- Course cards: Grid with enrollment count, latest activity indicator
- Pending reviews: Queue of submissions awaiting grades, sorted by submission date
- Quick actions: Prominent "Create Course" and "Create Assignment" CTAs

**Course Detail Page**:
- Header: Course title, description, teacher info, enrollment stats
- Tab navigation: Overview, Assignments, Students (teacher only), Materials
- Content area: Contextual based on active tab
- Sidebar: Course progress (students), Student list (teachers), Quick actions

### F. Interaction Patterns

**Micro-interactions**:
- Card hover: Subtle lift (transform translateY(-2px)) + shadow increase
- Button press: Scale down slightly (scale-95) on active state
- Success feedback: Green checkmark animation on submission
- Loading states: Skeleton screens for data-heavy pages, spinner for actions

**Navigation Flow**:
- Dashboard → Courses → Course Detail → Assignment → Submission (student)
- Dashboard → Create Course → Add Assignments → View Submissions → Grade (teacher)
- Persistent breadcrumbs for deep navigation

**Visual Feedback**:
- Assignment status: Color-coded left border (green=completed, amber=pending, red=overdue)
- Grade display: Large score with letter grade, progress bar for visual comparison
- Enrollment action: Instant state change with undo option (toast notification)

---

## Images

**Hero Images**: Not required for this dashboard application. Use gradient backgrounds with geometric patterns for visual interest without distraction.

**Avatar Images**: Required for user profiles - circular, consistent sizing (w-8 h-8 for small, w-12 h-12 for medium, w-24 h-24 for profile pages)

**Illustration Graphics**: Use for empty states and onboarding - simple, flat illustration style matching primary color palette

**Course Thumbnails**: Optional placeholder system with course initial letter on colored background (use primary color variants)