import { Text, TouchableOpacity, View } from 'react-native';
import React from 'react';

interface ThemeSelectProps {
    onPress: () => void;
    children: string;
}
export const ThemeSelectButton = (props: ThemeSelectProps) => {
    return (
        <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          borderRadius: 5,
          padding: 10,
          backgroundColor: 'white',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
        onPress={props.onPress}>
        <Text style={{ fontSize: 16 }}>{props.children}</Text>
      </TouchableOpacity>
    );
    
};