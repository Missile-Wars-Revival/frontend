import { useState, useEffect } from 'react';
import { fetchCurrentLeague } from '../../api/league';

interface UserLeague {
  league: string;
  division?: number | string;
}

export const useUserLeague = () => {
  const [userLeague, setUserLeague] = useState<UserLeague | null>(null);

  useEffect(() => {
    const getUserLeague = async () => {
      try {
        const leagueData = await fetchCurrentLeague();
        if (leagueData && leagueData.league) {
          setUserLeague(leagueData);
        }
      } catch (error) {
        console.error('Error fetching user league:', error);
      }
    };

    getUserLeague();
  }, []);

  return userLeague;
};