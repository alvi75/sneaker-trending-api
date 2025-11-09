// ============================================== 
// SYSTEM 2: ABSOLUTE MINIMUM VERSION
// 2 patterns only, 5 products each, ~5 seconds
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
    note: 'Minimum config for speed testing'
  });
});

app.get('/trending', async (req, res) => {
  try {
    console.log('🚀 Ultra-minimal search starting...');
    
    // ONLY 2 PATTERNS - Top performers only
    const PATTERNS = [
        { keyword: "Travis Scott", priority: 1 },
        { keyword: "Off-White", priority: 2 }
    ];

    const PRODUCTS_PER_PATTERN = 5;  // MINIMUM
    
    let allProducts = [];

    for (const pattern of PATTERNS) {
        console.log(`Searching: ${pattern.keyword}`);
        
        const result = await new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log(`Timeout: ${pattern.keyword}`);
                resolve([]);
            }, 10000); // 10s max per search
            
            sneaks.getProducts(pattern.keyword, PRODUCTS_PER_PATTERN, function(err, products) {
                clearTimeout(timeout);
                
                if (err || !products) {
                    console.log(`Error: ${pattern.keyword}`);
                    resolve([]);
                    return;
                }
                
                console.log(`Success: ${pattern.keyword} - ${products.length} items`);
                
                const processed = products
                    .filter(p => p.shoeName && !/(hoodie|shirt|tee)/i.test(p.shoeName))
                    .map(product => {
                        const retail = parseFloat(product.retailPrice) || 0;
                        const stockx = parseFloat(product.lowestResellPrice?.stockX) || 0;
                        
                        if (retail > 0 && stockx > 0) {
                            const increase = ((stockx - retail) / retail * 100).toFixed(1);
                            
                            if (parseFloat(increase) > 15) {
                                return {
                                    name: product.shoeName,
                                    styleID: product.styleID || 'N/A',
                                    retailPrice: retail,
                                    stockxPrice: stockx,
                                    priceIncrease: parseFloat(increase),
                                    profit: (stockx - retail).toFixed(0),
                                    matchedPattern: pattern.keyword,
                                    stockxUrl: product.resellLinks?.stockX || ''
                                };
                            }
                        }
                        return null;
                    })
                    .filter(p => p !== null);
                
                resolve(processed);
            });
        });
        
        allProducts.push(...result);
        
        // 1 second delay
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`Total products: ${allProducts.length}`);

    // Remove duplicates
    const unique = [];
    const seen = new Set();
    allProducts.forEach(p => {
        if (!seen.has(p.styleID)) {
            seen.add(p.styleID);
            unique.push(p);
        }
    });

    // Sort by price increase
    unique.sort((a, b) => b.priceIncrease - a.priceIncrease);

    // Top 5
    const top5 = unique.slice(0, 5);

    console.log(`Returning ${top5.length} items`);
    res.json(top5);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('API running on port', PORT);
  console.log('Config: 2 patterns, 5 products each');
});
