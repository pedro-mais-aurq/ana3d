const ALLOWED_EXTENSIONS = Object.freeze(["stl", "3mf", "obj"]);

export const UPLOAD_CONFIG = Object.freeze({
  bucketName: "model-uploads",
  allowedExtensions: ALLOWED_EXTENSIONS,
  maxFiles: 1,
  maxFileSizeBytes: 50_000_000,
  acceptAttribute: ALLOWED_EXTENSIONS.map((extension) => `.${extension}`).join(",")
});
