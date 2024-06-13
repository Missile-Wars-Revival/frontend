import { GeoLocation, Landmine, Loot, Missile } from "middle-earth";
import { useCallback } from "react";

  export const fetchMissilesFromBackend = async (): Promise<Missile[]> => {
    // Simulated fetch function to get missile data:
    return [ 
              new Missile(
                         "TheNuke",                              // type
                         "Hit",                                  // status
                         new GeoLocation(45.2949318,-0.852674),  // destination
                         new GeoLocation(45.2949318, -0.852674), // currentLocation
                         2,                                      // missileId
                         100,                                    // radius
                         "",                                     // sentbyusername
                         "",                                     // timesent
                         "",                                     // etatimetoimpact
                        ),
              new Missile(
                          "Ballista",                             // type
                          "Approaching",                          // status
                          new GeoLocation(51.025316,3.115612),    // destination
                          new GeoLocation(52.025316, -3.115612),  // currentLocation
                          1,                                      // missileId
                          50,                                     // radius
                          "",                                     // sentbyusername
                          "",                                     // timesent
                          "",                                     // etatimetoimpact
                        )  
                ];                                   
  };


  export const fetchLootFromBackend = async (): Promise<Loot[]> => {
    // Simulated fetch function to get loot data:
    return [
      new Loot(
        new GeoLocation(51.026281, -3.113764),    //location
        "",                                       //Rarity
        "",                                       //expiretime
      ),
      new Loot(
        new GeoLocation(45.305, -0.86),           //location
        "",                                       //Rarity
        "",                                       //expiretime
      )


    ];
  };

  export const fetchlandmineFromBackend = async (): Promise<Landmine[]> => {
    // Simulated fetch function to get landmine data:
    return [
      new Landmine(
        "BigBertha",                                 //type
        new GeoLocation(45.2949318, -0.852764),      //location
        "Test",                                      //placed by
        "",                                          //placed time
        "",                                          //eta expire time
      ),
      new Landmine(
        "BigBertha",                                 //type
        new GeoLocation(51.025682, -3.1174578),      //location
        "Test",                                      //placed by
        "",                                          //placed time
        "",                                          //eta expire time
      )

    ];
  };