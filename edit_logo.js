const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function processLogo() {
  const inputPath = 'C:\\Users\\abrah\\.gemini\\antigravity-ide\\brain\\208f5ba1-2f0b-4f9f-ad43-512e12627b9f\\media__1781913846481.png';
  
  // Ensure public directory exists
  const publicDir = 'C:\\Users\\abrah\\Desktop\\sistema_BrunaShop2\\public';
  const appDir = 'C:\\Users\\abrah\\Desktop\\sistema_BrunaShop2\\src\\app';
  if (!fs.existsSync(publicDir)){
      fs.mkdirSync(publicDir);
  }

  try {
    const processSize = async (size, outputPath) => {
      const radius = size / 2;
      const circleSvg = Buffer.from(
        `<svg width="${size}" height="${size}">
          <circle cx="${radius}" cy="${radius}" r="${radius}" fill="white"/>
        </svg>`
      );
      
      await sharp(inputPath)
        .resize(size, size, { fit: 'cover' })
        .composite([{ input: circleSvg, blend: 'dest-in' }])
        .png()
        .toFile(outputPath);
      console.log(`Generated ${outputPath}`);
    };

    // Generate App Router Icon
    await processSize(512, path.join(appDir, 'icon.png'));

    // Generate PWA Icons
    await processSize(192, path.join(publicDir, 'icon-192x192.png'));
    await processSize(512, path.join(publicDir, 'icon-512x512.png'));
    await processSize(180, path.join(publicDir, 'apple-touch-icon.png'));
    
  } catch (err) {
    console.error('Error processing image:', err);
  }
}

processLogo();
