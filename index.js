// ============================================== 
// SYSTEM 2: DEBUG VERSION
// Testing SneaksAPI on Render
// ============================================== 
const express = require('express');
const SneaksAPI = require('sneaks-api');

const app = express();
const sneaks = new SneaksAPI();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'API Running', 
    endpoints: {
      '/trending': 'Full trending search',
      '/test': 'Quick test with 1 search'
    }
  });
});

// TEST ENDPOINT - Just 1 search to debug
app.get('/test', async (req, res) => {
  try {
    console.log('🔍 Testing SneaksAPI with single search...');
    
    const testResults = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Search timed out after 30 seconds'));
      }, 30000);
      
      sneaks.getProducts("Jordan 1", 5, function(err, products) {
        clearTimeout(timeout);
        
        console.log('📊 Callback received!');
        console.log('Error:', err);
        console.log('Products count:', products ? products.length : 0);
        
        if (err) {
          console.error('❌ Error details:', JSON.stringify(err, null, 2));
          resolve({ success: false, error: err, products: [] });
        } else if (!products || products.length === 0) {
          console.log('⚠️ No products returned');
          resolve({ success: false, error: 'No products found', products: [] });
        } else {
          console.log('✅ Success! First product:', products[0]?.shoeName);
          resolve({ success: true, products: products });
        }
      });
    });
    
    res.json({
      test: 'SneaksAPI Test',
      result: testResults,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// FULL TRENDING ENDPOINT
app.get('/trending', async (req, res) => {
  try {
    console.log('🚀 Starting full trending search...');
    
    const PATTERNS = [
        { keyword: "Travis Scott", priority: 1, type: "collab" },
        { keyword: "Jordan 1", priority: 2, type: "brand" }
    ];

    const PRODUCTS_PER_PATTERN = 5;  // Very small for testing
    let allProducts = [];
    let searchErrors = [];

    for (const pattern of PATTERNS) {
        console.log(`\n🔎 Searching: ${pattern.keyword}...`);
        
        try {
          const searchResult = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error(`Timeout searching ${pattern.keyword}`));
            }, 20000);
            
            sneaks.getProducts(pattern.keyword, PRODUCTS_PER_PATTERN, function(err, products) {
              clearTimeout(timeout);
              
              if (err) {
                console.error(`❌ Error for ${pattern.keyword}:`, err);
                searchErrors.push({ pattern: pattern.keyword, error: err });
                resolve([]);
              } else if (!products || products.length === 0) {
                console.log(`⚠️ No products for ${pattern.keyword}`);
                resolve([]);
              } else {
                console.log(`✅ Found ${products.length} products for ${pattern.keyword}`);
                
                const processed = products
                  .filter(p => p.shoeName && !/(hoodie|shirt|tee)/i.test(p.shoeName))
                  .map(product => {
                    const retailPrice = parseFloat(product.retailPrice) || 0;
                    const stockxPrice = parseFloat(product.lowestResellPrice?.stockX) || 0;
                    const goatPrice = parseFloat(product.lowestResellPrice?.goat) || 0;
                    
                    if (retailPrice > 0 && stockxPrice > 0) {
                      const priceIncrease = ((stockxPrice - retailPrice) / retailPrice * 100).toFixed(1);
                      
                      if (parseFloat(priceIncrease) > 10) {
                        return {
                          name: product.shoeName,
                          styleID: product.styleID || 'N/A',
                          brand: product.brand || 'N/A',
                          retailPrice: retailPrice,
                          stockxPrice: stockxPrice,
                          goatPrice: goatPrice,
                          priceIncrease: parseFloat(priceIncrease),
                          profit: (stockxPrice - retailPrice).toFixed(0),
                          matchedPattern: pattern.keyword,
                          patternType: pattern.type,
                          patternPriority: pattern.priority,
                          stockxUrl: product.resellLinks?.stockX || '',
                          fetchedAt: new Date().toISOString()
                        };
                      }
                    }
                    return null;
                  })
                  .filter(p => p !== null);
                
                resolve(processed);
              }
            });
          });
          
          allProducts.push(...searchResult);
          
        } catch (error) {
          console.error(`💥 Exception for ${pattern.keyword}:`, error.message);
          searchErrors.push({ pattern: pattern.keyword, error: error.message });
        }
        
        // Wait 2 seconds between searches
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`\n📊 Total products collected: ${allProducts.length}`);

    // Remove duplicates
    const uniqueProducts = [];
    const seen = new Set();
    allProducts.forEach(product => {
      if (!seen.has(product.styleID)) {
        seen.add(product.styleID);
        uniqueProducts.push(product);
      }
    });

    uniqueProducts.sort((a, b) => {
      if (a.patternPriority !== b.patternPriority) {
        return a.patternPriority - b.patternPriority;
      }
      return b.priceIncrease - a.priceIncrease;
    });

    const top5 = uniqueProducts.slice(0, 5);

    res.json({
      success: allProducts.length > 0,
      count: top5.length,
      totalSearched: allProducts.length,
      errors: searchErrors,
      data: top5,
      searchTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Fatal error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Sneaker API running on port ${PORT}`);
  console.log(`🧪 Test endpoint: /test`);
  console.log(`📊 Full endpoint: /trending`);
});
