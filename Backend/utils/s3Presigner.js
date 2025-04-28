const { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();
// const AWS = require("aws-sdk");

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

// Debug mode - set to true to get more verbose logging
const DEBUG = process.env.DEBUG_S3 === 'true';

/**
 * Extract S3 key from a full S3 URL
 * @param {string} url - The S3 URL to parse
 * @returns {string|null} - The extracted S3 key or null if invalid
 */
const extractS3Key = (url) => {
  if (!url) return null;
  
  // If it's already a key (no http)
  if (!url.startsWith('http')) return url;
  
  try {
    const parsed = new URL(url);
    
    // For URLs with the bucket name in the hostname
    if (parsed.hostname.includes('.s3.')) {
      return parsed.pathname.substring(1); // Remove leading slash
    }
    
    // For URLs with the bucket name in the path
    const pathParts = parsed.pathname.split('/');
    if (pathParts.length > 2) {
      // Remove the first empty part and the bucket name
      return pathParts.slice(2).join('/');
    }
    
    return parsed.pathname.substring(1);
  } catch (error) {
    if (DEBUG) console.warn(`Failed to parse URL: ${url}`, error);
    
    // Fallback extraction using string manipulation
    if (url.includes('.s3.')) {
      const parts = url.split('.s3.');
      return parts[1].split('/').slice(1).join('/');
    }
    
    if (url.includes('/')) {
      return url.split('/').slice(-2).join('/');
    }
    
    return url;
  }
};

/**
 * Check if file exists in S3
 * @param {string} key - The S3 object key
 * @returns {Promise<boolean>} - Whether the file exists
 */
const checkFileExists = async (key) => {
  if (!key) return false;
  
  try {
    if (DEBUG) console.log(`Checking if file exists: ${key}`);
    
    await s3Client.send(new HeadObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    }));
    
    if (DEBUG) console.log(`File found: ${key}`);
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.warn(`File not found in S3: ${key}`);
      return false;
    }
    
    console.error(`Error checking if file exists (${key}):`, error);
    return false;
  }
};

/**
 * Generate presigned URL for S3 file and handle graceful fallback
 * @param {string} fileReference - S3 key or full URL
 * @returns {Promise<string|null>} - Presigned URL or original URL if file doesn't exist
 */
const generatePresignedUrl = async (fileReference) => {
  if (!fileReference) return null;
  
  try {
    const key = extractS3Key(fileReference);
    if (!key) return fileReference; // Return original if extraction fails
    
    const exists = await checkFileExists(key);
    if (!exists) {
      // Return the original reference if the file doesn't exist in S3
      return fileReference.startsWith('http') ? fileReference : null;
    }
    
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    });
    
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    // Return the original URL as fallback
    return fileReference.startsWith('http') ? fileReference : null;
  }
};

/**
 * Generate presigned URL from S3 URL with better fallback
 * @param {string} url - The S3 URL
 * @returns {Promise<string|null>} - Presigned URL or original URL as fallback
 */
const generatePresignedUrlFromS3Url = async (url) => {
  return generatePresignedUrl(url);
};

/**
 * Process client objects to add presigned URLs for file fields
 * @param {Object} client - Client object with file fields
 * @returns {Promise<Object>} - Client with presigned URLs
 */
const addPresignedUrlsToClient = async (client) => {
  if (!client) return client;
  
  const clientObj = typeof client.toObject === 'function' ? client.toObject() : {...client};
  
  // Fields that might contain file references
  const fileFields = ['profilePicture', 'nicPassportFile', 'companyLogo'];
  
  for (const field of fileFields) {
    if (clientObj[field]) {
      try {
        // Try to generate presigned URL, fallback to original
        const presignedUrl = await generatePresignedUrl(clientObj[field]);
        if (presignedUrl) {
          clientObj[`${field}Url`] = presignedUrl;
        }
      } catch (error) {
        console.error(`Failed to generate presigned URL for ${field}:`, error);
        // Keep original URL as fallback
        clientObj[`${field}Url`] = clientObj[field];
      }
    }
  }
  
  return clientObj;
};

async function getPresignedUrl(fileName, fileType) {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `chat/${fileName}`,
    ContentType: fileType,
  };

  try {
    const command = new PutObjectCommand(params);
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes
    return presignedUrl;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw error;
  }
}

module.exports = {
  generatePresignedUrl,
  generatePresignedUrlFromS3Url,
  extractS3Key,
  checkFileExists,
  addPresignedUrlsToClient,
  getPresignedUrl
};