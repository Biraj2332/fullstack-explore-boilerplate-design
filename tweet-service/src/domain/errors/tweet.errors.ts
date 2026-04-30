export type TweetDomainError =
  | { code: 'TWEET_NOT_FOUND';        message: string }
  | { code: 'TWEET_ALREADY_DELETED';  message: string }
  | { code: 'NOT_TWEET_OWNER';        message: string }
  | { code: 'ALREADY_LIKED';          message: string }
  | { code: 'NOT_LIKED';              message: string }
  | { code: 'EMPTY_CONTENT';          message: string }
  | { code: 'CONTENT_TOO_LONG';       message: string }
  | { code: 'CANNOT_RETWEET_OWN';     message: string }
  | { code: 'USER_NOT_FOUND';         message: string };
