import { ICommand } from '@nestjs/cqrs';

export class CreateUserCommand implements ICommand {
  constructor(
    public readonly authId: string,
    public readonly email: string,
  ) {}
}
