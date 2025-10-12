# 🚀 Obrazz - Quick Start Guide

Welcome to Obrazz development! This guide will help you get started quickly.

## ✅ Stage 1 Status

**Current Stage:** Stage 1 - Foundation & Setup ✅ **COMPLETED**  
**Next Stage:** Stage 2 - Authentication & User Management

## 📋 Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Expo Go app (for mobile testing)
- Git
- Code editor (VS Code recommended)

## 🔧 Installation

### 1. Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env` (already done)
2. Get your Supabase credentials from https://supabase.com
3. Update `.env` with your credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Setup Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `/lib/supabase/schema.sql`
4. Run the SQL script
5. Verify all tables were created

## 🏃 Running the App

### Start Development Server

```bash
npm start
```

This will open the Expo DevTools in your browser.

### Run on Specific Platform

```bash
# iOS Simulator (Mac only)
npm run ios

# Android Emulator
npm run android

# Web Browser
npm run web
```

### Scan QR Code (Physical Device)

1. Install Expo Go from App Store or Play Store
2. Scan the QR code from the terminal
3. App will load on your device

## 📁 Project Structure

```
obrazz/
├── app/                    # Screens (Expo Router)
│   ├── (auth)/            # Auth screens ✅
│   └── (tabs)/            # Main app tabs ✅
├── lib/                   # External configs
│   └── supabase/         # Supabase setup ✅
├── config/               # App configuration ✅
├── types/                # TypeScript types ✅
├── services/             # Business logic (ready for Stage 2)
├── store/                # State management (ready)
├── components/           # Reusable components (ready)
└── Docs/                 # Documentation
```

## 🛠️ Development Commands

```bash
# Start development server
npm start

# Run linter
npm run lint

# Fix lint issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Type check
npm run type-check
```

## 📖 Current Screens

### Auth Flow (Not implemented yet - Stage 2)

- `/app/(auth)/welcome.tsx` - Welcome screen
- `/app/(auth)/sign-in.tsx` - Sign in
- `/app/(auth)/sign-up.tsx` - Sign up
- `/app/(auth)/forgot-password.tsx` - Password reset

### Main App Tabs (Placeholders)

- `/app/(tabs)/index.tsx` - Community Feed
- `/app/(tabs)/wardrobe.tsx` - Wardrobe Management
- `/app/(tabs)/create.tsx` - Outfit Creator
- `/app/(tabs)/profile.tsx` - User Profile

## 🔐 Authentication (Stage 2 - Not Implemented)

Authentication will be implemented in Stage 2 using:

- Supabase Auth
- Email/Password registration
- JWT token management
- Zustand for auth state

Currently, all screens are accessible without authentication.

## 📚 Key Documentation

- **[Implementation.md](./Docs/Implementation.md)** - Full implementation plan
- **[TechStack.md](./Docs/TechStack.md)** - Complete tech stack
- **[project_structure.md](./Docs/project_structure.md)** - Project organization
- **[Bug_tracking.md](./Docs/Bug_tracking.md)** - Known issues and solutions
- **[STAGE_1_COMPLETION.md](./Docs/STAGE_1_COMPLETION.md)** - Stage 1 details

## 🧪 Testing

Testing framework will be added in Stage 9. For now, test manually:

1. Start the app: `npm start`
2. Navigate through all screens
3. Verify all tabs are accessible
4. Check console for errors

## 🐛 Troubleshooting

### Metro Bundler Issues

```bash
# Clear cache and restart
npm start -- --clear
```

### TypeScript Errors

```bash
# Check for type errors
npm run type-check
```

### Dependencies Issues

```bash
# Reinstall dependencies
rm -rf node_modules
rm package-lock.json
npm install
```

### Supabase Connection Issues

1. Verify `.env` has correct credentials
2. Check Supabase project is active
3. Verify database schema is created
4. Check network connection

## 📊 Stage 2 Preview

Next stage will implement:

- ✅ Complete auth flow (sign up, sign in, logout)
- ✅ Supabase Auth integration
- ✅ Protected routes
- ✅ User profile management
- ✅ Onboarding experience

Estimated time: 3-5 days

## 🔗 Useful Links

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [Zustand](https://github.com/pmndrs/zustand)

## 💡 Tips

1. **Keep Metro bundler running** - Fast refresh makes development smooth
2. **Use TypeScript** - All files should be `.tsx` or `.ts`
3. **Follow ESLint rules** - Code quality is enforced
4. **Check Docs/** folder - Comprehensive documentation available
5. **Use path aliases** - Import with `@config/*`, `@components/*`, etc.

## 🎯 Next Steps

1. **Configure Supabase** - Set up your database
2. **Start Stage 2** - Begin authentication implementation
3. **Read Implementation.md** - Understand the full roadmap
4. **Join development** - Follow the established patterns

## 📞 Support

- Check `/Docs/Bug_tracking.md` for common issues
- Review `/Docs/Implementation.md` for development plan
- Consult tech stack documentation for library usage

---

**Happy Coding! 🎉**

Start with Stage 2: Authentication & User Management
