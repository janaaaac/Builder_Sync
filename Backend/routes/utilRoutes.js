const express = require('express');
const router = express.Router();
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const https = require('https');
const requireAuth = require('../middleware/requireAuth');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// Parse S3 URL to extract key
function parseS3Url(url) {
  try {
    if (!url) return null;
    
    // If it's already a key (doesn't start with http)
    if (!url.startsWith('http')) {
      return url;
    }
    
    // Parse the URL
    const urlObj = new URL(url);
    
    // Extract the key
    let key;
    if (urlObj.hostname.includes('.s3.')) {
      // URL format: https://bucket-name.s3.region.amazonaws.com/key
      key = urlObj.pathname.substring(1); // Remove leading slash
    } else if (urlObj.hostname === 's3.amazonaws.com') {
      // URL format: https://s3.amazonaws.com/bucket-name/key
      const pathParts = urlObj.pathname.split('/');
      key = pathParts.slice(2).join('/');
    } else {
      // Try to extract from any other format
      const parts = url.split('/');
      return parts[parts.length - 1];
    }
    
    return key;
  } catch (error) {
    console.error('Error parsing S3 URL:', error);
    return null;
  }
}

// Serve files directly from S3
router.get('/s3-image/:folder/:filename', async (req, res) => {
  try {
    const folder = req.params.folder;
    const filename = req.params.filename;
    const key = `${folder}/${filename}`;
    
    console.log('Fetching S3 image with key:', key);
    
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });
    
    try {
      const { Body, ContentType } = await s3Client.send(command);
      
      // Set appropriate headers
      res.set('Content-Type', ContentType || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      // Stream the file to response
      Body.pipe(res);
    } catch (s3Error) {
      console.error('Error fetching from S3:', s3Error);
      
      if (s3Error.$metadata?.httpStatusCode === 404) {
        return res.status(404).send('File not found');
      }
      
      if (s3Error.$metadata?.httpStatusCode === 403) {
        console.error('S3 permission denied (403) - check bucket policy');
        return res.status(403).send('Permission denied');
      }
      
      return res.status(500).send('Error accessing S3');
    }
  } catch (error) {
    console.error('General error in S3 proxy route:', error);
    res.status(500).send('Server error');
  }
});

// Proxy any external URL
router.get('/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).json({ message: 'URL parameter is required' });
  }

  try {
    console.log('Proxying image:', imageUrl);
    
    // Handle S3 URLs differently if needed
    if (imageUrl.includes('amazonaws.com')) {
      const key = parseS3Url(imageUrl);
      if (key) {
        console.log('Extracted S3 key:', key);
        
        try {
          const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
          });
          
          const { Body, ContentType } = await s3Client.send(command);
          
          // Set correct content type
          res.set('Content-Type', ContentType);
          
          // Stream the file to response
          return Body.pipe(res);
        } catch (s3Error) {
          console.error('Error fetching from S3:', s3Error);
          // Fall back to HTTP request if S3 fails
        }
      }
    }
    
    // Regular HTTP(S) proxy
    https.get(imageUrl, (response) => {
      if (response.statusCode !== 200) {
        return res.status(response.statusCode).send('Error fetching image');
      }
      
      const contentType = response.headers['content-type'];
      if (contentType) {
        res.set('Content-Type', contentType);
      }
      
      response.pipe(res);
    }).on('error', (err) => {
      console.error('Error proxying image:', err);
      res.status(500).send('Failed to fetch image');
    });
  } catch (error) {
    console.error('Error in proxy route:', error);
    res.status(500).send('Server error');
  }
});

// Generate signed URL route
router.post('/sign-url', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ message: 'URL parameter is required' });
  }

  try {
    console.log('Generating signed URL for:', url);
    
    // Extract the S3 key from the URL
    const s3Key = parseS3Url(url);
    
    if (!s3Key) {
      return res.status(400).json({ message: 'Invalid S3 URL' });
    }
    
    console.log('Using S3 key:', s3Key);
    
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    console.log('Generated signed URL:', signedUrl);
    
    res.json({ signedUrl });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ message: 'Failed to generate signed URL' });
  }
});

module.exports = router;