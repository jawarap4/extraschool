import dbService from '../../../firebase/databaseService.js';
import { dbRefs } from '../../../firebase/config.js';

class KaligrafiController {
  // Get all kaligrafi with filters
  async getKaligrafiList(filters = {}) {
    let queryOptions = {};
    
    // Apply filters
    if (filters.categoryId) {
      queryOptions.orderBy = 'categoryId';
      queryOptions.equalTo = filters.categoryId;
    }
    
    if (filters.difficulty) {
      queryOptions.orderBy = 'difficulty';
      queryOptions.equalTo = parseInt(filters.difficulty);
    }
    
    if (filters.style) {
      queryOptions.orderBy = 'style';
      queryOptions.equalTo = filters.style;
    }
    
    if (filters.limit) {
      queryOptions.limit = parseInt(filters.limit);
    }
    
    const result = await dbService.getAll(dbRefs.kaligrafi, queryOptions);
    
    // Additional client-side filtering if needed
    if (filters.search && result.success) {
      const searchTerm = filters.search.toLowerCase();
      result.data = result.data.filter(item =>
        item.title.toLowerCase().includes(searchTerm) ||
        item.arabicText.includes(searchTerm) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    return result;
  }

  // Get kaligrafi detail with increment view
  async getKaligrafiDetail(kaligrafiId) {
    // Increment view count
    await dbService.incrementViews(kaligrafiId);
    
    // Get kaligrafi data
    const result = await dbService.getById(dbRefs.kaligrafi, kaligrafiId);
    
    if (result.success) {
      // Get related kaligrafi
      const categoryId = result.data.categoryId;
      const relatedResult = await dbService.getAll(
        dbRefs.kaligrafi,
        { 
          orderBy: 'categoryId',
          equalTo: categoryId,
          limit: 5
        }
      );
      
      // Get comments
      const commentsResult = await dbService.getAll(
        `${dbRefs.comments}/${kaligrafiId}`,
        { orderBy: 'createdAt' }
      );
      
      return {
        ...result,
        related: relatedResult.success ? relatedResult.data : [],
        comments: commentsResult.success ? commentsResult.data : []
      };
    }
    
    return result;
  }

  // Create new kaligrafi
  async createKaligrafi(userId, kaligrafiData) {
    const newKaligrafi = {
      ...kaligrafiData,
      createdBy: userId,
      views: 0,
      likes: 0,
      favorites: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    return await dbService.create(dbRefs.kaligrafi, newKaligrafi);
  }

  // Update kaligrafi
  async updateKaligrafi(kaligrafiId, updates) {
    return await dbService.update(dbRefs.kaligrafi, kaligrafiId, updates);
  }

  // Like/unlike kaligrafi
  async toggleLike(kaligrafiId, userId) {
    const likeRef = `likes/${kaligrafiId}/${userId}`;
    const snapshot = await dbService.getById('likes', `${kaligrafiId}/${userId}`);
    
    if (snapshot.success) {
      // Unlike
      await dbService.delete('likes', `${kaligrafiId}/${userId}`);
      
      // Decrement like count
      const kaligrafiResult = await this.getKaligrafiDetail(kaligrafiId);
      if (kaligrafiResult.success) {
        const currentLikes = kaligrafiResult.data.likes || 0;
        await this.updateKaligrafi(kaligrafiId, { likes: Math.max(0, currentLikes - 1) });
      }
      
      return { success: true, liked: false };
    } else {
      // Like
      await dbService.create('likes', { kaligrafiId, userId }, `${kaligrafiId}/${userId}`);
      
      // Increment like count
      const kaligrafiResult = await this.getKaligrafiDetail(kaligrafiId);
      if (kaligrafiResult.success) {
        const currentLikes = kaligrafiResult.data.likes || 0;
        await this.updateKaligrafi(kaligrafiId, { likes: currentLikes + 1 });
      }
      
      return { success: true, liked: true };
    }
  }

  // Add comment
  async addComment(kaligrafiId, userId, comment) {
    const commentData = {
      userId,
      kaligrafiId,
      text: comment.text,
      rating: comment.rating || 0,
      createdAt: Date.now()
    };
    
    return await dbService.create(
      `${dbRefs.comments}/${kaligrafiId}`, 
      commentData
    );
  }
}

export default new KaligrafiController();