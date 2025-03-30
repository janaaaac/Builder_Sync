const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const path = require("path");
const crypto = require("crypto");

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Map field names to S3 folder paths
const folderMap = {
  profilePicture: "profile-pictures/",
  nicPassportFile: "nic-passports/",
  companyLogo: "company-logos/",
  projectDocuments: "project-documents/",
  contractFiles: "contract-files/"
  // Add more mappings as needed
};

// Define file upload configuration
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { 
        fieldName: file.fieldname,
        uploadedBy: req.user?.id || 'anonymous',
        originalName: file.originalname
      });
    },
    key: (req, file, cb) => {
      // Get appropriate folder or default to 'other/'
      const folder = folderMap[file.fieldname] || "other/";
      
      // Generate unique file identifier
      const uniqueId = crypto.randomBytes(8).toString('hex');
      
      // Sanitize filename - remove spaces and special characters
      const fileExt = path.extname(file.originalname).toLowerCase();
      const baseName = path.basename(file.originalname, fileExt)
        .replace(/[^a-z0-9]/gi, '-')  // Replace non-alphanumeric with hyphens
        .replace(/-+/g, '-')          // Replace multiple hyphens with single one
        .substring(0, 40);            // Limit name length
      
      // Build final key with timestamp, unique ID, and sanitized filename
      const key = `${folder}${Date.now()}-${uniqueId}-${baseName}${fileExt}`;
      
      // Store upload info in request object for later use
      if (!req.fileInfo) req.fileInfo = {};
      req.fileInfo[file.fieldname] = key;
      
      cb(null, key);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Define allowed file types by field
    const imageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    const documentTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    
    // Set different restrictions based on field name
    if (file.fieldname === "profilePicture" || file.fieldname === "companyLogo") {
      if (imageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Profile pictures and logos must be JPEG, PNG, JPG, or WebP images!"), false);
      }
    } else if (file.fieldname === "nicPassportFile") {
      if ([...imageTypes, ...documentTypes].includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Identification documents must be images or PDF files!"), false);
      }
    } else {
      // Default - accept common file types
      if ([...imageTypes, ...documentTypes].includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Unsupported file type!"), false);
      }
    }
  },
  limits: { 
    fileSize: 10 * 1024 * 1024  // Increased to 10MB per file
  }
});

// Configure multiple field uploads
const uploadFields = upload.fields([
  { name: "profilePicture", maxCount: 1 },
  { name: "nicPassportFile", maxCount: 1 },
  { name: "companyLogo", maxCount: 1 },
  { name: "projectDocuments", maxCount: 5 },
  { name: "contractFiles", maxCount: 5 }
]);

// Express middleware for handling upload errors
const handleUploadErrors = (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer error (file too large, too many files, etc)
      return res.status(400).json({ 
        error: `Upload error: ${err.message}`,
        code: err.code
      });
    } else if (err) {
      // Other errors (file type not allowed, etc)
      return res.status(400).json({ error: err.message });
    }
    // No errors
    next();
  });
};

module.exports = { upload, uploadFields, handleUploadErrors, folderMap };
