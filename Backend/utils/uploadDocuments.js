const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Determine if we should use S3 or local storage
const useS3 = process.env.STORAGE_TYPE === 's3' && 
              process.env.AWS_ACCESS_KEY_ID && 
              process.env.AWS_SECRET_ACCESS_KEY && 
              process.env.AWS_REGION && 
              process.env.AWS_S3_BUCKET;

// Configure storage
let documentUpload;

if (useS3) {
  // Configure AWS S3
  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

  // Configure multer for S3 uploads
  documentUpload = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_S3_BUCKET,
      acl: 'public-read', // Set appropriate permissions
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        // Generate unique filename
        const extension = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const key = `documents/${uniqueSuffix}${extension}`;
        cb(null, key);
      }
    }),
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB limit
    },
    fileFilter: function (req, file, cb) {
      // Allow all document types (can be restricted as needed)
      cb(null, true);
    }
  });
} else {
  // Local storage for development
  console.log('Using local storage for document uploads');
  documentUpload = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadsDir);
      },
      filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}${extension}`);
      }
    }),
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB limit
    },
    fileFilter: function (req, file, cb) {
      // Allow all document types (can be restricted as needed)
      cb(null, true);
    }
  });
}

// Handle document uploads
exports.handleDocumentUpload = (req, res, next) => {
  const upload = documentUpload.fields([
    { name: 'document', maxCount: 1 }
  ]);

  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: 'Document upload error',
        error: err.message
      });
    } else if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server error during upload',
        error: err.message
      });
    }
    // Upload successful, proceed
    next();
  });
};

// Handle errors in the document upload process
exports.handleDocumentUploadErrors = (req, res, next) => {
  try {
    // If we reached this point, no errors occurred during upload
    next();
  } catch (error) {
    console.error('Error in document upload middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error with document upload',
      error: error.message
    });
  }
};