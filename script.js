// --- 1. CONFIG & UTILS ---

// --- API KEY KONFIGURASI (TERTANAM) ---
const AI_CONFIG = {
    API_KEY: "AIzaSyChkUo1qt4epG77LXbLFy0mDp3SS85PMOk", 
    MODEL_NAME: "gemini-2.5-flash-preview-09-2025" 
};

const dSin = (d) => Math.sin(d * (Math.PI / 180));
const dCos = (d) => Math.cos(d * (Math.PI / 180));
const dTan = (d) => Math.tan(d * (Math.PI / 180));
const dLog = (x) => Math.log10(x);
const dSqrt = (x) => Math.sqrt(x);

let historyLog = [];
let currentInput = '0';
let isResultState = false; 

// UI Refs (Calc)
const display = document.getElementById('calc-display');
const previewEl = document.getElementById('live-preview');
const historyList = document.getElementById('history-list');
const historyOverlay = document.getElementById('history-overlay');

// UI Refs (AI)
const chatContainer = document.getElementById('chatContainer');
const promptInput = document.getElementById('promptInput');
const loadingIndicator = document.getElementById('loadingIndicator');
const welcomeMsg = document.getElementById('welcomeMsg');

// --- 2. TAB SWITCHING LOGIC ---
function switchTab(tab) {
    const calcView = document.getElementById('calculator-view');
    const convView = document.getElementById('converter-view');
    const aiView = document.getElementById('ai-view');
    
    const tabCalc = document.getElementById('tab-calc');
    const tabConv = document.getElementById('tab-conv');
    const tabAi = document.getElementById('tab-ai');

    // Reset classes
    const activeClass = "flex-1 py-4 text-center font-semibold text-emerald-400 border-b-2 border-emerald-400 transition-all bg-slate-800/50";
    const inactiveClass = "flex-1 py-4 text-center font-semibold text-slate-400 border-b-2 border-transparent transition-all hover:bg-slate-700/50";
    const activeAiClass = "flex-1 py-4 text-center font-semibold text-purple-400 border-b-2 border-purple-400 transition-all bg-slate-800/50";

    calcView.classList.add('hidden');
    convView.classList.add('hidden');
    aiView.classList.add('hidden');
    
    tabCalc.className = inactiveClass;
    tabConv.className = inactiveClass;
    tabAi.className = inactiveClass;

    document.getElementById('history-overlay').classList.remove('history-open');
    document.getElementById('history-overlay').classList.add('history-closed');

    if (tab === 'calculator') {
        calcView.classList.remove('hidden');
        tabCalc.className = activeClass;
    } else if (tab === 'converter') {
        convView.classList.remove('hidden');
        tabConv.className = activeClass;
        updateUnits();
    } else if (tab === 'ai') {
        aiView.classList.remove('hidden');
        tabAi.className = activeAiClass;
    }
}


// --- 3. CALCULATOR LOGIC (UNTOUCHED) ---
function toggleHistory() {
    if (historyOverlay.classList.contains('history-closed')) {
        historyOverlay.classList.remove('history-closed');
        historyOverlay.classList.add('history-open');
        renderHistory();
    } else {
        historyOverlay.classList.remove('history-open');
        historyOverlay.classList.add('history-closed');
    }
}
function saveToHistory(expression, result) {
    historyLog.unshift({ expression: expression, result: result });
    if (historyLog.length > 20) historyLog.pop();
    renderHistory();
}
function clearHistory() { historyLog = []; renderHistory(); }
function insertFromHistory(value, type) {
    value = value.toString();
    if (isResultState) { currentInput = value; isResultState = false; } 
    else { if (currentInput === '0') currentInput = value; else currentInput += value; }
    updateDisplay();
    toggleHistory();
}
function renderHistory() {
    historyList.innerHTML = '';
    if (historyLog.length === 0) { historyList.innerHTML = '<div class="text-center text-slate-600 text-xs mt-10 italic">Belum ada riwayat</div>'; return; }
    historyLog.forEach(item => {
        const div = document.createElement('div');
        div.className = "bg-slate-800/50 rounded-lg p-3 border border-slate-700 hover:bg-slate-800 transition-colors";
        div.innerHTML = `
            <div onclick="insertFromHistory('${item.expression.replace(/'/g, "\\'")}', 'expr')" class="text-xs text-slate-400 mb-1 cursor-pointer hover:text-white break-all text-right border-b border-slate-700/50 pb-1">${item.expression}</div>
            <div onclick="insertFromHistory('${item.result}', 'res')" class="text-lg text-emerald-400 font-bold cursor-pointer hover:text-emerald-300 text-right">= ${item.result}</div>
        `;
        historyList.appendChild(div);
    });
}
function updateDisplay() {
    display.innerText = currentInput === '' ? '0' : currentInput;
    display.scrollLeft = display.scrollWidth;
    updateLivePreview();
}
function updateLivePreview() {
    if (isResultState || currentInput === '0' || currentInput === '') { previewEl.innerText = ''; return; }
    try {
        let raw = currentInput.replace(/%/g, '/100');
        const open = (raw.match(/\(/g) || []).length, close = (raw.match(/\)/g) || []).length;
        if (open > close) raw += ')'.repeat(open - close);
        let evalStr = raw.replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**').replace(/sin\(/g, 'dSin(').replace(/cos\(/g, 'dCos(').replace(/tan\(/g, 'dTan(').replace(/log\(/g, 'dLog(').replace(/sqrt\(/g, 'dSqrt(');
        const res = new Function('dSin','dCos','dTan','dLog','dSqrt', 'return ' + evalStr)(dSin,dCos,dTan,dLog,dSqrt);
        if (isFinite(res) && !isNaN(res)) previewEl.innerText = '= ' + parseFloat(res.toFixed(8));
        else previewEl.innerText = '';
    } catch (e) { previewEl.innerText = ''; }
}
function appendValue(val) {
    if (isResultState) {
        if (['+', '-', '*', '/', '%', '^'].includes(val)) isResultState = false; 
        else { currentInput = ''; isResultState = false; }
    }
    if (currentInput === '0' && val !== '.') currentInput = val; else currentInput += val;
    updateDisplay();
}
function appendFunction(funcName) {
    if (isResultState) { isResultState = false; currentInput = ''; }
    if (currentInput === '0') currentInput = '';
    currentInput += funcName;
    updateDisplay();
}
function backspace() {
    if (isResultState) { clearDisplay(); return; }
    if (currentInput.length > 0) { currentInput = currentInput.slice(0, -1); if (currentInput === '') currentInput = '0'; }
    updateDisplay();
}
function clearDisplay() { currentInput = '0'; isResultState = false; previewEl.innerText = ''; updateDisplay(); }
function calculate() {
    try {
        let raw = currentInput.replace(/%/g, '/100');
        const open = (raw.match(/\(/g) || []).length, close = (raw.match(/\)/g) || []).length;
        if (open > close) raw += ')'.repeat(open - close);
        let evalStr = raw.replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**').replace(/sin\(/g, 'dSin(').replace(/cos\(/g, 'dCos(').replace(/tan\(/g, 'dTan(').replace(/log\(/g, 'dLog(').replace(/sqrt\(/g, 'dSqrt(');
        const res = new Function('dSin','dCos','dTan','dLog','dSqrt', 'return ' + evalStr)(dSin,dCos,dTan,dLog,dSqrt);
        if (!isFinite(res) || isNaN(res)) throw new Error("Error");
        let fin = parseFloat(res.toFixed(10)).toString();
        saveToHistory(currentInput, fin);
        currentInput = fin; isResultState = true; previewEl.innerText = ''; display.innerText = currentInput;
    } catch (e) { const old = currentInput; currentInput = "Error"; display.innerText = currentInput; setTimeout(() => { currentInput = old; updateDisplay(); }, 1000); }
}
function toggleScientific() { document.getElementById('scientific-keys').classList.toggle('hidden'); }

// --- 4. CONVERTER LOGIC (FIXED: NaN Bug) ---
let currencyRates = {
    'IDR': 1, 'USD': 15900, 'EUR': 16800, 'SGD': 11800, 'MYR': 3550, 'JPY': 105, 'SAR': 4230, 'CNY': 2200,
    'GBP': 20100, 'AUD': 10300, 'KRW': 11.4, 'THB': 455, 'HKD': 2040, 'TWD': 490, 'VND': 0.62,
    'INR': 188, 'PHP': 270, 'AED': 4330, 'TRY': 460, 'CAD': 11300, 'CHF': 17900
};
const currencyNames = {
    'IDR': 'IDR - Rupiah Indonesia', 'USD': 'USD - Dollar Amerika', 'EUR': 'EUR - Euro',
    'SGD': 'SGD - Dollar Singapura', 'MYR': 'MYR - Ringgit Malaysia', 'JPY': 'JPY - Yen Jepang',
    'SAR': 'SAR - Riyal Saudi', 'CNY': 'CNY - Yuan China', 'GBP': 'GBP - Pound Inggris',
    'AUD': 'AUD - Dollar Australia', 'KRW': 'KRW - Won Korea', 'THB': 'THB - Baht Thailand',
    'HKD': 'HKD - Dollar Hong Kong', 'TWD': 'TWD - Dollar Taiwan', 'VND': 'VND - Dong Vietnam',
    'INR': 'INR - Rupee India', 'PHP': 'PHP - Peso Filipina', 'AED': 'AED - Dirham UEA',
    'TRY': 'TRY - Lira Turki', 'CAD': 'CAD - Dollar Kanada', 'CHF': 'CHF - Franc Swiss'
};
async function fetchLiveRates() {
    const badge = document.getElementById('data-source-badge');
    badge.innerText = "Memuat data terbaru...";
    badge.className = "px-2 py-1 bg-yellow-700/50 rounded text-yellow-200 animate-pulse";
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/IDR');
        const data = await response.json();
        if (data && data.rates) {
            Object.keys(currencyRates).forEach(code => {
                if (code !== 'IDR' && data.rates[code]) currencyRates[code] = 1 / data.rates[code];
            });
            badge.innerText = "Online (Live Update)"; badge.className = "px-2 py-1 bg-emerald-700/50 rounded text-emerald-200";
            if(document.getElementById('conv-category').value === 'currency') updateUnits();
        }
    } catch (error) { badge.innerText = "Offline (Data Backup)"; badge.className = "px-2 py-1 bg-slate-700 rounded text-slate-300"; }
}
const converterData = {
    currency: { units: [], type: 'currency' }, 
    length: { units: ['Meter (m)', 'Kilometer (km)', 'Centimeter (cm)', 'Millimeter (mm)', 'Inch (in)', 'Feet (ft)', 'Mile (mi)', 'Yard (yd)', 'Nautical Mile (NM)'], rates: { 'm': 1, 'km': 1000, 'cm': 0.01, 'mm': 0.001, 'in': 0.0254, 'ft': 0.3048, 'mi': 1609.34, 'yd': 0.9144, 'NM': 1852 } },
    weight: { units: ['Kilogram (kg)', 'Gram (g)', 'Milligram (mg)', 'Pound (lb)', 'Ounce (oz)', 'Ton (t)', 'Carat (ct)'], rates: { 'kg': 1, 'g': 0.001, 'mg': 0.000001, 'lb': 0.453592, 'oz': 0.0283495, 't': 1000, 'ct': 0.0002 } },
    data: { units: ['Byte (B)', 'Kilobyte (KB)', 'Megabyte (MB)', 'Gigabyte (GB)', 'Terabyte (TB)'], rates: { 'B': 1, 'KB': 1024, 'MB': 1048576, 'GB': 1073741824, 'TB': 1099511627776 } },
    temp: { units: ['Celcius (°C)', 'Fahrenheit (°F)', 'Kelvin (K)'], type: 'temp' }
};
function updateUnits() {
    const catSelect = document.getElementById('conv-category');
    const fromSelect = document.getElementById('unit-from');
    const toSelect = document.getElementById('unit-to');
    const category = catSelect.value;
    fromSelect.innerHTML = ''; toSelect.innerHTML = '';
    let units = [];
    if (category === 'currency') units = Object.keys(currencyRates).map(code => currencyNames[code] || code).sort();
    else units = converterData[category].units;
    units.forEach(u => { fromSelect.add(new Option(u, u)); toSelect.add(new Option(u, u)); });
    if (units.length > 1) toSelect.selectedIndex = 1;
    convert();
}
function convert() {
    const category = document.getElementById('conv-category').value;
    let val = parseFloat(document.getElementById('input-val').value);
    const fromStr = document.getElementById('unit-from').value;
    const toStr = document.getElementById('unit-to').value;
    if (isNaN(val)) { document.getElementById('output-val').innerText = '0'; return; }
    
    const getCode = (s) => {
        if(category === 'currency') return s.split(' - ')[0].split(' ')[0];
        const match = s.match(/\(([^)]+)\)/); // Ambil isi dalam kurung (B, KB, dll)
        if (match) return match[1];
        return s.split(' ')[0]; // Fallback
    };

    const from = getCode(fromStr);
    const to = getCode(toStr);
    
    let result = 0;
    if (category === 'temp') {
        if (from === to) result = val;
        else if (from === '°C' && to === '°F') result = (val * 9/5) + 32;
        else if (from === '°C' && to === 'K') result = val + 273.15;
        else if (from === '°F' && to === '°C') result = (val - 32) * 5/9;
        else if (from === 'K' && to === '°C') result = val - 273.15;
        else if (from === '°F' && to === 'K') result = (val - 32) * 5/9 + 273.15;
        else if (from === 'K' && to === '°F') result = (val - 273.15) * 9/5 + 32;
    } else if (category === 'currency') { 
        result = (val * currencyRates[from]) / currencyRates[to];
    } else { 
        if(!converterData[category].rates[from] || !converterData[category].rates[to]) {
           result = 0; 
        } else {
           result = (val * converterData[category].rates[from]) / converterData[category].rates[to]; 
        }
    }
    const outputEl = document.getElementById('output-val');
    if (category === 'currency') outputEl.innerText = result.toLocaleString('id-ID', { maximumFractionDigits: 2 });
    else outputEl.innerText = (result % 1 !== 0) ? parseFloat(result.toFixed(6)) : result;
    document.getElementById('output-unit').innerText = toStr;
}

// --- 5. AI CHAT LOGIC (Gemini 2.5) ---
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
    if(textarea.value === '') textarea.style.height = 'auto';
}

if(promptInput) {
    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

async function sendMessage() {
    const text = promptInput.value.trim();
    if (!text) return;

    if(welcomeMsg) welcomeMsg.classList.add('hidden');

    appendMessage(text, 'user');
    promptInput.value = '';
    promptInput.style.height = 'auto';

    loadingIndicator.classList.remove('hidden');
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        // Endpoint Gemini 2.5 Flash
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.MODEL_NAME}:generateContent?key=${AI_CONFIG.API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: text }] }] })
        });

        const data = await response.json();

        if (!response.ok) {
            // Check for 404 error
            if (data.error?.code === 404 || data.error?.message?.includes('not found')) {
                throw new Error("Model 2.5 belum aktif untuk key ini. Coba lagi nanti atau gunakan key lain.");
            }
            throw new Error(data.error?.message || "Gagal menghubungi server AI.");
        }

        if (data.candidates && data.candidates.length > 0) {
             const aiResponse = data.candidates[0].content.parts[0].text;
             appendMessage(aiResponse, 'ai');
        } else {
             throw new Error("Tidak ada respon dari AI.");
        }

    } catch (error) {
        console.error(error);
        appendMessage(`**Error:** ${error.message}`, 'error');
    } finally {
        loadingIndicator.classList.add('hidden');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

function appendMessage(text, type) {
    const div = document.createElement('div');
    const isUser = type === 'user';
    
    div.className = `flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in mb-4`;
    
    let bubbleClass = isUser 
        ? 'bg-purple-600 text-white rounded-2xl rounded-tr-sm' 
        : 'bg-slate-700/50 border border-slate-600 text-slate-200 rounded-2xl rounded-tl-sm';
    
    if (type === 'error') bubbleClass = 'bg-red-900/50 border border-red-500 text-red-200 rounded-2xl';

    const contentHTML = isUser ? text : (typeof marked !== 'undefined' ? marked.parse(text) : text);

    div.innerHTML = `
        <div class="max-w-[85%] px-4 py-3 ${bubbleClass} text-sm prose prose-invert">
            ${contentHTML}
        </div>
    `;
    
    chatContainer.insertBefore(div, loadingIndicator);
}

// Init App
updateUnits();
fetchLiveRates();

