export class UploadMediaCommand {
  constructor(
    public readonly userId: string,
    public readonly entityType: string,
    public readonly entityId: string | undefined,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly fileSize: number,
    public readonly buffer: Buffer,
    public readonly ipAddress: string | undefined,
  ) {}
}
