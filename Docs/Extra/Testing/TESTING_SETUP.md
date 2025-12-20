# Testing Setup Guide

## Current Status

The test files have been created but require Jest configuration to run. TypeScript errors appear because Jest types are not yet configured in the project.

## Installation Steps

To enable testing, run:

```bash
npm install --save-dev jest @types/jest ts-jest @testing-library/react-native
```

## Jest Configuration

Create `jest.config.js` in the project root:

```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@unimodules|@react-navigation)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/app/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@store/(.*)$': '<rootDir>/store/$1',
    '^@hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@types/(.*)$': '<rootDir>/types/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@constants/(.*)$': '<rootDir>/constants/$1',
  },
  collectCoverageFrom: [
    'services/**/*.{ts,tsx}',
    'store/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/__tests__/**',
    '!**/*.test.{ts,tsx}',
    '!**/node_modules/**',
  ],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)'],
};
```

## Update package.json

Add test script to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Update tsconfig.json

Add Jest types to compilerOptions:

```json
{
  "compilerOptions": {
    "types": ["react", "react-native", "jest"]
  }
}
```

## Test Files Created

1. **utils/validation/**tests**/authValidation.test.ts**
   - Tests for password validation (new strengthened requirements)
   - Tests for email validation
   - Tests for password matching

2. **utils/errors/**tests**/ServiceError.test.ts**
   - Tests for ServiceError class
   - Tests for error code mapping
   - Tests for Supabase error parsing

## Running Tests

After setup:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Recommended Next Steps

### Priority 1: Add Tests for Critical Services

1. **authService.ts**

   ```typescript
   // Test authentication flows
   describe('authService', () => {
     test('signIn with valid credentials', async () => {
       // Mock Supabase client
       // Test successful sign in
     });

     test('signIn with invalid credentials', async () => {
       // Test error handling
     });
   });
   ```

2. **outfitService.ts**

   ```typescript
   // Test CRUD operations
   describe('outfitService', () => {
     test('createOutfit saves to database', async () => {
       // Test outfit creation
     });

     test('getOutfitById returns populated outfit', async () => {
       // Test fetching with items
     });
   });
   ```

3. **itemService.ts**
   ```typescript
   // Test wardrobe item operations
   describe('itemService', () => {
     test('createItem processes image', async () => {
       // Test image processing flow
     });
   });
   ```

### Priority 2: Add Tests for State Management

1. **outfitStore.ts**

   ```typescript
   describe('outfitStore', () => {
     test('selectItemForCategory updates state', () => {
       // Test state updates
     });

     test('undo/redo history works', () => {
       // Test history management
     });
   });
   ```

2. **wardrobeStore.ts**
3. **authStore.ts**

### Priority 3: Add Integration Tests

1. Test complete user flows (signup → add item → create outfit)
2. Test error recovery scenarios
3. Test offline behavior

## Mocking Guidelines

### Mock Supabase Client

```typescript
jest.mock('@lib/supabase/client', () => ({
  supabase: {
    auth: {
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  },
}));
```

### Mock AsyncStorage

```typescript
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
```

### Mock Expo Modules

```typescript
jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
```

## Coverage Goals

| Component Type | Target Coverage |
| -------------- | --------------- |
| Services       | 80%+            |
| Utilities      | 90%+            |
| Stores         | 70%+            |
| Components     | 60%+            |

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
