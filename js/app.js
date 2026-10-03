// Global State (LocalStorage synchronized)
let appState = {
    roadmap: {
        lvl1_1: false, lvl1_2: false, lvl1_3: false,
        lvl2_1: false, lvl2_2: false, lvl2_3: false,
        lvl3_1: false, lvl3_2: false, lvl3_3: false,
        lvl4_1: false, lvl4_2: false, lvl4_3: false
    },
    easyMode: true
};

let currentCardIndex = 0;
let isCardFlipped = false;
let quizQuestions = [];
let currentQuizIndex = 0;
let quizScoreCount = 0;
let quizAnswered = false;

function loadProgress() {
    const saved = localStorage.getItem('dialogflow_cx_beginner_progress');
    if (saved) { 
        try { 
            appState = JSON.parse(saved); 
        } catch (e) {
            console.error("Failed to load local progress:", e);
        } 
    }
    applyRoadmapState();
    updateProgressStats();
}

function saveProgress() {
    localStorage.setItem('dialogflow_cx_beginner_progress', JSON.stringify(appState));
    updateProgressStats();
}

function updateProgressStats() {
    const keys = Object.keys(appState.roadmap);
    const total = keys.length;
    let completed = keys.filter(k => appState.roadmap[k]).length;
    const percent = Math.round((completed / total) * 100);

    const progressBar = document.getElementById('headerProgressBar');
    const progressText = document.getElementById('headerProgressText');
    const dashText = document.getElementById('dashPercentText');

    if (progressBar) progressBar.style.width = percent + '%';
    if (progressText) progressText.innerText = percent + '%';
    if (dashText) dashText.innerText = percent + '%';

    updateLevelCount('lvl1', ['lvl1_1', 'lvl1_2', 'lvl1_3']);
    updateLevelCount('lvl2', ['lvl2_1', 'lvl2_2', 'lvl2_3']);
    updateLevelCount('lvl3', ['lvl3_1', 'lvl3_2', 'lvl3_3']);
    updateLevelCount('lvl4', ['lvl4_1', 'lvl4_2', 'lvl4_3']);
}

function updateLevelCount(lvlId, items) {
    let done = items.filter(k => appState.roadmap[k]).length;
    const el = document.getElementById(lvlId + 'Count');
    if (el) el.innerText = `${done}/${items.length} 完了`;
}

function toggleRoadmapItem(id) {
    const chk = document.getElementById('chk_' + id);
    if (chk) appState.roadmap[id] = chk.checked;
    saveProgress();
    showToast('進捗を保存しました', 'success');
}

function applyRoadmapState() {
    Object.keys(appState.roadmap).forEach(id => {
        const chk = document.getElementById('chk_' + id);
        if (chk) chk.checked = !!appState.roadmap[id];
    });
}

function resetAllProgress() {
    Object.keys(appState.roadmap).forEach(k => appState.roadmap[k] = false);
    saveProgress();
    applyRoadmapState();
    showToast('学習進捗をリセットしました', 'info');
}

function openRoadmapDetail(id) {
    try {
        if (typeof roadmapDetails === 'undefined' || !roadmapDetails[id]) {
            console.error("Roadmap detail data not found for id:", id);
            showToast('解説データが見つかりませんでした', 'error');
            return;
        }
        const item = roadmapDetails[id];

        const badgeEl = document.getElementById('modalBadge');
        const titleEl = document.getElementById('modalTitle');
        const bodyEl = document.getElementById('modalBody');
        const modalEl = document.getElementById('roadmapModal');

        if (badgeEl) badgeEl.innerText = item.badge;
        if (titleEl) titleEl.innerText = item.title;

        if (bodyEl) {
            bodyEl.innerHTML = `
                <div class="p-3.5 sm:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800 space-y-1">
                    <div class="font-bold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider"><i class="fa-solid fa-book mr-1"></i> 概要定義</div>
                    <p class="text-slate-700 dark:text-slate-200 leading-relaxed">${item.official}</p>
                </div>

                <div class="p-3.5 sm:p-4 bg-teal-50 dark:bg-teal-900/30 rounded-xl border border-teal-200 dark:border-teal-800 space-y-1">
                    <div class="font-bold text-xs text-teal-600 dark:text-teal-400 uppercase tracking-wider"><i class="fa-solid fa-face-smile mr-1"></i> やさしい言葉で言うと？</div>
                    <p class="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">${item.easy}</p>
                </div>

                <div class="space-y-1">
                    <div class="font-bold text-xs text-slate-400 uppercase tracking-wider"><i class="fa-solid fa-comments mr-1"></i> 具体的イメージ・会話例</div>
                    <p class="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-750 p-3 rounded-lg leading-relaxed">${item.example}</p>
                </div>

                <div class="space-y-1">
                    <div class="font-bold text-xs text-indigo-500 uppercase tracking-wider"><i class="fa-solid fa-lightbulb mr-1"></i> 設計時のポイント</div>
                    <p class="text-slate-600 dark:text-slate-300 bg-indigo-50/50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/50 leading-relaxed">${item.point}</p>
                </div>
            `;
        }

        if (modalEl) {
            modalEl.classList.remove('hidden');
        }
    } catch (e) {
        console.error("Error in openRoadmapDetail:", e);
    }
}

function closeRoadmapModal() {
    const modalEl = document.getElementById('roadmapModal');
    if (modalEl) {
        modalEl.classList.add('hidden');
    }
}

function toggleEasyMode() {
    appState.easyMode = !appState.easyMode;
    const btn = document.getElementById('easyModeToggleBtn');
    const containers = document.querySelectorAll('.easy-badge-container');

    if (appState.easyMode) {
        if (btn) btn.innerHTML = '<i class="fa-solid fa-face-smile text-sm sm:mr-1.5"></i><span class="hidden sm:inline">やさしい解説 (ON)</span>';
        containers.forEach(el => el.classList.remove('hidden'));
        showToast('やさしい解説 ON', 'success');
    } else {
        if (btn) btn.innerHTML = '<i class="fa-solid fa-face-meh text-sm sm:mr-1.5"></i><span class="hidden sm:inline">やさしい解説 (OFF)</span>';
        containers.forEach(el => el.classList.add('hidden'));
        showToast('やさしい解説 OFF', 'info');
    }
}

function updateFlashcardUI() {
    if (typeof flashcardData === 'undefined' || flashcardData.length === 0) return;
    const card = flashcardData[currentCardIndex];
    document.getElementById('cardTerm').innerText = card.term;
    document.getElementById('cardEasyTerm').innerText = `「${card.easy}」`;
    document.getElementById('cardCategory').innerText = card.category;
    document.getElementById('cardDefinition').innerText = card.def;
    document.getElementById('cardCounter').innerText = `カード ${currentCardIndex + 1} / ${flashcardData.length}`;

    if (isCardFlipped) { flipCard(); }
}

function flipCard() {
    const inner = document.getElementById('flashcardInner');
    isCardFlipped = !isCardFlipped;
    if (inner) inner.style.transform = isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)';
}

function nextCard() { currentCardIndex = (currentCardIndex + 1) % flashcardData.length; updateFlashcardUI(); }
function prevCard() { currentCardIndex = (currentCardIndex - 1 + flashcardData.length) % flashcardData.length; updateFlashcardUI(); }
function shuffleFlashcards() { flashcardData.sort(() => Math.random() - 0.5); currentCardIndex = 0; updateFlashcardUI(); showToast('カードをシャッフルしました', 'success'); }
function markCardKnown() { showToast('「覚えた！」に登録しました', 'success'); nextCard(); }

function filterGlossary() {
    const input = document.getElementById('glossarySearch');
    if (!input) return;
    const query = input.value.toLowerCase();
    document.querySelectorAll('.glossary-item').forEach(item => {
        const text = item.innerText.toLowerCase();
        const keywords = (item.getAttribute('data-keywords') || '').toLowerCase();
        item.style.display = (text.includes(query) || keywords.includes(query)) ? 'block' : 'none';
    });
}

let simState = {
    flow: 'Default Start Flow',
    page: 'Start Page',
    intent: 'None',
    params: {}
};

function updateInspector() {
    const flowEl = document.getElementById('dbgActiveFlow');
    const pageEl = document.getElementById('dbgActivePage');
    const intentEl = document.getElementById('dbgIntent');
    const paramsEl = document.getElementById('dbgParams');

    if (flowEl) flowEl.innerText = simState.flow;
    if (pageEl) pageEl.innerText = simState.page;
    if (intentEl) intentEl.innerText = simState.intent;
    if (paramsEl) paramsEl.innerText = JSON.stringify(simState.params, null, 2);
}

function resetSim() {
    simState = { flow: 'Default Start Flow', page: 'Start Page', intent: 'None', params: {} };
    updateInspector();
    const chatContainer = document.getElementById('simChatMessages');
    if (chatContainer) {
        chatContainer.innerHTML = `
            <div class="flex items-start space-x-2.5">
                <div class="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">CX</div>
                <div class="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl rounded-tl-xs border border-slate-200 dark:border-slate-700 text-xs sm:text-sm shadow-sm max-w-[85%] leading-relaxed">
                    市役所総合案内AIです。<br>「住民票の取り方」「引っ越しの手続き」「開庁時間」「職員とお話ししたい」など、お気軽にお問い合わせください。
                </div>
            </div>
        `;
    }
    showToast('シミュレーターをリセットしました', 'info');
}

function handleSimKeyPress(e) { if (e.key === 'Enter') handleSimSend(); }
function sendSimMessage(text) { 
    const input = document.getElementById('simUserInput');
    if (input) input.value = text; 
    handleSimSend(); 
}

function handleSimSend() {
    const inputEl = document.getElementById('simUserInput');
    if (!inputEl) return;
    const message = inputEl.value.trim();
    if (!message) return;
    appendSimMessage(message, 'user');
    inputEl.value = '';

    setTimeout(() => { processSimResponse(message); }, 400);
}

function appendSimMessage(text, sender) {
    const container = document.getElementById('simChatMessages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = sender === 'user' ? 'flex items-start justify-end space-x-2.5' : 'flex items-start space-x-2.5';
    div.innerHTML = sender === 'user' ? 
        `<div class="bg-blue-600 text-white p-3 rounded-2xl text-xs sm:text-sm max-w-[80%]">${escapeHtml(text)}</div><div class="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">You</div>` :
        `<div class="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">CX</div><div class="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl text-xs sm:text-sm max-w-[85%] border border-slate-200 dark:border-slate-700 shadow-sm leading-relaxed">${text}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function processSimResponse(msg) {
    let botReply = "申し訳ありません。ご質問を認識できませんでした。(sys.no-match-default 起動)";
    
    if (msg.includes('住民票') || msg.includes('証明書') || msg.includes('印鑑')) {
        simState.flow = 'Certificates Flow';
        simState.page = 'Select Certificate Method';
        simState.intent = 'city.certificates.request';
        simState.params['document_type'] = '住民票の写し';
        simState.params['fee'] = '300円（コンビニ時200円）';
        botReply = "住民票のお手続きですね！<br>マイナンバーカードをお持ちの場合、コンビニマルチコピー機でも取得可能です。<br>「コンビニ取得」「窓口取得」などの案内ができます。";
    } else if (msg.includes('引っ越し') || msg.includes('転入') || msg.includes('転出') || msg.includes('住所')) {
        simState.flow = 'Relocation Flow';
        simState.page = 'Move In Requirement Page';
        simState.intent = 'city.relocation.move_in';
        simState.params['move_type'] = '市外からの転入';
        simState.params['deadline'] = '14日以内';
        botReply = "お引っ越し（転入届）ですね。<br>市外からの転入は<b>「転出証明書」</b>・<b>本人確認書類</b>・<b>マイナンバーカード</b>を市民課窓口へご持参ください。";
    } else if (msg.includes('時間') || msg.includes('開庁') || msg.includes('土日') || msg.includes('休み')) {
        simState.flow = 'General Info Flow';
        simState.page = 'Office Hours Page';
        simState.intent = 'city.info.hours';
        simState.params['office_hours'] = '平日 8:45〜17:15';
        botReply = "開庁時間は <b>平日 8:45〜17:15</b> です。<br>第2・第4土曜日の午前中（9:00〜12:00）も一部窓口を開けております。";
    } else if (msg.includes('人間') || msg.includes('オペレーター') || msg.includes('担当') || msg.includes('職員') || msg.includes('電話')) {
        simState.flow = 'Support Flow';
        simState.page = 'Human Staff Handover';
        simState.intent = 'city.support.staff_handover';
        simState.params['department'] = '市民総合相談課';
        botReply = "かしこまりました。担当部署の職員（ライブエージェント）へおつなぎいたします。少々お待ちください。";
    } else if (msg.includes('ありがとう') || msg.includes('助かった') || msg.includes('わかりました')) {
        simState.page = 'End Session';
        botReply = "お役に立てて幸いです！その他にご不明な点はございますか？";
    }

    updateInspector();
    appendSimMessage(botReply, 'bot');
}

function startQuiz() {
    if (typeof quizDataFull === 'undefined' || quizDataFull.length === 0) return;
    quizQuestions = [...quizDataFull].sort(() => Math.random() - 0.5);
    currentQuizIndex = 0;
    quizScoreCount = 0;
    loadQuizQuestion();
}

function loadQuizQuestion() {
    quizAnswered = false;
    const q = quizQuestions[currentQuizIndex];
    if (!q) return;

    const numEl = document.getElementById('quizQuestionNum');
    const textEl = document.getElementById('quizQuestionText');
    const expBox = document.getElementById('quizExplanationBox');
    const nextBtn = document.getElementById('quizNextBtn');

    if (numEl) numEl.innerText = `第 ${currentQuizIndex + 1} 問 / 全 ${quizQuestions.length} 問`;
    if (textEl) textEl.innerText = q.question;
    if (expBox) expBox.classList.add('hidden');
    if (nextBtn) nextBtn.classList.add('hidden');

    const optContainer = document.getElementById('quizOptionsContainer');
    if (!optContainer) return;
    optContainer.innerHTML = '';

    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-500 bg-white dark:bg-slate-750 font-medium text-xs sm:text-sm transition shadow-sm flex items-center justify-between group active:scale-[0.99] touch-target';
        btn.innerHTML = `<span><strong class="mr-2 text-rose-600">${['A', 'B', 'C', 'D'][idx]}.</strong> ${escapeHtml(opt)}</span><i class="fa-solid fa-chevron-right text-slate-300 text-xs"></i>`;
        btn.onclick = () => selectQuizAnswer(idx, btn);
        optContainer.appendChild(btn);
    });
}

function selectQuizAnswer(idx, btnEl) {
    if (quizAnswered) return;
    quizAnswered = true;
    const q = quizQuestions[currentQuizIndex];
    if (idx === q.correct) {
        btnEl.className = 'w-full text-left p-3.5 rounded-xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 font-medium text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 shadow-sm flex items-center justify-between';
        quizScoreCount++;
        document.getElementById('quizResultTitle').innerHTML = '<i class="fa-solid fa-circle-check text-emerald-500 mr-2"></i> 正解！';
    } else {
        btnEl.className = 'w-full text-left p-3.5 rounded-xl border-2 border-rose-500 bg-rose-50 dark:bg-rose-900/30 font-medium text-xs sm:text-sm text-rose-900 dark:text-rose-200 shadow-sm flex items-center justify-between';
        document.getElementById('quizResultTitle').innerHTML = '<i class="fa-solid fa-circle-xmark text-rose-500 mr-2"></i> 不正解';
    }
    document.getElementById('quizScoreDisplay').innerText = `${quizScoreCount} / ${quizQuestions.length}`;
    document.getElementById('quizExplanationText').innerText = q.explanation;
    document.getElementById('quizExplanationBox').classList.remove('hidden');
    document.getElementById('quizNextBtn').classList.remove('hidden');
}

function nextQuizQuestion() {
    currentQuizIndex++;
    if (currentQuizIndex < quizQuestions.length) {
        loadQuizQuestion();
    } else {
        const percent = Math.round((quizScoreCount / quizQuestions.length) * 100);
        const cardContainer = document.getElementById('quizCardContainer');
        if (cardContainer) {
            cardContainer.innerHTML = `
                <div class="text-center py-8 sm:py-12 space-y-4">
                    <div class="w-16 h-16 sm:w-20 sm:h-20 bg-rose-100 dark:bg-rose-900/50 text-rose-600 text-2xl sm:text-3xl font-bold rounded-full flex items-center justify-center mx-auto">
                        <i class="fa-solid fa-trophy"></i>
                    </div>
                    <h3 class="text-xl sm:text-2xl font-bold">結果: ${quizScoreCount} / ${quizQuestions.length} 正解 (${percent}%)</h3>
                    <p class="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                        ${percent >= 80 ? '高い理解度です！引き続き復習用として活用してください。' : 'もう一度ロードマップや用語ノートを見直して再挑戦してみましょう！'}
                    </p>
                    <button onclick="startQuiz()" class="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg transition active:scale-95 touch-target">
                        もう一度最初から解く <i class="fa-solid fa-rotate-right ml-1"></i>
                    </button>
                </div>
            `;
        }
    }
}

function switchTab(tabId) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(el => el.classList.add('hidden'));
    const target = document.getElementById('tab-' + tabId);
    if (target) target.classList.remove('hidden');

    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-target') === tabId) {
            btn.classList.add('bg-blue-50', 'dark:bg-slate-700', 'text-blue-600', 'dark:text-blue-400', 'font-semibold');
            btn.classList.remove('text-slate-600', 'dark:text-slate-300');
        } else {
            btn.classList.remove('bg-blue-50', 'dark:bg-slate-700', 'text-blue-600', 'dark:text-blue-400', 'font-semibold');
            btn.classList.add('text-slate-600', 'dark:text-slate-300');
        }
    });

    closeSidebar();
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
}

function toggleSidebar() { 
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar) return;
    
    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        if (overlay) {
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            overlay.classList.add('opacity-100');
        }
    } else {
        closeSidebar();
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (overlay) {
        overlay.classList.remove('opacity-100');
        overlay.classList.add('opacity-0', 'pointer-events-none');
    }
}

function toggleDarkMode() { document.documentElement.classList.toggle('dark'); }

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    const colorClass = type === 'error' ? 'bg-rose-600' : (type === 'info' ? 'bg-indigo-600' : 'bg-emerald-600');
    const iconClass = type === 'error' ? 'fa-circle-xmark' : (type === 'info' ? 'fa-circle-info' : 'fa-circle-check');
    
    toast.className = `${colorClass} text-white px-3.5 py-2.5 rounded-xl shadow-lg text-xs font-medium transition-all duration-300 flex items-center pointer-events-auto`;
    toast.innerHTML = `<i class="fa-solid ${iconClass} mr-2"></i>${escapeHtml(message)}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function escapeHtml(str) { 
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); 
}

window.onload = function() {
    loadProgress();
    updateFlashcardUI();
    updateInspector();
    startQuiz();
};