// --- VARIABILI GLOBALI ---
let exerciseSolutionDP = null;
let allSteps = [];
let currentStepIndex = 0;
let fullDPMatrix = null;
let currentS1 = "";
let currentS2 = "";
// Nuove variabili per l'animazione
let animationInterval = null;
let isPlaying = false;
let animationSpeed = 1050 - 750; // Valore iniziale dallo slider (1050 - 750 = 300ms)

// --- SELETTORI DOM ---
// Assicurati che il DOM sia caricato prima di cercare gli elementi
document.addEventListener('DOMContentLoaded', () => {

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
    const calculatorDistanceOutput = document.getElementById('calculatorDistanceOutput');
    
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

    // --- FUNZIONE CORE ALGORITMO ---

    /**
     * Calcola la distanza di Levenshtein e restituisce la matrice DP E i passi.
     * @param {string} s1 - La prima stringa.
     * @param {string} s2 - La seconda stringa.
     * @returns {{distance: number, dp: number[][], steps: object[]}}
     */
    function levenshtein(s1, s2) {
        const steps = [];
        const m = s1.length;
        const n = s2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        // Line 'init-i' (riga 5)
        for (let i = 0; i <= m; i++) {
            dp[i][0] = i;
            steps.push({ i, j: 0, value: i, line: 'init-i', info: `Cella base [${i},0]: Costo per creare "" da "${s1.substring(0, i)}" è ${i}. (Riga 6)` });
        }
        // Line 'init-j' (riga 7)
        for (let j = 1; j <= n; j++) { // Start from 1, 0,0 è già fatto da init-i
            dp[0][j] = j;
            steps.push({ i: 0, j, value: j, line: 'init-j', info: `Cella base [0,${j}]: Costo per creare "${s2.substring(0, j)}" da "" è ${j}. (Riga 8)` });
        }

        // Line 'loop-i', 'loop-j' (righe 10, 11)
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                
                // Line 'cost' (righe 12-15)
                // NOTA: Pseudocodice Cormen usa indici 1-based per stringhe, JS usa 0-based
                const cost = s1[i - 1] === s2[j - 1] ? 0 : 1; 

                // Line 'min' (righe 17-19)
                const del = dp[i - 1][j] + 1;
                const ins = dp[i][j - 1] + 1;
                const sub = dp[i - 1][j - 1] + cost;
                dp[i][j] = Math.min(del, ins, sub);
                
                let info = `Calcolo [${i},${j}]:\n`;
                info += `A[${i-1}] ('${s1[i-1]}') vs B[${j-1}] ('${s2[j-1]}')\n`;
                info += `Costo Sostituzione (cost): ${cost}\n\n`;
                info += `Cancellazione (da sopra): ${dp[i-1][j]} + 1 = ${del}\n`;
                info += `Inserimento (da sinistra): ${dp[i][j-1]} + 1 = ${ins}\n`;
                info += `Sostituzione (da diagonale): ${dp[i-1][j-1]} + ${cost} = ${sub}\n\n`;
                info += `d[${i},${j}] = min(${del}, ${ins}, ${sub}) = ${dp[i][j]}`;

                steps.push({ 
                    i, j, value: dp[i][j], 
                    cost, del, ins, sub, 
                    line: 'min', // Evidenzia il blocco 'min' che include 'cost'
                    info
                });
            }
        }
        return { distance: dp[m][n], dp: dp, steps: steps };
    }

    // --- LOGICA GESTIONE TAB ---

    function showCalculatorTab() {
        calculatorContent.classList.remove('hidden');
        exerciseContent.classList.add('hidden');
        tabCalculator.classList.replace('bg-gray-700', 'bg-cyan-600');
        tabCalculator.classList.replace('text-gray-300', 'text-white');
        tabExercise.classList.replace('bg-cyan-600', 'bg-gray-700');
        tabExercise.classList.replace('text-white', 'text-gray-300');
    }

    function showExerciseTab() {
        calculatorContent.classList.add('hidden');
        exerciseContent.classList.remove('hidden');
        tabCalculator.classList.replace('bg-cyan-600', 'bg-gray-700');
        tabCalculator.classList.replace('text-white', 'text-gray-300');
        tabExercise.classList.replace('bg-gray-700', 'bg-cyan-600');
        tabExercise.classList.replace('text-gray-300', 'text-white');
    }

    tabCalculator.addEventListener('click', showCalculatorTab);
    tabExercise.addEventListener('click', showExerciseTab);

    // --- LOGICA CALCOLATORE ---

    calculatorCalculateBtn.addEventListener('click', () => {
        currentS1 = calculatorString1Input.value;
        currentS2 = calculatorString2Input.value;
        
        const { distance, dp, steps } = levenshtein(currentS1, currentS2);

        // Salva stato globale
        allSteps = steps;
        fullDPMatrix = dp;
        currentStepIndex = 0;

        // !!! NEW: Reset animazione
        stopAnimation();
        playPauseBtn.textContent = "Avvia Animazione";
        isPlaying = false;

        // Mostra risultato
        calculatorDistanceOutput.textContent = distance;
        calculatorResultArea.classList.remove('hidden');
        
        // Imposta la vista di default (Step-by-Step)
        calculatorInteractiveArea.classList.remove('hidden');
        calculatorMatrixContainerWrapper.classList.add('hidden');
        toggleViewBtn.textContent = "Mostra Matrice Completa";

        // Renderizza il primo passo
        renderCurrentStep();
    });

    toggleViewBtn.addEventListener('click', () => {
        const isShowingSteps = !calculatorInteractiveArea.classList.contains('hidden');
        if (isShowingSteps) {
            // Passa a Matrice Completa
            calculatorInteractiveArea.classList.add('hidden');
            calculatorMatrixContainerWrapper.classList.remove('hidden');
            toggleViewBtn.textContent = "Mostra Step-by-Step";
            // !!! NEW: Ferma l'animazione se si cambia vista
            stopAnimation();
            // Renderizza la matrice completa
            renderCalculatorMatrix(fullDPMatrix, currentS1, currentS2);
        } else {
            // Passa a Step-by-Step
            calculatorInteractiveArea.classList.remove('hidden');
            calculatorMatrixContainerWrapper.classList.add('hidden');
            toggleViewBtn.textContent = "Mostra Matrice Completa";
            // Renderizza lo stato corrente
            renderCurrentStep();
        }
    });

    /**
     * Renderizza la matrice DP (Calcolatore) come tabella HTML statica.
     */
    function renderCalculatorMatrix(dp, s1, s2) {
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
                tableHtml += `<td class="${cellClass}">${dp[i][j]}</td>`;
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';
        calculatorMatrixContainer.innerHTML = tableHtml;
    }

    // --- LOGICA STEP-BY-STEP ---

    function playAnimation() {
        isPlaying = true;
        playPauseBtn.textContent = "Pausa";
        animationInterval = setTimeout(stepForward, animationSpeed);
    }

    function stopAnimation() {
        isPlaying = false;
        if (allSteps.length === 0 || currentStepIndex < allSteps.length - 1) {
            playPauseBtn.textContent = "Continua";
        } else {
            playPauseBtn.textContent = "Ricomincia";
        }
        if (animationInterval) {
            clearTimeout(animationInterval);
            animationInterval = null;
        }
    }

    function toggleAnimation() {
        if (isPlaying) {
            stopAnimation();
        } else {
            // Se è alla fine, resetta prima di avviare
            if (allSteps.length > 0 && currentStepIndex === allSteps.length - 1) {
                currentStepIndex = 0;
                renderCurrentStep(); // Mostra il primo passo prima di iniziare
            }
            playAnimation();
        }
    }

    function stepForward() {
        if (currentStepIndex < allSteps.length - 1) {
            currentStepIndex++;
            renderCurrentStep();
            // Schedula il prossimo passo
            animationInterval = setTimeout(stepForward, animationSpeed);
        } else {
            // Animazione finita
            stopAnimation();
        }
    }

    function changeSpeed() {
        // Valore max (1000) = veloce (delay 50ms)
        // Valore min (50) = lento (delay 1000ms)
        animationSpeed = 1050 - parseInt(speedSlider.value, 10);
    }

    function resetAnimation() {
        stopAnimation();
        currentStepIndex = 0;
        renderCurrentStep();
        playPauseBtn.textContent = "Avvia Animazione";
    }

    playPauseBtn.addEventListener('click', toggleAnimation);
    speedSlider.addEventListener('input', changeSpeed);
    resetStepBtn.addEventListener('click', resetAnimation);


    /**
     * Funzione principale che orchestra il rendering di un singolo passo.
     */
    function renderCurrentStep() {
        if (allSteps.length === 0) return;

        const currentStep = allSteps[currentStepIndex];
        
        // 1. Renderizza la matrice
        renderStepMatrix(currentStep);
        
        // 2. Aggiorna info e pseudocodice
        updateStepInfo(currentStep);
        highlightPseudocode(currentStep.line);

        // 3. Aggiorna contatore e pulsanti
        stepCounter.textContent = `Passo ${currentStepIndex + 1} / ${allSteps.length}`;
    }

    /**
     * Renderizza la tabella HTML per lo step-by-step.
     */
    function renderStepMatrix(currentStep) {
        const m = currentS1.length;
        const n = currentS2.length;
        const ci = currentStep.i;
        const cj = currentStep.j;

        let tableHtml = `<table class="min-w-full divide-y divide-gray-700 text-center font-mono">`;
        
        // Intestazione (s2)
        tableHtml += '<thead class="bg-gray-700"><tr>';
        tableHtml += '<th class="header-cell px-3 py-2 text-sm font-bold text-cyan-300"></th>';
        tableHtml += '<th class="header-cell px-3 py-2 text-sm font-bold text-cyan-300">Ø</th>';
        for (let j = 0; j < n; j++) tableHtml += `<th class="header-cell px-3 py-2 text-sm font-bold text-cyan-300">${currentS2[j]}</th>`;
        tableHtml += '</tr></thead>';

        // Corpo (s1 e valori)
        tableHtml += '<tbody class="divide-y divide-gray-700">';
        
        // Crea una mappa dei valori calcolati fino ad ora
        const calculatedValues = new Map();
        for (let k = 0; k <= currentStepIndex; k++) {
            calculatedValues.set(`${allSteps[k].i},${allSteps[k].j}`, allSteps[k].value);
        }

        for (let i = 0; i <= m; i++) {
            tableHtml += '<tr class="bg-gray-800 even:bg-gray-800/50">';
            tableHtml += `<td class="header-cell px-3 py-2 text-sm font-bold text-cyan-300">${(i === 0 ? 'Ø' : currentS1[i - 1])}</td>`;
            
            for (let j = 0; j <= n; j++) {
                let cellClass = "data-cell step-cell px-3 py-2 text-lg";
                let cellValue = "?";

                if (calculatedValues.has(`${i},${j}`)) {
                    cellValue = calculatedValues.get(`${i},${j}`);
                    if (i === 0 || j === 0) cellClass += " text-yellow-400";
                } else {
                    cellClass += " cell-future";
                }

                // Evidenziazione
                if (i === ci && j === cj) {
                    cellClass += " cell-current"; // Cella corrente
                } else if (currentStep.line === 'min' && 
                           ((i === ci - 1 && j === cj) || // Sopra
                            (i === ci && j === cj - 1) || // Sinistra
                            (i === ci - 1 && j === cj - 1))) { // Diagonale
                    cellClass += " cell-dependency";
                }

                tableHtml += `<td class="${cellClass}">${cellValue}</td>`;
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';
        stepMatrixContainer.innerHTML = tableHtml;
    }

    /**
     * Aggiorna il pannello info.
     */
    function updateStepInfo(step) {
        stepInfo.innerHTML = step.info.replace(/\n/g, '<br>');
    }

    /**
     * Evidenzia la riga corretta dello pseudocodice.
     */
    function highlightPseudocode(lineId) {
        // Rimuovi tutti gli highlight
        pseudocodeEl.querySelectorAll('.pseudo-line').forEach(line => {
            line.classList.remove('highlight');
        });

        // Logica di evidenziazione specifica
        let linesToHighlight = [lineId]; // Default
        if (lineId === 'init-i') linesToHighlight = ['init-i'];
        if (lineId === 'init-j') linesToHighlight = ['init-j'];
        if (lineId === 'min') {
            linesToHighlight = ['loop-i', 'loop-j', 'cost', 'min'];
        }

        // Aggiungi highlight alle righe corrette
        linesToHighlight.forEach(id => {
            pseudocodeEl.querySelectorAll(`[data-line-id="${id}"]`).forEach(line => {
                line.classList.add('highlight');
            });
        });
    }


    // --- LOGICA ESERCIZIO ---

    // Genera stringhe casuali
    generateStringsBtn.addEventListener('click', () => {
        const alphabet = "abcdefghijklmnopqrstuvwxyz";
        
        // 1. Genera s1 (stringa base)
        const len1 = Math.floor(Math.random() * 3) + 4; // Lunghezza 4-6
        let s1 = "";
        for (let i = 0; i < len1; i++) {
            s1 += alphabet[Math.floor(Math.random() * alphabet.length)];
        }

        // 2. Crea s2 modificando s1 per renderla simile
        let s2_array = s1.split('');
        
        // Calcola 'm' come da richiesta
        const m = (len1 <= 5) ? 1 : 2; // m=1 se n=4,5. m=2 se n=6

        // Calcola il numero massimo di modifiche (n-m)
        const max_edits = len1 - m; // Es: n=4 -> m=1 -> max=3. n=6 -> m=2 -> max=4.

        // Calcola il numero effettivo di modifiche (da 1 a max_edits)
        const edits = Math.floor(Math.random() * max_edits) + 1;

        for (let k = 0; k < edits; k++) {
            const operation = Math.floor(Math.random() * 3); // 0: Sostituzione, 1: Inserimento, 2: Eliminazione
            
            // 0: Sostituzione (se la stringa non è vuota)
            if (operation === 0 && s2_array.length > 0) {
                const pos = Math.floor(Math.random() * s2_array.length);
                const originalChar = s2_array[pos];
                let newChar;
                do {
                    newChar = alphabet[Math.floor(Math.random() * alphabet.length)];
                } while (newChar === originalChar); // Assicura che sia una modifica reale
                s2_array[pos] = newChar;
            } 
            // 1: Inserimento (con un limite di lunghezza massima)
            else if (operation === 1 && s2_array.length < 7) { 
                const pos = Math.floor(Math.random() * (s2_array.length + 1)); // Può inserire all'inizio o alla fine
                const newChar = alphabet[Math.floor(Math.random() * alphabet.length)];
                s2_array.splice(pos, 0, newChar);
            } 
            // 2: Eliminazione (con un limite di lunghezza minima)
            else if (operation === 2 && s2_array.length > 3) { 
                const pos = Math.floor(Math.random() * s2_array.length);
                s2_array.splice(pos, 1);
            }
        }
        
        let s2 = s2_array.join('');

        // Assegna le stringhe simili
        exerciseString1Input.value = s1;
        exerciseString2Input.value = s2;
        
        // Nasconde la vecchia matrice se presente
        exerciseMatrixContainer.classList.add('hidden');
        checkSolutionBtn.classList.add('hidden');
        exerciseResult.classList.add('hidden');
    });

    // Inizia l'esercizio
    startExerciseBtn.addEventListener('click', () => {
        const s1 = exerciseString1Input.value;
        const s2 = exerciseString2Input.value;
        
        if (s1.length === 0 || s2.length === 0) {
            exerciseResult.textContent = "Inserisci entrambe le stringhe per iniziare.";
            exerciseResult.classList.remove('hidden', 'text-green-400');
            exerciseResult.classList.add('text-yellow-400');
            return;
        }

        // Calcola la soluzione e la salva
        const { dp } = levenshtein(s1, s2);
        exerciseSolutionDP = dp;

        // Renderizza la matrice con input
        renderExerciseMatrix(s1, s2, dp);
        
        // Mostra la matrice e il pulsante di verifica
        exerciseMatrixContainer.classList.remove('hidden');
        checkSolutionBtn.classList.remove('hidden');
        exerciseResult.classList.add('hidden'); // Nasconde messaggi precedenti
    });

    /**
     * Renderizza la matrice (Esercizio) con celle input per l'utente.
     */
    function renderExerciseMatrix(s1, s2, dp) {
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

    // Verifica la soluzione
    checkSolutionBtn.addEventListener('click', () => {
        if (!exerciseSolutionDP) return; // Non dovrebbe succedere

        const inputs = document.querySelectorAll('#exerciseMatrixContainer .exercise-input');
        let allCorrect = true;

        inputs.forEach(input => {
            const i = parseInt(input.dataset.i);
            const j = parseInt(input.dataset.j);
            const userValue = parseInt(input.value);
            const correctValue = exerciseSolutionDP[i][j];

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


    // --- INIT ---
    // Esegui un calcolo all'avvio per mostrare un esempio nel calcolatore
    calculatorCalculateBtn.click();
});
