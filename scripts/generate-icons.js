const sharp = require('sharp');
const path = require('path');

const sizes = [512, 192, 144];
const inputFile = path.join(__dirname, '../public/SquareBox.png');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  try {
    for (const size of sizes) {
      await sharp(inputFile)
        .resize(size, size)
        .composite([{
          input: Buffer.from(
            `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${size * 0.2}" ry="${size * 0.2}" fill="white"/></svg>`
          ),
          blend: 'dest-in'
        }])
        .toFile(path.join(outputDir, `SquareBox-${size}.png`));
      
      console.log(`Generated ${size}x${size} icon`);
    }
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 