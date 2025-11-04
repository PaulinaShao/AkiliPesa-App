
export type Post = {
  id: string;
  authorId: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  media: {
    url: string;
    type: 'image' | 'video'
  }
};

export type Comment = {
  id: string;
  videoId: string;
  userId: string;
  text: string;
  timestamp: string;
};

export type Transaction = {
  id:string;
  type: 'Received' | 'Sent' | 'Earned' | 'Commission' | 'Add Funds' | 'Withdraw' | 'Escrow Hold' | 'Escrow Release' | 'Purchase';
  amount: number;
  date: string;
  description: string;
  status: 'Completed' | 'Pending' | 'Failed';
};

export type Message = {
    id: string;
    senderId: string;
    receiverId: string;
    text: string;
    timestamp: string;
    unread?: boolean;
};
