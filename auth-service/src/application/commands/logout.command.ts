import { ICommand } from '@nestjs/cqrs';

export class LogoutCommand implements ICommand {
  constructor(
    public readonly refreshToken: string,
    public readonly userId?: string,
  ) {}
}
