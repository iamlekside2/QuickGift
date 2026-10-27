import {
  BadRequestException,
  Controller,
  HttpCode,
  InternalServerErrorException,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { AuthGuard } from '../../common/auth.guard';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@UseGuards(AuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly upload: UploadService) {}

  @Post('image')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file || !ALLOWED_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type '${file?.mimetype}'. Allowed: jpg, png, webp.`,
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException('File too large. Maximum size is 5 MB.');
    }
    try {
      const url = await this.upload.uploadImage(file.buffer, file.mimetype);
      return { url };
    } catch (e: any) {
      throw new InternalServerErrorException(`Upload failed: ${e?.message ?? e}`);
    }
  }
}
