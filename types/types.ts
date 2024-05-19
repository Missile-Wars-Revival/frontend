//Missile 
export interface Missile {
  destination: {
    latitude: number;
    longitude: number;
  };
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  type: string;
  sentbyusername: string,
  status: string;
}
//for missile library
export interface Missilelib {
  type: string;
  quantity: number;
  description: string;
}
export interface LandmineLib {
  type: string;
  quantity: number;
  description: string;
}

export interface Loot {
  latitude: number;
  longitude: number;
  rarity: string;
}

export interface Landmine {
  latitude: number;
  longitude: number;
  placedby: string;
  Type: String;
  Expire: string;
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
