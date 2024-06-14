declare type TimeStamp = string;

//calculating last seen on map
export const getTimeDifference = (timestamp: TimeStamp) => {
  const currentTime = new Date().getTime();
  const lastSeenTime = new Date(timestamp).getTime();
  const differenceInMilliseconds = currentTime - lastSeenTime;
  const differenceInSeconds = Math.floor(
    differenceInMilliseconds / 1000
  );

  if (differenceInSeconds < 60) {
    return { text: "Last seen: Just now" };
  }

  const differenceInMinutes = Math.floor(differenceInSeconds / 60);
  const differenceInHours = Math.floor(differenceInMinutes / 60);

  if (differenceInHours < 1) {
    return { text: `Last seen: ${differenceInMinutes} min ago` };
  } else if (differenceInHours === 1) {
    return { text: `Last seen: 1 hour ago` };
  } else {
    return { text: `Last seen: ${differenceInHours} hours ago` };
  }
};

//  function to check if a player has been inactive for 24 hours
export const isInactiveFor12Hours = (timestamp: TimeStamp): boolean => {
  const currentTime = new Date().getTime();
  const lastSeenTime = new Date(timestamp).getTime();
  const differenceInMilliseconds = currentTime - lastSeenTime;
  const differenceInHours = Math.floor(differenceInMilliseconds / (1000 * 60 * 60));
  
  return differenceInHours >= 12;
};


//landmine timestamp
export const convertimestampfuture = (timestamp: string | number | Date) => {
  const currentTime = new Date().getTime();
  const eventTime = new Date(timestamp).getTime();
  const differenceInMilliseconds = eventTime - currentTime;
  const differenceInSeconds = Math.floor(
    differenceInMilliseconds / 1000
  );

  const differenceInMinutes = Math.floor(differenceInSeconds / 60);
  const differenceInHours = Math.floor(differenceInMinutes / 60);

  if (differenceInMilliseconds < 0) {
    return { text: `Expired` }; // Handle past timestamps if needed
  } else if (differenceInHours < 1) {
    return { text: `Expires in: ${differenceInMinutes} min` };
  } else if (differenceInHours === 1) {
    return { text: `Expires in: 1 hour` };
  } else {
    return { text: `Expires in: ${differenceInHours} hours` };
  }
};
