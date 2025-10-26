document.addEventListener('DOMContentLoaded', () => {

    // --- CONTROLLO PAGINA ---
    // Esegui lo script solo se siamo nella pagina knapsack.html
    const solveButton = document.getElementById('solveButton');
    if (!solveButton) {
        return; // Non siamo nella pagina giusta
    }

    // --- LOGICA GESTIONE TAB ---
    const tabCalculator = document.getElementById('tabCalculator');
    const tabExercise = document.getElementById('tabExercise');
    const calculatorContent = document.getElementById('calculatorContent');
    const exerciseContent = document.getElementById('exerciseContent');

    if (tabCalculator && tabExercise) {
        tabCalculator.addEventListener('click', () => {
            if (calculatorContent) calculatorContent.classList.remove('hidden');
            if (exerciseContent) exerciseContent.classList.add('hidden');
            tabCalculator.classList.replace('bg-dracula-line', 'bg-dracula-purple');
            tabCalculator.classList.replace('text-dracula-fg/70', 'text-dracula-fg');
            tabExercise.classList.replace('bg-dracula-purple', 'bg-dracula-line');
            tabExercise.classList.replace('text-dracula-fg', 'text-dracula-fg/70');
        });

        tabExercise.addEventListener('click', () => {
            if (calculatorContent) calculatorContent.classList.add('hidden');
            if (exerciseContent) exerciseContent.classList.remove('hidden');
            tabCalculator.classList.replace('bg-dracula-purple', 'bg-dracula-line');
            tabCalculator.classList.replace('text-dracula-fg', 'text-dracula-fg/70');
            tabExercise.classList.replace('bg-dracula-line', 'bg-dracula-purple');
            tabExercise.classList.replace('text-dracula-fg/70', 'text-dracula-fg');
        });
    }

    // --- Variabili Globali per la Dimostrazione ---
    let items = [];
    let capacity = 5;
    let dpTable = [];

    // --- Riferimenti DOM per la Dimostrazione ---
    const capacityInput = document.getElementById('capacity');
    const addItemForm = document.getElementById('addItemForm');
    const itemNameInput = document.getElementById('itemName');
    const itemWeightInput = document.getElementById('itemWeight');
    const itemValueInput = document.getElementById('itemValue');
    const itemsList = document.getElementById('itemsList');
    const noItemsMsg = document.getElementById('no-items-msg');
    // solveButton già definito sopra
    const resetButton = document.getElementById('resetButton');
    const resultsDiv = document.getElementById('results');
    const maxValueSpan = document.getElementById('maxValue');
    const selectedItemsSpan = document.getElementById('selectedItems');
    
    const tableContainer = document.getElementById('dp-table-container');
    const dpTableElement = document.getElementById('dp-table');
    const speedSlider = document.getElementById('speedSlider');

    // --- Variabili Globali per la Pratica ---
    let practiceItems = [];
    let practiceCapacity = 0;
    let correctSolutionTable = [];

    // --- Riferimenti DOM per la Pratica ---
    const generatePracticeButton = document.getElementById('generatePracticeButton');
    const practiceProblemContainer = document.getElementById('practice-problem-container');
    const practiceCapacitySpan = document.getElementById('practice-capacity');
    const practiceItemsList = document.getElementById('practice-items-list');
    const practiceTableContainer = document.getElementById('practice-table-container');
    const practiceDpTableElement = document.getElementById('practice-dp-table');
    const verifyPracticeButton = document.getElementById('verifyPracticeButton');
    const practiceResult = document.getElementById('practice-result');


    // ######################################################
    // ### LOGICA PER LA DIMOSTRAZIONE
    // ######################################################

    // Helper function per la pausa
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Aggiungi oggetti di esempio per iniziare
    function addInitialItems() {
        items = [
            { name: 'Oggetto A', weight: 2, value: 6 },
            { name: 'Oggetto B', weight: 3, value: 10 },
            { name: 'Oggetto C', weight: 1, value: 3 }
        ];
        capacity = 5;
        capacityInput.value = 5;
        renderItemsList();
    }

    // Event Listener per 'addItemForm'
    addItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = itemNameInput.value.trim();
        const weight = parseInt(itemWeightInput.value);
        const value = parseInt(itemValueInput.value);

        if (name && weight > 0 && value >= 0) {
            items.push({ name, weight, value });
            renderItemsList();
            // Resetta il form
            itemNameInput.value = '';
            itemWeightInput.value = '';
            itemValueInput.value = '';
        }
    });

    // Event Listener per i pulsanti
    solveButton.addEventListener('click', solveKnapsack);
    resetButton.addEventListener('click', resetApp);
    capacityInput.addEventListener('change', () => {
        capacity = parseInt(capacityInput.value);
    });

    // Funzione principale per risolvere
    async function solveKnapsack() { 
        capacity = parseInt(capacityInput.value);
        if (items.length === 0 || capacity <= 0) {
            console.error("Aggiungi almeno un oggetto e imposta una capacità positiva.");
            return;
        }

        // Disabilita i pulsanti durante l'animazione
        solveButton.disabled = true;
        resetButton.disabled = true;
        solveButton.textContent = 'Calcolando...';

        // Pulisci visualizzazioni precedenti
        resultsDiv.classList.add('hidden');
        tableContainer.classList.add('hidden');
        document.querySelectorAll('.path-cell').forEach(cell => {
            cell.classList.remove('path-cell');
        });

        // 1. Esegui l'algoritmo DP e VISUALIZZA
        await visualizeAndSolveDP(); 

        // 3. Trova gli oggetti selezionati e illumina il percorso
        const selected = findSelectedItemsAndHighlight();

        // 4. Mostra i risultati
        displayResults(selected);
        
        // Riabilita i pulsanti
        solveButton.disabled = false;
        resetButton.disabled = false;
        solveButton.textContent = 'Risolvi e Visualizza';
    }

    // 1. Algoritmo Visualizzato
    async function visualizeAndSolveDP() {
        const n = items.length;
        // Inizializza la tabella DP
        dpTable = Array(n + 1).fill(0).map(() => Array(capacity + 1).fill(0));
        
        // Renderizza la struttura vuota della tabella
        renderEmptyDPTable();
        
        // Pausa breve per far vedere la tabella vuota
        await sleep(200);

        for (let i = 1; i <= n; i++) {
            const currentItem = items[i - 1];
            const wt = currentItem.weight;
            const val = currentItem.value;

            for (let w = 0; w <= capacity; w++) {
                // Trova le celle HTML rilevanti
                const cell = document.querySelector(`td[data-i="${i}"][data-w="${w}"]`);
                const cellExcluded = document.querySelector(`td[data-i="${i-1}"][data-w="${w}"]`);
                
                let cellIncluded = null;
                let valueIncluded = -1; // Usiamo -1 per indicare che non è calcolabile
                const valueExcluded = dpTable[i - 1][w];

                // Evidenzia celle (USA CLASSI DI style.css)
                if(cell) cell.classList.add('cell-current');
                if(cellExcluded) cellExcluded.classList.add('cell-dependency');

                if (wt <= w) {
                    // L'oggetto può entrare
                    cellIncluded = document.querySelector(`td[data-i="${i-1}"][data-w="${w - wt}"]`);
                    if(cellIncluded) cellIncluded.classList.add('cell-dependency');
                    
                    valueIncluded = val + dpTable[i - 1][w - wt];
                    dpTable[i][w] = Math.max(valueIncluded, valueExcluded);
                } else {
                    // L'oggetto è troppo pesante
                    dpTable[i][w] = valueExcluded;
                }
                
                // Pausa per l'animazione
                const speed = 510 - parseInt(speedSlider.value); 
                await sleep(speed); 

                // Aggiorna il valore nella cella
                if(cell) cell.textContent = dpTable[i][w];

                // Rimuovi evidenziazione (USA CLASSI DI style.css)
                if(cell) cell.classList.remove('cell-current');
                if(cellExcluded) cellExcluded.classList.remove('cell-dependency');
                if(cellIncluded) cellIncluded.classList.remove('cell-dependency');
            }
        }
    }

    // 2. Renderizza la Tabella DP VUOTA
    function renderEmptyDPTable() {
        // Pulisci la tabella precedente
        dpTableElement.innerHTML = '';
        
        const n = items.length;
        
        // Crea Intestazione (Capacità)
        const thead = document.createElement('thead');
        let headerRow = '<tr><th class="header-cell corner-cell">Oggetto / Capacità</th>';
        for (let w = 0; w <= capacity; w++) {
            headerRow += `<th class="header-cell min-w-[50px]">${w}</th>`;
        }
        headerRow += '</tr>';
        thead.innerHTML = headerRow;
        dpTableElement.appendChild(thead);

        // Crea Corpo Tabella
        const tbody = document.createElement('tbody');
        for (let i = 0; i <= n; i++) {
            const tr = document.createElement('tr');
            
            // Intestazione Riga (Nome Oggetto)
            const itemCell = document.createElement('th');
            // USA CLASSI DI style.css
            itemCell.className = 'header-cell item-cell min-w-[120px] text-left';
            itemCell.textContent = (i === 0) ? 'Nessuno' : items[i - 1].name;
            tr.appendChild(itemCell);

            // Celle Dati
            for (let w = 0; w <= capacity; w++) {
                const td = document.createElement('td');
                // USA CLASSI DI style.css
                td.className = 'data-cell text-center min-w-[50px]';
                // Inizializza con 0 solo per la prima riga, - per le altre
                td.textContent = (i === 0) ? '0' : '-';
                // Colora celle base
                if (i === 0) td.classList.add('text-dracula-yellow');
                
                // Aggiungi data attributes per una facile selezione
                td.dataset.i = i;
                td.dataset.w = w;
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
        dpTableElement.appendChild(tbody);
        tableContainer.classList.remove('hidden');
    }

    // 3. Trova Oggetti Selezionati e Illumina Percorso
    function findSelectedItemsAndHighlight() {
        const selected = [];
        let i = items.length;
        let w = capacity;

        while (i > 0 && w > 0) {
            // Illumina la cella corrente del percorso (USA CLASSE .path-cell da <style>)
            const cell = document.querySelector(`td[data-i="${i}"][data-w="${w}"]`);
            if (cell) cell.classList.add('path-cell');

            const currentItem = items[i - 1];
            const value = dpTable[i][w];
            const prevValue = dpTable[i - 1][w];

            if (value !== prevValue) {
                // Questo oggetto è stato incluso
                selected.push(currentItem);
                w = w - currentItem.weight;
                // Illumina anche la cella da cui proveniamo
                const prevDecisionCell = document.querySelector(`td[data-i="${i-1}"][data-w="${w}"]`);
                if (prevDecisionCell) prevDecisionCell.classList.add('path-cell');
            }
            i--;
        }
        // Illumina l'ultima cella (riga 0) se il percorso arriva lì
        const finalCell = document.querySelector(`td[data-i="${i}"][data-w="${w}"]`);
        if (finalCell) finalCell.classList.add('path-cell');

        return selected.reverse(); // Inverti per ordine corretto
    }

    // 4. Mostra i Risultati
    function displayResults(selected) {
        const maxValue = dpTable[items.length][capacity];
        maxValueSpan.textContent = maxValue;
        
        if (selected.length > 0) {
            selectedItemsSpan.textContent = selected.map(item => item.name).join(', ');
        } else {
            selectedItemsSpan.textContent = 'Nessuno';
        }
        resultsDiv.classList.remove('hidden');
    }

    // Aggiorna la lista degli oggetti nell'UI
    function renderItemsList() {
        itemsList.innerHTML = ''; // Pulisci la lista
        if (items.length === 0) {
            noItemsMsg.classList.remove('hidden');
            return;
        }

        noItemsMsg.classList.add('hidden');

        items.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center bg-dracula-line p-2 rounded shadow-sm';
            li.innerHTML = `
                <span class="text-dracula-fg">
                    <span class="font-semibold">${item.name}</span> 
                    (P: ${item.weight}, V: ${item.value})
                </span>
                <button data-index="${index}" class="removeItem text-dracula-red hover:text-dracula-red/80 font-bold text-xl px-2">
                    &times;
                </button>
            `;
            
            // Aggiungi event listener al pulsante di rimozione
            li.querySelector('.removeItem').addEventListener('click', (e) => {
                // Usa currentTarget per assicurarti di ottenere il bottone
                const itemIndex = parseInt(e.currentTarget.dataset.index);
                items.splice(itemIndex, 1);
                renderItemsList(); // Ridisegna la lista
            });

            itemsList.appendChild(li);
        });
    }

    // Resetta l'applicazione
    function resetApp() {
        items = [];
        capacity = 5;
        capacityInput.value = 5;
        dpTable = [];
        
        renderItemsList();
        
        // Pulisci visualizzazioni
        resultsDiv.classList.add('hidden');
        tableContainer.classList.add('hidden');
        
        // Aggiungi di nuovo gli oggetti di esempio
        addInitialItems();

        // Assicurati che i pulsanti siano riattivati
        solveButton.disabled = false;
        resetButton.disabled = false;
        solveButton.textContent = 'Risolvi e Visualizza';
    }
    // Carica gli oggetti di esempio all'avvio
    addInitialItems();


    // ######################################################
    // ### LOGICA PER LA MODALITÀ PRATICA
    // ######################################################

    // Event Listener per i pulsanti di pratica
    generatePracticeButton.addEventListener('click', generatePracticeProblem);
    verifyPracticeButton.addEventListener('click', verifyPracticeSolution);

    /**
     * Genera un nuovo problema di pratica
     */
    function generatePracticeProblem() {
        practiceItems = [];
        
        // 1. Genera Capacità (tra 8 e 12)
        practiceCapacity = 8 + Math.floor(Math.random() * 5);
        
        // 2. Genera Oggetti
        let w1 = 2 + Math.floor(Math.random() * 3); // Peso: 2-4
        let v1 = 8 + Math.floor(Math.random() * 5); // Valore: 8-12
        let w2 = 3 + Math.floor(Math.random() * 3); // Peso: 3-5
        let v2 = 9 + Math.floor(Math.random() * 6); // Valore: 9-14
        if (w1 + w2 > practiceCapacity) {
            w2 = 1; // Fallback
        }
        
        let w3 = 5 + Math.floor(Math.random() * 4); // Peso: 5-8
        let v3 = v1 + v2 - (5 + Math.floor(Math.random() * 5)); // Valore: < v1+v2
        if (v3 < 1) v3 = v1; // Fallback

        let w4 = 2 + Math.floor(Math.random() * 2); // Peso: 2-3
        let v4 = 3 + Math.floor(Math.random() * 3); // Valore: 3-5

        practiceItems = [
            { name: 'Smeraldo', weight: w1, value: v1 },
            { name: 'Rubino', weight: w2, value: v2 },
            { name: 'Diamante', weight: w3, value: v3 },
            { name: 'Zaffiro', weight: w4, value: v4 }
        ];
        
        // 3. Mostra il problema
        renderPracticeProblem();

        // 4. Renderizza la tabella di input
        renderPracticeTable();

        // 5. Mostra i contenitori
        practiceProblemContainer.classList.remove('hidden');
        practiceTableContainer.classList.remove('hidden');
        practiceResult.classList.add('hidden');
        practiceResult.textContent = '';
    }

    /**
     * Mostra la capacità e gli oggetti del problema di pratica
     */
    function renderPracticeProblem() {
        practiceCapacitySpan.textContent = practiceCapacity;
        practiceItemsList.innerHTML = '';
        practiceItems.forEach(item => {
            const li = document.createElement('li');
            li.className = 'text-dracula-fg';
            li.innerHTML = `
                <span class="font-semibold">${item.name}</span> 
                (Peso: ${item.weight}, Valore: ${item.value})
            `;
            practiceItemsList.appendChild(li);
        });
    }

    /**
     * Renderizza la tabella di pratica con i campi <input>
     */
    function renderPracticeTable() {
        practiceDpTableElement.innerHTML = '';
        const n = practiceItems.length;

        // Crea Intestazione (Capacità)
        const thead = document.createElement('thead');
        let headerRow = '<tr><th class="header-cell corner-cell">Oggetto / Capacità</th>';
        for (let w = 0; w <= practiceCapacity; w++) {
            headerRow += `<th class="header-cell min-w-[50px]">${w}</th>`;
        }
        headerRow += '</tr>';
        thead.innerHTML = headerRow;
        practiceDpTableElement.appendChild(thead);

        // Crea Corpo Tabella
        const tbody = document.createElement('tbody');
        for (let i = 0; i <= n; i++) {
            const tr = document.createElement('tr');
            
            // Intestazione Riga (Nome Oggetto)
            const itemCell = document.createElement('th');
            // USA CLASSI DI style.css
            itemCell.className = 'header-cell item-cell min-w-[120px] text-left';
            itemCell.textContent = (i === 0) ? 'Nessuno' : practiceItems[i - 1].name;
            tr.appendChild(itemCell);

            // Celle Dati (Input)
            for (let w = 0; w <= practiceCapacity; w++) {
                const td = document.createElement('td');
                // USA CLASSI DI style.css
                td.className = 'data-cell p-0 text-center min-w-[50px]';
                
                if (i === 0) {
                    // Cella base, non input
                    td.textContent = 0;
                    td.classList.add('text-dracula-yellow');
                } else {
                    // Cella input
                    const input = document.createElement('input');
                    input.type = 'number';
                    // USA CLASSI DI style.css
                    input.className = 'exercise-input'; 
                    input.dataset.i = i;
                    input.dataset.w = w;
                    td.appendChild(input);
                }
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
        practiceDpTableElement.appendChild(tbody);
    }

    /**
     * Calcola la soluzione corretta (logica DP pura)
     */
    function calculateCorrectSolution(items, capacity) {
        const n = items.length;
        const dp = Array(n + 1).fill(0).map(() => Array(capacity + 1).fill(0));

        for (let i = 1; i <= n; i++) {
            const currentItem = items[i - 1];
            const wt = currentItem.weight;
            const val = currentItem.value;

            for (let w = 0; w <= capacity; w++) {
                const valueExcluded = dp[i - 1][w];
                if (wt <= w) {
                    const valueIncluded = val + dp[i - 1][w - wt];
                    dp[i][w] = Math.max(valueIncluded, valueExcluded);
                } else {
                    dp[i][w] = valueExcluded;
                }
            }
        }
        return dp;
    }

    /**
     * Verifica la soluzione inserita dall'utente
     */
    function verifyPracticeSolution() {
        // 1. Calcola la soluzione corretta
        correctSolutionTable = calculateCorrectSolution(practiceItems, practiceCapacity);
        
        let errorCount = 0;
        const n = practiceItems.length;

        // 2. Itera su tutti gli input dell'utente
        for (let i = 1; i <= n; i++) {
            for (let w = 0; w <= practiceCapacity; w++) {
                const input = document.querySelector(`#practice-dp-table input[data-i="${i}"][data-w="${w}"]`);
                if (!input) continue;
                
                const userValue = (input.value === '') ? -1 : parseInt(input.value);
                const correctValue = correctSolutionTable[i][w];

                // Rimuovi classi vecchie (USA CLASSI DI style.css)
                input.classList.remove('bg-green-200', 'bg-pink-300');

                if (userValue === correctValue) {
                    input.classList.add('bg-green-200'); // Corretto
                } else {
                    input.classList.add('bg-pink-300'); // Sbagliato
                    errorCount++;
                }
            }
        }

        // 3. Mostra il risultato
        practiceResult.classList.remove('hidden');
        if (errorCount === 0) {
            practiceResult.textContent = `Congratulazioni! La tabella è corretta. Il valore massimo è ${correctSolutionTable[n][practiceCapacity]}.`;
            // USA CLASSI DI style.css
            practiceResult.className = 'mt-4 text-center text-lg font-semibold text-dracula-green';
        } else {
            practiceResult.textContent = `Hai ${errorCount} ${errorCount === 1 ? 'errore' : 'errori'}. Riprova! (Le celle in rosa sono sbagliate)`;
            // USA CLASSI DI style.css
            practiceResult.className = 'mt-4 text-center text-lg font-semibold text-dracula-red';
        }
    }

}); // Fine DOMContentLoaded
