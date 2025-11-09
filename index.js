// ============================================== 
// SYSTEM 2: OPTIMIZED & FASTER VERSION
// Reduced patterns and products for speed
// ============================================== 
const express = require('express');
const SneaksAPI = require('sneaks-api');

const app = express();
const sneaks = new SneaksAPI();

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'API Running', 
    endpoint: '/trending',
    note: 'Optimized for speed - searches 3 patterns with 10 products each'
  });
});

// OPTIMIZED TRENDING ENDPOINT
app.get('/trending', async (req, res) => {
  try {
    console.log('Starting trending search...');
    
    // REDUCED to 3 top patterns only (faster)
    const PATTERNS = [
        { keyword: "Travis Scott", priority: 1, type: "collab" },
        { keyword: "Off-White", priority: 2, type: "collab" },
        { keyword: "Jordan", priority: 3, type: "brand" }
    ];

    // REDUCED to 10 products per pattern (faster)
    const PRODUCTS_PER_PATTERN = 10;
    
    // REDUCED delay to 1 second (faster but still safe)
    const DELAY_MS = 1000;

    let allProducts = [];
    let completedSearches = 0;

    // Search each pattern
    for (const pattern of PATTERNS) {
        console.log(`Searching: ${pattern.keyword}...`);
        
        await new Promise((resolve) => {
            sneaks.getProducts(pattern.keyword, PRODUCTS_PER_PATTERN, function(err, products) {
                
                // Better error handling
                if (err) {
                    console.log(`Error searching ${pattern.keyword}:`, err);
                    completedSearches++;
                    if (completedSearches === PATTERNS.length) {
                        resolve();
                    }
                    return;
                }
                
                if (!products || products.length === 0) {
                    console.log(`No products found for ${pattern.keyword}`);
                    completedSearches++;
                    if (completedSearches === PATTERNS.length) {
                        resolve();
                    }
                    return;
                }
                
                products.forEach(product => {
                    // Skip if no product name
                    if (!product.shoeName) return;
                    
                    // Filter: Only sneakers (no apparel)
                    if (/(hoodie|shirt|tee|jacket|pants|shorts|socks)/i.test(product.shoeName)) {
                        return;
                    }

                    const retailPrice = parseFloat(product.retailPrice) || 0;
                    const stockxPrice = parseFloat(product.lowestResellPrice?.stockX) || 0;
                    const goatPrice = parseFloat(product.lowestResellPrice?.goat) || 0;

                    // Only keep if has prices
                    if (retailPrice > 0 && stockxPrice > 0) {
                        const priceIncrease = ((stockxPrice - retailPrice) / retailPrice * 100).toFixed(1);

                        // LOWERED threshold to 10% (get more results)
                        if (parseFloat(priceIncrease) > 10) {
                            allProducts.push({
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
                                goatUrl: product.resellLinks?.goat || '',
                                thumbnail: product.thumbnail || '',
                                fetchedAt: new Date().toISOString()
                            });
                        }
                    }
                });

                completedSearches++;
                if (completedSearches === PATTERNS.length) {
                    resolve();
                }
            });
        });

        // Shorter delay between searches
        await new Promise(r => setTimeout(r, DELAY_MS));
    }

    console.log(`Total products found: ${allProducts.length}`);

    // Remove duplicates
    const uniqueProducts = [];
    const seen = new Set();
    allProducts.forEach(product => {
        if (!seen.has(product.styleID)) {
            seen.add(product.styleID);
            uniqueProducts.push(product);
        }
    });

    // Sort by priority, then by price increase
    uniqueProducts.sort((a, b) => {
        if (a.patternPriority !== b.patternPriority) {
            return a.patternPriority - b.patternPriority;
        }
        return b.priceIncrease - a.priceIncrease;
    });

    // Take top 5 (faster response, less data)
    const top5 = uniqueProducts.slice(0, 5);

    console.log(`Returning top ${top5.length} trending sneakers`);

    // Return results
    res.json({
      success: true,
      count: top5.length,
      totalSearched: allProducts.length,
      data: top5,
      searchTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      note: 'Check Render logs for details'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Sneaker API running on port ${PORT}`);
  console.log(`📊 Optimized settings: 3 patterns, 10 products each, 1s delay`);
});
