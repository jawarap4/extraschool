import { useState, useEffect } from 'react';
import dbService from '../firebase/databaseService.js';
import { dbRefs } from '../firebase/config.js';

export const useRealtimeKaligrafi = (categoryId = null) => {
  const [kaligrafi, setKaligrafi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;
    
    const setupSubscription = () => {
      let path = dbRefs.kaligrafi;
      const options = { orderBy: 'createdAt' };
      
      if (categoryId) {
        options.orderBy = 'categoryId';
        options.equalTo = categoryId;
      }
      
      unsubscribe = dbService.subscribe(path, (result) => {
        if (result.success) {
          setKaligrafi(result.data);
          setError(null);
        } else {
          setError(result.error);
        }
        setLoading(false);
      }, options);
    };
    
    setupSubscription();
    
    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [categoryId]);

  return { kaligrafi, loading, error };
};

export const useUserProgress = (userId) => {
  const [progress, setProgress] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!userId) return;
    
    const unsubscribe = dbService.subscribe(
      `${dbRefs.userProgress}/${userId}`,
      (result) => {
        if (result.success) {
          setProgress(result.data);
          
          // Calculate stats
          const totalTime = result.data.reduce((sum, item) => 
            sum + (item.duration || 0), 0
          );
          const totalSessions = result.data.length;
          
          setStats({
            totalTime,
            totalSessions,
            averageTime: totalSessions > 0 ? totalTime / totalSessions : 0
          });
        }
      },
      { orderBy: 'lastPracticed' }
    );
    
    return () => unsubscribe();
  }, [userId]);

  return { progress, stats };
};