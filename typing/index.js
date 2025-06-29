// --- DOM selections ---
const mainWrapper = document.getElementById('mainWrapper');
const homePage = document.getElementById('homePage');
const gameContent = document.getElementById('gameContent');
const startTestButton = document.getElementById('startTestButton');
const unlimitedTypingButton = document.getElementById('unlimitedTypingButton');
const inputField = document.querySelector('.input-field');
const typingTextP = document.querySelector('.typing-text-viewport p');
const typingTextViewport = document.querySelector(".typing-text-viewport");
const timeLeftDisplay = document.getElementById('timeLeft');
const timeElapsedDisplay = document.getElementById('timeElapsed');
const mistakesDisplay = document.getElementById('mistakesDisplay');
const wpmDisplay = document.getElementById('wpmDisplay');
const cpmDisplay = document.getElementById('cpmDisplay');
const maxSpeedDisplay = document.getElementById('maxSpeedDisplay');
const tryAgainButton = document.getElementById('tryAgainButton');
const quitTestButton = document.getElementById('quitTestButton');
const stopUnlimitedTypingButton = document.getElementById('stopUnlimitedTypingButton');
const progressBar = document.getElementById('progressBar');
const scoreBoardModal = document.getElementById('scoreBoardModal');
const modalWpm = document.getElementById('modalWpm');
const modalCpm = document.getElementById('modalCpm');
const modalTimeTaken = document.getElementById('modalTimeTaken');
const modalWordsTyped = document.getElementById('modalWordsTyped');
const modalMistakes = document.getElementById('modalMistakes');
const modalTryAgainButton = document.getElementById('modalTryAgainButton');
const backToHomeButton = document.getElementById('backToHomeButton');
const homeMaxSpeed = document.getElementById('homeMaxSpeed');
const highScoreNotification = document.getElementById('highScoreNotification');
const timeLeftContainer = document.getElementById('timeLeftContainer');
const timeElapsedContainer = document.getElementById('timeElapsedContainer');

// --- Game variables ---
const paragraphs = [
    "The quick brown fox jumps over the lazy dog. This is a classic sentence for typing tests.",
    "Programming is the art of telling a computer what to do. It requires logic, creativity, and persistence.",
    "The sun always shines brightest after the rain. Every challenge is an opportunity in disguise.",
    "Innovation distinguishes between a leader and a follower. Embrace change and never stop learning.",
    "Technology has transformed the world in countless ways, making information more accessible than ever.",
    "A journey of a thousand miles begins with a single step. Start today, not tomorrow.",
    "The early bird catches the worm, but the second mouse gets the cheese. Timing is everything.",
    "Creativity is intelligence having fun. Don't be afraid to experiment and think outside the box.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The only way to do great work is to love what you do. Find your passion and pursue it relentlessly.",
    "Data is the new oil. Understanding and analyzing it is crucial in the modern world."
];

let timer = null;
const maxTime = 60;
let timeLeft = maxTime;
let timeElapsed = 0;
let charIndex = 0;
let mistakes = 0;
let isTyping = false;
let WPM = 0;
let CPM = 0;
let totalTypedChars = 0;
let correctTypedChars = 0;
let maxSpeed = parseInt(localStorage.getItem('maxSpeed') || '0', 10);
let mode = 'timed';
let currentTextSegment = '';
let currentParagraphLength = 0;
const LINE_HEIGHT_PX = 30; // fallback

typingTextViewport.addEventListener('click', function () {
    if (!inputField.readOnly) {
        inputField.focus();
    }
});

// --- Utility Functions ---

function updateMaxSpeedDisplay() {
    maxSpeedDisplay.innerText = maxSpeed;
    homeMaxSpeed.innerText = `${maxSpeed} WPM`;
}

function showNotification(message) {
    highScoreNotification.querySelector('span').innerText = message;
    highScoreNotification.classList.add('show');
    setTimeout(() => {
        highScoreNotification.classList.remove('show');
    }, 3000);
}

// --- Game Logic Functions ---

function getLineHeightPx() {
    const lh = parseFloat(getComputedStyle(typingTextP).lineHeight);
    return isNaN(lh) ? LINE_HEIGHT_PX : lh;
}

function scrollParagraphVertically() {
    const activeChar = typingTextP.querySelector('span.active');
    if (!activeChar) return;

    const lineHeightPx = getLineHeightPx();
    const charTop = activeChar.offsetTop;
    const charBottom = charTop + activeChar.offsetHeight;
    const viewportHeight = typingTextViewport.clientHeight;
    let currentY = parseFloat(typingTextP.style.transform?.match(/translateY\((.*)px\)/)?.[1]) || 0;

    if (charTop + currentY < 0) {
        typingTextP.style.transform = `translateY(${-charTop}px)`;
    } else if (charBottom + currentY > viewportHeight) {
        typingTextP.style.transform = `translateY(${viewportHeight - charBottom}px)`;
    }
    // No scrolling if already in view
}
function renderTypingText() {
    typingTextP.innerHTML = '';
    currentTextSegment.split("").forEach((char, idx) => {
        const span = document.createElement('span');
        span.innerText = char;
        if (idx < charIndex) {
            span.className = inputField.dataset[`char${idx}`] || '';
        }
        typingTextP.appendChild(span);
    });
    const chars = typingTextP.querySelectorAll('span');
    if (charIndex < chars.length) {
        chars[charIndex].classList.add('active');
    } else if (chars.length > 0) {
        chars[0].classList.add('active');
        charIndex = 0;
    }
    typingTextP.style.transform = `translateY(0px)`;
}

function loadParagraph() {
    if (mode === 'timed') {
        // Concatenate random paragraphs until at least 300 chars (adjust as needed for 4+ lines)
        let combined = "";
        while (combined.length < 300) {
            if (combined.length > 0) combined += " ";
            combined += paragraphs[Math.floor(Math.random() * paragraphs.length)];
        }
        currentTextSegment = combined;
        currentParagraphLength = currentTextSegment.length;
    } else {
        if (charIndex === 0 && inputField.value === '') currentTextSegment = '';
        const charsNeeded = 500;
        while (currentTextSegment.length - charIndex < charsNeeded) {
            if (currentTextSegment.length > 0) currentTextSegment += " ";
            currentTextSegment += paragraphs[Math.floor(Math.random() * paragraphs.length)];
        }
    }
    renderTypingText();
    scrollParagraphVertically();
}

function focusInputField() {
    inputField.focus();
}

function initTyping(e) {
    const characters = typingTextP.querySelectorAll('span');
    const currentInputValue = inputField.value;
    const isBackspace = currentInputValue.length < charIndex;

    if (!isTyping) {
        timer = setInterval(mode === 'timed' ? initTime : initUnlimitedTime, 1000);
        isTyping = true;
    }

    if (isBackspace) {
        if (charIndex > 0) {
            charIndex--;
            if (characters[charIndex].classList.contains('incorrect')) mistakes--;
            characters[charIndex].classList.remove('correct', 'incorrect');
            totalTypedChars = Math.max(0, totalTypedChars - 1);
            correctTypedChars = Math.max(0, correctTypedChars - (characters[charIndex].classList.contains('correct') ? 1 : 0));
        }
    } else {
        if (charIndex < characters.length) {
            const expected = characters[charIndex].innerText;
            const typedChar = currentInputValue.slice(-1);
            totalTypedChars++;
            if (typedChar === expected) {
                characters[charIndex].classList.add('correct');
                inputField.dataset[`char${charIndex}`] = 'correct';
                correctTypedChars++;
            } else {
                characters[charIndex].classList.add('incorrect');
                inputField.dataset[`char${charIndex}`] = 'incorrect';
                mistakes++;
            }
            charIndex++;
        }
    }
    // Remove previous active and set new
    characters.forEach(span => span.classList.remove('active'));
    if (charIndex < characters.length) characters[charIndex].classList.add('active');
    scrollParagraphVertically();

    // Unlimited mode: append more text if near end
    if (mode === 'unlimited' && (currentTextSegment.length - charIndex <= 100)) {
        while (currentTextSegment.length - charIndex < 500) {
            currentTextSegment += " " + paragraphs[Math.floor(Math.random() * paragraphs.length)];
        }
        renderTypingText();
        // restore correctness for already typed chars
        for (let i = 0; i < charIndex; i++) {
            if (inputField.dataset[`char${i}`]) {
                typingTextP.children[i].className = inputField.dataset[`char${i}`];
            }
        }
        typingTextP.children[charIndex]?.classList.add('active');
        scrollParagraphVertically();
    }

    mistakesDisplay.innerText = mistakes;
    calculateWPMCPM();

    if (mode === 'timed') {
        updateProgressBar();
        if (charIndex === characters.length) {
            endGame();
        }
    }
}

function initTime() {
    if (timeLeft > 0) {
        timeLeft--;
        timeLeftDisplay.innerText = timeLeft;
        calculateWPMCPM();
    } else {
        endGame();
    }
}

function initUnlimitedTime() {
    timeElapsed++;
    timeElapsedDisplay.innerText = timeElapsed;
    calculateWPMCPM();
}

function calculateWPMCPM() {
    const timeInMinutes = mode === 'timed'
        ? (maxTime - timeLeft) / 60
        : timeElapsed > 0 ? timeElapsed / 60 : 1 / 60;
    if (timeInMinutes > 0) {
        WPM = Math.max(0, Math.round((correctTypedChars / 5) / timeInMinutes));
        CPM = Math.max(0, Math.round(totalTypedChars / timeInMinutes));
        wpmDisplay.innerText = WPM;
        cpmDisplay.innerText = CPM;
    } else {
        WPM = CPM = 0;
        wpmDisplay.innerText = 0;
        cpmDisplay.innerText = 0;
    }
}

function updateProgressBar() {
    if (mode === 'timed') {
        const progress = (charIndex / currentParagraphLength) * 100;
        progressBar.style.width = `${progress}%`;
    } else {
        progressBar.style.width = '0%';
    }
}

function endGame() {
    clearInterval(timer);
    inputField.removeEventListener('input', initTyping);
    inputField.readOnly = true;
    if (WPM > maxSpeed) {
        maxSpeed = WPM;
        localStorage.setItem('maxSpeed', maxSpeed);
        updateMaxSpeedDisplay();
        showNotification("🎉 New High Score!");
    }
    modalWpm.innerText = WPM;
    modalCpm.innerText = CPM;
    modalTimeTaken.innerText = mode === 'timed' ? `${maxTime - timeLeft}s` : `${timeElapsed}s`;
    modalWordsTyped.innerText = Math.round(correctTypedChars / 5);
    modalMistakes.innerText = mistakes;
    scoreBoardModal.classList.add('show');
}

function resetGameValues() {
    clearInterval(timer);
    isTyping = false;
    timeLeft = maxTime;
    timeElapsed = 0;
    charIndex = 0;
    mistakes = 0;
    WPM = 0;
    CPM = 0;
    totalTypedChars = 0;
    correctTypedChars = 0;
    inputField.value = "";
    inputField.readOnly = false;
    timeLeftDisplay.innerText = maxTime;
    timeElapsedDisplay.innerText = 0;
    mistakesDisplay.innerText = 0;
    wpmDisplay.innerText = 0;
    cpmDisplay.innerText = 0;
    progressBar.style.width = '0%';
    typingTextP.style.transform = `translateY(0px)`;
    scoreBoardModal.classList.remove('show');
    updateMaxSpeedDisplay();
    inputField.removeEventListener('input', initTyping);
    // Remove per-char dataset
    Object.keys(inputField.dataset).forEach(key => delete inputField.dataset[key]);
}

function startGame(gameMode) {
    mode = gameMode;
    resetGameValues();
    mainWrapper.classList.add('game-active');
    loadParagraph();
    focusInputField();
    inputField.addEventListener('input', initTyping);

    if (mode === 'timed') {
        timeLeftContainer.style.display = 'flex';
        timeElapsedContainer.style.display = 'none';
        stopUnlimitedTypingButton.style.display = 'none';
        progressBar.style.display = 'block';
    } else {
        timeLeftContainer.style.display = 'none';
        timeElapsedContainer.style.display = 'flex';
        stopUnlimitedTypingButton.style.display = 'block';
        progressBar.style.display = 'none';
    }
}

function goToHome() {
    resetGameValues();
    mainWrapper.classList.remove('game-active');
}

// --- Event Listeners ---
startTestButton.addEventListener('click', () => startGame('timed'));
unlimitedTypingButton.addEventListener('click', () => startGame('unlimited'));
tryAgainButton.addEventListener('click', () => startGame(mode));
quitTestButton.addEventListener('click', goToHome);
stopUnlimitedTypingButton.addEventListener('click', endGame);
modalTryAgainButton.addEventListener('click', () => startGame(mode));
backToHomeButton.addEventListener('click', goToHome);

// Initial setup
updateMaxSpeedDisplay();