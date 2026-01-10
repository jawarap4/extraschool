import { db, dbRefs } from './config.js';
import { 
  ref, 
  set, 
  get, 
  update, 
  remove, 
  push, 
  query, 
  orderByChild, 
  equalTo, 
  limitToLast,
  onValue,
  off
} from 'firebase/database';

class DatabaseService {
  constructor() {
    this.db = db;
  }

  // ========== CRUD OPERATIONS ==========
  
  // CREATE
  async create(path, data, id = null) {
    try {
      const refPath = id ? ref(this.db, `${path}/${id}`) : ref(this.db, path);
      const newRef = id ? refPath : push(refPath);
      
      await set(newRef, {
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      
      return {
        success: true,
        id: id || newRef.key,
        data
      };
    } catch (error) {
      console.error('Create error:', error);
      return { success: false, error: error.message };
    }
  }

  // READ - Single
  async getById(path, id) {
    try {
      const snapshot = await get(ref(this.db, `${path}/${id}`));
      if (snapshot.exists()) {
        return { 
          success: true, 
          data: { id: snapshot.key, ...snapshot.val() } 
        };
      }
      return { success: false, error: 'Data not found' };
    } catch (error) {
      console.error('Get by ID error:', error);
      return { success: false, error: error.message };
    }
  }

  // READ - Multiple with query
  async getAll(path, options = {}) {
    try {
      let dbQuery = ref(this.db, path);
      
      // Apply filters if provided
      if (options.orderBy) {
        dbQuery = query(dbQuery, orderByChild(options.orderBy));
      }
      if (options.equalTo) {
        dbQuery = query(dbQuery, equalTo(options.equalTo));
      }
      if (options.limit) {
        dbQuery = query(dbQuery, limitToLast(options.limit));
      }

      const snapshot = await get(dbQuery);
      
      if (snapshot.exists()) {
        const data = [];
        snapshot.forEach(child => {
          data.push({ id: child.key, ...child.val() });
        });
        
        // Reverse if latest first
        if (options.orderBy === 'createdAt') {
          data.reverse();
        }
        
        return { success: true, data };
      }
      
      return { success: true, data: [] };
    } catch (error) {
      console.error('Get all error:', error);
      return { success: false, error: error.message };
    }
  }

  // UPDATE
  async update(path, id, data) {
    try {
      const updates = {
        ...data,
        updatedAt: Date.now()
      };
      
      await update(ref(this.db, `${path}/${id}`), updates);
      return { success: true, id, data: updates };
    } catch (error) {
      console.error('Update error:', error);
      return { success: false, error: error.message };
    }
  }

  // DELETE
  async delete(path, id) {
    try {
      await remove(ref(this.db, `${path}/${id}`));
      return { success: true, id };
    } catch (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }
  }

  // ========== REALTIME LISTENERS ==========
  
  // Real-time subscription
  subscribe(path, callback, options = {}) {
    let dbQuery = ref(this.db, path);
    
    if (options.orderBy) {
      dbQuery = query(dbQuery, orderByChild(options.orderBy));
    }
    
    const unsubscribe = onValue(dbQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data = [];
        snapshot.forEach(child => {
          data.push({ id: child.key, ...child.val() });
        });
        callback({ success: true, data });
      } else {
        callback({ success: true, data: [] });
      }
    }, (error) => {
      callback({ success: false, error: error.message });
    });
    
    return unsubscribe;
  }

  // ========== SPECIFIC METHODS FOR KALIGRAFI MASTER ==========
  
  // Increment view count
  async incrementViews(kaligrafiId) {
    const kaligrafiRef = ref(this.db, `${dbRefs.kaligrafi}/${kaligrafiId}`);
    const snapshot = await get(kaligrafiRef);
    
    if (snapshot.exists()) {
      const currentViews = snapshot.val().views || 0;
      await update(kaligrafiRef, { views: currentViews + 1 });
      return { success: true };
    }
    
    return { success: false };
  }

  // Add to favorites
  async addToFavorite(userId, kaligrafiId) {
    const favoriteRef = ref(this.db, `${dbRefs.favorites}/${userId}/${kaligrafiId}`);
    await set(favoriteRef, {
      kaligrafiId,
      addedAt: Date.now()
    });
    
    return { success: true };
  }

  // Remove from favorites
  async removeFromFavorite(userId, kaligrafiId) {
    await remove(ref(this.db, `${dbRefs.favorites}/${userId}/${kaligrafiId}`));
    return { success: true };
  }

  // Track user progress
  async updateUserProgress(userId, kaligrafiId, progressData) {
    const progressRef = ref(this.db, `${dbRefs.userProgress}/${userId}/${kaligrafiId}`);
    await set(progressRef, {
      ...progressData,
      lastPracticed: Date.now(),
      updatedAt: Date.now()
    });
    
    return { success: true };
  }
}

export default new DatabaseService();