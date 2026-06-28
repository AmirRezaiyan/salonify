// Add this to check fonts in browser console
(function debugFonts() {
  console.log('═══════════════════════════════════════');
  console.log('🔍 FONT DEBUGGING');
  console.log('═══════════════════════════════════════\n');

  // Check computed font-family
  const computedFont = getComputedStyle(document.documentElement).fontFamily;
  const bodyFont = getComputedStyle(document.body).fontFamily;
  
  console.log('📋 Computed Font Families:');
  console.log('   Root (:root):', computedFont);
  console.log('   Body:', bodyFont);
  console.log('');

  // Test font loading
  console.log('📦 Testing Font URLs:');
  const fontFiles = [
    '/fonts/Vazirmatn%5Bwght%5D.woff2',
    '/fonts/Vazirmatn-Regular.woff2',
    '/fonts/Vazirmatn-Bold.woff2',
    '/fonts/Vazirmatn-Light.woff2',
    '/fonts/Vazirmatn-Medium.woff2',
    '/fonts/Vazirmatn-SemiBold.woff2',
    '/fonts/Vazirmatn-ExtraBold.woff2'
  ];

  fontFiles.forEach(file => {
    fetch(file)
      .then(r => {
        const status = r.ok ? '✅' : '❌';
        const code = r.ok ? r.status : '404';
        console.log(`   ${status} ${file} (${code})`);
      })
      .catch(e => console.log(`   ❌ ${file} (ERROR: ${e.message})`));
  });

  console.log('\n🎨 CSS Variables Check:');
  const root = document.documentElement;
  const fontVar = getComputedStyle(root).getPropertyValue('--font-family').trim();
  console.log('   --font-family:', fontVar);
  
  console.log('\n═══════════════════════════════════════\n');
})();
