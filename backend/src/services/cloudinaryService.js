const cloudinary = require('../config/cloudinary');

const streamUpload = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

const uploadImages = async (files = [], folder = 'farmflow') => {
  const uploads = files.map((file) => streamUpload(file.buffer, folder));
  const results = await Promise.all(uploads);
  return results.map((r) => ({ url: r.secure_url, publicId: r.public_id }));
};

const uploadSingleImage = async (file, folder = 'farmflow') => {
  const result = await streamUpload(file.buffer, folder);
  return { url: result.secure_url, publicId: result.public_id };
};

const deleteImage = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};

const deleteImages = async (publicIds = []) => {
  await Promise.all(publicIds.filter(Boolean).map((id) => cloudinary.uploader.destroy(id)));
};

module.exports = { uploadImages, uploadSingleImage, deleteImage, deleteImages };
