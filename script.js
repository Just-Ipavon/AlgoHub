// --- IMPOSTAZIONI E COSTANTI ---
const NODE_RADIUS = 20;
const VERTICAL_SPACING = 55;
const ANIMATION_SPEED = 500;
const ZOOM_SENSITIVITY = 0.001;
const SPRING = 0.08;
const FRICTION = 0.85;

// --- ELEMENTI DEL DOM ---
const canvas = document.getElementById('tree-canvas');
const ctx = canvas.getContext('2d');
const container = canvas.parentElement;
const insertBtn = document.getElementById('insert-btn');
const deleteBtn = document.getElementById('delete-btn');
const searchBtn = document.getElementById('search-btn');
const resetBtn = document.getElementById('reset-btn');
const valueInput = document.getElementById('node-value');
const listInput = document.getElementById('node-list');
const loadListBtn = document.getElementById('load-list-btn');
const treeTypeSelect = document.getElementById('tree-type');
const pseudoArea = document.getElementById('pseudo-code-area');
const pseudoHeader = document.getElementById('pseudo-code-header');
const pseudoContainer = document.getElementById('pseudo-code-container');
const pseudoTitle = document.getElementById('pseudo-title');
const messageOverlay = document.getElementById('message-overlay');
const logContainer = document.getElementById('log-container');
const logAreaContainer = document.getElementById('log-area-container');
const logResizer = document.getElementById('log-resizer');
const controlsPanel = document.getElementById('controls-panel');
const toggleControlsBtn = document.getElementById('toggle-controls-btn');

// --- STATO DELL'APPLICAZIONE ---
let tree = null;
let treeType = 'bst';
let animationQueue = [];
let numberListQueue = [];
let isAnimating = false;
let viewOffset = { x: 0, y: 50 };
let scale = 1.0;
let draggedNode = null;
let dragOffset = { x: 0, y: 0 };
let isDraggingCanvas = false;
let startDragPosition = { x: 0, y: 0 };
let isDraggingPseudo = false;
let pseudoDragOffset = { x: 0, y: 0 };
let selectedNode = null;
let highlightedNodes = [];

// --- CLASSI ALBERO ---
class Node {
    constructor(key, x = 0, y = 0) {
        this.key = key; this.left = null; this.right = null; this.parent = null;
        this.x = x; this.y = y; this.color = 'RED';
        this.vx = 0; this.vy = 0;
        this.targetX = x; this.targetY = y;
        this.highlightColor = null;
    }
}
class BinaryTree {
    constructor() { this.root = null; }
    insert(key) { throw new Error("Insert must be implemented"); }
    delete(key) { throw new Error("Delete must be implemented"); }
    search(key) { this.searchBST(key); }
    searchBST(key) {
        let current = this.root;
        animationQueue.push({ type: 'highlight-code', line: 'search-0' });
        animationQueue.push({ type: 'log', message: `Inizio ricerca per ${key}` });
        while (current !== null) {
            animationQueue.push({ type: 'highlight-node', node: current, color: '#3b82f6' });
            animationQueue.push({ type: 'highlight-code', line: 'search-1' });
            animationQueue.push({ type: 'log', message: `Confronto ${key} con ${current.key}` });
            if (key === current.key) {
                animationQueue.push({ type: 'highlight-node', node: current, color: '#10b981' });
                animationQueue.push({ type: 'highlight-code', line: 'search-2' });
                animationQueue.push({ type: 'log', message: `Valore ${key} trovato!` });
                return;
            }
            animationQueue.push({ type: 'highlight-code', line: 'search-3' });
            if (key < current.key) {
                animationQueue.push({ type: 'highlight-code', line: 'search-4' });
                current = current.left;
            } else {
                animationQueue.push({ type: 'highlight-code', line: 'search-5' });
                current = current.right;
            }
        }
        animationQueue.push({ type: 'highlight-code', line: 'search-6' });
        animationQueue.push({ type: 'log', message: `Valore ${key} non trovato.` });
    }
}
class BinarySearchTree extends BinaryTree {
    insert(key) {
        const newNode = new Node(key);
        animationQueue.push({ type: 'stage-node', node: newNode });
        animationQueue.push({ type: 'highlight-code', line: 'insert-bst-0' });
        if (this.root === null) {
            this.root = newNode;
            animationQueue.push({ type: 'highlight-code', line: 'insert-bst-1' });
            animationQueue.push({ type: 'update-tree', isInitializing: true });
            animationQueue.push({ type: 'log', message: `Albero vuoto. ${key} è la nuova radice.` });
        } else {
            let current = this.root; let parent;
            animationQueue.push({ type: 'highlight-code', line: 'insert-bst-2' });
            while (true) {
                parent = current;
                animationQueue.push({ type: 'highlight-node', node: current });
                animationQueue.push({ type: 'log', message: `Confronto ${key} con ${current.key}` });
                animationQueue.push({ type: 'highlight-code', line: 'insert-bst-3' });
                if (key < current.key) {
                    current = current.left;
                    animationQueue.push({ type: 'highlight-code', line: 'insert-bst-4' });
                    if (current === null) {
                        parent.left = newNode; newNode.parent = parent;
                        animationQueue.push({ type: 'highlight-code', line: 'insert-bst-5' });
                        animationQueue.push({ type: 'log', message: `Inserito ${key} a sinistra di ${parent.key}.` });
                        animationQueue.push({ type: 'update-tree' }); return;
                    }
                } else {
                    current = current.right;
                    animationQueue.push({ type: 'highlight-code', line: 'insert-bst-6' });
                    if (current === null) {
                        parent.right = newNode; newNode.parent = parent;
                        animationQueue.push({ type: 'highlight-code', line: 'insert-bst-7' });
                        animationQueue.push({ type: 'log', message: `Inserito ${key} a destra di ${parent.key}.` });
                        animationQueue.push({ type: 'update-tree' }); return;
                    }
                }
            }
        }
    }
    delete(key) {
        let nodeToDelete = this.findNode(key);
        if (!nodeToDelete) { animationQueue.push({ type: 'log', message: `Nodo ${key} non trovato.` }); return; }
        animationQueue.push({ type: 'highlight-node', node: nodeToDelete, color: '#ef4444' });
        animationQueue.push({ type: 'log', message: `Trovato nodo ${key} da cancellare.` });
        if (nodeToDelete.left === null && nodeToDelete.right === null) {
            animationQueue.push({ type: 'log', message: `Caso 1: È una foglia. Rimuovo.` });
            this.transplant(nodeToDelete, null);
        } else if (nodeToDelete.left === null) {
            animationQueue.push({ type: 'log', message: `Caso 2: Ha solo il figlio destro.` });
            this.transplant(nodeToDelete, nodeToDelete.right);
        } else if (nodeToDelete.right === null) {
            animationQueue.push({ type: 'log', message: `Caso 2: Ha solo il figlio sinistro.` });
            this.transplant(nodeToDelete, nodeToDelete.left);
        } else {
            animationQueue.push({ type: 'log', message: `Caso 3: Ha due figli. Trovo successore.` });
            let successor = this.minimum(nodeToDelete.right);
            animationQueue.push({ type: 'highlight-node', node: successor, color: '#eab308' });
            animationQueue.push({ type: 'log', message: `Successore è ${successor.key}.` });
            if (successor.parent !== nodeToDelete) {
                this.transplant(successor, successor.right);
                successor.right = nodeToDelete.right;
                successor.right.parent = successor;
            }
            this.transplant(nodeToDelete, successor);
            successor.left = nodeToDelete.left;
            successor.left.parent = successor;
        }
        animationQueue.push({ type: 'update-tree' });
    }
    findNode(key, startNode = this.root) {
        let current = startNode;
        while(current !== null && key !== current.key) {
            if (key < current.key) current = current.left;
            else current = current.right;
        }
        return current;
    }
    transplant(u, v) {
        if (u.parent === null) this.root = v;
        else if (u === u.parent.left) u.parent.left = v;
        else u.parent.right = v;
        if (v !== null) v.parent = u.parent;
    }
    minimum(node) {
        while (node.left !== null) node = node.left;
        return node;
    }
}
class RedBlackTree extends BinarySearchTree {
    insert(key) {
        let z = new Node(key);
        animationQueue.push({ type: 'stage-node', node: z });
        let y = null; let x = this.root;
        animationQueue.push({ type: 'highlight-code', line: 'insert-rbt-0' });
        animationQueue.push({ type: 'log', message: `Inserimento RBT di ${key}.`});
        while (x !== null) {
            y = x;
            animationQueue.push({ type: 'highlight-node', node: x });
            animationQueue.push({ type: 'log', message: `Confronto ${z.key} con ${x.key}` });
            if (z.key < x.key) x = x.left;
            else x = x.right;
        }
        z.parent = y;
        animationQueue.push({ type: 'highlight-code', line: 'insert-rbt-1' });
        if (y === null) this.root = z;
        else if (z.key < y.key) y.left = z;
        else y.right = z;
        
        animationQueue.push({ type: 'recolor-node', node: z, newColor: 'RED' });
        animationQueue.push({ type: 'log', message: `Inserito ${key} come nodo ROSSO.`});
        animationQueue.push({ type: 'update-tree' });
        animationQueue.push({ type: 'highlight-code', line: 'insert-rbt-2' });
        this.insertFixup(z);
    }
    insertFixup(z) {
        animationQueue.push({ type: 'highlight-code', line: 'fixup-0' });
        animationQueue.push({ type: 'log', message: `Avvio InsertFixup per ${z.key}.`});
        while (z.parent !== null && z.parent.color === 'RED') {
            animationQueue.push({ type: 'highlight-node', node: z, color: '#facc15' });
            animationQueue.push({ type: 'highlight-node', node: z.parent, color: '#facc15' });
            animationQueue.push({ type: 'highlight-code', line: 'fixup-1' });

            const isParentLeftChild = z.parent === z.parent.parent.left;
            let uncle = isParentLeftChild ? z.parent.parent.right : z.parent.parent.left;

            if (uncle !== null && uncle.color === 'RED') {
                animationQueue.push({ type: 'log', message: `Fixup Caso 1: Zio è ROSSO.`});
                animationQueue.push({ type: 'highlight-node', node: uncle, color: '#facc15' });
                animationQueue.push({ type: 'highlight-code', line: 'fixup-3' });
                animationQueue.push({ type: 'recolor-node', node: z.parent, newColor: 'BLACK' });
                animationQueue.push({ type: 'recolor-node', node: uncle, newColor: 'BLACK' });
                animationQueue.push({ type: 'recolor-node', node: z.parent.parent, newColor: 'RED' });
                z = z.parent.parent;
            } else {
                if ((isParentLeftChild && z === z.parent.right) || (!isParentLeftChild && z === z.parent.left)) {
                    animationQueue.push({ type: 'log', message: `Fixup Caso 2: Zio NERO, triangolo.`});
                    animationQueue.push({ type: 'highlight-code', line: 'fixup-4' });
                    z = z.parent;
                    isParentLeftChild ? this.leftRotate(z) : this.rightRotate(z);
                }
                animationQueue.push({ type: 'log', message: `Fixup Caso 3: Zio NERO, linea.`});
                animationQueue.push({ type: 'highlight-code', line: 'fixup-5' });
                animationQueue.push({ type: 'recolor-node', node: z.parent, newColor: 'BLACK' });
                animationQueue.push({ type: 'recolor-node', node: z.parent.parent, newColor: 'RED' });
                isParentLeftChild ? this.rightRotate(z.parent.parent) : this.leftRotate(z.parent.parent);
            }
             if (z === this.root) break;
        }
        animationQueue.push({ type: 'log', message: `Fixup terminato. Rendo radice NERA.`});
        animationQueue.push({ type: 'highlight-code', line: 'fixup-10' });
        animationQueue.push({ type: 'recolor-node', node: this.root, newColor: 'BLACK' });
    }
    leftRotate(x) {
        animationQueue.push({ type: 'log', message: `Rotazione a sinistra su ${x.key}.`});
        let y = x.right; x.right = y.left;
        if (y.left !== null) y.left.parent = x;
        y.parent = x.parent;
        if (x.parent === null) this.root = y;
        else if (x === x.parent.left) x.parent.left = y;
        else x.parent.right = y;
        y.left = x; x.parent = y;
        animationQueue.push({ type: 'update-tree' });
    }
    rightRotate(y) {
        animationQueue.push({ type: 'log', message: `Rotazione a destra su ${y.key}.`});
        let x = y.left; y.left = x.right;
        if (x.right !== null) x.right.parent = y;
        x.parent = y.parent;
        if (y.parent === null) this.root = x;
        else if (y === y.parent.right) y.parent.right = x;
        else y.parent.left = x;
        x.right = y; y.parent = x;
        animationQueue.push({ type: 'update-tree' });
    }
    delete(key) {
        let z = this.findNode(key);
        if (z === null) {
            animationQueue.push({ type: 'log', message: `Nodo ${key} non trovato.`, isError: true });
            return;
        }
        animationQueue.push({ type: 'log', message: `Inizio cancellazione RBT di ${key}.` });
        animationQueue.push({ type: 'highlight-node', node: z, color: '#ef4444' });

        let y = z;
        let yOriginalColor = y.color;
        let x;

        if (z.left === null) {
            x = z.right;
            this.transplant(z, z.right);
        } else if (z.right === null) {
            x = z.left;
            this.transplant(z, z.left);
        } else {
            y = this.minimum(z.right);
            yOriginalColor = y.color;
            x = y.right;
            if (y.parent === z) {
                if(x) x.parent = y;
            } else {
                this.transplant(y, y.right);
                y.right = z.right;
                y.right.parent = y;
            }
            this.transplant(z, y);
            y.left = z.left;
            y.left.parent = y;
            animationQueue.push({ type: 'recolor-node', node: y, newColor: z.color });
        }
        
        animationQueue.push({ type: 'update-tree' });
        animationQueue.push({ type: 'log', message: `Nodo rimosso. Colore originale: ${yOriginalColor}.` });

        if (yOriginalColor === 'BLACK') {
            this.deleteFixup(x);
        }
    }
    deleteFixup(x) {
        animationQueue.push({ type: 'log', message: `Avvio DeleteFixup.` });
        animationQueue.push({ type: 'highlight-code', line: 'dfix-0' });

        while (x !== this.root && (x === null || x.color === 'BLACK')) {
            if (x && x.parent) animationQueue.push({ type: 'highlight-node', node: x.parent, color: '#a78bfa' });
            
            const isLeftChild = x === (x.parent && x.parent.left);
            let w = isLeftChild ? x.parent.right : x.parent.left;

            if (w) {
                 animationQueue.push({ type: 'highlight-node', node: w, color: '#fde047' });
                 animationQueue.push({ type: 'log', message: `Sibling (w) è ${w.key}.` });
            }

            if (w && w.color === 'RED') {
                animationQueue.push({ type: 'log', message: `Fixup Caso 1` });
                animationQueue.push({ type: 'recolor-node', node: w, newColor: 'BLACK' });
                animationQueue.push({ type: 'recolor-node', node: x.parent, newColor: 'RED' });
                isLeftChild ? this.leftRotate(x.parent) : this.rightRotate(x.parent);
                w = isLeftChild ? x.parent.right : x.parent.left;
            }
            if (w && (w.left === null || w.left.color === 'BLACK') && (w.right === null || w.right.color === 'BLACK')) {
                 animationQueue.push({ type: 'log', message: `Fixup Caso 2` });
                animationQueue.push({ type: 'recolor-node', node: w, newColor: 'RED' });
                x = x.parent;
            } else if (w) {
                if (isLeftChild && (w.right === null || w.right.color === 'BLACK')) {
                    animationQueue.push({ type: 'log', message: `Fixup Caso 3` });
                    if(w.left) animationQueue.push({ type: 'recolor-node', node: w.left, newColor: 'BLACK' });
                    animationQueue.push({ type: 'recolor-node', node: w, newColor: 'RED' });
                    this.rightRotate(w);
                    w = x.parent.right;
                } else if (!isLeftChild && (w.left === null || w.left.color === 'BLACK')) {
                     animationQueue.push({ type: 'log', message: `Fixup Caso 3 (simmetrico)` });
                     if(w.right) animationQueue.push({ type: 'recolor-node', node: w.right, newColor: 'BLACK' });
                     animationQueue.push({ type: 'recolor-node', node: w, newColor: 'RED' });
                     this.leftRotate(w);
                     w = x.parent.left;
                }
                
                animationQueue.push({ type: 'log', message: `Fixup Caso 4` });
                animationQueue.push({ type: 'recolor-node', node: w, newColor: x.parent.color });
                animationQueue.push({ type: 'recolor-node', node: x.parent, newColor: 'BLACK' });
                if(isLeftChild && w.right) animationQueue.push({ type: 'recolor-node', node: w.right, newColor: 'BLACK' });
                else if (!isLeftChild && w.left) animationQueue.push({ type: 'recolor-node', node: w.left, newColor: 'BLACK' });
                isLeftChild ? this.leftRotate(x.parent) : this.rightRotate(x.parent);
                x = this.root;
            } else {
                 x = x.parent; // Should not happen in a valid RBT if x is not root
            }
        }
        if(x) animationQueue.push({ type: 'recolor-node', node: x, newColor: 'BLACK' });
    }
}


// --- FUNZIONI DI DISEGNO E LAYOUT ---
function updateNodePositions(node, x, y, hOffset, isInitializing = false) {
    if (!node) return;
    node.targetX = x;
    node.targetY = y;
    if (isInitializing) {
        node.x = x;
        node.y = y;
    }
    const nextOffset = hOffset / 1.8; 
    if (node.left) updateNodePositions(node.left, x - hOffset, y + VERTICAL_SPACING, nextOffset, isInitializing);
    if (node.right) updateNodePositions(node.right, x + hOffset, y + VERTICAL_SPACING, nextOffset, isInitializing);
}
function drawLine(from, to) {
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 2; ctx.stroke();
}
function drawNode(node) {
    if (selectedNode === node) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS + 8, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.fill();
    }
    if (node.highlightColor) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS + 4, 0, 2 * Math.PI);
        ctx.strokeStyle = node.highlightColor;
        ctx.lineWidth = 4;
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = (treeType === 'rbt' && node.color === 'RED' ? '#dc2626' : '#1f2937');
    ctx.fill();
    ctx.strokeStyle = (treeType === 'rbt' && node.color === 'BLACK') ? '#f9fafb' : '#6b7280';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#f9fafb'; ctx.font = '16px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(node.key, node.x, node.y);
}


// --- LOOP PRINCIPALE E GESTIONE ANIMAZIONE ---
function mainLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(viewOffset.x, viewOffset.y);
    ctx.scale(scale, scale);

    if (tree && tree.root) {
        const updateAndDraw = (node) => {
            if (!node) return;
            let forceX = (node.targetX - node.x) * SPRING;
            let forceY = (node.targetY - node.y) * SPRING;
            node.vx = (node.vx + forceX) * FRICTION;
            node.vy = (node.vy + forceY) * FRICTION;
            if (node !== draggedNode) {
                node.x += node.vx;
                node.y += node.vy;
            }
            updateAndDraw(node.left);
            updateAndDraw(node.right);
            if(node.left) drawLine(node, node.left);
            if(node.right) drawLine(node, node.right);
        };
        const drawNodesOnTop = (node) => {
             if (!node) return;
             drawNodesOnTop(node.left);
             drawNodesOnTop(node.right);
             drawNode(node);
        }
        updateAndDraw(tree.root);
        drawNodesOnTop(tree.root);
    }
    ctx.restore();
    requestAnimationFrame(mainLoop);
}

function clearAllAnimationHighlights() {
    highlightedNodes.forEach(n => n.highlightColor = null);
    highlightedNodes = [];
    const hl = pseudoContainer.querySelector('.highlight');
    if(hl) hl.classList.remove('highlight');
}

function processAnimationStep() {
    clearAllAnimationHighlights();

    if (animationQueue.length === 0) {
        isAnimating = false;
        if (numberListQueue.length > 0) {
            processNextInListQueue();
        } else {
            enableControls();
        }
        return;
    }

    const step = animationQueue.shift();
    switch (step.type) {
        case 'update-tree':
            if (tree.root) updateNodePositions(tree.root, 0, NODE_RADIUS, container.clientWidth / 6.0, step.isInitializing);
            break;
        case 'stage-node':
            let stagedX, stagedY;
            if (tree.root) {
                stagedX = tree.root.targetX - 150;
                stagedY = tree.root.targetY;
            } else {
                stagedX = 0;
                stagedY = NODE_RADIUS;
            }
            step.node.x = stagedX; step.node.y = stagedY;
            step.node.targetX = stagedX; step.node.targetY = stagedY;
            step.node.highlightColor = '#3b82f6';
            highlightedNodes.push(step.node);
            logMessage(`> Preparazione inserimento di ${step.node.key}`, 'info');
            break;
        case 'highlight-node':
            if(step.node) {
                step.node.highlightColor = step.color || '#eab308';
                highlightedNodes.push(step.node);
            }
            break;
        case 'recolor-node':
            if(step.node) {
                step.node.color = step.newColor;
                logMessage(`> Ricolora nodo ${step.node.key} in ${step.newColor}`, 'info');
            }
            break;
        case 'log':
            showMessage(step.message);
            logMessage(`> ${step.message}`, step.isError ? 'error' : 'info');
            break;
        case 'highlight-code':
            highlightPseudoCode(step.line);
            break;
    }
    setTimeout(processAnimationStep, ANIMATION_SPEED);
}

function startAnimation() {
    if (isAnimating || animationQueue.length === 0) return;
    isAnimating = true;
    disableControls();
    processAnimationStep();
}

function logMessage(message,type='info'){if(logContainer.children.length===1&&logContainer.children[0].textContent.includes('apparirà qui')){logContainer.innerHTML='';}const p=document.createElement('p');p.textContent=message;if(type==='error')p.className='log-error';logContainer.appendChild(p);logContainer.scrollTop=logContainer.scrollHeight;}
function showMessage(msg,type='info'){messageOverlay.textContent=msg;messageOverlay.className=`absolute top-4 left-1/2 -translate-x-1/2 text-gray-900 font-bold px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300 z-30 ${type==='error'?'bg-red-500':'bg-yellow-500'}`;messageOverlay.classList.remove('opacity-0');setTimeout(()=>messageOverlay.classList.add('opacity-0'),ANIMATION_SPEED*4);}
function highlightPseudoCode(lineId){const line=document.getElementById(lineId);if(line)line.classList.add('highlight');}
function disableControls(){[insertBtn,deleteBtn,searchBtn,resetBtn,treeTypeSelect,loadListBtn].forEach(el=>el.disabled=true);}
function enableControls(){[insertBtn,deleteBtn,searchBtn,resetBtn,treeTypeSelect,loadListBtn].forEach(el=>el.disabled=false);}

// --- GESTIONE EVENTI ---
function handleInsert(){const value=parseInt(valueInput.value);if(isNaN(value)||value<1||value>999){showMessage("Inserisci un valore valido (1-999).","error");return;}if(tree.findNode(value)){showMessage(`Il nodo ${value} esiste già.`,"error");return;}loadPseudoCode(treeType,'insert');tree.insert(value);valueInput.value='';startAnimation();}
function handleDelete(){const valueFromInput=parseInt(valueInput.value);let valueToDelete;if(selectedNode){valueToDelete=selectedNode.key;selectedNode=null;}else if(!isNaN(valueFromInput)){valueToDelete=valueFromInput;}else{showMessage("Seleziona un nodo o inserisci un valore da cancellare.","error");return;}loadPseudoCode(treeType,'delete');tree.delete(valueToDelete);valueInput.value='';startAnimation();}
function handleSearch(){const value=parseInt(valueInput.value);if(isNaN(value)){showMessage("Inserisci un valore da cercare.","error");return;}loadPseudoCode(treeType,'search');tree.search(value);valueInput.value='';startAnimation();}
function handleReset(){if(isAnimating)return;init();}
function handleTreeTypeChange(){if(isAnimating){treeTypeSelect.value=treeType;return;}treeType=treeTypeSelect.value;handleReset();}

function processNextInListQueue() {
    if (numberListQueue.length === 0) { enableControls(); return; }
    const num = numberListQueue.shift();
    if (tree.findNode(num)) {
        logMessage(`> Nodo ${num} già presente, saltato.`, 'info');
        processNextInListQueue(); 
        return;
    }
    tree.insert(num);
    startAnimation();
}

function handleLoadList(){
    if(isAnimating)return;
    const listStr=listInput.value;
    const numbers=listStr.split(',').map(s=>parseInt(s.trim())).filter(n=>!isNaN(n)&&n>=1&&n<=999);
    if(numbers.length===0){showMessage("Nessun numero valido nella lista.","error");return;}
    handleReset();
    loadPseudoCode(treeType,'insert');
    logMessage(`Caricamento della lista: ${numbers.join(', ')}`);
    numberListQueue=[...new Set(numbers)]; 
    listInput.value='';
    processNextInListQueue(); 
}


// --- DRAG, PAN & ZOOM ---
function getMousePos(evt) { const rect = canvas.getBoundingClientRect(); return { x: evt.clientX - rect.left, y: evt.clientY - rect.top }; }
function findNodeAtPos(node, x, y) {
    if (!node) return null;
    const worldMouseX = (x - viewOffset.x) / scale;
    const worldMouseY = (y - viewOffset.y) / scale;
    const dx = worldMouseX - node.x;
    const dy = worldMouseY - node.y;
    if (dx * dx + dy * dy < (NODE_RADIUS + 4) * (NODE_RADIUS + 4)) return node;
    return findNodeAtPos(node.left, x, y) || findNodeAtPos(node.right, x, y);
}
function forceMoveSubtree(node, dx, dy) {
    if (!node) return;
    node.x += dx; node.y += dy;
    node.targetX += dx; node.targetY += dy;
    forceMoveSubtree(node.left, dx, dy);
    forceMoveSubtree(node.right, dx, dy);
}
canvas.addEventListener('mousedown', (e) => {
    if (isAnimating) return;
    const pos = getMousePos(e);
    const clickedNode = findNodeAtPos(tree.root, pos.x, pos.y);
    if (clickedNode) {
        selectedNode = (selectedNode === clickedNode) ? null : clickedNode;
        valueInput.value = selectedNode ? selectedNode.key : '';
        draggedNode = clickedNode;
        draggedNode.vx = draggedNode.vy = 0;
        const worldMouseX = (pos.x - viewOffset.x) / scale;
        const worldMouseY = (pos.y - viewOffset.y) / scale;
        dragOffset = { x: worldMouseX - draggedNode.x, y: worldMouseY - draggedNode.y };
        canvas.classList.add('grabbing');
    } else {
        if(selectedNode) { selectedNode = null; valueInput.value = ''; }
        isDraggingCanvas = true;
        startDragPosition = { x: pos.x - viewOffset.x, y: pos.y - viewOffset.y };
        canvas.classList.add('grabbing');
    }
});
canvas.addEventListener('mousemove', (e) => {
    if (isAnimating) return;
    const pos = getMousePos(e);
    if (draggedNode) {
        const worldMouseX = (pos.x - viewOffset.x) / scale;
        const worldMouseY = (pos.y - viewOffset.y) / scale;
        const newX = worldMouseX - dragOffset.x;
        const newY = worldMouseY - dragOffset.y;
        const dx = newX - draggedNode.x;
        const dy = newY - draggedNode.y;
        forceMoveSubtree(draggedNode, dx, dy);
    } else if (isDraggingCanvas) {
        viewOffset.x = pos.x - startDragPosition.x;
        viewOffset.y = pos.y - startDragPosition.y;
    }
});
canvas.addEventListener('mouseup', () => { draggedNode = null; isDraggingCanvas = false; canvas.classList.remove('grabbing'); });
canvas.addEventListener('mouseleave', () => { if (draggedNode || isDraggingCanvas) canvas.dispatchEvent(new Event('mouseup')); });
canvas.addEventListener('wheel', (e) => { e.preventDefault(); const pos = getMousePos(e); const worldPosBeforeZoom = { x: (pos.x - viewOffset.x) / scale, y: (pos.y - viewOffset.y) / scale }; const zoom = 1 - e.deltaY * ZOOM_SENSITIVITY; const newScale = Math.max(0.1, Math.min(5, scale * zoom)); viewOffset.x = pos.x - worldPosBeforeZoom.x * newScale; viewOffset.y = pos.y - worldPosBeforeZoom.y * newScale; scale = newScale; });
window.addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT' || isAnimating) return; const panSpeed = 20; let moved = false; switch (e.key) { case 'ArrowUp': viewOffset.y += panSpeed; moved = true; break; case 'ArrowDown': viewOffset.y -= panSpeed; moved = true; break; case 'ArrowLeft': viewOffset.x += panSpeed; moved = true; break; case 'ArrowRight': viewOffset.x -= panSpeed; moved = true; break; } if (moved) { e.preventDefault(); } });
pseudoHeader.addEventListener('mousedown', (e) => { isDraggingPseudo = true; pseudoDragOffset.x = e.clientX - pseudoArea.offsetLeft; pseudoDragOffset.y = e.clientY - pseudoArea.offsetTop; document.body.style.userSelect = 'none'; });
document.addEventListener('mousemove', (e) => { if (isDraggingPseudo) { let newX = e.clientX - pseudoDragOffset.x; let newY = e.clientY - pseudoDragOffset.y; const maxX = window.innerWidth - pseudoArea.offsetWidth; const maxY = window.innerHeight - pseudoArea.offsetHeight; newX = Math.max(0, Math.min(newX, maxX)); newY = Math.max(0, Math.min(newY, maxY)); pseudoArea.style.left = `${newX}px`; pseudoArea.style.top = `${newY}px`; pseudoArea.style.right = 'auto'; } });
document.addEventListener('mouseup', () => { isDraggingPseudo = false; document.body.style.userSelect = ''; });
const startResizeLog = (e) => { e.preventDefault(); window.addEventListener('mousemove', resizeLog); window.addEventListener('mouseup', stopResizeLog); };
const resizeLog = (e) => { const newHeight = window.innerHeight - e.clientY; if (newHeight > 60 && newHeight < window.innerHeight * 0.7) { logAreaContainer.style.height = `${newHeight}px`; } };
const stopResizeLog = () => { window.removeEventListener('mousemove', resizeLog); window.removeEventListener('mouseup', stopResizeLog); };
logResizer.addEventListener('mousedown', startResizeLog);
toggleControlsBtn.addEventListener('click', () => { controlsPanel.classList.toggle('collapsed'); });

// --- PSEUDOCODICE ---
const pseudoCodes = { 
    bst: { insert: `<p id="insert-bst-0">Se l'albero è vuoto:</p><p id="insert-bst-1">&nbsp;&nbsp;Crea il nodo radice.</p><p id="insert-bst-2">Altrimenti, inizia dalla radice:</p><p id="insert-bst-3">&nbsp;&nbsp;Se valore < nodo corrente:</p><p id="insert-bst-4">&nbsp;&nbsp;&nbsp;&nbsp;Vai a sinistra.</p><p id="insert-bst-5">&nbsp;&nbsp;&nbsp;&nbsp;Se vuoto, inserisci qui.</p><p id="insert-bst-6">&nbsp;&nbsp;Altrimenti (valore >= nodo corrente):</p><p id="insert-bst-7">&nbsp;&nbsp;&nbsp;&nbsp;Vai a destra.</p><p id="insert-bst-8">&nbsp;&nbsp;&nbsp;&nbsp;Se vuoto, inserisci qui.</p>`, search: `<p id="search-0">Inizia dalla radice.</p><p id="search-1">Finché il nodo non è nullo:</p><p id="search-2">&nbsp;&nbsp;Se valore == nodo corrente, TROVATO.</p><p id="search-3">&nbsp;&nbsp;Se valore < nodo corrente:</p><p id="search-4">&nbsp;&nbsp;&nbsp;&nbsp;Vai a sinistra.</p><p id="search-5">&nbsp;&nbsp;Altrimenti, vai a destra.</p><p id="search-6">Se il nodo è nullo, NON TROVATO.</p>`, delete: `<p>1. Trova il nodo.</p><p>2. Se è una foglia, rimuovilo.</p><p>3. Se ha un figlio, sostituiscilo con il figlio.</p><p>4. Se ha due figli, trova il successore, scambia i valori e cancella il successore.</p>`,}, 
    rbt: { insert: `<p id="insert-rbt-0">1. Esegui un inserimento standard BST.</p><p id="insert-rbt-1">2. Colora il nuovo nodo di ROSSO.</p><p id="insert-rbt-2">3. Esegui InsertFixup per ripristinare le proprietà.</p>`, fixup: `<p id="fixup-0"><b>InsertFixup:</b></p><p id="fixup-1">Finché padre(z) è ROSSO:</p><p id="fixup-2">&nbsp;&nbsp;Se padre(z) è figlio sinistro:</p><p id="fixup-3">&nbsp;&nbsp;&nbsp;&nbsp;<b>Caso 1</b>: Zio è ROSSO -> Ricolora</p><p id="fixup-4">&nbsp;&nbsp;&nbsp;&nbsp;<b>Caso 2</b>: Zio NERO (triangolo) -> Rotazione Sinistra</p><p id="fixup-5">&nbsp;&nbsp;&nbsp;&nbsp;<b>Caso 3</b>: Zio NERO (linea) -> Rotazione Destra + Ricolora</p><p id="fixup-6">&nbsp;&nbsp;Altrimenti (padre(z) è figlio destro):</p><p id="fixup-7">&nbsp;&nbsp;&nbsp;&nbsp;...casi simmetrici...</p><p id="fixup-10">Infine, colora la radice di NERO.</p>`, 
           delete: `<p>1. Esegui una cancellazione standard BST.</p><p>2. Se il nodo rimosso era NERO, avvia DeleteFixup.</p><p id="dfix-0"><b>DeleteFixup:</b></p><p>Finché x non è radice ed è NERO:</p><p>&nbsp;&nbsp;Se x è figlio sinistro:</p><p>&nbsp;&nbsp;&nbsp;&nbsp;<b>Caso 1</b>: Fratello (w) è ROSSO.</p><p>&nbsp;&nbsp;&nbsp;&nbsp;<b>Caso 2</b>: Fratello (w) è NERO e i suoi figli sono NERI.</p><p>&nbsp;&nbsp;&nbsp;&nbsp;<b>Caso 3</b>: Fratello (w) è NERO, figlio sx ROSSO, dx NERO.</p><p>&nbsp;&nbsp;&nbsp;&nbsp;<b>Caso 4</b>: Fratello (w) è NERO, figlio dx ROSSO.</p><p>&nbsp;&nbsp;Altrimenti (x è figlio destro):</p><p>&nbsp;&nbsp;&nbsp;&nbsp;...casi simmetrici...</p><p>Infine, colora x di NERO.</p>`,
           search: `<p id="search-0">Inizia dalla radice.</p><p id="search-1">Finché il nodo non è nullo:</p><p id="search-2">&nbsp;&nbsp;Se valore == nodo corrente, TROVATO.</p><p id="search-3">&nbsp;&nbsp;Se valore < nodo corrente:</p><p id="search-4">&nbsp;&nbsp;&nbsp;&nbsp;Vai a sinistra.</p><p id="search-5">&nbsp;&nbsp;Altrimenti, vai a destra.</p><p id="search-6">Se il nodo è nullo, NON TROVATO.</p>`,}};
function loadPseudoCode(type,operation){let code='';const opName=operation.charAt(0).toUpperCase()+operation.slice(1);const typeName=type.toUpperCase();if(type==='rbt'&&operation==='insert'){code=pseudoCodes.rbt.insert+pseudoCodes.rbt.fixup;}else if(pseudoCodes[type]&&pseudoCodes[type][operation]){code=pseudoCodes[type][operation];}
pseudoContainer.innerHTML=code;pseudoTitle.textContent=`Pseudocodice: ${opName} ${typeName}`;}

// --- INIZIALIZZAZIONE ---
function init() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    treeType = treeTypeSelect.value;
    tree = (treeType === 'bst') ? new BinarySearchTree() : new RedBlackTree();
    scale = 1.0;
    viewOffset = { x: canvas.width / 2, y: 50 };
    numberListQueue = [];
    selectedNode = null;
    pseudoContainer.innerHTML='<p>Seleziona un\'operazione per vedere l\'algoritmo.</p>';
    pseudoTitle.textContent="Pseudocodice";
    logContainer.innerHTML='<p class="text-gray-500">Il log delle operazioni apparirà qui...</p>';
}

window.addEventListener('resize', () => {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
});
insertBtn.addEventListener('click', handleInsert);
deleteBtn.addEventListener('click', handleDelete);
searchBtn.addEventListener('click', handleSearch);
resetBtn.addEventListener('click', handleReset);
treeTypeSelect.addEventListener('change', handleTreeTypeChange);
loadListBtn.addEventListener('click', handleLoadList);
valueInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') handleInsert(); });

window.addEventListener('load', () => {
    init();
    mainLoop();
});

