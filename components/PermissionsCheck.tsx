import React, { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import PermissionsScreen from '../app/PermissionsScreen';

interface PermissionsCheckProps {
  children: React.ReactNode;
}

const PermissionsCheck: React.FC<PermissionsCheckProps> = ({ children }) => {
  const [permissionStatus, setPermissionStatus] = useState<'checking' | 'granted' | 'denied'>('checking');

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setPermissionStatus(status === 'granted' ? 'granted' : 'denied');
  };

  const handlePermissionGranted = () => {
    checkPermissions();
  };

  if (permissionStatus === 'checking') {
    return null; // or a loading indicator
  }

  if (permissionStatus === 'denied') {
    return <PermissionsScreen onPermissionGranted={handlePermissionGranted} />;
  }

  return <>{children}</>;
};

export default PermissionsCheck;
