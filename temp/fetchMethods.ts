import { GeoLocation, Landmine, Loot, Missile } from "middle-earth";

  export const fetchMissilesFromBackend = async (): Promise<Missile[]> => {
    // Simulated fetch function to get missile data:
    return [ 
              new Missile(
                         "TheNuke",                              // type
                         "Hit",                                  // status
                         new GeoLocation(51.1326906221589,-3.3299448073139626),  // destination
                         new GeoLocation(51.1326906221589, -3.3299448073139626), // currentLocation
                         2,                                      // missileId
                         100,                                    // radius
                         "",                                     // sentbyusername
                         "",                                     // timesent
                         "2024-10-05T06:43:52.577Z",             // timeofimpact
                        ),
              new Missile(
                          "Ballista",                             // type
                          "Incoming",                             // status
                          new GeoLocation(51.025316, -3.115612),  // destination
                          new GeoLocation(52.025316, -3.115612),  // currentLocation
                          1,                                      // missileId
                          100,                                    // radius
                          "",                                     // sentbyusername
                          "",                                     // timesent
                          "2024-10-05T06:43:52.577Z",             // timeofimpact
                        )  
                ];                                   
  };


  export const fetchLootFromBackend = async (): Promise<Loot[]> => {
    // Simulated fetch function to get loot data:
    return [
      new Loot(
        new GeoLocation(51.026281, -3.113764),    //location
        "Uncommon",                               //Rarity
        "2024-10-05T06:43:52.577Z",                                       //expiretime
      ),
      new Loot(
        new GeoLocation(51.1326906221589, -3.3299448073139626),           //location
        "Common",                                       //Rarity
        "2024-10-05T06:43:52.577Z",                                 //expiretime
      )


    ];
  };
  
  export const fetchlandmineFromBackend = async (): Promise<Landmine[]> => {
    // Simulated fetch function to get landmine data:
    return [
      new Landmine(
        "BigBertha",                                 //type
        new GeoLocation(45.2949318, -0.852764),      //location
        "Test2",                                      //placed by
        "",                                          //placed time
        "2024-10-05T06:43:52.577Z",                                          //eta expire time
      ),
      new Landmine(
        "BigBertha",                                 //type
        new GeoLocation(51.025682, -3.1174578),      //location
        "Test",                                      //placed by
        "",                                          //placed time
        "2024-10-05T06:43:52.577Z",                                          //eta expire time
      )

    ];
  };