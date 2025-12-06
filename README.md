# 🪞 Obrazz - Smart Personal Wardrobe App

<div align="center">
  <img src="assets/images/icon.png" alt="Obrazz Logo" width="120" height="120">
  
  **Your AI-powered personal stylist and wardrobe manager**
  
  [![React Native](https://img.shields.io/badge/React%20Native-0.81.4-blue)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-SDK%2054-black)](https://expo.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
  
  ---
  
  ### 🏗️ Development Status
  
  **Stage 1: Foundation & Setup** ✅ COMPLETED  
  **Stage 2: Authentication** ✅ COMPLETED  
  **Stage 3: Wardrobe Management** ✅ COMPLETED  
  **Stage 4: Manual Outfit Creator (4.0-4.10)** ✅ COMPLETED  
  **Stage 5: AI Outfit Generation** 🚧 PLANNED  
  **Progress:** 45% (4.5 of 10 stages complete)
  
  [View Full Roadmap](./Docs/Implementation.md) | [Quick Start Guide](./Docs/Extra/QUICKSTART.md)
</div>

## 📱 About

Obrazz is a cutting-edge mobile application that transforms how you organize and style your wardrobe. With AI-powered outfit suggestions, manual outfit creation tools, and a vibrant community feed, Obrazz makes fashion accessible and fun for everyone.

### ✨ Key Features

- 👚 **Smart Wardrobe Management** - Add clothes with automatic background removal
- 🎨 **Manual Outfit Creator** - Drag-and-drop interface with customizable backgrounds
- 🤖 **AI Outfit Generation** - Get personalized style recommendations
- 🏠 **Community Feed** - Share and discover outfit inspiration
- 💎 **Premium Subscription** - Unlock unlimited outfits and AI generations
- 🌍 **Multi-language Support** - English and Russian interfaces
- 🌓 **Dark Mode** - Beautiful dark theme support

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Expo Go app on your physical device (optional)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/obrazz.git
cd obrazz
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your API keys
```

4. **Start the development server**

```bash
npx expo start
```

5. **Run on your device**

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app for physical device

## 📚 Documentation

- [Implementation Plan](./Docs/Implementation.md) - Detailed development roadmap
- [Project Structure](./Docs/project_structure.md) - Folder organization and conventions
- [UI/UX Design System](./Docs/UI_UX_doc.md) - Design specifications and guidelines
- [Tech Stack](./Docs/TechStack.md) - Complete list of technologies and versions
- [Bug Tracking](./Docs/Bug_tracking.md) - Known issues and solutions
- [PRD](./Docs/PRDobrazz.md) - Product requirements document
- [App Map](./Docs/AppMapobrazz.md) - Detailed application architecture

## 🛠️ Tech Stack

### Frontend

- **React Native** 0.81.4 with **Expo SDK** 54
- **TypeScript** 5.9.2
- **React Navigation** 7.x + Expo Router
- **Zustand** 5.x for state management
- **TanStack Query** 5.71.x for data fetching
- **React Native Reanimated** 4.x for animations
- **NativeWind** 4.x for styling

### Backend

- **Supabase** (PostgreSQL + Auth + Storage)
- **NestJS** 10.5.x for AI microservices
- **OpenAI API** for outfit generation
- **Remove.bg API** for background removal

### Tools & Services

- **RevenueCat** for subscriptions
- **Sentry** for error tracking
- **Expo EAS** for builds and OTA updates

## 🏗️ Project Structure

```
obrazz/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication flow
│   ├── (tabs)/            # Main tab navigation
│   └── (modals)/          # Modal screens
├── components/            # Reusable components
├── services/              # Business logic
├── store/                 # Zustand state stores
├── lib/                   # External library configs
├── types/                 # TypeScript definitions
├── utils/                 # Helper functions
├── assets/                # Images, fonts, animations
└── Docs/                  # Documentation
```

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

### Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_REMOVE_BG_API_KEY=your_remove_bg_api_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
EXPO_PUBLIC_REVENUECAT_API_KEY=your_revenuecat_api_key
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### Code Style

This project uses:

- ESLint for linting
- Prettier for code formatting
- Husky for pre-commit hooks
- TypeScript for type safety

## 📱 Building for Production

### Using EAS Build

1. **Install EAS CLI**

```bash
npm install -g eas-cli
```

2. **Configure EAS**

```bash
eas build:configure
```

3. **Build for iOS**

```bash
eas build --platform ios
```

4. **Build for Android**

```bash
eas build --platform android
```

### Local Builds

For local builds, follow the [Expo documentation](https://docs.expo.dev/build/introduction/).

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Design inspired by Whering, Pinterest, and Figma
- Icons from [Ionicons](https://ionic.io/ionicons)
- Background removal by [Remove.bg](https://remove.bg)

## 📞 Support

- 📧 Email: support@obrazz.app
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/obrazz/issues)
- 💬 Discord: [Join our community](https://discord.gg/obrazz)

## 🚀 Roadmap

- [x] Stage 1: Foundation & Setup
- [x] Stage 2: Authentication & User Management
- [x] Stage 3: Wardrobe Management Core
- [x] Stage 4: Manual Outfit Creator (4.0-4.10)
  - [x] Stage 4.5: Outfits Collection & Navigation
  - [x] Stage 4.6: UX Refactoring (2-Step Process)
  - [x] Stage 4.7: SmoothCarousel System
  - [x] Stage 4.8: 4-Tab System
  - [x] Stage 4.9: ImageCropper Refactor
  - [x] Stage 4.10: Data Persistence Architecture
- [ ] Stage 5: AI Outfit Generation
- [ ] Stage 6: Community & Social Features
- [ ] Stage 7: Subscription & Monetization
- [ ] Stage 8: Polish & Optimization
- [ ] Stage 9: Testing & QA
- [ ] Stage 10: Deployment & Launch

---

<div align="center">
  Made with ❤️ by the Obrazz Team
  
  [Website](https://obrazz.app) • [Blog](https://blog.obrazz.app) • [Twitter](https://twitter.com/obrazzapp)
</div>
