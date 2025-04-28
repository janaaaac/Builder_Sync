const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const path = require("path");

// Initialize S3 client with environment variables
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Map field names to S3 folder paths
const folderMap = {
  companyLogo: "company-logos/",
  specializedLicenses: "specialized-licenses/",
  isoCertifications: "iso-certifications/"
};

// Define allowed file types by purpose
const allowedMimeTypes = {
  image: ["image/jpeg", "image/png", "image/jpg"],
  document: ["application/pdf"]
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
        originalName: file.originalname 
      });
    },
    key: (req, file, cb) => {
      // Sanitize filename to prevent security issues
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const baseName = path.basename(file.originalname, fileExtension)
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      
      // Get appropriate folder or default to 'other/'
      const folder = folderMap[file.fieldname] || "other/";
      
      // Create unique filename with timestamp
      const uniqueName = `${folder}${Date.now()}-${baseName}${fileExtension}`;
      
      // Add key to request for later use in controllers
      if (!req.fileKeys) req.fileKeys = {};
      if (!req.fileKeys[file.fieldname]) {
        req.fileKeys[file.fieldname] = file.fieldname === "companyLogo" ? uniqueName : [uniqueName];
      } else if (Array.isArray(req.fileKeys[file.fieldname])) {
        req.fileKeys[file.fieldname].push(uniqueName);
      }
      
      cb(null, uniqueName);
    },
  }),
  fileFilter: (req, file, cb) => {
    const validTypes = [...allowedMimeTypes.image, ...allowedMimeTypes.document];
    
    if (validTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, JPG images and PDF files are allowed!"), false);
    }
  },
  limits: { 
    fileSize: 500 * 1024 * 1024 // Limit to 500MB per file
  },
});

// Handle multiple file uploads
const uploadCompanyFields = upload.fields([
  { name: "companyLogo", maxCount: 1 },
  { name: "specializedLicenses", maxCount: 5 }, // Up to 5 license files
  { name: "isoCertifications", maxCount: 5 }, // Up to 5 ISO certification files
]);

module.exports = { 
  upload, 
  uploadCompanyFields,
  // Export these for potential use in other parts of the application
  folderMap,
  allowedMimeTypes
};
