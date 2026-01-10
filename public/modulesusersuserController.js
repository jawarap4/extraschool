import dbService from '../../../firebase/databaseService.js';
import { dbRefs } from '../../../firebase/config.js';
import { validateUserData } from './userModel.js';

class UserController {
  // Get user profile
  async getUserProfile(userId) {
    const result = await dbService.getById(dbRefs.users, userId);
    
    if (result.success) {
      // Don't expose sensitive data
      const { password, ...safeData } = result.data;
      return { ...result, data: safeData };
    }
    
    return result;
  }

  // Update user profile
  async updateUserProfile(userId, updates) {
    // Validate updates
    const validation = validateUserData(updates);
    if (!validation.isValid) {
      return { 
        success: false, 
        error: 'Validation failed', 
        details: validation.errors 
      };
    }

    return await dbService.update(dbRefs.users, userId, updates);
  }

  // Get user progress
  async getUserProgress(userId) {
    const result = await dbService.getAll(
      `${dbRefs.userProgress}/${userId}`,
      { orderBy: 'lastPracticed' }
    );
    
    if (result.success) {
      // Calculate statistics
      const totalPractice = result.data.length;
      const totalTime = result.data.reduce((sum, item) => sum + (item.practiceTime || 0), 0);
      const lastWeek = result.data.filter(item => 
        Date.now() - item.lastPracticed < 7 * 24 * 60 * 60 * 1000
      ).length;
      
      return {
        ...result,
        stats: {
          totalPractice,
          totalTime,
          lastWeekPractice: lastWeek,
          averagePerDay: (lastWeek / 7).toFixed(1)
        }
      };
    }
    
    return result;
  }

  // Get user favorites
  async getUserFavorites(userId) {
    const result = await dbService.getAll(
      `${dbRefs.favorites}/${userId}`,
      { orderBy: 'addedAt' }
    );
    
    if (result.success && result.data.length > 0) {
      // Get full kaligrafi data for each favorite
      const kaligrafiPromises = result.data.map(item =>
        dbService.getById(dbRefs.kaligrafi, item.kaligrafiId)
      );
      
      const kaligrafiResults = await Promise.all(kaligrafiPromises);
      const favorites = kaligrafiResults
        .filter(res => res.success)
        .map(res => res.data);
      
      return { success: true, data: favorites };
    }
    
    return result;
  }

  // Get leaderboard
  async getLeaderboard(limit = 10) {
    const result = await dbService.getAll(
      dbRefs.users,
      { 
        orderBy: 'xp',
        limit: limit 
      }
    );
    
    if (result.success) {
      // Sort by XP (descending)
      const sorted = result.data.sort((a, b) => b.xp - a.xp);
      return { ...result, data: sorted };
    }
    
    return result;
  }
}

export default new UserController();