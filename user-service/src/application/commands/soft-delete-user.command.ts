import { ICommand } from '@nestjs/cqrs';

export class SoftDeleteUserCommand implements ICommand {
  constructor(public readonly authId: string, public readonly requesterId?: string) {}
}
