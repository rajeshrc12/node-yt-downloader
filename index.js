require('dotenv').config();  // Load environment variables from .env file

const express = require('express');
const ytdl = require('ytdl-core');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

// Initialize the S3 client (credentials are automatically loaded from environment variables)
const s3 = new AWS.S3();

// Endpoint to download video and upload to S3
app.get('/download-video', (req, res) => {
  const { videoId } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  // Validate the video ID format (basic check for YouTube video ID pattern)
  const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/;
  if (!videoIdRegex.test(videoId)) {
    return res.status(400).json({ error: 'Invalid YouTube video ID' });
  }

  // Generate a unique file name for S3
  const fileName = `${videoId}.mp4`;
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  // Set S3 upload parameters
  const params = {
    Bucket: 'clipsmart', // Replace with your S3 bucket name
    Key: `videos/${uuidv4()}-${fileName}`, // Unique file name using UUID
    Body: ytdl(videoUrl, { quality: 'highestvideo', filter: 'videoandaudio' }), // Streaming video directly to S3
    ContentType: 'video/mp4',
  };

  // Upload video directly from YouTube to S3
  s3.upload(params, (err, data) => {
    if (err) {
      console.error('Error uploading to S3:', err);
      return res.status(500).json({ error: 'Error uploading to S3' });
    }

    console.log('File uploaded successfully:', data.Location);

    // Generate a presigned URL for the uploaded video
    const presignedUrlParams = {
      Bucket: 'clipsmart',
      Key: data.Key,
      Expires: 3600, // URL will expire in 1 hour
    };

    // Generate the presigned URL
    s3.getSignedUrl('getObject', presignedUrlParams, (err, url) => {
      if (err) {
        console.error('Error generating presigned URL:', err);
        return res.status(500).json({ error: 'Error generating presigned URL' });
      }

      console.log('Presigned URL generated:', url);
      res.json({ message: 'File uploaded to S3 successfully', fileUrl: url });
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
