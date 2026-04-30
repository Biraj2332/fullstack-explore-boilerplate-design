import { ICommand } from '@nestjs/cqrs';

export class RestoreUserCommand implements ICommand {
  constructor(public readonly authId: string, public readonly requesterId?: string) {}
}
