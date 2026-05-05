import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import type { Request, Response } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtGuard } from '../guards/jwt.guard';
import { UploadMediaCommand } from '../../application/commands/upload-media.command';
import { DeleteMediaCommand } from '../../application/commands/delete-media.command';
import { GetMediaQuery, GetByEntityQuery } from '../../application/queries/media.queries';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const UPLOADS_DIR = process.env.UPLOADS_DIR ?? '/app/uploads';

const multerOpts = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
    ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(new BadRequestException(`Unsupported type: ${file.mimetype}`));
  },
};

@ApiTags('media')
@ApiBearerAuth('access-token')
@UseGuards(JwtGuard)
@Controller('media')
export class MediaController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** Single-file upload */
  @Post('upload')
  @ApiOperation({ summary: 'Upload a single image (max 5 MB, JPEG/PNG/GIF/WebP)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerOpts))
  async upload(
    @Req() _req: Request & { file?: Express.Multer.File },
    @CurrentUser() user: any,
    @Query('entityType') entityType = 'tweet',
    @Query('entityId')   entityId?: string,
  ) {
    const file = (_req as any).file as Express.Multer.File | undefined;
    if (!file) throw new BadRequestException('No file uploaded');
    const result = await this.commandBus.execute(
      new UploadMediaCommand(user.sub, entityType, entityId, file.originalname, file.mimetype, file.size, file.buffer, _req.ip),
    );
    if (result.isErr()) throw new BadRequestException(result.error.message);
    return result._unsafeUnwrap();
  }

  /** Multiple-file upload (up to 4 images for a tweet) */
  @Post('upload-multiple')
  @ApiOperation({ summary: 'Upload multiple images (tweet with media)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 4, multerOpts))
  async uploadMultiple(
    @Req() req: Request,
    @CurrentUser() user: any,
    @Query('entityType') entityType = 'tweet',
    @Query('entityId')   entityId?: string,
  ) {
    const files = (req as any).files as Express.Multer.File[] | undefined;
    if (!files?.length) throw new BadRequestException('No files uploaded');
    const results = await Promise.all(
      files.map((f) =>
        this.commandBus.execute(
          new UploadMediaCommand(user.sub, entityType, entityId, f.originalname, f.mimetype, f.size, f.buffer, req.ip),
        ),
      ),
    );
    const failed = results.filter((r) => r.isErr());
    if (failed.length) throw new BadRequestException(failed[0].error.message);
    return results.map((r) => r._unsafeUnwrap());
  }

  /** Serve the image (choose size via ?size=thumbnail|medium|large|original) */
  @Get(':id')
  @ApiOperation({ summary: 'Serve a media file' })
  async serve(
    @Param('id') id: string,
    @Query('size') size: 'thumbnail' | 'medium' | 'large' | 'original' = 'original',
    @Res({ passthrough: true }) res: Response,
  ) {
    const media = await this.queryBus.execute(new GetMediaQuery(id));
    if (!media || media.isDeleted()) throw new NotFoundException('Media not found');

    const relPath =
      size === 'thumbnail' ? (media.thumbnailPath ?? media.originalPath)
      : size === 'medium'  ? (media.mediumPath    ?? media.originalPath)
      : size === 'large'   ? (media.largePath     ?? media.originalPath)
      : media.originalPath;

    const absPath = path.join(UPLOADS_DIR, relPath);
    if (!fs.existsSync(absPath)) throw new NotFoundException('File not found on disk');

    const ext = path.extname(absPath);
    const mime = ['.webp'].includes(ext) ? 'image/webp' : media.mimeType;
    res.set({ 'Content-Type': mime, 'Cache-Control': 'public, max-age=604800' });
    return new StreamableFile(fs.createReadStream(absPath));
  }

  /** List media attached to a tweet / avatar */
  @Get('by-entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get all media for a tweet or avatar' })
  async byEntity(@Param('entityType') et: string, @Param('entityId') eid: string) {
    return this.queryBus.execute(new GetByEntityQuery(et, eid));
  }

  /** Soft-delete (owner only) */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a media item (owner only)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.commandBus.execute(new DeleteMediaCommand(id, user.sub));
    if (result.isErr()) {
      const { code, message } = result.error;
      if (code === 'NOT_FOUND')     throw new NotFoundException(message);
      if (code === 'UNAUTHORIZED')  throw new UnauthorizedException(message);
      throw new BadRequestException(message);
    }
  }
}
