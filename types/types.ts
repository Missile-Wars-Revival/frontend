//for missile library
export interface Missilelib {
  type: string;
  quantity: number;
  description: string;
}
//for landmine lib
export interface LandmineLib {
  type: string;
  quantity: number;
  description: string;
}

export interface Friend {
  username: string;
}

export type MapStyle = {
  elementType: string; //element is optional
};
