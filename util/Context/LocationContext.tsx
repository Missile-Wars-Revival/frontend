import React, { createContext, useContext } from 'react';
import { useLocationUpdates } from '../../hooks/useLocationUpdates';

const LocationContext = createContext(null);

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  useLocationUpdates();

  return (
    <LocationContext.Provider value={null}>
      {children}
    </LocationContext.Provider>
  );
};
