import { v2 as cloudinary } from "cloudinary";

type UploadNormativeParams = {
  buffer: Buffer;
  fileName: string;
  mimeType?: string;
};

type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  resourceType: string;
};

function assertCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Faltan variables de Cloudinary. Revisá CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en .env."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

function sanitizePublicId(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");

  return withoutExtension
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

export async function uploadNormativeToCloudinary({
  buffer,
  fileName,
}: UploadNormativeParams): Promise<CloudinaryUploadResult> {
  assertCloudinaryConfig();

  const publicIdBase = sanitizePublicId(fileName) || "normativa";
  const uniqueSuffix = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "nubisal/normativas",
        public_id: `${uniqueSuffix}-${publicIdBase}`,
        use_filename: false,
        unique_filename: false,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(
            error || new Error("No se pudo subir la normativa a Cloudinary.")
          );
          return;
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

export async function deleteCloudinaryAssetFromUrl(filePath: string) {
  if (!filePath.includes("res.cloudinary.com")) return;

  try {
    assertCloudinaryConfig();

    const marker = "/raw/upload/";
    const markerIndex = filePath.indexOf(marker);

    if (markerIndex === -1) return;

    let publicId = filePath.slice(markerIndex + marker.length);

    publicId = publicId.replace(/^v\d+\//, "");
    publicId = decodeURIComponent(publicId);

    await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
    });
  } catch {
    // No frenamos la acción si no se pudo borrar el archivo remoto.
  }
}