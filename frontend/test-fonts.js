// Test script to check if fonts are loading correctly
const fontPaths = [
  './assets/webfonts/Vazirmatn%5Bwght%5D.woff2',
  './assets/webfonts/Vazirmatn-Regular.woff2',
  './assets/webfonts/Vazirmatn-Bold.woff2',
  './assets/webfonts/Vazirmatn-Light.woff2',
  './assets/webfonts/Vazirmatn-Medium.woff2',
  './assets/webfonts/Vazirmatn-SemiBold.woff2',
  './assets/webfonts/Vazirmatn-ExtraBold.woff2'
];

console.log('🧪 Testing Font Paths...\n');

fontPaths.forEach(path => {
  fetch(path)
    .then(response => {
      if (response.ok) {
        console.log(`✅ ${path} - SUCCESS (${response.status})`);
      } else {
        console.log(`❌ ${path} - FAILED (${response.status})`);
      }
    })
    .catch(error => {
      console.log(`❌ ${path} - ERROR: ${error.message}`);
    });
});
