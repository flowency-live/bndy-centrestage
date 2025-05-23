import React, { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthError, RecaptchaVerifier, UserCredential } from 'firebase/auth';

// Define the AuthContextType to match the current implementation in bndy-ui
export interface AuthContextType {
  currentUser: any | null;
  isLoading: boolean;
  error: AuthError | null;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithFacebook: () => Promise<UserCredential>;
  signInWithApple: () => Promise<UserCredential>;
  signInWithPhone: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<string>;
  confirmPhoneCode: (verificationId: string, code: string) => Promise<UserCredential>;
  signInWithEmail: (email: string, password: string) => Promise<UserCredential>;
  createUserWithEmail: (email: string, password: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

// Create a mock AuthContext with all required properties
export const mockAuthContext: AuthContextType = {
  currentUser: null,
  isLoading: false,
  error: null,
  signInWithGoogle: jest.fn().mockResolvedValue({} as UserCredential),
  signInWithFacebook: jest.fn().mockResolvedValue({} as UserCredential),
  signInWithApple: jest.fn().mockResolvedValue({} as UserCredential),
  signInWithPhone: jest.fn().mockResolvedValue('verification-id'),
  confirmPhoneCode: jest.fn().mockResolvedValue({} as UserCredential),
  signInWithEmail: jest.fn().mockResolvedValue({} as UserCredential),
  createUserWithEmail: jest.fn().mockResolvedValue({} as UserCredential),
  signOut: jest.fn().mockResolvedValue(undefined),
  clearError: jest.fn(),
};

// Create a mock AuthContext
export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Create a custom render function that includes the AuthProvider
export const AllTheProviders = ({ children }: { children: ReactNode }) => {
  return (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );
};

export const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };
