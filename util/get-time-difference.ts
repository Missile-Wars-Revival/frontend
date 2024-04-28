declare type TimeStamp = string;

//calculating last seen on map
export const getTimeDifference = (timestamp: TimeStamp) => {
  const currentTime = new Date().getTime();
  const lastSeenTime = new Date(timestamp).getTime();
  const differenceInMilliseconds = currentTime - lastSeenTime;
  const differenceInMinutes = Math.floor(
    differenceInMilliseconds / (1000 * 60)
  );

  if (differenceInMinutes < 1) {
    return { text: "Last seen: Just now", color: "green" };
  }

  return { text: `Last seen: ${differenceInMinutes} min ago`, color: "black" };
};
