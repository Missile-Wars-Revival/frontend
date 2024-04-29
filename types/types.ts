export interface Missile {
  location: {
    latitude: number;
    longitude: number;
  };
  radius: number;
}
//for missile library
export interface Missilelib {
  type: string;
  quantity: number;
}

import nukeImage from '../assets/missiles/nuke.png';
import cruiseImage from '../assets/missiles/cruise.png';

interface MissileImages {
  [key: string]: any; // Index signature to allow any string key
}

export const missileImages: MissileImages = {
  nuke: nukeImage,
  cruise: cruiseImage,
  // Add other missile images here
};

export interface Loot {
  latitude: number;
  longitude: number;
}

export interface Landmine {
  latitude: number;
  longitude: number;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Player {
  username: string;
  latitude: number;
  longitude: number;
  updatedAt: string; 
}

export interface Friend {
  username: string;
}
