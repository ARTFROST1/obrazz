# ⚡ Quick Reference - Параллельная разработка Obrazz

## 📞 Кто за что отвечает

| Область              | Разработчик A   | Разработчик B   |
| -------------------- | --------------- | --------------- |
| **UI/UX**            | ✅ Владелец     | 🔍 Review       |
| **Backend/API**      | 🔍 Review       | ✅ Владелец     |
| **State Management** | 📖 Читает       | ✅ Создает      |
| **Components**       | ✅ Создает      | 📖 Использует   |
| **Services**         | 📖 Использует   | ✅ Создает      |
| **Database**         | 🔍 Review       | ✅ Владелец     |
| **Types**            | 🤝 Согласование | 🤝 Согласование |
| **Testing**          | 🤝 50/50        | 🤝 50/50        |

---

## 📅 Текущая неделя - Что делать СЕЙЧАС

### НЕДЕЛЯ 1: Stage 3 - Wardrobe Management

#### 🔵 Dev A - Tasks

```bash
✓ СЕЙЧАС: Wardrobe Screen UI
  └─ app/(tabs)/wardrobe.tsx
  └─ components/wardrobe/ItemCard.tsx
  └─ components/wardrobe/ItemGrid.tsx

→ ДАЛЕЕ: Add Item Screen
→ ПОТОМ: Filters & Detail
```

#### 🟢 Dev B - Tasks

```bash
✓ СЕЙЧАС: Item Service
  └─ services/wardrobe/itemService.ts
  └─ store/wardrobe/wardrobeStore.ts
  └─ Supabase CRUD setup

→ ДАЛЕЕ: Background Removal API
→ ПОТОМ: Query Optimization
```

---

## 🔄 Daily Routine

### Morning (9:00)

```bash
1. git checkout dev
2. git pull origin dev
3. git checkout -b feature/dev-[a|b]/task-name
4. Standup call (15 min)
5. Start coding
```

### During Day

```bash
# Commit often
git add .
git commit -m "feat(scope): description"

# Push to your branch
git push origin feature/dev-[a|b]/task-name

# Create PR when ready
# Request review from partner
```

### Evening (18:00)

```bash
1. Push all commits
2. Create/update PR
3. Quick sync call (15 min)
4. Update STATUS.md if needed
```

---

## 🆘 Когда застрял - Quick Actions

### 1. Technical Issue

```
⏱️ Try yourself: 30 min
  ↓ (if not solved)
💬 Ask partner: Quick call
  ↓ (if not solved)
📖 Check docs: Bug_tracking.md
  ↓ (if not solved)
🌐 External: StackOverflow/GitHub
```

### 2. Merge Conflict

```
🔍 Analyze: What files conflict?
  ↓
🤝 Discuss: 5-min call with partner
  ↓
✅ Resolve: Together in pair
  ↓
✓ Test: Both review solution
```

### 3. Design Decision

```
🤔 Uncertain about approach?
  ↓
📝 Document options
  ↓
💬 Quick sync: 10-min discussion
  ↓
✅ Decision: Document in code comments
```

---

## 📁 File Structure - Кто где работает

```
obrazz/
├── app/                    # Dev A (screens)
│   ├── (tabs)/            # Dev A
│   └── (modals)/          # Dev A
│
├── components/            # Dev A (создает)
│   ├── ui/               # Dev A owns
│   ├── wardrobe/         # Dev A
│   ├── outfit/           # Dev A
│   └── community/        # Dev A
│
├── services/              # Dev B (создает)
│   ├── wardrobe/         # Dev B
│   ├── outfit/           # Dev B
│   └── subscription/     # Dev B
│
├── store/                 # Dev B (создает)
│   ├── wardrobe/         # Dev B
│   └── outfit/           # Dev B
│
├── lib/                   # Dev B
│   └── supabase/         # Dev B
│
├── types/                 # BOTH (согласование!)
│   ├── api/              # Dev B инициирует
│   ├── models/           # Dev B инициирует
│   └── navigation/       # Dev A инициирует
│
└── Docs/                  # BOTH update
    └── Bug_tracking.md   # Track your own bugs
```

---

## 🔀 Git Workflow - Cheat Sheet

### Create Feature Branch

```bash
git checkout dev
git pull origin dev
git checkout -b feature/dev-a/wardrobe-ui
```

### Commit Changes

```bash
git add .
git commit -m "feat(wardrobe): add item grid component"
# или
git commit -m "fix(canvas): resolve gesture conflict"
```

### Push & Create PR

```bash
git push origin feature/dev-a/wardrobe-ui
# Затем на GitHub: Create Pull Request → dev
```

### Update from dev (daily!)

```bash
git checkout dev
git pull origin dev
git checkout feature/dev-a/wardrobe-ui
git rebase dev
# Resolve conflicts if any
git push -f origin feature/dev-a/wardrobe-ui
```

### Merge PR (after approval)

```bash
# На GitHub: Merge Pull Request
# Затем локально:
git checkout dev
git pull origin dev
git branch -d feature/dev-a/wardrobe-ui
```

---

## 💬 Communication Quick Guide

### Slack/Telegram Messages

#### ✅ GOOD Examples

```
Dev A: "Закончил ItemCard, можешь проверить типы в PR #12?"
Dev B: "Обновил Item types, breaking change в PR #13 - посмотри комменты"
Dev A: "Застрял с canvas gesture, созвонимся в 15:00?"
```

#### ❌ BAD Examples

```
"Ничего не работает"
"Можешь помочь?"
"Смотри PR"
```

### Code Comments

#### ✅ GOOD

```typescript
// TODO(dev-b): Integrate with itemService when ready
// FIXME: Gesture conflict when pinch + rotate together
// NOTE: This approach chosen because of X, Y, Z
```

#### ❌ BAD

```typescript
// fix this
// temp solution
// idk why this works
```

---

## 📋 PR Checklist - Before Submit

```markdown
## Before Creating PR

- [ ] Code compiles without errors
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Tested on device/simulator
- [ ] No console.logs left
- [ ] Comments added for complex logic
- [ ] Types updated if needed
- [ ] Docs updated if needed

## PR Description

- [ ] Clear title
- [ ] What changed
- [ ] Why it changed
- [ ] How to test
- [ ] Screenshots (if UI)
- [ ] Breaking changes noted
```

---

## 🐛 Bug Reporting Template

```markdown
### В Bug_tracking.md добавь:

**BUG-[S3/4/5]-[001]:** [Brief description]
**Date:** 2025-01-XX
**Severity:** Critical/High/Medium/Low
**Reporter:** Dev A/B
**Component:** Wardrobe/Canvas/etc

**Steps:**

1. ...
2. ...

**Expected:**
...

**Actual:**
...

**Solution:**
...

**Files:**

- file1.tsx
- file2.ts
```

---

## 📊 Sync Points Calendar

### Week 1 - Stage 3

```
Mon  ── Tue ── Wed ── Thu ── Fri
  │            │            │
  └─Day 2      └─Day 4      └─Day 6
    Sync         Sync         Sync
```

### What to discuss at Sync Points

- **Day 2:** API contracts, Type definitions
- **Day 4:** Integration issues, Blockers
- **Day 6:** Final testing, Next week planning

---

## 🎯 This Week's Metrics

### Targets

```
✓ Tasks completed:      [  /  ]
✓ PRs merged:           [  /  ]
✓ Code reviews done:    [  /  ]
✓ Bugs fixed:           [  /  ]
✓ Tests added:          [  /  ]
```

### Quality Gates

```
✓ Build passing:        [ YES / NO ]
✓ All tests green:      [ YES / NO ]
✓ No critical bugs:     [ YES / NO ]
✓ Docs updated:         [ YES / NO ]
```

---

## ⚡ Hotkeys & Commands

### VS Code

```
Cmd/Ctrl + Shift + P  → Command Palette
Cmd/Ctrl + P          → Quick File Open
Cmd/Ctrl + Shift + F  → Search in files
F12                   → Go to definition
Shift + F12           → Find references
Cmd/Ctrl + .          → Quick fix
```

### Terminal

```bash
npm start              # Start Expo
npm run lint:fix       # Fix lint errors
npm run type-check     # Check TypeScript
npm run format         # Format code

# Git shortcuts
git st                 # status
git co <branch>        # checkout
git br                 # branch list
git lg                 # log graph
```

---

## 🔗 Important Links

### Documentation

- [Implementation Plan](./Implementation.md)
- [Parallel Roadmap](./PARALLEL_DEVELOPMENT_ROADMAP.md)
- [Tech Stack](./TechStack.md)
- [UI/UX Guide](./UI_UX_doc.md)
- [Project Structure](./project_structure.md)
- [Bug Tracking](./Bug_tracking.md)

### External Resources

- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Supabase Docs](https://supabase.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [TanStack Query](https://tanstack.com/query/latest)

### Tools

- GitHub Repository: [link]
- Slack/Telegram: [link]
- Figma Design: [link]
- Supabase Dashboard: [link]

---

## 🚨 Emergency Contacts

```
Critical Bug:           @both immediate call
Production Issue:       @both + stakeholders
Blocked >1 hour:        @partner sync
Security Issue:         @both + document
Data Loss Risk:         STOP + call
```

---

## 🎓 Code Style Quick Rules

### TypeScript

```typescript
// ✅ GOOD
interface UserProfile {
  id: string;
  name: string;
}

// ❌ BAD
type UserProfile = {
  id: any;
  name: any;
};
```

### React Components

```typescript
// ✅ GOOD
export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  return <View>...</View>;
};

// ❌ BAD
export default function ItemCard(props) {
  return <View>...</View>;
}
```

### Imports

```typescript
// ✅ GOOD - Use aliases
import { ItemCard } from '@components/wardrobe/ItemCard';
import { useItems } from '@hooks/useItems';

// ❌ BAD - Relative paths
import { ItemCard } from '../../../components/wardrobe/ItemCard';
```

---

## 🎯 Focus Areas

### Dev A Priority

1. User-facing UI
2. Smooth animations
3. Responsive design
4. Accessibility
5. Visual polish

### Dev B Priority

1. Data integrity
2. Performance
3. Error handling
4. API reliability
5. Security

---

**Print this page and keep it at your desk! 📌**

**Questions? → Ask partner immediately! 💬**

**Stuck? → Follow the "When застрял" guide ⬆️**

**Remember: Communication > Code! 🤝**
