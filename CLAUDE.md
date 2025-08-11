# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SecurePass Generator is a React Native + Expo mobile app for secure password generation. Built with TypeScript, it provides cryptographically secure password generation with advanced features like strength calculation, similar character exclusion, and password management.

## Key Commands

### Development
```bash
# Start Expo development server
npm start

# Run on specific platforms
npm run android    # Android
npm run ios        # iOS (requires macOS)
npm run web        # Web browser

# Type checking (IMPORTANT: Always run before committing)
npx tsc --noEmit

# Testing
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
```

### Code Quality
```bash
# Linting (Note: ESLint v9 compatibility issues exist)
ESLINT_USE_FLAT_CONFIG=false npx eslint src/ --ext .ts,.tsx

# Code formatting
npx prettier --write src/
npx prettier --check src/   # Check formatting without fixing
```

## Architecture

### Core Components

**Password Generation Engine** (`src/utils/passwordGenerator.ts`)
- `PasswordGenerator` class with cryptographically secure random number generation
- Support for 4-128 character passwords with customizable character sets
- Advanced features: similar character exclusion (`0O1lI`), consecutive character prevention
- Character requirements enforcement to ensure all selected types are included

**Password Strength Calculator** (`src/utils/strengthCalculator.ts`)  
- NIST guideline-based entropy calculation
- Scores 0-4 with color-coded visual feedback
- Pattern recognition for weak passwords (common passwords, sequences, repetition)
- Detailed suggestions for password improvement

**Validation System** (`src/utils/validation.ts`)
- Input validation for password generator options
- XSS protection and input sanitization
- Export/import data structure validation
- Comprehensive error handling with `ValidationError` class

### Type System

**Core Interfaces** (`src/types/index.ts`)
- `GeneratorOptions`: Password generation configuration with all customization options
- `StrengthResult`: Password strength analysis with score, label, color, and entropy
- `SavedPassword`: Stored password data structure
- `RootStackParamList`: Navigation type definitions

**Constants** (`src/constants/index.ts`)
- Character sets for password generation (uppercase, lowercase, numbers, symbols)
- Password constraints (min/max length: 4-128)
- UI colors and strength indicators
- Preset configurations for common use cases

### Navigation Structure
- Stack-based navigation with 3 main screens:
  - `Generator`: Main password generation interface
  - `PasswordList`: Saved passwords management
  - `Settings`: App configuration

### Testing Strategy
- Jest + ts-jest for unit testing
- Comprehensive test suites for all utility functions
- Focus on security-critical components (password generation, strength calculation)
- Path alias support via `@/` prefix for clean imports

## Development Phases

**Phase 1: Project Setup** ✅ COMPLETED
- React Native + Expo + TypeScript foundation
- Core folder structure and navigation
- Code quality tools (ESLint, Prettier)

**Phase 2: Password Engine** ✅ COMPLETED  
- Core generation algorithms and strength calculation
- Security-focused implementation with proper entropy
- Comprehensive unit tests with 110 test cases
- NIST-based strength calculation with entropy scoring
- Advanced features: similar character exclusion, repetition prevention

**Phase 3-8: Planned Features**
- UI implementation, security features, password management
- Sharing capabilities and monetization via ads

## Important Notes

### Security Considerations
- All password generation uses cryptographically secure random numbers
- No network communication - completely offline operation
- Memory-only password processing to prevent leaks
- Input sanitization prevents XSS attacks

### Expo/React Native Specifics
- Uses Expo SDK 53 with React Native 0.79
- Path aliases configured via `tsconfig.json` (`@/` → `src/`)
- Dependencies include AsyncStorage, Clipboard, Navigation, and Crypto libraries

### Known Issues
- ESLint v9 configuration compatibility issues (use `ESLINT_USE_FLAT_CONFIG=false`)
- Jest module name mapping may need adjustment for path aliases
- Some React Native libraries have version compatibility warnings

### Code Patterns
- Utility classes with static methods for core functionality
- TypeScript interfaces for all data structures
- Error classes extend base Error for proper error handling
- Constants organized by functional area (UI, generation, validation)

This codebase prioritizes security, type safety, and maintainable architecture suitable for a production password generation application.