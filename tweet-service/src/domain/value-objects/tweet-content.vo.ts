// Value Object — enforces 280 char business rule

export class TweetContent {
  private readonly _value: string;
  static readonly MAX_LENGTH = 280;

  constructor(value: string) {
    const trimmed = value.trim();
    if (!trimmed) throw new Error('Tweet content cannot be empty');
    if (trimmed.length > TweetContent.MAX_LENGTH) {
      throw new Error(`Tweet content cannot exceed ${TweetContent.MAX_LENGTH} characters`);
    }
    this._value = trimmed;
  }

  get value(): string {
    return this._value;
  }

  get length(): number {
    return this._value.length;
  }
}
