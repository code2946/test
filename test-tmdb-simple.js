// Simple test for TMDB API endpoints
const https = require('https');

const TMDB_ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyNGRiZWYzOTRmOTAzNGMwM2ViNmM5M2E4ZjA0M2MwNSIsIm5iZiI6MTc1MjkzMTUwOS44MzMsInN1YiI6IjY4N2I5Y2I1ZGZmMDA4MWRhYzcyYzI1YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.RmEVeq7ssiU0LSkUj9ihGMySUeS3y3CbeKs_00BCsi4";

function testEndpoint(path, description) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'api.themoviedb.org',
            port: 443,
            path: `/3${path}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    console.log(`✅ ${description}: SUCCESS`);
                    console.log(`   Status: ${res.statusCode}`);
                    
                    if (jsonData.results) {
                        console.log(`   Results: ${jsonData.results.length} items`);
                        if (jsonData.results[0]) {
                            console.log(`   First item: ${jsonData.results[0].title || jsonData.results[0].name || 'No title'}`);
                        }
                    } else if (jsonData.genres) {
                        console.log(`   Genres: ${jsonData.genres.length} items`);
                    } else {
                        console.log(`   Data keys: ${Object.keys(jsonData).join(', ')}`);
                    }
                    
                    resolve(true);
                } catch (error) {
                    console.log(`❌ ${description}: JSON Parse Error`);
                    console.log(`   Raw response: ${data.substring(0, 200)}...`);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log(`❌ ${description}: Network Error`);
            console.log(`   Error: ${error.message}`);
            resolve(false);
        });

        req.setTimeout(10000, () => {
            console.log(`❌ ${description}: Timeout`);
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

async function runTests() {
    console.log('🚀 Testing TMDB API endpoints...\n');
    
    const tests = [
        ['/genre/movie/list?language=en-US', 'Movie Genres'],
        ['/movie/popular?page=1', 'Popular Movies'],
        ['/movie/top_rated?page=1', 'Top Rated Movies'],
        ['/search/movie?query=batman&page=1', 'Movie Search'],
        ['/discover/movie?sort_by=popularity.desc&page=1', 'Discover Movies']
    ];
    
    for (const [path, description] of tests) {
        await testEndpoint(path, description);
        console.log(''); // Empty line for readability
    }
    
    console.log('✅ TMDB API tests completed!');
}

runTests();