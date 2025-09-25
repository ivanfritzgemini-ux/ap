#!/usr/bin/env node

/**
 * Script para verificar la configuración de logos y transparencia
 * Verifica que los archivos existan y que se usen correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de logos...\n');

// Verificar archivos de logo
const logoFiles = [
  'public/polivalente logo c.png',
  'public/uploads/logos/polivalente-logo-c.png'
];

logoFiles.forEach(file => {
  const fullPath = path.resolve(file);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    console.log(`✅ ${file} - ${(stats.size / 1024).toFixed(2)} KB`);
  } else {
    console.log(`❌ ${file} - No encontrado`);
  }
});

console.log('\n📂 Verificando estructura de directorios...');

const directories = [
  'public/uploads',
  'public/uploads/logos',
  'public/uploads/profile-photos'
];

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}`);
  } else {
    console.log(`❌ ${dir} - No existe`);
  }
});

console.log('\n🎨 Verificando componentes de logo...');

// Verificar que los componentes existen
const components = [
  'src/components/logo.tsx',
  'src/components/establishment-logo.tsx'
];

components.forEach(comp => {
  if (fs.existsSync(comp)) {
    console.log(`✅ ${comp}`);
  } else {
    console.log(`❌ ${comp} - No encontrado`);
  }
});

console.log('\n📄 Verificando referencias en archivos...');

// Archivos que deberían usar EstablishmentLogo
const filesToCheck = [
  'src/app/dashboard/layout.tsx',
  'src/components/dashboard/mobile-header.tsx'
];

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('EstablishmentLogo')) {
      console.log(`✅ ${file} - Usa EstablishmentLogo`);
    } else if (content.includes('Logo')) {
      console.log(`⚠️  ${file} - Usa Logo (considera cambiar a EstablishmentLogo)`);
    } else {
      console.log(`❓ ${file} - No usa componente de logo`);
    }
  } else {
    console.log(`❌ ${file} - No encontrado`);
  }
});

console.log('\n🔧 Recomendaciones:');
console.log('1. Usa EstablishmentLogo para logos dinámicos desde la base de datos');
console.log('2. Usa Logo para casos estáticos o de fallback');
console.log('3. Los archivos PNG deben tener fondo transparente');
console.log('4. Evita clases bg-white en imágenes con transparencia');

console.log('\n✨ Verificación completa');