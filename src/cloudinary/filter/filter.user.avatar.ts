import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

export const imageFileAvatarFilter = (
  req: Request,
  file: MulterFile,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; //Giới hạn kích thước tối đa: ví dụ 5MB
  // Check mimetype ảnh
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
    return callback(
      new BadRequestException(
        'Only image files  allowed are jpg,jpeg,png,gif !',
      ),
      false,
    );
  }

  // Check kích thước file
  if (file.size > MAX_FILE_SIZE) {
    return callback(
      new BadRequestException('File size exceeds the 5MB limit!'),
      false,
    );
  }
  callback(null, true);
};
