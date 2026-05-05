import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetMediaQuery, GetByEntityQuery } from '../queries/media.queries';
import { MEDIA_REPOSITORY, IMediaRepository } from '../../domain/repositories/media.repository.interface';
import { Media } from '../../domain/entities/media.entity';

@QueryHandler(GetMediaQuery)
export class GetMediaHandler implements IQueryHandler<GetMediaQuery, Media | null> {
  constructor(@Inject(MEDIA_REPOSITORY) private readonly repo: IMediaRepository) {}
  execute(q: GetMediaQuery) { return this.repo.findById(q.id); }
}

@QueryHandler(GetByEntityQuery)
export class GetByEntityHandler implements IQueryHandler<GetByEntityQuery, Media[]> {
  constructor(@Inject(MEDIA_REPOSITORY) private readonly repo: IMediaRepository) {}
  execute(q: GetByEntityQuery) { return this.repo.findByEntityId(q.entityType, q.entityId); }
}
