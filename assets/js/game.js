const urlParams = new URLSearchParams(window.location.search);
const ROWS = parseInt(urlParams.get('rows')) || 10;
const COLS = parseInt(urlParams.get('cols')) || 10;
const MINES = parseInt(urlParams.get('mines')) || 10;
const MODE = urlParams.get('mode') || 'single';
let board = [];
let revealed = [];
let flags = [];
let flagCount = 0;
let timer = 0;
let timerInterval = null;
let gameStarted = false;
let currentPlayer = 1;
let player1Score = 0;
let player2Score = 0;
let turnTimer = 0;
let turnTimerInterval = null;
const TURN_DURATION = 24;

function initializeBoard() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    revealed = Array(ROWS).fill().map(() => Array(COLS).fill(false));
    flags = Array(ROWS).fill().map(() => Array(COLS).fill(false));
    flagCount = 0;
    player1Score = 0;
    player2Score = 0;
    currentPlayer = 1;
    turnTimer = TURN_DURATION;
    updatePlayerScores();
    updateTurnTimer();
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

function startTurnTimer() {
    if (MODE === 'two' && !turnTimerInterval) {
        turnTimer = TURN_DURATION;
        updateTurnTimer();
        turnTimerInterval = setInterval(() => {
            turnTimer--;
            updateTurnTimer();
            if (turnTimer <= 0) {
                switchPlayer();
            }
        }, 1000);
    }
}

function stopTurnTimer() {
    if (turnTimerInterval) {
        clearInterval(turnTimerInterval);
        turnTimerInterval = null;
    }
}

function updatePlayerScores() {
    const player1ScoreElement = document.getElementById('player1-score');
    const player2ScoreElement = document.getElementById('player2-score');
    player1ScoreElement.textContent = `Player 1: ${player1Score}`;
    player2ScoreElement.textContent = `Player 2: ${player2Score}`;
    if (MODE === 'two') {
        if (currentPlayer === 1) {
            player1ScoreElement.classList.add('active-player');
            player2ScoreElement.classList.remove('active-player');
        } else {
            player1ScoreElement.classList.remove('active-player');
            player2ScoreElement.classList.add('active-player');
        }
    } else {
        player1ScoreElement.classList.remove('active-player');
        player2ScoreElement.classList.remove('active-player');
        player1ScoreElement.textContent = '';
        player2ScoreElement.textContent = '';
    }
}

function updateTurnTimer() {
    if (MODE === 'two') {
        document.getElementById('turn-timer').textContent = `Turn Time: ${turnTimer}s`;
    } else {
        document.getElementById('turn-timer').textContent = '';
    }
}

function updateFlagsDisplay() {
    document.getElementById('flags-remaining').textContent = `Mines remaining: ${MINES - flagCount}`;
}

function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    turnTimer = TURN_DURATION;
    updatePlayerScores();
    updateTurnTimer();
    stopTurnTimer();
    startTurnTimer();
}

function handleClick(x, y) {
    if (flags[x][y] || revealed[x][y]) return;
    startTimer();
    startTurnTimer();
    revealed[x][y] = true;
    if (board[x][y] === 'M') {
        if (MODE === 'two') {
            if (currentPlayer === 1) {
                player1Score -= 10;
            } else {
                player2Score -= 10;
            }
            updatePlayerScores();
            switchPlayer();
        } else {
            showGameOver();
            revealAllMines();
        }
    } else {
        if (MODE === 'two') {
            if (currentPlayer === 1) {
                player1Score += 3;
            } else {
                player2Score += 3;
            }
            updatePlayerScores();
            switchPlayer();
        }
        if (board[x][y] === 0) revealEmpty(x, y);
        if (MODE === 'single') checkWin();
    }
    renderBoard();
}

function handleRightClick(x, y) {
    if (revealed[x][y]) return;
    startTimer();
    startTurnTimer();
    if (!flags[x][y]) {
        flags[x][y] = true;
        flagCount++;
        if (MODE === 'two') {
            if (board[x][y] === 'M') {
                if (currentPlayer === 1) {
                    player1Score += 10;
                } else {
                    player2Score += 10;
                }
            } else {
                if (currentPlayer === 1) {
                    player1Score += 1;
                } else {
                    player2Score += 1;
                }
            }
            updatePlayerScores();
            switchPlayer();
            checkWin();
        }
    } else {
        flags[x][y] = false;
        flagCount--;
        if (MODE === 'two') {
            switchPlayer();
        }
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
    if (MODE === 'two') {
        let allMinesFlagged = true;
        for (let x = 0; x < ROWS; x++) {
            for (let y = 0; y < COLS; y++) {
                if (board[x][y] === 'M' && !flags[x][y]) {
                    allMinesFlagged = false;
                    break;
                }
            }
        }
        if (allMinesFlagged) {
            showGameOver(true);
        }
    } else {
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
}

function showGameOver(win = false) {
    stopTimer();
    stopTurnTimer();
    const popup = document.getElementById('game-over-popup');
    let message = win && MODE === 'two' ? `Player ${player1Score > player2Score ? 1 : 2} Wins!` : win ? 'You Win!' : 'Game Over!';
    popup.innerHTML = `
        <h2>${message}</h2>
        ${MODE === 'two' ? `<p>Player 1: ${player1Score} | Player 2: ${player2Score}</p>` : ''}
        <p>Time: ${timer}s</p>
        <button onclick="restartGame()">Restart</button>
        <button onclick="goToIndex()">Back to Home</button>
    `;
    popup.style.display = 'block';
    document.getElementById('game-board').style.pointerEvents = 'none';
}

function restartGame() {
    stopTimer();
    stopTurnTimer();
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