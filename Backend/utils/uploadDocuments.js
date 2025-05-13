const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');

// Removed the creation of the local storage directory as it is no longer needed.

// Configure storage
let documentUpload;

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
    bucket: process.env.AWS_BUCKET_NAME, // Use AWS_BUCKET_NAME
    // acl: 'public-read', // Removed as bucket does not support ACLs
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

// Handle document uploads
exports.handleDocumentUpload = (req, res, next) => {
  const upload = documentUpload.fields([
    { name: 'document', maxCount: 1 }
  ]);

  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      console.error('Multer error during upload:', err);
      return res.status(400).json({
        success: false,
        message: 'Document upload error',
        error: err.message
      });
    } else if (err) {
      console.error('Server error during upload:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error during upload',
        error: err.message
      });
    }

    // Log uploaded file details for debugging
    console.log('Uploaded file details:', req.files);

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