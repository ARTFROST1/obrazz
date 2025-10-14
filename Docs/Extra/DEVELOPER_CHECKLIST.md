# ✅ Developer Setup Checklist

## Before Starting Development

### 1. Prerequisites Installed

- [ ] Node.js 18.x or higher
- [ ] npm or yarn package manager
- [ ] Git
- [ ] Code editor (VS Code recommended)
- [ ] Expo Go app on phone (for testing)

### 2. Project Setup

- [x] Dependencies installed (`npm install` completed)
- [ ] Supabase account created
- [ ] Supabase project created
- [ ] Database schema deployed (run `lib/supabase/schema.sql`)
- [ ] Supabase API keys obtained

### 3. Environment Configuration

- [x] `.env` file exists
- [ ] `EXPO_PUBLIC_SUPABASE_URL` configured
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` configured
- [ ] Other API keys added (optional for Stage 1)

### 4. Development Tools

- [x] ESLint configured
- [x] Prettier configured
- [x] Husky git hooks active
- [x] TypeScript strict mode enabled
- [ ] VS Code extensions installed (recommended):
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

### 5. Verify Setup

```bash
# Run these commands to verify everything works:
npm run type-check    # Should complete without critical errors
npm run lint          # Should show only warnings, no errors
npm start             # Should start Expo dev server
```

## Daily Development Checklist

### Before Starting Work

- [ ] Pull latest changes from main branch
- [ ] Run `npm install` if package.json changed
- [ ] Check `/Docs/Implementation.md` for current tasks
- [ ] Review current stage requirements

### During Development

- [ ] Follow TypeScript strict typing
- [ ] Use path aliases (@components, @utils, etc.)
- [ ] Add TODO comments for future work
- [ ] Write meaningful commit messages
- [ ] Test on both iOS and Android (if possible)
- [ ] Check console for warnings/errors

### Before Committing

- [ ] Run `npm run lint:fix` to auto-fix issues
- [ ] Run `npm run format` to format code
- [ ] Run `npm run type-check` to verify types
- [ ] Test the app runs without errors
- [ ] Remove console.log statements
- [ ] Update documentation if needed

### Code Quality Standards

- [ ] All files have proper imports (including React)
- [ ] No `any` types used (use proper TypeScript types)
- [ ] Components are functional with hooks
- [ ] Styles are defined at bottom of file
- [ ] Props interfaces defined for components
- [ ] Meaningful variable names used

## Stage 2 Development Checklist

### Before Starting Stage 2

- [x] Stage 1 completed
- [ ] Supabase Auth enabled in dashboard
- [ ] Email templates configured in Supabase
- [ ] Review `/Docs/UI_UX_doc.md` for auth screens
- [ ] Understand auth flow requirements

### Stage 2 Tasks

- [ ] Create auth service in `/services/auth/`
- [ ] Setup Zustand auth store
- [ ] Implement registration form with validation
- [ ] Implement sign in form
- [ ] Add password reset flow
- [ ] Create auth state management
- [ ] Add protected route wrapper
- [ ] Implement profile screen
- [ ] Add onboarding flow
- [ ] Test auth flow end-to-end

## Common Commands

```bash
# Development
npm start                    # Start Expo dev server
npm run ios                  # Run on iOS
npm run android              # Run on Android
npm run web                  # Run on web

# Code Quality
npm run lint                 # Check for lint errors
npm run lint:fix             # Fix lint errors automatically
npm run format               # Format code with Prettier
npm run type-check           # Check TypeScript types

# Troubleshooting
npm start -- --clear         # Clear cache and restart
rm -rf node_modules && npm install  # Reinstall dependencies
```

## File Creation Guidelines

### Creating a New Screen

```typescript
// app/your-screen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function YourScreen() {
  return (
    <View style={styles.container}>
      <Text>Your Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
});
```

### Creating a New Component

```typescript
// components/YourComponent.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface YourComponentProps {
  title: string;
  onPress?: () => void;
}

export function YourComponent({ title, onPress }: YourComponentProps) {
  return (
    <View style={styles.container}>
      <Text>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});
```

### Creating a New Service

```typescript
// services/your-service/yourService.ts
import { supabase } from '@/lib/supabase/client';

export const yourService = {
  async getData() {
    const { data, error } = await supabase.from('table_name').select('*');

    if (error) throw error;
    return data;
  },
};
```

### Creating a Zustand Store

```typescript
// store/yourStore.ts
import { create } from 'zustand';

interface YourState {
  count: number;
  increment: () => void;
}

export const useYourStore = create<YourState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

## Documentation to Review

### Essential Reading

1. **[QUICKSTART.md](./QUICKSTART.md)** - Getting started guide
2. **[Implementation.md](./Docs/Implementation.md)** - Full roadmap
3. **[project_structure.md](./Docs/project_structure.md)** - File organization
4. **[TechStack.md](./Docs/TechStack.md)** - Technologies used

### Before Each Stage

1. Read stage requirements in Implementation.md
2. Review UI_UX_doc.md for design specs
3. Check Bug_tracking.md for known issues
4. Consult TechStack.md for library versions

## Testing Checklist

### Manual Testing

- [ ] App starts without errors
- [ ] All screens accessible
- [ ] Navigation works correctly
- [ ] No console errors
- [ ] No memory leaks
- [ ] Works on iOS (if available)
- [ ] Works on Android
- [ ] Responsive on different screen sizes

### Stage 2 Testing

- [ ] User can register
- [ ] User can sign in
- [ ] User can sign out
- [ ] Password reset works
- [ ] Invalid inputs show errors
- [ ] Loading states display correctly
- [ ] Auth persists after app restart

## Git Workflow

### Branching Strategy

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Regular commits
git add .
git commit -m "feat: add user registration form"

# Push to remote
git push origin feature/your-feature-name
```

### Commit Message Format

```
feat: add new feature
fix: fix bug in component
docs: update documentation
style: format code
refactor: refactor component
test: add tests
chore: update dependencies
```

## Troubleshooting

### Common Issues

**Metro bundler not starting**

```bash
npm start -- --clear
```

**TypeScript errors**

```bash
npm run type-check
# Fix any issues, then restart
```

**Module not found**

```bash
rm -rf node_modules
npm install
```

**Supabase connection issues**

- Check .env has correct credentials
- Verify Supabase project is active
- Check network connection

**Expo Go not connecting**

- Make sure phone and computer on same network
- Try scanning QR code again
- Restart Expo Go app

## Resources

### Documentation

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [Zustand](https://github.com/pmndrs/zustand)
- [TanStack Query](https://tanstack.com/query/latest)

### Community

- [React Native Discord](https://discord.gg/react-native)
- [Expo Discord](https://chat.expo.dev/)
- [Supabase Discord](https://discord.supabase.com/)

## Need Help?

1. Check `/Docs/Bug_tracking.md` for known issues
2. Review relevant documentation
3. Search project issues/discussions
4. Ask in team chat
5. Create new issue with details

---

**Happy Coding! 🚀**

_Keep this checklist handy during development_
