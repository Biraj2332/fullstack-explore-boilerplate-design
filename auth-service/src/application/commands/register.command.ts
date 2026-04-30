import { ICommand } from '@nestjs/cqrs';

export class RegisterCommand implements ICommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {}
}
