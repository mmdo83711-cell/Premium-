// Firebase কনফিগারেশন
const firebaseConfig = {
    apiKey: "AIzaSyCLVNqwyxyCRUlHJjPximCa9J_o1idn6C8",
    authDomain: "video-b71ed.firebaseapp.com",
    databaseURL: "https://video-b71ed-default-rtdb.firebaseio.com",
    projectId: "video-b71ed",
    storageBucket: "video-b71ed.firebasestorage.app",
    messagingSenderId: "641495253298",
    appId: "1:641495253298:web:805f370986d1d0e63f572b"
};

// Firebase মডিউল ইমপোর্ট
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

// Firebase ইনিশিয়ালাইজ
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// গ্লোবাল ভেরিয়েবল
let adsConfig = null;
let appsData = null;
let currentAppId = null;

// DOM এলিমেন্টস
const loadingOverlay = document.getElementById('loadingOverlay');
const interstitialOverlay = document.getElementById('interstitialOverlay');
const interstitialAd = document.getElementById('interstitialAd');

// অ্যাপ ইনিশিয়ালাইজ যখন DOM লোড হয়
document.addEventListener('DOMContentLoaded', async function() {
    showLoading();
    
    try {
        // এডস কনফিগারেশন লোড করুন
        await loadAdsConfig();
        
        // অ্যাপস ডেটা লোড করুন
        await loadAppsData();
        
        // বর্তমান পেজ অনুযায়ী ইনিশিয়ালাইজ করুন
        if (window.location.pathname.includes('details.html')) {
            initializeDetailsPage();
        } else {
            initializeHomePage();
        }
        
        // এডস লোড করুন
        loadAds();
        
    } catch (error) {
        console.error('ইনিশিয়ালাইজেশন এরর:', error);
        alert('অ্যাপ ডেটা লোড করতে ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
        hideLoading();
    }
    
    // রিফ্রেশ বাটন ইভেন্ট লিসেনার যোগ করুন
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
    }
});

// Firebase থেকে এডস কনফিগারেশন লোড
async function loadAdsConfig() {
    return new Promise((resolve, reject) => {
        const adsRef = ref(database, 'ads');
        
        onValue(adsRef, (snapshot) => {
            adsConfig = snapshot.val();
            console.log('এডস কনফিগ লোড হয়েছে:', adsConfig);
            resolve(adsConfig);
        }, (error) => {
            console.error('এডস কনফিগ লোড করতে এরর:', error);
            reject(error);
        });
    });
}

// Firebase থেকে অ্যাপস ডেটা লোড
async function loadAppsData() {
    return new Promise((resolve, reject) => {
        const appsRef = ref(database, 'apps');
        
        onValue(appsRef, (snapshot) => {
            appsData = snapshot.val();
            console.log('অ্যাপস ডেটা লোড হয়েছে:', appsData);
            resolve(appsData);
        }, (error) => {
            console.error('অ্যাপস ডেটা লোড করতে এরর:', error);
            reject(error);
        });
    });
}

// ডাইনামিকভাবে এডস লোড এবং প্রদর্শন
function loadAds() {
    if (!adsConfig || !adsConfig.enabled) {
        console.log('এডস গ্লোবালি ডিজেবল করা আছে');
        return;
    }
    
    // ব্যানার এড লোড করুন যদি ইনেবল থাকে
    if (adsConfig.banner && adsConfig.banner.enabled && adsConfig.banner.script) {
        loadAdScript('bannerAd', adsConfig.banner.script);
    }
    
    // নেটিভ ব্যানার এড লোড করুন যদি ইনেবল থাকে
    if (adsConfig.native && adsConfig.native.enabled && adsConfig.native.script) {
        loadAdScript('nativeBannerAd', adsConfig.native.script);
    }
    
    // সোশ্যাল বার এড লোড করুন যদি ইনেবল থাকে
    if (adsConfig.socialBar && adsConfig.socialBar.enabled && adsConfig.socialBar.script) {
        loadAdScript('socialBarAd', adsConfig.socialBar.script);
    }
}

// এড স্ক্রিপ্ট কন্টেইনারে লোড করুন
function loadAdScript(containerId, scriptContent) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // পূর্বের কনটেন্ট ক্লিয়ার করুন
    container.innerHTML = '';
    
    // স্ক্রিপ্ট এলিমেন্ট তৈরি করুন
    const scriptElement = document.createElement('div');
    scriptElement.innerHTML = scriptContent;
    
    // কন্টেইনারে অ্যাপেন্ড করুন
    container.appendChild(scriptElement);
    
    // কনটেন্টের ভিতরের স্ক্রিপ্ট এক্সিকিউট করুন
    const scripts = scriptElement.getElementsByTagName('script');
    for (let script of scripts) {
        const newScript = document.createElement('script');
        if (script.src) {
            newScript.src = script.src;
        } else {
            newScript.textContent = script.textContent;
        }
        document.body.appendChild(newScript);
    }
}

// হোম পেজ ইনিশিয়ালাইজ
function initializeHomePage() {
    const appsGrid = document.getElementById('appsGrid');
    if (!appsGrid || !appsData) return;
    
    appsGrid.innerHTML = '';
    
    // অ্যাপস ডেটা অবজেক্ট থেকে অ্যারে করুন এবং সর্ট করুন
    const appsArray = Object.entries(appsData || {}).map(([id, app]) => ({
        id,
        ...app
    })).sort((a, b) => a.order - b.order);
    
    // অ্যাপ কার্ড তৈরি করুন
    appsArray.forEach(app => {
        const appCard = createAppCard(app);
        appsGrid.appendChild(appCard);
    });
}

// অ্যাপ কার্ড এলিমেন্ট তৈরি করুন
function createAppCard(app) {
    const card = document.createElement('div');
    card.className = 'app-card';
    card.dataset.appId = app.id;
    
    card.innerHTML = `
        <div class="app-thumbnail">
            <i class="${app.icon || 'fas fa-mobile-alt'}"></i>
        </div>
        <div class="app-info">
            <div class="app-header">
                <h3 class="app-name">${app.name}</h3>
                ${app.premium ? '<span class="premium-badge">প্রিমিয়াম</span>' : ''}
            </div>
            <p class="app-description">${app.shortDescription || app.description || 'প্রিমিয়াম অ্যান্ড্রয়েড অ্যাপ্লিকেশন'}</p>
            <div class="app-meta">
                <span><i class="fas fa-code-branch"></i> v${app.version || '1.0'}</span>
                <span><i class="fas fa-sd-card"></i> ${app.size || '10MB'}</span>
                <span><i class="fas fa-download"></i> ${app.downloads || '1K+'}</span>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        window.location.href = `details.html?id=${app.id}`;
    });
    
    return card;
}

// ডিটেইলস পেজ ইনিশিয়ালাইজ
function initializeDetailsPage() {
    // URL থেকে অ্যাপ আইডি নিন
    const urlParams = new URLSearchParams(window.location.search);
    currentAppId = urlParams.get('id');
    
    if (!currentAppId || !appsData || !appsData[currentAppId]) {
        document.getElementById('appDetails').innerHTML = `
            <div class="error-message" style="text-align: center; padding: 40px;">
                <h2 style="color: var(--danger-color);">অ্যাপ খুঁজে পাওয়া যায়নি</h2>
                <p style="margin: 20px 0;">আপনার চাহিত অ্যাপটি খুঁজে পাওয়া যায়নি।</p>
                <button onclick="window.history.back()" style="background: var(--primary-color); color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    ফিরে যান
                </button>
            </div>
        `;
        return;
    }
    
    const app = appsData[currentAppId];
    displayAppDetails(app);
}

// অ্যাপ ডিটেইলস প্রদর্শন
function displayAppDetails(app) {
    const appDetails = document.getElementById('appDetails');
    const downloadCard = document.getElementById('downloadCard');
    
    if (!appDetails || !downloadCard) return;
    
    // অ্যাপ ডিটেইলস কনটেন্ট
    appDetails.innerHTML = `
        <div class="app-details-header">
            <div class="details-thumbnail">
                <i class="${app.icon || 'fas fa-mobile-alt'}"></i>
            </div>
            <h2 class="details-title">${app.name}</h2>
            <p>${app.category || 'প্রোডাক্টিভিটি'} • v${app.version || '1.0'}</p>
        </div>
        <div class="app-details-body">
            <p class="details-description">${app.description || 'অ্যাডভান্স ফিচারসহ প্রিমিয়াম অ্যান্ড্রয়েড অ্যাপ্লিকেশন।'}</p>
            <div class="details-meta">
                <div class="meta-item">
                    <i class="fas fa-sd-card"></i>
                    <div>
                        <div class="meta-label">আকার</div>
                        <div>${app.size || '10MB'}</div>
                    </div>
                </div>
                <div class="meta-item">
                    <i class="fas fa-code-branch"></i>
                    <div>
                        <div class="meta-label">ভার্সন</div>
                        <div>${app.version || '1.0'}</div>
                    </div>
                </div>
                <div class="meta-item">
                    <i class="fas fa-calendar"></i>
                    <div>
                        <div class="meta-label">সর্বশেষ আপডেট</div>
                        <div>${app.lastUpdated || 'সাম্প্রতিক'}</div>
                    </div>
                </div>
                <div class="meta-item">
                    <i class="fas fa-download"></i>
                    <div>
                        <div class="meta-label">ডাউনলোড</div>
                        <div>${app.downloads || '1K+'}</div>
                    </div>
                </div>
                <div class="meta-item">
                    <i class="fas fa-star"></i>
                    <div>
                        <div class="meta-label">রেটিং</div>
                        <div>${app.rating || '4.5'}/5</div>
                    </div>
                </div>
                <div class="meta-item">
                    <i class="fas fa-user"></i>
                    <div>
                        <div class="meta-label">ডেভেলপার</div>
                        <div>${app.developer || 'প্রিমিয়াম ডেভ'}</div>
                    </div>
                </div>
            </div>
            
            <h3 style="margin-top: 30px; margin-bottom: 15px;">ফিচারসমূহ</h3>
            <ul class="features-list">
                ${(app.features || ['প্রিমিয়াম ফিচারসমূহ', 'বিজ্ঞাপন মুক্ত', 'নিয়মিত আপডেট', 'প্রিমিয়াম সাপোর্ট'])
                    .map(feature => `<li><i class="fas fa-check-circle"></i> ${feature}</li>`)
                    .join('')}
            </ul>
        </div>
    `;
    
    // ডাউনলোড কার্ড কনটেন্ট
    const isLocked = app.locked || false;
    downloadCard.innerHTML = `
        <div class="download-status">
            <span class="status-badge ${isLocked ? 'status-locked' : 'status-unlocked'}">
                ${isLocked ? '🔒 লক করা আছে' : '🔓 আনলক করা আছে'}
            </span>
        </div>
        <p>${isLocked ? 'এই অ্যাপটি বর্তমানে অ্যাডমিন দ্বারা লক করা আছে' : 'এই প্রিমিয়াম অ্যাপটি ডাউনলোড করতে নিচের বাটনে ক্লিক করুন'}</p>
        <button class="download-btn" onclick="handleDownload('${currentAppId}')" ${isLocked ? 'disabled' : ''}>
            <i class="fas fa-download"></i> ডাউনলোড করুন
        </button>
        <p class="download-size">ফাইল সাইজ: ${app.size || '10MB'}</p>
    `;
}

// ডাউনলোড বাটন ক্লিক হ্যান্ডেল
function handleDownload(appId) {
    if (!appId || !appsData || !appsData[appId]) {
        alert('অ্যাপটি খুঁজে পাওয়া যায়নি!');
        return;
    }
    
    const app = appsData[appId];
    
    if (app.locked) {
        alert('এই অ্যাপটি বর্তমানে অ্যাডমিন দ্বারা লক করা আছে।');
        return;
    }
    
    // ইন্টারস্টিশিয়াল এড দেখান যদি ইনেবল থাকে
    if (adsConfig && adsConfig.enabled && adsConfig.interstitial && 
        adsConfig.interstitial.enabled && adsConfig.interstitial.script) {
        
        showInterstitialAd(() => {
            // এডের পর ডাউনলোড সম্পন্ন করুন
            completeDownload(app);
        });
    } else {
        // এড ছাড়াই সরাসরি ডাউনলোড
        completeDownload(app);
    }
}

// ইন্টারস্টিশিয়াল এড দেখান
function showInterstitialAd(onComplete) {
    if (!adsConfig.interstitial.script) {
        onComplete();
        return;
    }
    
    // পূর্বের ইন্টারস্টিশিয়াল ক্লিয়ার করুন
    interstitialAd.innerHTML = '';
    
    // এড স্ক্রিপ্ট লোড করুন
    const scriptElement = document.createElement('div');
    scriptElement.innerHTML = adsConfig.interstitial.script;
    interstitialAd.appendChild(scriptElement);
    
    // স্ক্রিপ্ট এক্সিকিউট করুন
    const scripts = scriptElement.getElementsByTagName('script');
    for (let script of scripts) {
        const newScript = document.createElement('script');
        if (script.src) {
            newScript.src = script.src;
        } else {
            newScript.textContent = script.textContent;
        }
        document.body.appendChild(newScript);
    }
    
    // ওভারলে দেখান
    interstitialOverlay.style.display = 'flex';
    
    // অটো-ক্লোজ টাইমআউট সেট করুন (১৫ সেকেন্ড)
    setTimeout(() => {
        if (interstitialOverlay.style.display === 'flex') {
            closeInterstitial();
            onComplete();
        }
    }, 15000);
}

// ইন্টারস্টিশিয়াল এড বন্ধ করুন
function closeInterstitial() {
    interstitialOverlay.style.display = 'none';
}

// ডাউনলোড প্রক্রিয়া সম্পন্ন করুন
function completeDownload(app) {
    // ডাউনলোড লিংক তৈরি করুন
    const downloadUrl = app.downloadUrl || '#';
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${app.name.replace(/\s+/g, '_')}.apk`;
    link.target = '_blank';
    link.click();
    
    // সফল বার্তা দেখান
    alert(`${app.name} ডাউনলোড হচ্ছে...\nডাউনলোড স্বয়ংক্রিয়ভাবে শুরু না হলে আপনার ব্রাউজারের ডাউনলোড ম্যানেজার চেক করুন।`);
}

// ডেটা রিফ্রেশ
function refreshData() {
    showLoading();
    
    // সব ডেটা রিলোড করুন
    Promise.all([loadAdsConfig(), loadAppsData()])
        .then(() => {
            if (window.location.pathname.includes('details.html')) {
                initializeDetailsPage();
            } else {
                initializeHomePage();
            }
            loadAds();
        })
        .catch(error => {
            console.error('ডেটা রিফ্রেশ করতে এরর:', error);
            alert('ডেটা রিফ্রেশ করতে ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।');
        })
        .finally(() => {
            hideLoading();
        });
}

// ইউটিলিটি ফাংশন
function showLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// HTML onclick হ্যান্ডলারদের জন্য ফাংশন এক্সপোর্ট
window.closeInterstitial = closeInterstitial;
window.handleDownload = handleDownload;