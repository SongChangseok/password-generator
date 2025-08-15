# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native (Expo) password generator mobile application built with TypeScript. The app generates secure passwords with customizable options and includes security features like biometric authentication and secure local storage.

**Technology Stack:**
- React Native with Expo SDK 53
- TypeScript with strict type checking
- React Navigation (bottom tabs)
- Expo SecureStore for encrypted storage
- Expo Crypto for secure random generation
- Expo Local Authentication for biometric auth

## Development Commands

### Essential Commands
- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator (macOS only)
- `npm run web` - Run in web browser

### Code Quality
- `npm run typecheck` - Run TypeScript compilation check
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier

### Testing Commands
- `npm test` - Run all unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Pre-commit Requirements
Always run these commands before committing:
1. `npm run typecheck` - Must pass with no errors
2. `npm run lint` - Must pass with no errors
3. `npm test` - All tests must pass

## Project Architecture

### Folder Structure
```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components (GeneratorScreen, HistoryScreen, SettingsScreen)
└── utils/          # Utility functions and helpers
    ├── __tests__/  # Unit tests for utilities
    ├── types.ts    # TypeScript type definitions
    ├── secureRandom.ts      # Cryptographically secure random generation
    ├── passwordGenerator.ts # Core password generation logic
    ├── strengthCalculator.ts # Password strength analysis
    └── performance.ts       # Performance measurement utilities
```

### Navigation Structure
The app uses bottom tab navigation with three main screens:
- **Generator**: Main password generation interface
- **History**: Stored password management (secure encrypted storage)
- **Settings**: App configuration and security settings

### Security Architecture
- **Secure Storage**: All sensitive data encrypted using Expo SecureStore with AES-256
- **Biometric Auth**: Face ID/Touch ID/Fingerprint authentication for app access
- **Memory Protection**: Sensitive data cleared from memory immediately after use
- **Background Protection**: App content hidden when backgrounded

### Key Design Patterns
- TypeScript path aliases configured (`@/*` maps to `src/*`)
- React functional components with hooks
- Platform-specific implementations using Expo APIs
- Offline-first approach (only ads require network)

## Development Guidelines

### Security Requirements
- Never store plaintext passwords in any logs or temporary variables
- Use `expo-crypto.getRandomBytesAsync()` for cryptographically secure random generation
- Implement proper error handling for biometric authentication failures
- Clear sensitive data from component state immediately after use

### Code Standards
- Strict TypeScript compilation required
- ESLint + Prettier for consistent formatting
- Functional components only (no class components)
- Use React.memo() for performance optimization where needed

### Platform Considerations
- Test biometric authentication on both iOS and Android
- Handle platform-specific secure storage differences
- Consider different screen sizes and safe areas
- Implement proper haptic feedback for user actions

## Development Phases

The project follows a structured development plan:
1. **Phase 1**: MVP (basic password generation + UI)
2. **Phase 2**: Security features (biometric auth, PIN, app lock)
3. **Phase 3**: Convenience features (password storage, search)
4. **Phase 4**: Security audit and compliance
5. **Phase 5**: Monetization and store release

Current status: Phase 1 - Password generation engine completed.

## Important Implementation Notes

### Password Generation
- **Core Engine**: Complete password generation system implemented
- **Security**: Uses `expo-crypto.getRandomBytesAsync()` for cryptographically secure random generation
- **Flexibility**: Supports 8-32 character lengths with all character type combinations
- **Options**: Uppercase, lowercase, numbers, symbols, exclude similar chars, prevent repeating
- **Strength Analysis**: 5-level strength scoring (0-4) with detailed feedback
- **Performance**: Generates passwords in <300ms (target achieved)
- **Testing**: 96%+ code coverage with comprehensive unit and integration tests

### Local Storage
- Use Expo SecureStore for all password storage
- Encrypt data before storage (AES-256)
- Implement data integrity checks
- Support maximum storage limits (10 passwords for free version)

### Authentication Flow
- Implement biometric authentication where available
- Fallback to PIN code when biometric unavailable
- Auto-lock after configurable timeout (30s/1min/5min/immediate)
- Background blur protection

## Testing Strategy

### Current Test Coverage
- **Password Generation**: Complete unit tests for all generation algorithms
- **Security Functions**: Tests for secure random generation and strength calculation
- **Integration Tests**: End-to-end password generation pipeline testing
- **Performance Tests**: Benchmarking and performance measurement validation
- **Coverage**: 96%+ code coverage achieved (target: 90%)

### Testing Framework
- **Jest**: Primary testing framework with expo-jest preset
- **Coverage**: Automatic coverage reporting with thresholds
- **Mocking**: Expo Crypto mocked for consistent testing
- **CI/CD**: All tests must pass before code integration

### Future Testing (Not Yet Implemented)
- Integration tests for secure storage operations
- E2E tests for complete user flows
- Security testing for encryption and authentication

## Performance Targets

### Achieved Targets ✅
- **Password generation**: < 300ms (currently achieving ~1-5ms)
- **Test execution**: All 65 tests complete in <2 seconds
- **Code coverage**: 96%+ (exceeds 90% target)

### Future Targets (Not Yet Measured)
- App launch time: < 2.5 seconds
- Memory usage: < 80MB
- App bundle size: < 25MB

## Key Utilities and APIs

### Core Password Generation
```typescript
import { generateSecurePassword, DEFAULT_OPTIONS } from '@/utils/passwordGenerator';
import { GeneratorOptions } from '@/utils/types';

// Generate with default options (16 chars, all types)
const result = await generateSecurePassword(DEFAULT_OPTIONS);

// Custom generation
const options: GeneratorOptions = {
  length: 20,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: false,
  excludeSimilar: true,
  preventRepeating: true,
};
const customResult = await generateSecurePassword(options);
```

### Password Strength Analysis
```typescript
import { calculatePasswordStrength, getStrengthColor } from '@/utils/strengthCalculator';

const strength = calculatePasswordStrength('MyP@ssw0rd!');
// Returns: { score: 3, label: 'good', feedback: ['Strong password!'] }

const color = getStrengthColor(strength); // Returns color code for UI
```

### Performance Measurement
```typescript
import { measurePerformance, benchmarkPasswordGeneration } from '@/utils/performance';

// Measure single generation
const { result, metrics } = await measurePerformance(() => 
  generateSecurePassword(DEFAULT_OPTIONS)
);

// Benchmark multiple generations
const benchmark = await benchmarkPasswordGeneration(
  () => generateSecurePassword(DEFAULT_OPTIONS),
  100 // iterations
);
```