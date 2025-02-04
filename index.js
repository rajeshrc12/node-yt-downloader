const express = require('express');
const fs = require('fs');
const ytdl = require('ytdl-core');
const path = require('path');

const app = express();
const port = 3000;

// Endpoint to download video
app.get('/download-video', (req, res) => {
  const { videoId } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  // Use videoId as the file name (e.g., "videoId.mp4")
  const fileName = `${videoId}.mp4`;
  const outputFilePath = path.join(__dirname, fileName);

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const videoStream = ytdl(videoUrl, { quality: 'highestvideo', filter: 'videoandaudio' });
  const fileStream = fs.createWriteStream(outputFilePath);

  let downloadedBytes = 0;
  let totalBytes = 0;

  videoStream.on('response', (response) => {
    totalBytes = parseInt(response.headers['content-length'], 10);
  });

  videoStream.on('data', (chunk) => {
    downloadedBytes += chunk.length;
    const progress = (downloadedBytes / totalBytes) * 100;
    console.log(`Downloading... ${progress.toFixed(2)}%`);
  });

  videoStream.pipe(fileStream);

  fileStream.on('finish', () => {
    console.log('Download completed!');
    res.json({ message: 'Download completed', filePath: outputFilePath });
  });

  fileStream.on('error', (error) => {
    console.error('Error writing the file:', error);
    res.status(500).json({ error: 'An error occurred during the file download' });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
