import { v2 as cloudinary } from 'cloudinary';

const CLOUDINARY_ROOT_FOLDER = 'Du-an_QL_Project';

export const uploadImageToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
): Promise<{ secure_url: string; public_id: string } | undefined> => {
  try {
    // Gộp đường dẫn thư mục gốc + thư mục con
    const fullFolderPath = `${CLOUDINARY_ROOT_FOLDER}/${folder}`;

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: fullFolderPath, resource_type: 'auto' },
            (error, result) => {
              if (error || !result) {
                const reason =
                  error instanceof Error
                    ? error
                    : new Error(JSON.stringify(error));
                return reject(reason);
              }
              resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
              });
            },
          )
          .end(fileBuffer);
      },
    );

    return result;
  } catch (error) {
    console.error('Failed to upload image:', error);
    return undefined;
  }
};

export const deleteImageFromCloudinary = async (
  publicId: string,
): Promise<boolean> => {
  try {
    const result = (await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    })) as {
      result: string;
    };

    return result.result === 'ok';
  } catch (error) {
    console.error('Failed to delete image:', error);
    return false;
  }
};

export const deleteCloudinaryFileByMime = async (
  publicId: string,
  fileType: string,
): Promise<boolean> => {
  if (!publicId || !fileType) return false;

  const resourceType = fileType.startsWith('image/')
    ? 'image'
    : fileType.startsWith('video/')
      ? 'video'
      : 'raw';

  try {
    const result = (await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    })) as { result: string };

    if (result.result !== 'ok') {
      console.warn(`Failed to delete Cloudinary file: ${publicId}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error deleting Cloudinary file ${publicId}:`, error);
    return false;
  }
};
