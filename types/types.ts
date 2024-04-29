export interface Missile {
  location: {
    latitude: number;
    longitude: number;
  };
  radius: number;
}

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
  updatedAt: string; // Adjust the type as per your data
  username: string;
  latitude: number;
  longitude: number;
}

export interface Friend {
  username: string;
}
