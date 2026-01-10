import dbService from '../../../firebase/databaseService.js';
import { dbRefs } from '../../../firebase/config.js';

class StatsController {
  // Get overall app statistics
  async getAppStats() {
    try {
      const [
        usersResult,
        kaligrafiResult,
        practiceResult
      ] = await Promise.all([
        dbService.getAll(dbRefs.users),
        dbService.getAll(dbRefs.kaligrafi),
        dbService.getAll(dbRefs.userProgress)
      ]);
      
      const totalUsers = usersResult.success ? usersResult.data.length : 0;
      const totalKaligrafi = kaligrafiResult.success ? kaligrafiResult.data.length : 0;
      
      // Calculate total practice time
      let totalPracticeTime = 0;
      if (practiceResult.success) {
        practiceResult.data.forEach(userProgress => {
          Object.values(userProgress).forEach(session => {
            totalPracticeTime += session.duration || 0;
          });
        });
      }
      
      return {
        success: true,
        data: {
          totalUsers,
          totalKaligrafi,
          totalPracticeTime: Math.round(totalPracticeTime / 3600), // Convert to hours
          activeToday: await this.getActiveUsersToday(),
          popularStyles: await this.getPopularStyles()
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get active users today
  async getActiveUsersToday() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    const result = await dbService.getAll(dbRefs.userProgress);
    if (!result.success) return 0;
    
    const activeUsers = new Set();
    
    result.data.forEach(userProgress => {
      Object.values(userProgress).forEach(session => {
        if (now - session.lastPracticed < oneDay) {
          activeUsers.add(userProgress.userId);
        }
      });
    });
    
    return activeUsers.size;
  }

  // Get popular styles
  async getPopularStyles() {
    const result = await dbService.getAll(dbRefs.kaligrafi);
    if (!result.success) return [];
    
    const styleCount = {};
    result.data.forEach(kaligrafi => {
      const style = kaligrafi.style || 'unknown';
      styleCount[style] = (styleCount[style] || 0) + 1;
    });
    
    return Object.entries(styleCount)
      .map(([style, count]) => ({ style, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // Get user learning progress
  async getUserLearningProgress(userId, period = 'week') {
    const result = await dbService.getAll(`${dbRefs.userProgress}/${userId}`);
    
    if (!result.success) return { success: false, error: 'No data found' };
    
    const now = Date.now();
    let periodMs;
    
    switch (period) {
      case 'week': periodMs = 7 * 24 * 60 * 60 * 1000; break;
      case 'month': periodMs = 30 * 24 * 60 * 60 * 1000; break;
      default: periodMs = 7 * 24 * 60 * 60 * 1000;
    }
    
    const periodData = result.data.filter(session => 
      now - session.lastPracticed < periodMs
    );
    
    // Group by day
    const dailyData = {};
    periodData.forEach(session => {
      const date = new Date(session.lastPracticed).toLocaleDateString();
      if (!dailyData[date]) {
        dailyData[date] = { date, duration: 0, count: 0 };
      }
      dailyData[date].duration += session.duration || 0;
      dailyData[date].count += 1;
    });
    
    const sortedData = Object.values(dailyData)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return {
      success: true,
      data: sortedData,
      summary: {
        totalSessions: periodData.length,
        totalDuration: periodData.reduce((sum, s) => sum + (s.duration || 0), 0),
        averagePerDay: (periodData.length / (periodMs / (24 * 60 * 60 * 1000))).toFixed(1)
      }
    };
  }
}

export default new StatsController();