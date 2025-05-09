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

// Define file upload configuration for construction plans
const uploadPlans = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { 
        fieldName: file.fieldname,
        uploadedBy: req.user?.id || 'anonymous',
        originalName: file.originalname,
        projectId: req.params.projectId || 'unassigned'
      });
    },
    key: (req, file, cb) => {
      // Use plans folder for all construction plans
      const folder = "plans/";
      
      // Generate unique file identifier
      const uniqueId = crypto.randomBytes(8).toString('hex');
      
      // Sanitize filename
      const fileExt = path.extname(file.originalname).toLowerCase();
      const baseName = path.basename(file.originalname, fileExt)
        .replace(/[^a-z0-9]/gi, '-')
        .replace(/-+/g, '-')
        .substring(0, 40);
      
      // Build final key with timestamp, unique ID, and sanitized filename
      const key = `${folder}${Date.now()}-${uniqueId}-${baseName}${fileExt}`;
      
      // Store upload info in request object for later use
      if (!req.fileInfo) req.fileInfo = {};
      req.fileInfo[file.fieldname] = key;
      
      cb(null, key);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Define allowed file types for plans
    const planTypes = [
      "application/pdf", 
      "image/jpeg", 
      "image/png", 
      "image/jpg", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.dwg",
      "application/vnd.dxf",
      "application/octet-stream", // For CAD files sometimes
      "application/acad" // AutoCAD
    ];
    
    if (planTypes.includes(file.mimetype) || 
        file.originalname.endsWith('.dwg') || 
        file.originalname.endsWith('.dxf')) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type for construction plans!"), false);
    }
  },
  limits: { 
    fileSize: 1024 * 1024 * 500  // 500MB per file
  }
});

// Configure plan upload fields
const planFields = uploadPlans.fields([
  { name: "floorPlans", maxCount: 10 },
  { name: "elevationPlans", maxCount: 5 },
  { name: "sectionPlans", maxCount: 5 },
  { name: "sitePlans", maxCount: 5 },
  { name: "structuralPlans", maxCount: 5 },
  { name: "electricalPlans", maxCount: 5 },
  { name: "plumbingPlans", maxCount: 5 },
  { name: "otherPlans", maxCount: 10 }
]);

// Express middleware for handling plan upload errors
const handlePlanUploadErrors = (req, res, next) => {
  planFields(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer error (file too large, too many files, etc)
      return res.status(400).json({ 
        error: `Plan upload error: ${err.message}`,
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

module.exports = { uploadPlans, planFields, handlePlanUploadErrors };