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
  status: string,
}
//for missile library
export interface Missilelib {
  type: string;
  quantity: number;
  description: string;
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
  username: string;
  latitude: number;
  longitude: number;
  updatedAt: string; 
}

export interface Friend {
  username: string;
}
