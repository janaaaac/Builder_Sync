const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

/**
 * Extract S3 key from a full S3 URL
 * @param {string} url - The S3 URL to parse
 * @returns {string|null} - The extracted S3 key or null if invalid
 */
const extractS3Key = (url) => {
  if (!url) return null;
  try {
    // Try using URL parsing for more robust extraction
    try {
      const parsedUrl = new URL(url);
      // Get the pathname and remove leading slash
      let key = parsedUrl.pathname;
      if (key.startsWith('/')) key = key.substring(1);
      
      // If hostname contains bucket name, ensure it's not included in the key
      if (parsedUrl.hostname.includes(process.env.AWS_BUCKET_NAME)) {
        const bucketPath = `${process.env.AWS_BUCKET_NAME}/`;
        if (key.startsWith(bucketPath)) {
          key = key.substring(bucketPath.length);
        }
      }
      
      return key;
    } catch (urlError) {
      // Fall back to string parsing if URL parsing fails
      // Handle standard S3 URLs (https://bucket.s3.region.amazonaws.com/folder/file.jpg)
      if (url.includes('.amazonaws.com/')) {
        return url.split('.amazonaws.com/')[1];
      }
      // Handle CloudFront URLs if applicable
      if (url.includes('cloudfront.net/')) {
        return url.split('cloudfront.net/')[1];
      }
      // If it doesn't match known patterns, return the URL as is (might already be a key)
      return url;
    }
  } catch (error) {
    console.error('Error extracting S3 key:', error);
    return null;
  }
};

/**
 * Generate a presigned URL for an S3 object
 * @param {string} key - The S3 object key
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
 * @param {Object} options - Additional options for the presigned URL
 * @returns {Promise<string>} - The presigned URL
 */
const generatePresignedUrl = async (key, expiresIn = 3600, options = {}) => {
  if (!key) return null;
  
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ...options
    });
    
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error(`Error generating presigned URL for ${key}:`, error);
    return null;
  }
};

/**
 * Generate a presigned URL from a full S3 URL
 * @param {string} s3Url - The S3 URL
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
 * @returns {Promise<string>} - The presigned URL
 */
const generatePresignedUrlFromS3Url = async (s3Url, expiresIn = 3600) => {
  const key = extractS3Key(s3Url);
  if (!key) return null;
  
  return generatePresignedUrl(key, expiresIn);
};

/**
 * Generate presigned URLs for multiple S3 keys
 * @param {string[]} keys - Array of S3 object keys
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
 * @returns {Promise<string[]>} - Array of presigned URLs in same order as keys
 */
const generatePresignedUrls = async (keys, expiresIn = 3600) => {
  if (!keys || !Array.isArray(keys)) return [];
  
  try {
    // Use Promise.all to process all keys in parallel
    return await Promise.all(
      keys.map(key => generatePresignedUrl(key, expiresIn))
    );
  } catch (error) {
    console.error('Error generating multiple presigned URLs:', error);
    return [];
  }
};

/**
 * Generate presigned URLs for multiple S3 URLs
 * @param {string[]} s3Urls - Array of S3 URLs
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
 * @returns {Promise<string[]>} - Array of presigned URLs in same order as input URLs
 */
const generatePresignedUrlsFromS3Urls = async (s3Urls, expiresIn = 3600) => {
  if (!s3Urls || !Array.isArray(s3Urls)) return [];
  
  try {
    // Use Promise.all to process all URLs in parallel
    return await Promise.all(
      s3Urls.map(url => generatePresignedUrlFromS3Url(url, expiresIn))
    );
  } catch (error) {
    console.error('Error generating multiple presigned URLs from S3 URLs:', error);
    return [];
  }
};

module.exports = { 
  generatePresignedUrl,
  generatePresignedUrlFromS3Url,
  generatePresignedUrls,
  generatePresignedUrlsFromS3Urls,
  extractS3Key
};