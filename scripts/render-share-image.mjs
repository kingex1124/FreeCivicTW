import sharp from 'sharp';
await sharp('Images/Site/og-default.svg').png().toFile('Images/Site/og-default.png');
console.log('分享圖已產生：Images/Site/og-default.png');
