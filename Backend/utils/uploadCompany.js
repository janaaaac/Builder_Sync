const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Define file upload structure
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      let folder = "general/";
      if (file.fieldname === "companyLogo") folder = "company-logos/";
      else if (file.fieldname === "specializedLicenses") folder = "specialized-licenses/";
      else if (file.fieldname === "isoCertifications") folder = "iso-certifications/";

      const uniqueName = `${folder}${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, JPG images and PDF files are allowed!"), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit to 10MB per file
});

// Handle multiple file uploads
const uploadCompanyFields = upload.fields([
  { name: "companyLogo", maxCount: 1 },
  { name: "specializedLicenses", maxCount: 5 }, // Up to 5 license files
  { name: "isoCertifications", maxCount: 5 }, // Up to 5 ISO certification files
]);

module.exports = { upload, uploadCompanyFields };
