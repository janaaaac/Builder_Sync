const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Set up multer storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});

// Upload middleware for multiple images
exports.uploadPortfolioImages = upload.array('images', 10); // Allows up to 10 images

// Upload to S3
exports.uploadToS3 = async (file) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${uuidv4()}${path.extname(file.originalname)}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  const data = await s3.upload(params).promise();
  return data.Location;
};