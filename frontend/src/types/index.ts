// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends TokenPair {
  user?: AuthUser;
}

// ─── User Profile ──────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  authId: string;
  email: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface UpdateProfilePayload {
  name?: string;
  bio?: string;
  avatarUrl?: string;
}

// ─── Tweet ─────────────────────────────────────────────────────────────────────
export interface Tweet {
  id: string;
  userId: string;
  content: string;
  mediaUrls: string[];
  likesCount: number;
  retweetsCount: number;
  originalTweetId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateTweetPayload {
  content: string;
  mediaUrls?: string[];
}

export interface UpdateTweetPayload {
  content: string;
}

// ─── Notification ──────────────────────────────────────────────────────────────
export type NotificationType =
  | 'TWEET_CREATED'
  | 'TWEET_LIKED'
  | 'TWEET_RETWEETED'
  | 'USER_FOLLOWED'
  | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  fromUserId: string | null;
  type: NotificationType;
  title: string;
  body: string;
  entityId: string | null;
  entityType: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  deletedAt: string | null;
}

// ─── Timeline Cursor ───────────────────────────────────────────────────────────
export interface TimelineResponse {
  tweets: Tweet[];
  nextCursor?: string;
}


// ─── User Search Result ─────────────────────────────────────────────────────────
export interface UserSearchResult {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

