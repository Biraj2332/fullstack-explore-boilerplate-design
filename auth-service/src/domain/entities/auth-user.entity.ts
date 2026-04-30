// Pure domain entity — no NestJS, no Prisma imports allowed here

export class AuthUser {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}
