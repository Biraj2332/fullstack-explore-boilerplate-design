export class GetMediaQuery {
  constructor(public readonly id: string) {}
}

export class GetByEntityQuery {
  constructor(
    public readonly entityType: string,
    public readonly entityId: string,
  ) {}
}
