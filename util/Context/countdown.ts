import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define a type for the context value
export type CountdownContextType = {
  countdownIsActive: boolean;
  startCountdown: () => void;
  stopCountdown: () => void;
};

// Create the context with a default undefined! It will always be provided by the provider.
export const CountdownContext = createContext<CountdownContextType | undefined>(undefined);

// Custom hook for consuming the context
export function useCountdown(): CountdownContextType {
  const context = useContext(CountdownContext);
  if (context === undefined) {
    throw new Error('useCountdown must be used within a CountdownProvider');
  }
  return context;
}

// Define the props for the provider component
export type CountdownProviderProps = {
  children: ReactNode;
};
