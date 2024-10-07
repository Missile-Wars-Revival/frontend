import { useState, useEffect } from 'react';
import { fetchCurrentLeague } from '../../api/league';

interface LeagueData {
  success: boolean;
  league: string;
  division: number;
}

export const useUserLeague = () => {
  const [userLeague, setUserLeague] = useState<LeagueData | null>(null);

  useEffect(() => {
    const getUserLeague = async () => {
      try {
        const leagueData = await fetchCurrentLeague();
        if (leagueData && leagueData.success) {
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