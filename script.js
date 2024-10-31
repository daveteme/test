class Game {
    constructor() {
        this.currentPlayer = 'red';
        this.timeLeft = 7;
        this.timer = null;
        this.board = Array(9).fill(null);
        this.draggedCork = null;
        this.originalPosition = null;
        this.gameEnded = false;
        this.gameMode = 'PVP';
        this.movesMap = {
            1: [4, 2, 5],
            2: [1, 5, 3],
            3: [6, 2, 5],
            4: [1, 5, 7],
            5: [1, 2, 3, 4, 6, 7, 8, 9],
            6: [3, 5, 9],
            7: [4, 5, 8],
            8: [7, 5, 9],
            9: [6, 8, 5]
        };
        
        this.initializeGame();
    }

    initializeGame() {
        this.createBoard();
        this.setupEventListeners();
        this.createInitialCorks();
        this.startTimer();
        this.updateDisplay();
        
        document.getElementById('manVsMan').addEventListener('click', () => {
            this.gameMode = 'PVP';
            this.resetGame();
        });
        
        document.getElementById('manVsBot').addEventListener('click', () => {
            this.gameMode = 'PVE';
            this.resetGame();
        });
    }

    createBoard() {
        const board = document.querySelector('#gameArea');
        for (let i = 1; i <= 9; i++) {
            const spot = document.createElement('div');
            spot.id = `spot${i}`;
            spot.className = 'spot';
            spot.dataset.spot = i;
            board.appendChild(spot);
        }
    }

    createInitialCorks() {
        this.createCork('red', 1);
        this.createCork('red', 2);
        this.createCork('red', 3);
        this.createCork('blue', 7);
        this.createCork('blue', 8);
        this.createCork('blue', 9);

        this.board[0] = 'red';
        this.board[1] = 'red';
        this.board[2] = 'red';
        this.board[6] = 'blue';
        this.board[7] = 'blue';
        this.board[8] = 'blue';
    }

    createCork(color, spotNumber) {
        const cork = document.createElement('div');
        cork.className = `cork ${color}`;
        cork.dataset.color = color;
        cork.draggable = true;

        cork.addEventListener('dragstart', (e) => this.handleDragStart(e));
        cork.addEventListener('dragend', (e) => this.handleDragEnd(e));

        const spot = document.querySelector(`#spot${spotNumber}`);
        spot.appendChild(cork);
    }

    handleDragStart(e) {
        if (this.gameEnded || e.target.dataset.color !== this.currentPlayer) {
            e.preventDefault();
            return;
        }
        
        this.draggedCork = e.target;
        this.originalPosition = e.target.parentElement;
        e.target.classList.add('dragging');
        
        const currentSpot = parseInt(this.originalPosition.dataset.spot);
        const validMoves = this.movesMap[currentSpot];
        
        validMoves.forEach(spotNumber => {
            const spot = document.querySelector(`#spot${spotNumber}`);
            if (!this.board[spotNumber - 1] && !spot.querySelector('.cork')) {
                spot.classList.add('valid-move');
            }
        });
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.valid-move').forEach(spot => {
            spot.classList.remove('valid-move');
        });
    }

    setupEventListeners() {
        document.querySelectorAll('.spot').forEach(spot => {
            spot.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (spot.classList.contains('valid-move')) {
                    e.dataTransfer.dropEffect = 'move';
                }
            });

            spot.addEventListener('drop', (e) => {
                e.preventDefault();
                if (spot.classList.contains('valid-move')) {
                    this.handleDrop(spot);
                }
            });
        });

        document.getElementById('skipButton').addEventListener('click', () => this.skipTurn());
        document.getElementById('resetButton').addEventListener('click', () => this.resetGame());
    }

    getValidMoves(position) {
        const validMoves = [];
        const currentSpot = position + 1;
        const possibleMoves = this.movesMap[currentSpot];

        possibleMoves?.forEach(spotNumber => {
            if (!this.board[spotNumber - 1]) {
                validMoves.push(spotNumber - 1);
            }
        });

        return validMoves;
    }

    getPlayerPieces(player) {
        const pieces = [];
        this.board.forEach((piece, index) => {
            if (piece === player) {
                pieces.push(index);
            }
        });
        return pieces;
    }

    evaluateBoard() {
        if (this.checkWinCondition('blue')) return 1000;
        if (this.checkWinCondition('red')) return -1000;

        let score = 0;
        const redPieces = this.getPlayerPieces('red');
        const bluePieces = this.getPlayerPieces('blue');

        bluePieces.forEach(pos => {
            if (pos < 6) score += 10;
            if (pos === 4) score += 5;
        });

        redPieces.forEach(pos => {
            if (pos > 2) score -= 10;
            if (pos === 4) score -= 5;
        });

        return score;
    }

    minimax(depth, alpha, beta, isMaximizing) {
        if (depth === 0 || this.checkWinCondition('red') || this.checkWinCondition('blue')) {
            return this.evaluateBoard();
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            const pieces = this.getPlayerPieces('blue');
            
            for (const piece of pieces) {
                const validMoves = this.getValidMoves(piece);
                for (const move of validMoves) {
                    const oldBoard = [...this.board];
                    this.board[piece] = null;
                    this.board[move] = 'blue';
                    const evalScore = this.minimax(depth - 1, alpha, beta, false);
                    this.board = [...oldBoard];
                    maxEval = Math.max(maxEval, evalScore);
                    alpha = Math.max(alpha, evalScore);
                    if (beta <= alpha) break;
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            const pieces = this.getPlayerPieces('red');
            
            for (const piece of pieces) {
                const validMoves = this.getValidMoves(piece);
                for (const move of validMoves) {
                    const oldBoard = [...this.board];
                    this.board[piece] = null;
                    this.board[move] = 'red';
                    const evalScore = this.minimax(depth - 1, alpha, beta, true);
                    this.board = [...oldBoard];
                    minEval = Math.min(minEval, evalScore);
                    beta = Math.min(beta, evalScore);
                    if (beta <= alpha) break;
                }
            }
            return minEval;
        }
    }

    getBestMove() {
        let bestScore = -Infinity;
        let bestMove = null;
        let bestPiece = null;
        
        const pieces = this.getPlayerPieces('blue');
        
        for (const piece of pieces) {
            const validMoves = this.getValidMoves(piece);
            for (const move of validMoves) {
                const oldBoard = [...this.board];
                this.board[piece] = null;
                this.board[move] = 'blue';
                const score = this.minimax(2, -Infinity, Infinity, false);
                this.board = [...oldBoard];

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                    bestPiece = piece;
                }
            }
        }

        return { piece: bestPiece, move: bestMove };
    }

    handleDrop(spot) {
        if (this.draggedCork && !spot.querySelector('.cork')) {
            const oldSpot = parseInt(this.originalPosition.dataset.spot) - 1;
            const newSpot = parseInt(spot.dataset.spot) - 1;
            this.board[oldSpot] = null;
            this.board[newSpot] = this.draggedCork.dataset.color;

            spot.appendChild(this.draggedCork);
            
            if (this.checkWinCondition(this.currentPlayer)) {
                this.handleWin(this.currentPlayer);
                return;
            }
            
            this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';
            this.resetTimer();
            this.updateDisplay();

            if (this.gameMode === 'PVE' && this.currentPlayer === 'blue' && !this.gameEnded) {
                setTimeout(() => {
                    const { piece, move } = this.getBestMove();
                    if (piece !== null && move !== null) {
                        const sourceCork = document.querySelector(`#spot${piece + 1} .cork`);
                        const targetSpot = document.querySelector(`#spot${move + 1}`);
                        
                        if (sourceCork && targetSpot) {
                            this.board[piece] = null;
                            this.board[move] = 'blue';
                            targetSpot.appendChild(sourceCork);

                            if (this.checkWinCondition('blue')) {
                                this.handleWin('blue');
                                return;
                            }

                            this.currentPlayer = 'red';
                            this.resetTimer();
                            this.updateDisplay();
                        }
                    }
                }, 500);
            }
        }
    }

checkWinCondition(player) {
    // Red's winning lines are middle and bottom rows only
    if (player === 'red') {
        // Middle row
        if (this.board[3] === player && this.board[4] === player && this.board[5] === player) return true;
        // Bottom row
        if (this.board[6] === player && this.board[7] === player && this.board[8] === player) return true;
    } 
    // Blue's winning lines are top and middle rows only
    else {
        // Top row
        if (this.board[0] === player && this.board[1] === player && this.board[2] === player) return true;
        // Middle row
        if (this.board[3] === player && this.board[4] === player && this.board[5] === player) return true;
    }

    // Check vertical wins
    for (let col = 0; col < 3; col++) {
        if (this.board[col] === player && 
            this.board[col + 3] === player && 
            this.board[col + 6] === player) {
            return true;
        }
    }

    // Check diagonal wins
    if (this.board[0] === player && this.board[4] === player && this.board[8] === player) return true;
    if (this.board[2] === player && this.board[4] === player && this.board[6] === player) return true;

    return false;
}



    handleWin(winner) {
        this.gameEnded = true;
        clearInterval(this.timer);
        
        const message = `${winner.toUpperCase()} WINS!`;
        document.querySelector('.current-player').textContent = message;
        
        const winnerMessage = document.querySelector('.winner-message');
        winnerMessage.querySelector('h2').textContent = message;
        winnerMessage.style.display = 'block';
        
        document.querySelectorAll('.cork').forEach(cork => {
            cork.draggable = false;
        });

        const gameArea = document.querySelector('#gameArea');
        gameArea.style.boxShadow = winner === 'red' ? 
            '0 0 20px rgba(255, 0, 0, 0.7)' : 
            '0 0 20px rgba(0, 0, 255, 0.7)';

        document.querySelectorAll(`.cork.${winner}`).forEach(cork => {
            cork.style.animation = 'winner-pulse 1s infinite';
        });
    }

    startTimer() {
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                this.skipTurn();
            }
            this.updateDisplay();
        }, 1000);
    }

    resetTimer() {
        this.timeLeft = 7;
        clearInterval(this.timer);
        this.startTimer();
    }

    skipTurn() {
        if (!this.gameEnded) {
            this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';
            this.resetTimer();
            this.updateDisplay();

            if (this.gameMode === 'PVE' && this.currentPlayer === 'blue') {
                const { piece, move } = this.getBestMove();
                if (piece !== null && move !== null) {
                    setTimeout(() => {
                        const sourceCork = document.querySelector(`#spot${piece + 1} .cork`);
                        const targetSpot = document.querySelector(`#spot${move + 1}`);
                        
                        this.board[piece] = null;
                        this.board[move] = 'blue';
                        targetSpot.appendChild(sourceCork);

                        if (this.checkWinCondition('blue')) {
                            this.handleWin('blue');
                            return;
                        }

                        this.currentPlayer = 'red';
                        this.resetTimer();
                        this.updateDisplay();
                    }, 500);
                }
            }
        }
    }

    resetGame() {
        this.board = Array(9).fill(null);
        document.querySelectorAll('.cork').forEach(cork => cork.remove());
        
        this.currentPlayer = 'red';
        this.gameEnded = false;
        this.resetTimer();
        
        const gameArea = document.querySelector('#gameArea');
        gameArea.style.boxShadow = '0 0 20px rgba(196, 0, 148, 0.3)';
        
        const winnerMessage = document.querySelector('.winner-message');
        winnerMessage.style.display = 'none';
        
        this.createInitialCorks();
        this.updateDisplay();
    }

    updateDisplay() {
        document.querySelector('.timer').textContent = `Time: ${this.timeLeft}s`;
        if (!this.gameEnded) {
            document.querySelector('.current-player').textContent = 
                `Current Player: ${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}`;
        }
    }
}

window.onload = () => {
    game = new Game();
}
    
