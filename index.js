// ============================================== 
// SYSTEM 2: REPLIT API VERSION
// Your exact code wrapped in Express
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
  res.json({ status: 'API Running', endpoint: '/trending' });
});

// YOUR EXACT CODE FROM N8N
app.get('/trending', async (req, res) => {
  try {
    // Proven patterns from your research
    const PATTERNS = [
        { keyword: "Travis Scott", priority: 1, type: "collab" },
        { keyword: "Off-White", priority: 2, type: "collab" },
        { keyword: "Fragment", priority: 3, type: "collab" },
        { keyword: "Union", priority: 4, type: "collab" },
        { keyword: "Fear of God", priority: 5, type: "brand" },
        { keyword: "Vans", priority: 6, type: "brand" }
    ];

    const PRODUCTS_PER_PATTERN = 20;

    // Collect all products
    let allProducts = [];
    let completedSearches = 0;

    // Search each pattern
    for (const pattern of PATTERNS) {
        await new Promise((resolve) => {
            sneaks.getProducts(pattern.keyword, PRODUCTS_PER_PATTERN, function(err, products) {
                if (!err && products) {
                    products.forEach(product => {
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
                                    styleID: product.styleID,
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
                                    fetchedAt: new Date().toISOString()
                                });
                            }
                        }
                    });
                }

                completedSearches++;
                if (completedSearches === PATTERNS.length) {
                    resolve();
                }
            });
        });

        // 2 second delay between searches
        await new Promise(r => setTimeout(r, 2000));
    }

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

    // Take top 10 overall
    const top10 = uniqueProducts.slice(0, 10);

    // Return results (same format as n8n)
    res.json(top10);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Sneaker API running on port ${PORT}`);
});
