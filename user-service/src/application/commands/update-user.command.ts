import { ICommand } from '@nestjs/cqrs';

export class UpdateUserCommand implements ICommand {
  constructor(
    public readonly authId: string,
    public readonly data: Partial<{ name: string; bio: string; avatarUrl: string }>,
    public readonly userId?: string,
    public readonly ipAddress?: string,
  ) {}
}
