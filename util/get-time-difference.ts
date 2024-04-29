declare type TimeStamp = string;

//calculating last seen on map
export const getTimeDifference = (timestamp: TimeStamp) => {
  const currentTime = new Date().getTime();
  const lastSeenTime = new Date(timestamp).getTime();
  const differenceInMilliseconds = currentTime - lastSeenTime;
  const differenceInSeconds = Math.floor(
    differenceInMilliseconds / 1000
  );

  if (differenceInSeconds < 120) {
    return { text: "Last seen: Just now", color: "green" };
  }

  const differenceInMinutes = Math.floor(differenceInSeconds / 60);

  return { text: `Last seen: ${differenceInMinutes} min ago`, color: "black" };
};
