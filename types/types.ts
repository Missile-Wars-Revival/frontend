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
  description: string;
}
//images
import AmplifierImage from '../assets/missiles/Amplifier.png';
import BallistaImage from '../assets/missiles/Ballista.png';
import BigBerthaImage from '../assets/missiles/BigBertha.png';
import BombabomImage from '../assets/missiles/Bombabom.png';
import BunkerBlockerImage from '../assets/missiles/BunkerBlocker.png';
import BuzzardImage from '../assets/missiles/Buzzard.png';
import ClusterBombImage from '../assets/missiles/ClusterBomb.png';
import CorporateRaiderImage from '../assets/missiles/CorporateRaider.png';
import GutShotImage from '../assets/missiles/GutShot.png';
import TheNukeImage from '../assets/missiles/TheNuke.png';
import YokozunaImage from '../assets/missiles/Yokozuna.png';
import ZippyImage from '../assets/missiles/Zippy.png';

interface MissileImages {
  [key: string]: any;
}

export const missileImages: MissileImages = {
  Amplifier: AmplifierImage,
  Ballista: BallistaImage,
  BigBertha: BigBerthaImage,
  Bombabom: BombabomImage,
  BunkerBlocker: BunkerBlockerImage,
  Buzzard: BuzzardImage,
  ClusterBomb: ClusterBombImage,
  CorporateRaider: CorporateRaiderImage,
  GutShot: GutShotImage,
  TheNuke: TheNukeImage,
  Yokozuna: YokozunaImage,
  Zippy: ZippyImage,

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
