export const kaligrafiSchema = {
  id: '',
  title: '',
  arabicText: '',
  latinText: '',
  translation: '',
  categoryId: '',
  difficulty: 1, // 1-5
  style: 'naskh', // naskh, diwani, kufi, thuluth, etc.
  author: '',
  source: '',
  imageUrl: '',
  videoUrl: '',
  description: '',
  tips: [],
  strokeOrder: [], // Array of stroke instructions
  views: 0,
  likes: 0,
  favorites: 0,
  createdBy: '',
  createdAt: '',
  updatedAt: '',
  isPublic: true,
  tags: []
};

export const practiceSessionSchema = {
  id: '',
  userId: '',
  kaligrafiId: '',
  startTime: '',
  endTime: '',
  duration: 0, // in seconds
  accuracy: 0, // percentage
  strokes: [], // Array of stroke data
  score: 0,
  notes: '',
  completed: false
};