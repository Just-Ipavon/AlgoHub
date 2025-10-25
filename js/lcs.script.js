// --- VARIABILI GLOBALI ---
let lcsExerciseSolution = null; 
let lcsAllSteps = [];
let lcsCurrentStepIndex = 0;
let lcsFullDPMatrix = null;
let lcsCurrentS1 = "";
let lcsCurrentS2 = "";
// Variabili per l'animazione
let lcsAnimationInterval = null;
let lcsIsPlaying = false;
let lcsAnimationSpeed = 1050 - 750; // Valore iniziale dallo slider (1050 - 750 = 300ms)

// --- SELETTORI DOM ---
// Assicurati che il DOM sia caricato prima di cercare gli elementi
document.addEventListener('DOMContentLoaded', () => {
    
    // Controlla se siamo sulla pagina LCS
    // Seleziona un elemento univoco della pagina LCS
    const lcsHeader = document.querySelector('h1.text-cyan-400');
    if (!lcsHeader || !lcsHeader.textContent.includes('LCS')) {
        // Non siamo sulla pagina LCS, non fare nulla
        return;
    }

    // Tab
    const tabCalculator = document.getElementById('tabCalculator');
    const tabExercise = document.getElementById('tabExercise');
    const calculatorContent = document.getElementById('calculatorContent');
    const exerciseContent = document.getElementById('exerciseContent');
    
    // Calcolatore
    const calculatorCalculateBtn = document.getElementById('calculatorCalculateBtn');
    const calculatorString1Input = document.getElementById('calculatorString1');
    const calculatorString2Input = document.getElementById('calculatorString2');
    const calculatorResultArea = document.getElementById('calculatorResultArea');
    const calculatorLengthOutput = document.getElementById('calculatorLengthOutput');
    const calculatorSequenceOutput = document.getElementById('calculatorSequenceOutput');
    
    // Calcolatore - Viste
    const toggleViewBtn = document.getElementById('toggleViewBtn');
    const calculatorInteractiveArea = document.getElementById('calculatorInteractiveArea');
    const calculatorMatrixContainerWrapper = document.getElementById('calculatorMatrixContainerWrapper');
    const calculatorMatrixContainer = document.getElementById('calculatorMatrixContainer');

    // Calcolatore - Step-by-Step
    const playPauseBtn = document.getElementById('playPauseBtn');
    const speedSlider = document.getElementById('speedSlider');
    const resetStepBtn = document.getElementById('resetStepBtn');
    const stepCounter = document.getElementById('stepCounter');
    const stepMatrixContainer = document.getElementById('stepMatrixContainer');
    const pseudocodeEl = document.getElementById('pseudocodeEl');
    const stepInfo = document.getElementById('stepInfo');

    // Esercizio
    const generateStringsBtn = document.getElementById('generateStringsBtn');
    const startExerciseBtn = document.getElementById('startExerciseBtn');
    const checkSolutionBtn = document.getElementById('checkSolutionBtn');
    const exerciseString1Input = document.getElementById('exerciseString1');
    const exerciseString2Input = document.getElementById('exerciseString2');
    const exerciseMatrixContainer = document.getElementById('exerciseMatrixContainer');
    const exerciseResult = document.getElementById('exerciseResult');

    // --- ENUM PER LE FRECCE ---
    const DIR = {
        NONE: 0,
        DIAG: 1, // ↖
        UP: 2,   // ↑
        LEFT: 3  // ←
    };

    // --- FUNZIONE CORE ALGORITMO LCS ---

    /**
     * Calcola la LCS e restituisce la matrice DP, la matrice delle direzioni e i passi.
     * @param {string} s1 - La prima stringa (X).
     * @param {string} s2 - La seconda stringa (Y).
     * @returns {{dp: number[][], dir: number[][], steps: object[]}}
     */
    function lcs(s1, s2) {
        const steps = [];
        const m = s1.length;
        const n = s2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        const dir = Array(m + 1).fill(null).map(() => Array(n + 1).fill(DIR.NONE));

        // Inizializzazione (righe 4-7)
        for (let i = 0; i <= m; i++) {
            dp[i][0] = 0;
            steps.push({ i, j: 0, value: 0, direction: DIR.NONE, line: 'init-i', info: `Cella base [${i},0] = 0. (Riga 5)` });
        }
        for (let j = 1; j <= n; j++) {
            dp[0][j] = 0;
            steps.push({ i: 0, j, value: 0, direction: DIR.NONE, line: 'init-j', info: `Cella base [0,${j}] = 0. (Riga 7)` });
        }

        // Loop principale (righe 8-18)
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                let info = `Calcolo [${i},${j}]:\n`;
                info += `X[${i-1}] ('${s1[i-1]}') vs Y[${j-1}] ('${s2[j-1]}')\n`;
                
                // Caso 1: Match (righe 10-12)
                if (s1[i - 1] === s2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                    dir[i][j] = DIR.DIAG;
                    info += `Match! (Riga 10)\nValore = Diagonale (${dp[i - 1][j - 1]}) + 1 = ${dp[i][j]}`;
                    steps.push({ i, j, value: dp[i][j], direction: DIR.DIAG, line: 'match', info });
                } 
                // Caso 2: No Match, prendi da sopra (righe 13-15)
                else if (dp[i - 1][j] >= dp[i][j - 1]) {
                    dp[i][j] = dp[i - 1][j];
                    dir[i][j] = DIR.UP;
                    info += `No Match. (Riga 13)\nSopra (${dp[i-1][j]}) >= Sinistra (${dp[i][j-1]}).\nValore = ${dp[i][j]} (da sopra).`;
                    steps.push({ i, j, value: dp[i][j], direction: DIR.UP, line: 'no-match', info });
                } 
                // Caso 3: No Match, prendi da sinistra (righe 16-18)
                else {
                    dp[i][j] = dp[i][j - 1];
                    dir[i][j] = DIR.LEFT;
                    info += `No Match. (Riga 16)\nSopra (${dp[i-1][j]}) < Sinistra (${dp[i][j-1]}).\nValore = ${dp[i][j]} (da sinistra).`;
                    steps.push({ i, j, value: dp[i][j], direction: DIR.LEFT, line: 'no-match', info });
                }
            }
        }
        return { dp, dir, steps };
    }

    /**
     * Ricostruisce la stringa LCS dalla matrice delle direzioni.
     */
    function getLcsSequence(s1, dir, i, j) {
        if (i === 0 || j === 0) {
            return "";
        }
        if (dir[i][j] === DIR.DIAG) {
            return getLcsSequence(s1, dir, i - 1, j - 1) + s1[i - 1];
        } else if (dir[i][j] === DIR.UP) {
            return getLcsSequence(s1, dir, i - 1, j);
        } else {
            return getLcsSequence(s1, dir, i, j - 1);
        }
    }


    // --- LOGICA GESTIONE TAB ---
    // (Identica a Levenshtein, ma con check per null)
    if (tabCalculator && tabExercise) {
        tabCalculator.addEventListener('click', () => {
            calculatorContent.classList.remove('hidden');
            exerciseContent.classList.add('hidden');
            tabCalculator.classList.replace('bg-gray-700', 'bg-cyan-600');
            tabCalculator.classList.replace('text-gray-300', 'text-white');
            tabExercise.classList.replace('bg-cyan-600', 'bg-gray-700');
            tabExercise.classList.replace('text-white', 'text-gray-300');
        });

        tabExercise.addEventListener('click', () => {
            calculatorContent.classList.add('hidden');
            exerciseContent.classList.remove('hidden');
            tabCalculator.classList.replace('bg-cyan-600', 'bg-gray-700');
            tabCalculator.classList.replace('text-white', 'text-gray-300');
            tabExercise.classList.replace('bg-gray-700', 'bg-cyan-600');
            tabExercise.classList.replace('text-gray-300', 'text-white');
        });
    }

    // --- LOGICA CALCOLATORE LCS ---

    if (calculatorCalculateBtn) {
        calculatorCalculateBtn.addEventListener('click', () => {
            lcsCurrentS1 = calculatorString1Input.value;
            lcsCurrentS2 = calculatorString2Input.value;
            
            const { dp, dir, steps } = lcs(lcsCurrentS1, lcsCurrentS2);
            const sequence = getLcsSequence(lcsCurrentS1, dir, lcsCurrentS1.length, lcsCurrentS2.length);

            // Salva stato globale
            lcsAllSteps = steps;
            lcsFullDPMatrix = { dp, dir }; // Salva sia dp che dir
            lcsCurrentStepIndex = 0;

            // Reset animazione
            stopAnimationLCS();
            playPauseBtn.textContent = "Avvia Animazione";
            lcsIsPlaying = false;

            // Mostra risultato
            calculatorLengthOutput.textContent = dp[lcsCurrentS1.length][lcsCurrentS2.length];
            calculatorSequenceOutput.textContent = `"${sequence}"`;
            calculatorResultArea.classList.remove('hidden');
            
            // Imposta la vista di default (Step-by-Step)
            calculatorInteractiveArea.classList.remove('hidden');
            calculatorMatrixContainerWrapper.classList.add('hidden');
            toggleViewBtn.textContent = "Mostra Matrice Completa";

            // Renderizza il primo passo
            renderCurrentStepLCS();
        });
    }

    if (toggleViewBtn) {
        toggleViewBtn.addEventListener('click', () => {
            const isShowingSteps = !calculatorInteractiveArea.classList.contains('hidden');
            if (isShowingSteps) {
                // Passa a Matrice Completa
                calculatorInteractiveArea.classList.add('hidden');
                calculatorMatrixContainerWrapper.classList.remove('hidden');
                toggleViewBtn.textContent = "Mostra Step-by-Step";
                stopAnimationLCS();
                // Renderizza la matrice completa
                renderCalculatorMatrixLCS(lcsFullDPMatrix.dp, lcsFullDPMatrix.dir, lcsCurrentS1, lcsCurrentS2);
            } else {
                // Passa a Step-by-Step
                calculatorInteractiveArea.classList.remove('hidden');
                calculatorMatrixContainerWrapper.classList.add('hidden');
                toggleViewBtn.textContent = "Mostra Matrice Completa";
                renderCurrentStepLCS();
            }
        });
    }

    function getArrow(dir) {
        if (dir === DIR.DIAG) return '<span class="lcs-arrow">↖</span>';
        if (dir === DIR.UP) return '<span class="lcs-arrow">↑</span>';
        if (dir === DIR.LEFT) return '<span class="lcs-arrow">←</span>';
        return '';
    }

    /**
     * Renderizza la matrice DP (Calcolatore) come tabella HTML statica.
     */
    function renderCalculatorMatrixLCS(dp, dir, s1, s2) {
        const m = s1.length;
        const n = s2.length;
        let tableHtml = `<table class="min-w-full divide-y divide-gray-700 text-center font-mono">`;
        
        // Intestazione (s2)
        tableHtml += '<thead class="bg-gray-700"><tr>';
        tableHtml += '<th class="header-cell px-3 py-2 text-sm font-bold text-cyan-300"></th>';
        tableHtml += '<th class="header-cell px-3 py-2 text-sm font-bold text-cyan-300">Ø</th>';
        for (let j = 0; j < n; j++) tableHtml += `<th class="header-cell px-3 py-2 text-sm font-bold text-cyan-300">${s2[j]}</th>`;
        tableHtml += '</tr></thead>';

        // Corpo (s1 e valori)
        tableHtml += '<tbody class="divide-y divide-gray-700">';
        for (let i = 0; i <= m; i++) {
            tableHtml += '<tr class="bg-gray-800 even:bg-gray-800/50">';
            // Intestazione riga (s1)
            tableHtml += `<td class="header-cell px-3 py-2 text-sm font-bold text-cyan-300">${(i === 0 ? 'Ø' : s1[i - 1])}</td>`;
            
            // Valori DP
            for (let j = 0; j <= n; j++) {
                let cellClass = "data-cell px-3 py-2 text-lg";
                if (i === 0 || j === 0) cellClass += " text-yellow-400";
                else cellClass += " text-white";
                if (i === m && j === n) cellClass += " bg-yellow-600 text-black font-bold ring-2 ring-yellow-300";
                
                tableHtml += `<td class="${cellClass}">
                                ${getArrow(dir[i][j])}
                                <span class="lcs-value">${dp[i][j]}</span>
                              </td>`;
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';
        calculatorMatrixContainer.innerHTML = tableHtml;
    }

    // --- LOGICA STEP-BY-STEP LCS ---

    function playAnimationLCS() {
        lcsIsPlaying = true;
        playPauseBtn.textContent = "Pausa";
        lcsAnimationInterval = setTimeout(stepForwardLCS, lcsAnimationSpeed);
    }

    function stopAnimationLCS() {
        lcsIsPlaying = false;
        if (lcsAllSteps.length === 0 || lcsCurrentStepIndex < lcsAllSteps.length - 1) {
            playPauseBtn.textContent = "Continua";
        } else {
            playPauseBtn.textContent = "Ricomincia";
        }
        if (lcsAnimationInterval) {
            clearTimeout(lcsAnimationInterval);
            lcsAnimationInterval = null;
        }
    }

    function toggleAnimationLCS() {
        if (lcsIsPlaying) {
            stopAnimationLCS();
        } else {
            if (lcsAllSteps.length > 0 && lcsCurrentStepIndex === lcsAllSteps.length - 1) {
                lcsCurrentStepIndex = 0;
                renderCurrentStepLCS();
            }
            playAnimationLCS();
        }
    }

    function stepForwardLCS() {
        if (lcsCurrentStepIndex < lcsAllSteps.length - 1) {
            lcsCurrentStepIndex++;
            renderCurrentStepLCS();
            lcsAnimationInterval = setTimeout(stepForwardLCS, lcsAnimationSpeed);
        } else {
            stopAnimationLCS();
        }
    }

    function changeSpeedLCS() {
        lcsAnimationSpeed = 1050 - parseInt(speedSlider.value, 10);
    }

    function resetAnimationLCS() {
        stopAnimationLCS();
        lcsCurrentStepIndex = 0;
        renderCurrentStepLCS();
        playPauseBtn.textContent = "Avvia Animazione";
    }

    if (playPauseBtn) playPauseBtn.addEventListener('click', toggleAnimationLCS);
    if (speedSlider) speedSlider.addEventListener('input', changeSpeedLCS);
    if (resetStepBtn) resetStepBtn.addEventListener('click', resetAnimationLCS);


    /**
     * Funzione principale che orchestra il rendering di un singolo passo LCS.
     */
    function renderCurrentStepLCS() {
        if (lcsAllSteps.length === 0) return;

        const currentStep = lcsAllSteps[lcsCurrentStepIndex];
        
        renderStepMatrixLCS(currentStep);
        updateStepInfoLCS(currentStep);
        highlightPseudocodeLCS(currentStep.line);

        stepCounter.textContent = `Passo ${lcsCurrentStepIndex + 1} / ${lcsAllSteps.length}`;
    }

    /**
     * Renderizza la tabella HTML per lo step-by-step LCS.
     */
    function renderStepMatrixLCS(currentStep) {
        const m = lcsCurrentS1.length;
        const n = lcsCurrentS2.length;
        const ci = currentStep.i;
        const cj = currentStep.j;

        let tableHtml = `<table class="min-w-full divide-y divide-gray-700 text-center font-mono">`;
        
        // Intestazione (s2)
        tableHtml += '<thead class="bg-gray-700"><tr>';
        tableHtml += '<th class="header-cell px-3 py-2 text-sm font-bold text-cyan-300"></th>';
        tableHtml += '<th class="header-cell px-3 py-2 text-sm font-bold text-cyan-300">Ø</th>';
        for (let j = 0; j < n; j++) tableHtml += `<th class="header-cell px-3 py-2 text-sm font-bold text-cyan-300">${lcsCurrentS2[j]}</th>`;
        tableHtml += '</tr></thead>';

        // Corpo (s1 e valori)
        tableHtml += '<tbody class="divide-y divide-gray-700">';
        
        const calculatedValues = new Map();
        for (let k = 0; k <= lcsCurrentStepIndex; k++) {
            const step = lcsAllSteps[k];
            calculatedValues.set(`${step.i},${step.j}`, { value: step.value, direction: step.direction });
        }

        for (let i = 0; i <= m; i++) {
            tableHtml += '<tr class="bg-gray-800 even:bg-gray-800/50">';
            tableHtml += `<td class="header-cell px-3 py-2 text-sm font-bold text-cyan-300">${(i === 0 ? 'Ø' : lcsCurrentS1[i - 1])}</td>`;
            
            for (let j = 0; j <= n; j++) {
                let cellClass = "data-cell step-cell px-3 py-2 text-lg";
                let cellValue = "?";
                let cellArrow = "";

                if (calculatedValues.has(`${i},${j}`)) {
                    const data = calculatedValues.get(`${i},${j}`);
                    cellValue = data.value;
                    cellArrow = getArrow(data.direction);
                    if (i === 0 || j === 0) cellClass += " text-yellow-400";
                } else {
                    cellClass += " cell-future";
                }

                // Evidenziazione
                if (i === ci && j === cj) {
                    cellClass += " cell-current";
                } else if (currentStep.line === 'match' && (i === ci - 1 && j === cj - 1)) {
                    cellClass += " cell-dependency"; // Diagonale
                } else if (currentStep.line === 'no-match') {
                    if (i === ci - 1 && j === cj) cellClass += " cell-dependency"; // Sopra
                    if (i === ci && j === cj - 1) cellClass += " cell-dependency"; // Sinistra
                }

                tableHtml += `<td class="${cellClass}">
                                ${cellArrow}
                                <span class="lcs-value">${cellValue}</span>
                              </td>`;
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';
        stepMatrixContainer.innerHTML = tableHtml;
    }

    /**
     * Aggiorna il pannello info LCS.
     */
    function updateStepInfoLCS(step) {
        stepInfo.innerHTML = step.info.replace(/\n/g, '<br>');
    }

    /**
     * Evidenzia la riga corretta dello pseudocodice LCS.
     */
    function highlightPseudocodeLCS(lineId) {
        pseudocodeEl.querySelectorAll('.pseudo-line').forEach(line => {
            line.classList.remove('highlight');
        });

        let linesToHighlight = [lineId];
        if (lineId === 'init-i') linesToHighlight = ['init-i'];
        if (lineId === 'init-j') linesToHighlight = ['init-j'];
        if (lineId === 'match' || lineId === 'no-match') {
            linesToHighlight = ['loop-i', 'loop-j', lineId];
        }

        linesToHighlight.forEach(id => {
            pseudocodeEl.querySelectorAll(`[data-line-id="${id}"]`).forEach(line => {
                line.classList.add('highlight');
            });
        });
    }


    // --- LOGICA ESERCIZIO LCS ---

    if (generateStringsBtn) {
        generateStringsBtn.addEventListener('click', () => {
            const alphabet = "ABCDEFGH";
            
            // 1. Genera s1 (stringa base)
            const len1 = Math.floor(Math.random() * 3) + 4; // Lunghezza 4-6
            let s1 = "";
            for (let i = 0; i < len1; i++) {
                s1 += alphabet[Math.floor(Math.random() * alphabet.length)];
            }

            // 2. Crea s2 modificando s1
            let s2_array = s1.split('');
            const edits = Math.floor(Math.random() * 2) + 1; // 1 o 2 modifiche

            for (let k = 0; k < edits; k++) {
                const operation = Math.floor(Math.random() * 3);
                
                if (operation === 0 && s2_array.length > 0) { // Sostituzione
                    const pos = Math.floor(Math.random() * s2_array.length);
                    s2_array[pos] = alphabet[Math.floor(Math.random() * alphabet.length)];
                } else if (operation === 1 && s2_array.length < 7) { // Inserimento
                    const pos = Math.floor(Math.random() * (s2_array.length + 1));
                    s2_array.splice(pos, 0, alphabet[Math.floor(Math.random() * alphabet.length)]);
                } else if (s2_array.length > 3) { // Eliminazione
                    const pos = Math.floor(Math.random() * s2_array.length);
                    s2_array.splice(pos, 1);
                }
            }
            
            let s2 = s2_array.join('');

            exerciseString1Input.value = s1;
            exerciseString2Input.value = s2;
            
            exerciseMatrixContainer.classList.add('hidden');
            checkSolutionBtn.classList.add('hidden');
            exerciseResult.classList.add('hidden');
        });
    }

    if (startExerciseBtn) {
        startExerciseBtn.addEventListener('click', () => {
            const s1 = exerciseString1Input.value;
            const s2 = exerciseString2Input.value;
            
            if (s1.length === 0 || s2.length === 0) {
                exerciseResult.textContent = "Inserisci entrambe le stringhe per iniziare.";
                exerciseResult.classList.remove('hidden', 'text-green-400');
                exerciseResult.classList.add('text-yellow-400');
                return;
            }

            const { dp } = lcs(s1, s2);
            lcsExerciseSolution = dp;

            renderExerciseMatrixLCS(s1, s2, dp);
            
            exerciseMatrixContainer.classList.remove('hidden');
            checkSolutionBtn.classList.remove('hidden');
            exerciseResult.classList.add('hidden');
        });
    }

    /**
     * Renderizza la matrice (Esercizio) con celle input per l'utente LCS.
     */
    function renderExerciseMatrixLCS(s1, s2, dp) {
        const m = s1.length;
        const n = s2.length;
        let tableHtml = `<table class="min-w-full divide-y divide-gray-700 text-center font-mono">`;
        
        // Intestazione (s2)
        tableHtml += '<thead class="bg-gray-700"><tr>';
        tableHtml += '<th class="header-cell px-3 py-2 text-sm font-bold text-cyan-300"></th>';
        tableHtml += '<th class="header-cell px-3 py-2 text-sm font-bold text-cyan-300">Ø</th>';
        for (let j = 0; j < n; j++) tableHtml += `<th class="header-cell px-3 py-2 text-sm font-bold text-cyan-300">${s2[j]}</th>`;
        tableHtml += '</tr></thead>';

        // Corpo (s1 e valori)
        tableHtml += '<tbody class="divide-y divide-gray-700">';
        for (let i = 0; i <= m; i++) {
            tableHtml += '<tr class="bg-gray-800 even:bg-gray-800/50">';
            // Intestazione riga (s1)
            tableHtml += `<td class="header-cell px-3 py-2 text-sm font-bold text-cyan-300">${(i === 0 ? 'Ø' : s1[i - 1])}</td>`;
            
            // Valori DP
            for (let j = 0; j <= n; j++) {
                tableHtml += `<td class="data-cell px-3 py-2 text-lg">`;
                // Caso base (prima riga e prima colonna): mostra il valore
                if (i === 0 || j === 0) {
                    tableHtml += `<span class="text-yellow-400 p-2">${dp[i][j]}</span>`;
                } else {
                    // Cella da compilare: mostra un input
                    tableHtml += `<input type="number" min="0" class="exercise-input" data-i="${i}" data-j="${j}">`;
                }
                tableHtml += `</td>`;
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';
        exerciseMatrixContainer.innerHTML = tableHtml;
    }

    if (checkSolutionBtn) {
        checkSolutionBtn.addEventListener('click', () => {
            if (!lcsExerciseSolution) return;

            const inputs = document.querySelectorAll('#exerciseMatrixContainer .exercise-input');
            let allCorrect = true;

            inputs.forEach(input => {
                const i = parseInt(input.dataset.i);
                const j = parseInt(input.dataset.j);
                const userValue = parseInt(input.value);
                const correctValue = lcsExerciseSolution[i][j];

                if (isNaN(userValue) || userValue !== correctValue) {
                    allCorrect = false;
                    input.classList.remove('bg-green-200');
                    input.classList.add('bg-pink-300'); // Sbagliato
                } else {
                    input.classList.remove('bg-pink-300');
                    input.classList.add('bg-green-200'); // Corretto
                }
            });

            // Mostra il risultato
            exerciseResult.classList.remove('hidden');
            if (allCorrect) {
                exerciseResult.textContent = "Corretto! Ottimo lavoro!";
                exerciseResult.classList.remove('text-red-400');
                exerciseResult.classList.add('text-green-400');
            } else {
                exerciseResult.textContent = "Ci sono degli errori. Le celle in rosa sono sbagliate. Riprova!";
                exerciseResult.classList.remove('text-green-400');
                exerciseResult.classList.add('text-red-400');
            }
        });
    }

    // --- INIT ---
    if (calculatorCalculateBtn) {
        calculatorCalculateBtn.click();
    }
});
