const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs');
const path = require('path');

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

/**
 * Upload a single file to AWS S3 from the server
 * @param {Object} file - The file object from multer
 * @param {String} prefix - Folder prefix for the file
 * @returns {Promise<Object>} Object containing file info and S3 URL
 */
const uploadFileToS3 = async (file, prefix = 'proposals') => {
  // Generate a unique file key
  const timestamp = new Date().getTime();
  const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileKey = `${prefix}/${timestamp}-${sanitizedFileName}`;
  
  // Read the file from disk
  const fileContent = fs.readFileSync(file.path);
  
  // Set up the upload parameters
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
    Body: fileContent,
    ContentType: file.mimetype
    // Removed ACL: 'public-read' as it's not supported by your bucket
  };
  
  try {
    // Upload to S3 using v3 SDK
    const upload = new Upload({
      client: s3Client,
      params: params
    });

    const uploadResult = await upload.done();
    
    // Clean up the temporary file
    fs.unlinkSync(file.path);
    
    // Construct S3 URL (since v3 doesn't return Location directly)
    const region = process.env.AWS_REGION || 'eu-north-1';
    const bucketName = process.env.AWS_BUCKET_NAME;
    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${fileKey}`;
    
    // Return file information
    return {
      originalName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      key: fileKey,
      url: url
    };
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
};

/**
 * Upload multiple files to AWS S3 for a proposal
 * @param {Array<Object>} files - Array of multer file objects
 * @returns {Promise<Array<Object>>} Array of uploaded file information
 */
const uploadProposalAttachments = async (files, proposalId) => {
  // Use provided proposalId or generate a unique proposal ID to group files together
  const propId = proposalId || `proposal_${new Date().getTime()}`;
  const prefix = `proposals/${propId}`;
  
  try {
    // Upload each file in parallel
    const uploadPromises = files.map(file => uploadFileToS3(file, prefix));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading proposal attachments:', error);
    throw error;
  }
};

/**
 * Delete a file from S3 using its key
 * @param {String} fileKey - Key of the file to delete
 * @returns {Promise<Object>} S3 delete response
 */
const deleteFileFromS3 = async (fileKey) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey
  };
  
  try {
    // Use v3 SDK to delete object
    const command = new DeleteObjectCommand(params);
    return await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
};

// Helper to ensure upload directory exists
const ensureUploadDirectoryExists = () => {
  const uploadDir = path.join(__dirname, '..', 'uploads', 'proposals');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

module.exports = {
  uploadFileToS3,
  uploadProposalAttachments,
  deleteFileFromS3,
  ensureUploadDirectoryExists
};
