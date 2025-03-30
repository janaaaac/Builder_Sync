const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const path = require("path");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Staff-specific upload configuration
const staffFolderMap = {
  profilePicture: "staff-profiles/",
  qualifications: "staff-qualifications/",
  certifications: "staff-certifications/"
};

const staffUpload = multer({
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
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const baseName = path.basename(file.originalname, fileExtension)
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      
      const folder = staffFolderMap[file.fieldname] || "staff-other/";
      const uniqueName = `${folder}${req.user._id}-${Date.now()}-${baseName}${fileExtension}`;
      
      if (!req.fileKeys) req.fileKeys = {};
      req.fileKeys[file.fieldname] = uniqueName;
      
      cb(null, uniqueName);
    },
  }),
  fileFilter: (req, file, cb) => {
    const validTypes = [
      'image/jpeg', 
      'image/png', 
      'image/jpg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (validTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images, PDFs and Word docs are allowed"), false);
    }
  },
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
});

const uploadStaffFiles = staffUpload.fields([
  { name: "profilePicture", maxCount: 1 },
  { name: "qualifications", maxCount: 5 },
  { name: "certifications", maxCount: 5 }
]);

module.exports = { 
  staffUpload,
  uploadStaffFiles,
  staffFolderMap
};