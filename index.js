// ============================================== 
// SYSTEM 2: PRODUCTION VERSION
// Full 6 patterns optimized for speed
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
    endpoint: '/trending',
    note: 'Searches 6 high-value patterns, returns top 10 trending sneakers'
  });
});

// FULL TRENDING ENDPOINT
app.get('/trending', async (req, res) => {
  try {
    console.log('🚀 Starting trending search...');
    
    // All 6 proven patterns from your research
    const PATTERNS = [
        { keyword: "Travis Scott", priority: 1, type: "collab" },
        { keyword: "Off-White", priority: 2, type: "collab" },
        { keyword: "Fragment", priority: 3, type: "collab" },
        { keyword: "Union", priority: 4, type: "collab" },
        { keyword: "Fear of God", priority: 5, type: "brand" },
        { keyword: "Vans", priority: 6, type: "brand" }
    ];

    const PRODUCTS_PER_PATTERN = 15;  // Good balance of speed vs results
    let allProducts = [];
    let completedSearches = 0;

    for (const pattern of PATTERNS) {
        console.log(`🔎 Searching: ${pattern.keyword}...`);
        
        await new Promise((resolve) => {
            sneaks.getProducts(pattern.keyword, PRODUCTS_PER_PATTERN, function(err, products) {
                
                if (err) {
                    console.log(`❌ Error for ${pattern.keyword}`);
                    completedSearches++;
                    if (completedSearches === PATTERNS.length) {
                        resolve();
                    }
                    return;
                }
                
                if (!products || products.length === 0) {
                    console.log(`⚠️ No products for ${pattern.keyword}`);
                    completedSearches++;
                    if (completedSearches === PATTERNS.length) {
                        resolve();
                    }
                    return;
                }
                
                products.forEach(product => {
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

                        // Only keep if trending (>15% increase)
                        if (parseFloat(priceIncrease) > 15) {
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

        // 1.5 second delay between searches (faster but safe)
        await new Promise(r => setTimeout(r, 1500));
    }

    console.log(`📊 Total products found: ${allProducts.length}`);

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

    // Take top 10
    const top10 = uniqueProducts.slice(0, 10);

    console.log(`✅ Returning top ${top10.length} trending sneakers`);

    // Return results (same format as your n8n script)
    res.json(top10);

  } catch (error) {
    console.error('💥 Error:', error);
    res.status(500).json({ 
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Sneaker API running on port ${PORT}`);
  console.log(`📊 Config: 6 patterns, 15 products each, 1.5s delay`);
  console.log(`⏱️ Expected response time: ~15-20 seconds`);
});
