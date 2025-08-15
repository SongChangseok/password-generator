# Password Generator

A secure password generator mobile application built with React Native and Expo.

## Features

- Generate secure passwords with customizable options
- Password history tracking with secure storage
- Cross-platform support (iOS, Android, Web)
- TypeScript support with strict type checking

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository:
```bash
git clone https://github.com/SongChangseok/password-generator.git
cd password-generator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
```bash
# iOS (requires macOS)
npm run ios

# Android
npm run android

# Web
npm run web
```

## Development

### Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
└── utils/          # Utility functions
```

### Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Run TypeScript type checking

### Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo SDK 53** - Development platform and tools
- **TypeScript** - Type safety and better development experience
- **React Navigation** - Navigation library
- **Expo SecureStore** - Secure storage for sensitive data
- **Expo Crypto** - Cryptographic functions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.