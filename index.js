// ============================================== 
// SNEAKER INVESTMENT API - BUSINESS FOCUSED
// Prioritizes highest ROI collaborations
// Based on 2748 product analysis
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
    status: 'Sneaker Investment API - Live',
    endpoint: '/trending',
    strategy: 'Focus on high-ROI collabs + top brands',
    successRate: '47.9% for collaborations',
    avgReturn: '+37.7% for collabs, +20.5% Fear of God, +16.8% Vans'
  });
});

app.get('/trending', async (req, res) => {
  try {
    console.log('🚀 Investment opportunity search starting...');
    const startTime = Date.now();
    
    // INVESTMENT-FOCUSED PATTERNS
    // Priority based on success rate & ROI from your data
    const PATTERNS = [
        { keyword: "Travis Scott", priority: 1, type: "collab", avgROI: 37.7, successRate: 47.9 },
        { keyword: "Off-White", priority: 2, type: "collab", avgROI: 37.7, successRate: 47.9 },
        { keyword: "Fragment", priority: 3, type: "collab", avgROI: 37.7, successRate: 47.9 },
        { keyword: "Union", priority: 4, type: "collab", avgROI: 37.7, successRate: 47.9 },
        { keyword: "Fear of God", priority: 5, type: "brand", avgROI: 20.5, successRate: 28.7 }
    ];

    const PRODUCTS_PER_PATTERN = 8;
    
    let allProducts = [];

    for (const pattern of PATTERNS) {
        console.log(`🔎 ${pattern.keyword} (${pattern.type}, avg +${pattern.avgROI}%)...`);
        
        const result = await new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log(`⏱️ Timeout: ${pattern.keyword}`);
                resolve([]);
            }, 12000);
            
            sneaks.getProducts(pattern.keyword, PRODUCTS_PER_PATTERN, function(err, products) {
                clearTimeout(timeout);
                
                if (err || !products) {
                    console.log(`❌ Error: ${pattern.keyword}`);
                    resolve([]);
                    return;
                }
                
                console.log(`✅ ${pattern.keyword}: ${products.length} found`);
                
                const processed = products
                    .filter(p => p.shoeName && !/(hoodie|shirt|tee|jacket|pants|shorts|socks)/i.test(p.shoeName))
                    .map(product => {
                        const retail = parseFloat(product.retailPrice) || 0;
                        const stockx = parseFloat(product.lowestResellPrice?.stockX) || 0;
                        const goat = parseFloat(product.lowestResellPrice?.goat) || 0;
                        
                        if (retail > 0 && stockx > 0) {
                            const increase = ((stockx - retail) / retail * 100).toFixed(1);
                            
                            // INVESTMENT CRITERIA: 20%+ increase (above average)
                            if (parseFloat(increase) > 20) {
                                return {
                                    name: product.shoeName,
                                    styleID: product.styleID || 'N/A',
                                    brand: product.brand || 'N/A',
                                    retailPrice: retail,
                                    stockxPrice: stockx,
                                    goatPrice: goat,
                                    priceIncrease: parseFloat(increase),
                                    profit: (stockx - retail).toFixed(0),
                                    matchedPattern: pattern.keyword,
                                    patternType: pattern.type,
                                    priority: pattern.priority,
                                    expectedAvgROI: pattern.avgROI,
                                    patternSuccessRate: pattern.successRate,
                                    investmentGrade: getInvestmentGrade(parseFloat(increase), pattern.type),
                                    stockxUrl: product.resellLinks?.stockX || '',
                                    goatUrl: product.resellLinks?.goat || '',
                                    thumbnail: product.thumbnail || ''
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
        await new Promise(r => setTimeout(r, 1000));
    }

    const searchTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`📊 Total: ${allProducts.length} opportunities in ${searchTime}s`);

    // Remove duplicates
    const unique = [];
    const seen = new Set();
    allProducts.forEach(p => {
        if (!seen.has(p.styleID)) {
            seen.add(p.styleID);
            unique.push(p);
        }
    });

    // SMART SORTING FOR INVESTMENT
    // 1. Collaborations ALWAYS first (highest success rate)
    // 2. Within collabs, sort by price increase
    // 3. Then brands
    unique.sort((a, b) => {
        // Collabs beat brands
        if (a.patternType === 'collab' && b.patternType !== 'collab') return -1;
        if (b.patternType === 'collab' && a.patternType !== 'collab') return 1;
        
        // Within same type, highest increase first
        return b.priceIncrease - a.priceIncrease;
    });

    // Top 10 investment opportunities
    const top10 = unique.slice(0, 10);

    // Calculate investment summary
    const collabCount = top10.filter(p => p.patternType === 'collab').length;
    const avgIncrease = (top10.reduce((sum, p) => sum + p.priceIncrease, 0) / top10.length).toFixed(1);
    const totalPotentialProfit = top10.reduce((sum, p) => sum + parseFloat(p.profit), 0);

    console.log(`✅ Returning ${top10.length} investments (${collabCount} collabs)`);

    res.json({
        success: true,
        investmentOpportunities: top10,
        summary: {
            totalOpportunities: top10.length,
            collaborations: collabCount,
            brands: top10.length - collabCount,
            avgPriceIncrease: `+${avgIncrease}%`,
            totalPotentialProfit: `$${totalPotentialProfit.toFixed(0)}`,
            searchTime: `${searchTime}s`
        }
    });

  } catch (error) {
    console.error('💥 Error:', error);
    res.status(500).json({ 
      error: error.message
    });
  }
});

// Investment grade based on increase and type
function getInvestmentGrade(increase, type) {
    if (type === 'collab') {
        if (increase > 100) return 'A+ (Hot Collab)';
        if (increase > 50) return 'A (Strong Collab)';
        if (increase > 30) return 'B+ (Good Collab)';
        return 'B (Decent Collab)';
    } else {
        if (increase > 50) return 'A (Exceptional Brand)';
        if (increase > 30) return 'B+ (Strong Brand)';
        if (increase > 20) return 'B (Good Brand)';
        return 'C (Average)';
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Sneaker Investment API running on port ${PORT}`);
  console.log(`💼 Business Focus: High-ROI collaborations + top brands`);
  console.log(`📊 Config: 5 patterns, 8 products each, 20%+ threshold`);
  console.log(`⏱️ Expected: ~12-15s response`);
});
