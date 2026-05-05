export class DeleteMediaCommand {
  constructor(
    public readonly mediaId: string,
    public readonly requestingUserId: string,
  ) {}
}
