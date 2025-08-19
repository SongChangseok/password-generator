import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

export interface AuthenticationResult {
  success: boolean;
  error?: string;
  biometricUsed?: boolean;
}

/**
 * Check device biometric capabilities
 * @returns Promise<BiometricCapabilities> Device biometric support status
 */
export const checkBiometricCapabilities =
  async (): Promise<BiometricCapabilities> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      return {
        hasHardware,
        isEnrolled,
        supportedTypes,
      };
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      return {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
      };
    }
  };

/**
 * Get user-friendly authentication type name
 * @param types Supported authentication types
 * @returns string Human-readable authentication method
 */
export const getAuthenticationTypeName = (
  types: LocalAuthentication.AuthenticationType[]
): string => {
  if (
    types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
  ) {
    return 'Face ID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Touch ID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'Iris Recognition';
  }
  return 'Biometric Authentication';
};

/**
 * Authenticate user with biometrics
 * @param promptMessage Custom prompt message
 * @param fallbackLabel Fallback button label
 * @returns Promise<AuthenticationResult> Authentication result
 */
export const authenticateWithBiometrics = async (
  promptMessage: string = 'Authenticate to access Password Generator',
  fallbackLabel: string = 'Use PIN Code'
): Promise<AuthenticationResult> => {
  try {
    const capabilities = await checkBiometricCapabilities();

    if (!capabilities.hasHardware) {
      return {
        success: false,
        error: 'Biometric hardware not available',
        biometricUsed: false,
      };
    }

    if (!capabilities.isEnrolled) {
      return {
        success: false,
        error: 'No biometric credentials enrolled',
        biometricUsed: false,
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel,
      disableDeviceFallback: true, // Force biometric only
      cancelLabel: 'Cancel',
    });

    return {
      success: result.success,
      error: result.success ? undefined : 'Authentication failed',
      biometricUsed: true,
    };
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      biometricUsed: false,
    };
  }
};

/**
 * Check if biometric authentication is enabled in app settings
 * @returns Promise<boolean> Whether biometric auth is enabled
 */
export const isBiometricAuthEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await SecureStore.getItemAsync('biometric_auth_enabled');
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking biometric auth setting:', error);
    return false;
  }
};

/**
 * Enable or disable biometric authentication
 * @param enabled Whether to enable biometric auth
 * @returns Promise<void>
 */
export const setBiometricAuthEnabled = async (
  enabled: boolean
): Promise<void> => {
  try {
    await SecureStore.setItemAsync(
      'biometric_auth_enabled',
      enabled.toString()
    );
  } catch (error) {
    console.error('Error setting biometric auth preference:', error);
    throw new Error('Failed to save biometric auth setting');
  }
};

/**
 * Get security level description based on available methods
 * @param capabilities Device biometric capabilities
 * @returns string Security level description
 */
export const getSecurityLevelDescription = (
  capabilities: BiometricCapabilities
): string => {
  if (!capabilities.hasHardware) {
    return 'PIN code only - Basic security';
  }

  if (!capabilities.isEnrolled) {
    return 'Biometric hardware available but not set up';
  }

  const authType = getAuthenticationTypeName(capabilities.supportedTypes);
  return `${authType} + PIN code - High security`;
};

/**
 * Main authentication flow - try biometric first, fallback to PIN
 * @returns Promise<AuthenticationResult> Complete authentication result
 */
export const authenticateUser = async (): Promise<AuthenticationResult> => {
  try {
    // Check if biometric auth is enabled
    const biometricEnabled = await isBiometricAuthEnabled();

    if (!biometricEnabled) {
      return {
        success: false,
        error: 'Biometric authentication disabled',
        biometricUsed: false,
      };
    }

    // Try biometric authentication
    const capabilities = await checkBiometricCapabilities();

    if (capabilities.hasHardware && capabilities.isEnrolled) {
      const authType = getAuthenticationTypeName(capabilities.supportedTypes);
      const result = await authenticateWithBiometrics(
        `Use ${authType} to access Password Generator`,
        'Use PIN Code'
      );

      return result;
    }

    // No biometric available, indicate PIN should be used
    return {
      success: false,
      error: 'Biometric authentication not available',
      biometricUsed: false,
    };
  } catch (error) {
    console.error('Authentication flow error:', error);
    return {
      success: false,
      error: 'Authentication system error',
      biometricUsed: false,
    };
  }
};
