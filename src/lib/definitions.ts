export type User = {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
};

export type Video = {
  id: string;
  userId: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
};

export type Comment = {
  id: string;
  videoId: string;
  userId: string;
  text: string;
  timestamp: string;
};

export type Transaction = {
  id: string;
  type: 'Received' | 'Sent' | 'Earned' | 'Commission' | 'Add Funds' | 'Withdraw' | 'Escrow Hold' | 'Escrow Release';
  amount: number;
  date: string;
  description: string;
  status: 'Completed' | 'Pending' | 'Failed';
};
