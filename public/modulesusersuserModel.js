export const userSchema = {
  id: '',
  email: '',
  username: '',
  displayName: '',
  photoURL: '',
  level: 'beginner', // beginner, intermediate, advanced, master
  xp: 0,
  streak: 0,
  badges: [],
  joinedAt: '',
  lastActive: '',
  settings: {
    notifications: true,
    darkMode: false,
    language: 'id',
    practiceReminder: true
  }
};

export const validateUserData = (userData) => {
  const errors = [];
  
  if (!userData.email || !/\S+@\S+\.\S+/.test(userData.email)) {
    errors.push('Email tidak valid');
  }
  
  if (!userData.username || userData.username.length < 3) {
    errors.push('Username minimal 3 karakter');
  }
  
  if (userData.xp && userData.xp < 0) {
    errors.push('XP tidak boleh negatif');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};