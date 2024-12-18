const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const axios = require('axios');
require("dotenv").config()


const API_KEY = process.env.CAPTCHA; 
(async () => {
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    console.log( "starting a new window")
    let counter = 0
    // Set anti-bot measures
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 }); // Set a realistic viewport size

    await page.evaluateOnNewDocument(() => {
        // Remove `navigator.webdriver`
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    while (true){
        await page.goto('https://www.amazon.com',{ waitUntil: 'domcontentloaded', timeout: 0 });
        const randomTimeToSearch = Math.floor(Math.random() * (15000 - 5000 + 1)) + 0;
        const randomTimeToClick = Math.floor(Math.random() * (15000 - 5000 + 1)) + 0;
        const randomTimeToStay = Math.floor(Math.random() * (15000 - 5000 + 1)) + 0;
        const searchTerms = [
            "ice cream scoop",
            "ripple double coffee cups",
            "ice cream bowls",
            "portion scoops",
            "disposable chicken boxes",
            "double wall coffee cups",
            "moderna plates",
            "gable boxes",
            "restaurantware baking pan",
            "restaurant fry pans",
            "restaurantware fry pans"
        ]
    
        const randomSearchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        // Go to Amazon homepage
        
        const captchaExists = await isCaptchaPresent(page);
        if (captchaExists) {
            console.log("reCAPTCHA found on the page!");
            const siteKey = await page.evaluate(() => {
                const iframe = document.querySelector('iframe[src^="https://www.google.com/recaptcha/"]');
                if (iframe) {
                    const iframeSrc = iframe.getAttribute('src');
                    const siteKeyMatch = iframeSrc.match(/sitekey=([a-zA-Z0-9_-]+)/);
                    return siteKeyMatch ? siteKeyMatch[1] : null;
                }
                return null;
            });
            if (siteKey) {
                console.log("reCAPTCHA site key:", siteKey);
    
                // Solve the CAPTCHA using 2Captcha
                const captchaSolution = await solveCaptcha(siteKey, page.url());
                console.log("Captcha solution received:", captchaSolution);
    
                // Enter the CAPTCHA solution into the form
                await page.evaluate((captchaSolution) => {
                    document.querySelector('textarea[name="g-recaptcha-response"]').value = captchaSolution;
                    document.querySelector('form').submit(); // Submit the form
                });
    
                console.log("Submitted the reCAPTCHA solution!");
            } else {
                console.log("No reCAPTCHA site key found.");
            }
            // Handle the CAPTCHA here (e.g., solve it using 2Captcha or free alternative)
            // Or do some other logic to handle CAPTCHA
        } else {
            console.log("No reCAPTCHA found on the page.");
        }
    

        await page.waitForSelector('#twotabsearchtextbox');
        if (page.waitForSelector('#twotabsearchtextbox')) {
            console.log("waiting for time to search ...... ", randomTimeToSearch/1000);
            await pause(randomTimeToSearch)
            console.log("search term ..... ", randomSearchTerm)
            await page.type('#twotabsearchtextbox', randomSearchTerm);
            await page.keyboard.press('Enter');
            
            // Wait for search results to load
            await page.waitForSelector('.s-card-container');
            await autoScroll(page);
        
            // Get a list of sponsored items and click the one starting with "Restaurantware"
            const sponsoredLinks = await page.$$('.s-featured-result-item .a-section');
            
        
            for (const link of sponsoredLinks) {
                const isSponsored = await link.$('.a-declarative');
        
        
                if (isSponsored) {
                    console.log ("found some sponsored links.... ")
                    const titleElement = await link.$('h2 span');
                    const titleElementAlt = await link.$('a h2 span');
                    if (titleElement || titleElementAlt) {
                        const title = await page.evaluate(el => el.textContent.trim(), titleElement);
                        const titleAlt = await page.evaluate(el => el.textContent.trim(), titleElementAlt);
                        console.log("Sponsored item title:", title);
                        if (title) {
                            if (title.includes("Restaurantware") || title.includes('Coppetta') || title.includes('Met Lux') || title.includes('Bio Tek')) {
                                console.log ("found some Restaurantware sponsored ads .....")
                                console.log("waiting for time to click .... ", randomTimeToClick/1000);
                                await pause(randomTimeToClick)
                                await page.mouse.move(50, 50); 
                                await titleElement.click();
                                counter = counter + 1
                                console.log('Navigated to sponsored Restaurantware listing.');
                                console.log("counter .... ", counter)
                                console.log("title ....", title)
                                console.log("waiting on the page ... ", randomTimeToStay/1000);
                                await pause(randomTimeToStay)
                                await page.mouse.move(50, 50); 
                                break
                            }
                        } else if (titleElementAlt) {
                            if (titleAlt.includes("Restaurantware") || titleAlt.includes('Coppetta') || titleAlt.includes('Met Lux') || titleAlt.includes('Bio Tek')) {
                                console.log ("found some Restaurantware sponsored ads .....")
                                console.log("waiting for time to click .... ", randomTimeToClick/1000);
                                await pause(randomTimeToClick)
                                await page.mouse.move(50, 50); 
                                await titleElementAlt.click();
                                counter = counter + 1
                                console.log('Navigated to sponsored Restaurantware listing.');
                                console.log("counter .... ", counter)
                                console.log("title ....", titleAlt)
                                console.log("waiting on the page ... ", randomTimeToStay/1000);
                                await pause(randomTimeToStay)
                                await page.mouse.move(50, 50); 
                                break
                            }
                        }
                    }
                }
            }
        }
    }

    // await browser.close();
})();


const pause = function (ms) {
    return new Promise (resolve => setTimeout(resolve, ms))
}

// Auto scroll function
const autoScroll = async (page) => {
    // await page.evaluate(async () => {
    //     await new Promise((resolve) => {
    //         let totalHeight = 0;
    //         const distance = 100;
    //         const timer = setInterval(() => {
    //             const scrollHeight = document.body.scrollHeight;
    //             window.scrollBy(0, distance);
    //             totalHeight += distance;
    //             if (totalHeight >= scrollHeight) {
    //                 clearInterval(timer);
    //                 resolve();
    //             }
    //         }, 100);
    //     });
    // });
};

async function isCaptchaPresent(page) {
    const captchaIframe = await page.$('iframe[src^="https://www.google.com/recaptcha/"]');
    return captchaIframe !== null;
}

// Function to solve CAPTCHA using 2Captcha
async function solveCaptcha(captchaSiteKey, pageUrl) {
    console.log("Sending CAPTCHA solving request to 2Captcha...");

    // Step 1: Send a request to 2Captcha to solve the CAPTCHA
    const captchaRequest = `https://2captcha.com/in.php?key=${API_KEY}&method=userrecaptcha&googlekey=${captchaSiteKey}&pageurl=${pageUrl}&json=1`;
    const response = await axios.get(captchaRequest);
    const captchaId = response.data.request; // Task ID for the CAPTCHA

    console.log("2Captcha task created. Task ID:", captchaId);

    // Step 2: Poll for the CAPTCHA solution
    let solution = null;
    while (!solution) {
        console.log("Waiting for CAPTCHA solution...");
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before polling again

        const resultRequest = `https://2captcha.com/res.php?key=${API_KEY}&action=get&id=${captchaId}&json=1`;
        const resultResponse = await axios.get(resultRequest);

        if (resultResponse.data.status === 1) {
            solution = resultResponse.data.request; // CAPTCHA solution
        }
    }

    console.log("CAPTCHA solved. Solution:", solution);
    return solution;
}