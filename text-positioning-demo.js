console.log('=== AJUSTES DE POSICIONAMIENTO DE TEXTO Y MARCADORES ===\n');

// Configuración del gráfico
const gaugeSize = 260; // Tamaño del gauge por defecto

console.log('📍 POSICIONAMIENTO DEL TEXTO CENTRAL:');
console.log('────────────────────────────────────');

// Posición anterior
const oldTop = gaugeSize * 0.25;
const oldHeight = gaugeSize * 0.35;
console.log(`❌ Anterior: top = ${oldTop}px (${gaugeSize} × 0.25)`);
console.log(`   Centro vertical en: ${oldTop + (oldHeight / 2)}px`);

// Nueva posición
const newTop = gaugeSize * 0.4;
const newHeight = gaugeSize * 0.2;
console.log(`✅ Nueva: top = ${newTop}px (${gaugeSize} × 0.4)`);
console.log(`   Centro vertical en: ${newTop + (newHeight / 2)}px`);

const movement = newTop - oldTop;
console.log(`📏 Movimiento hacia abajo: +${movement}px\n`);

console.log('📏 TAMAÑO DE MARCADORES DE PORCENTAJE:');
console.log('───────────────────────────────────────');

// Marcadores normales
const oldNormalSize = gaugeSize * 0.038;
const newNormalSize = gaugeSize * 0.046;
console.log(`📊 Marcadores normales (0%, 25%, 50%, 75%, 100%):`);
console.log(`   ❌ Anterior: ${oldNormalSize.toFixed(1)}px (${gaugeSize} × 0.038)`);
console.log(`   ✅ Nueva: ${newNormalSize.toFixed(1)}px (${gaugeSize} × 0.046)`);
console.log(`   📈 Incremento: +${(newNormalSize - oldNormalSize).toFixed(1)}px\n`);

// Marcador del 85%
const oldMinSize = gaugeSize * 0.042;
const newMinSize = gaugeSize * 0.050;
console.log(`⚡ Marcador del 85% (mínimo):`);
console.log(`   ❌ Anterior: ${oldMinSize.toFixed(1)}px (${gaugeSize} × 0.042)`);
console.log(`   ✅ Nueva: ${newMinSize.toFixed(1)}px (${gaugeSize} × 0.050)`);
console.log(`   📈 Incremento: +${(newMinSize - oldMinSize).toFixed(1)}px\n`);

// Texto "mín"
const oldMinTextSize = gaugeSize * 0.028;
const newMinTextSize = gaugeSize * 0.036;
console.log(`📝 Texto "mín" bajo el 85%:`);
console.log(`   ❌ Anterior: ${oldMinTextSize.toFixed(1)}px (${gaugeSize} × 0.028)`);
console.log(`   ✅ Nueva: ${newMinTextSize.toFixed(1)}px (${gaugeSize} × 0.036)`);
console.log(`   📈 Incremento: +${(newMinTextSize - oldMinTextSize).toFixed(1)}px\n`);

console.log('🎯 RESULTADO VISUAL:');
console.log('──────────────────');
console.log('✅ El porcentaje y "Asistencia Promedio" ahora están alineados con la base del gráfico');
console.log('✅ Los marcadores de porcentaje son 2 puntos más grandes y más visibles');
console.log('✅ El marcador del 85% mantiene su énfasis especial pero con mejor tamaño');