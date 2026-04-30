export class UserProfile {
  constructor(
    public readonly id: string,
    public readonly authId: string,
    public readonly email: string,
    public readonly name: string | null,
    public readonly bio: string | null,
    public readonly avatarUrl: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}
