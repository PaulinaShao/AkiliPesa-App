import type { User, Video, Comment, Transaction } from '@/lib/definitions';

export const users: User[] = [
  { id: 'u1', username: 'naturelover', name: 'Alex Doe', avatar: 'https://picsum.photos/seed/user1/200/200', bio: 'Exploring the beauty of the world, one trail at a time.', followers: 1200, following: 150 },
  { id: 'u2', username: 'cityvibes', name: 'Bella Smith', avatar: 'https://picsum.photos/seed/user2/200/200', bio: 'Urban explorer and coffee enthusiast.', followers: 25000, following: 300 },
  { id: 'u3', username: 'foodfusion', name: 'Charlie Green', avatar: 'https://picsum.photos/seed/user3/200/200', bio: 'Cooking up a storm in my kitchen. Recipes & fun.', followers: 500000, following: 80 },
  { id: 'u4', username: 'petpals', name: 'Dana White', avatar: 'https://picsum.photos/seed/user4/200/200', bio: 'Just a person and their furry friends.', followers: 8500, following: 500 },
  { id: 'u5', username: 'dancemachine', name: 'Eli Ray', avatar: 'https://picsum.photos/seed/user5/200/200', bio: 'Living life one dance at a time. #dancechallenge', followers: 1200000, following: 200 },
  { id: 'u6', username: 'travelbug', name: 'Fiona Blue', avatar: 'https://picsum.photos/seed/user6/200/200', bio: 'Passport full of stamps. Next stop: everywhere.', followers: 78000, following: 1200 },
];

export const videos: Video[] = [
  { 
    id: 'v1', 
    userId: 'u1', 
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 
    thumbnailUrl: 'https://picsum.photos/seed/vid1/400/600',
    caption: 'Chasing waterfalls! Absolutely breathtaking views. You have to see this place to believe it. The raw power of nature is humbling.', 
    tags: ['nature', 'travel', 'hiking'],
    likes: 15000, 
    comments: 320, 
    shares: 150 
  },
  { 
    id: 'v2', 
    userId: 'u2', 
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 
    thumbnailUrl: 'https://picsum.photos/seed/vid2/400/600',
    caption: 'The city that never sleeps. Lights, camera, action! Every corner has a story to tell.', 
    tags: ['city', 'architecture', 'nightlife'],
    likes: 28000, 
    comments: 540, 
    shares: 300 
  },
  { 
    id: 'v3', 
    userId: 'u3', 
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/vid3/400/600',
    caption: 'My secret to the perfect pasta sauce! It has been passed down for generations. You will not regret trying this.', 
    tags: ['food', 'cooking', 'recipe'],
    likes: 120000, 
    comments: 2100, 
    shares: 800
  },
  { 
    id: 'v4', 
    userId: 'u4', 
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 
    thumbnailUrl: 'https://picsum.photos/seed/vid4/400/600',
    caption: 'My dog is a certified goofball. I cannot stop laughing at his antics. He brings so much joy.', 
    tags: ['animals', 'dog', 'cute'],
    likes: 95000, 
    comments: 1500, 
    shares: 1200
  },
  { 
    id: 'v5', 
    userId: 'u5', 
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/vid5/400/600',
    caption: 'Hopping on the latest dance trend! Did I nail it or what? Let me know in the comments below!', 
    tags: ['dance', 'music', 'challenge'],
    likes: 350000, 
    comments: 8000, 
    shares: 5000
  },
  { 
    id: 'v6', 
    userId: 'u6', 
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/vid6/400/600',
    caption: 'Found this hidden gem on my last trip. Paradise is real and I want to go back already.', 
    tags: ['travel', 'beach', 'nature'],
    likes: 42000, 
    comments: 750, 
    shares: 400
  },
];

export const comments: Comment[] = [
    { id: 'c1', videoId: 'v1', userId: 'u2', text: 'Wow, where is this?', timestamp: '2024-07-29T10:00:00Z' },
    { id: 'c2', videoId: 'v1', userId: 'u3', text: 'Stunning!', timestamp: '2024-07-29T10:05:00Z' },
    { id: 'c3', videoId: 'v3', userId: 'u5', text: 'Looks delicious! Trying this tonight!', timestamp: '2024-07-29T11:00:00Z' },
    { id: 'c4', videoId: 'v5', userId: 'u1', text: 'You killed it!', timestamp: '2024-07-29T12:00:00Z' },
    { id: 'c5', videoId: 'v5', userId: 'u2', text: 'Teach me your ways!', timestamp: '2024-07-29T12:01:00Z' },
];

export const transactions: Transaction[] = [
  { id: 't1', type: 'Received', amount: 5000, date: '2024-07-30', description: 'From @cityvibes', status: 'Completed' },
  { id: 't2', type: 'Sent', amount: 2000, date: '2024-07-29', description: 'To @foodfusion', status: 'Completed' },
  { id: 't3', type: 'Earned', amount: 1500, date: '2024-07-28', description: 'Video gift', status: 'Completed' },
  { id: 't4', type: 'Commission', amount: 500, date: '2024-07-27', description: 'From @dancemachine', status: 'Completed' },
  { id: 't5', type: 'Add Funds', amount: 10000, date: '2024-07-26', description: 'Bank Transfer', status: 'Completed' },
  { id: 't6', type: 'Withdraw', amount: 5000, date: '2024-07-25', description: 'Mobile Money', status: 'Pending' },
  { id: 't7', type: 'Received', amount: 2500, date: '2024-07-24', description: 'From @travelbug', status: 'Completed' },
  { id: 't8', type: 'Sent', amount: 1000, date: '2024-07-23', description: 'To @petpals', status: 'Failed' },
];
