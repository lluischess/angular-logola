// Script de prueba para verificar endpoints de productos
const https = require('http');

function testEndpoint(url, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 Probando: ${description}`);
    console.log(`📡 URL: ${url}`);
    
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`✅ Status: ${res.statusCode}`);
          console.log(`📦 Respuesta:`, JSON.stringify(jsonData, null, 2));
          resolve(jsonData);
        } catch (error) {
          console.log(`❌ Error parseando JSON:`, error.message);
          console.log(`📄 Respuesta cruda:`, data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Error de conexión:`, error.message);
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      console.log(`⏰ Timeout después de 5 segundos`);
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function runTests() {
  console.log('🚀 Iniciando pruebas de endpoints de productos...\n');
  
  try {
    // Probar endpoint general de productos
    await testEndpoint('http://localhost:3000/products', 'Todos los productos');
    
    // Probar endpoint de productos por categoría
    await testEndpoint('http://localhost:3000/products/category/caramelos', 'Productos de caramelos');
    
    // Probar endpoint de categorías
    await testEndpoint('http://localhost:3000/categories', 'Todas las categorías');
    
    console.log('\n✅ Todas las pruebas completadas');
    
  } catch (error) {
    console.log('\n❌ Error en las pruebas:', error.message);
  }
}

runTests();
