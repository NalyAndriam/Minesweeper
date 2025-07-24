function startGame(rows, cols, mines) {
    window.location.href = `game.html?rows=${rows}&cols=${cols}&mines=${mines}`;
}

const urlParams = new URLSearchParams(window.location.search);
const ROWS = parseInt(urlParams.get('rows')) || 10;
const COLS = parseInt(urlParams.get('cols')) || 10;
const MINES = parseInt(urlParams.get('mines')) || 10;
let board = [];
let revealed = [];
let flags = [];
let flagCount = 0;
let timer = 0;
let timerInterval = null;
let gameStarted = false;

function initializeBoard() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    revealed = Array(ROWS).fill().map(() => Array(COLS).fill(false));
    flags = Array(ROWS).fill().map(() => Array(COLS).fill(false));
    flagCount = 0;
    updateFlagsDisplay();

    let minePositions = [];
    while (minePositions.length < MINES) {
        const x = Math.floor(Math.random() * ROWS);
        const y = Math.floor(Math.random() * COLS);
        if (!minePositions.some(pos => pos[0] === x && pos[1] === y)) {
            minePositions.push([x, y]);
            board[x][y] = 'M';
        }
    }

    for (let x = 0; x < ROWS; x++) {
        for (let y = 0; y < COLS; y++) {
            if (board[x][y] === 'M') continue;
            let count = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const nx = x + i;
                    const ny = y + j;
                    if (nx >= 0 && nx < ROWS && ny >= 0 && ny < COLS && board[nx][ny] === 'M') {
                        count++;
                    }
                }
            }
            board[x][y] = count;
        }
    }
}

function renderBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.style.gridTemplateColumns = `repeat(${COLS}, 30px)`;
    gameBoard.innerHTML = '';
    for (let x = 0; x < ROWS; x++) {
        for (let y = 0; y < COLS; y++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            if (revealed[x][y]) {
                cell.classList.add('revealed');
                cell.textContent = board[x][y] === 'M' ? '💣' : board[x][y] || '';
            } else if (flags[x][y]) {
                cell.classList.add('flag');
                cell.textContent = '🚩';
            }
            cell.addEventListener('click', () => handleClick(x, y));
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                handleRightClick(x, y);
            });
            gameBoard.appendChild(cell);
        }
    }
}

function startTimer() {
    if (!gameStarted) {
        gameStarted = true;
        timer = 0;
        timerInterval = setInterval(() => {
            timer++;
            document.getElementById('timer').textContent = `Time: ${timer}s`;
        }, 1000);
    }
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateFlagsDisplay() {
    document.getElementById('flags-remaining').textContent = `Mines remaining: ${MINES - flagCount}`;
}

function handleClick(x, y) {
    startTimer();
    if (flags[x][y] || revealed[x][y]) return;
    revealed[x][y] = true;
    if (board[x][y] === 'M') {
        showGameOver();
        revealAllMines();
    } else {
        if (board[x][y] === 0) revealEmpty(x, y);
        checkWin();
    }
    renderBoard();
}

function handleRightClick(x, y) {
    if (revealed[x][y]) return;
    if (!flags[x][y]) {
        flags[x][y] = true;
        flagCount++;
    } else {
        flags[x][y] = false;
        flagCount--;
    }
    updateFlagsDisplay();
    renderBoard();
}

function revealEmpty(x, y) {
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const nx = x + i;
            const ny = y + j;
            if (nx >= 0 && nx < ROWS && ny >= 0 && ny < COLS && !revealed[nx][ny] && !flags[nx][ny]) {
                revealed[nx][ny] = true;
                if (board[nx][ny] === 0) revealEmpty(nx, ny);
            }
        }
    }
}

function revealAllMines() {
    for (let x = 0; x < ROWS; x++) {
        for (let y = 0; y < COLS; y++) {
            if (board[x][y] === 'M') revealed[x][y] = true;
        }
    }
}

function checkWin() {
    let unrevealedNonMines = 0;
    for (let x = 0; x < ROWS; x++) {
        for (let y = 0; y < COLS; y++) {
            if (!revealed[x][y] && board[x][y] !== 'M') unrevealedNonMines++;
        }
    }
    if (unrevealedNonMines === 0) {
        showGameOver(true);
    }
}

function showGameOver(win = false) {
    stopTimer();
    const popup = document.getElementById('game-over-popup');
    popup.innerHTML = `
                <h2>${win ? 'You Win!' : 'Game Over!'}</h2>
                <p>Time: ${timer}s</p>
                <button onclick="restartGame()">Restart</button>
                <button onclick="goToIndex()">Back to Home</button>
            `;
    popup.style.display = 'block';
    document.getElementById('game-board').style.pointerEvents = 'none';
}

function restartGame() {
    stopTimer();
    gameStarted = false;
    timer = 0;
    document.getElementById('timer').textContent = `Time: 0s`;
    const popup = document.getElementById('game-over-popup');
    popup.style.display = 'none';
    document.getElementById('game-board').style.pointerEvents = 'auto';
    initializeBoard();
    renderBoard();
}

function goToIndex() {
    window.location.href = 'index.html';
}

initializeBoard();
renderBoard();