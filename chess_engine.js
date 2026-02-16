// Motor de Xadrez Completo - Todas as regras e peças

class ChessEngine {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.isCheck = false;
        this.isCheckmate = false;
        this.isStalemate = false;
        this.enPassantTarget = null;
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
    }

    // Inicializar o tabuleiro com todas as peças
    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Peças brancas (linha 7 e 6)
        board[7][0] = { type: 'rook', color: 'white', moved: false };
        board[7][1] = { type: 'knight', color: 'white' };
        board[7][2] = { type: 'bishop', color: 'white' };
        board[7][3] = { type: 'queen', color: 'white' };
        board[7][4] = { type: 'king', color: 'white', moved: false };
        board[7][5] = { type: 'bishop', color: 'white' };
        board[7][6] = { type: 'knight', color: 'white' };
        board[7][7] = { type: 'rook', color: 'white', moved: false };
        
        for (let i = 0; i < 8; i++) {
            board[6][i] = { type: 'pawn', color: 'white', moved: false };
        }
        
        // Peças pretas (linha 0 e 1)
        board[0][0] = { type: 'rook', color: 'black', moved: false };
        board[0][1] = { type: 'knight', color: 'black' };
        board[0][2] = { type: 'bishop', color: 'black' };
        board[0][3] = { type: 'queen', color: 'black' };
        board[0][4] = { type: 'king', color: 'black', moved: false };
        board[0][5] = { type: 'bishop', color: 'black' };
        board[0][6] = { type: 'knight', color: 'black' };
        board[0][7] = { type: 'rook', color: 'black', moved: false };
        
        for (let i = 0; i < 8; i++) {
            board[1][i] = { type: 'pawn', color: 'black', moved: false };
        }
        
        return board;
    }

    // Obter peça em uma posição
    getPiece(row, col) {
        if (row < 0 || row > 7 || col < 0 || col > 7) return null;
        return this.board[row][col];
    }

    // Verificar se uma posição está vazia
    isEmpty(row, col) {
        return this.getPiece(row, col) === null;
    }

    // Verificar se há uma peça inimiga
    isEnemy(row, col, color) {
        const piece = this.getPiece(row, col);
        return piece && piece.color !== color;
    }

    // Verificar se há uma peça aliada
    isAlly(row, col, color) {
        const piece = this.getPiece(row, col);
        return piece && piece.color === color;
    }

    // Obter movimentos válidos para uma peça
    getValidMoves(row, col) {
        const piece = this.getPiece(row, col);
        if (!piece || piece.color !== this.currentPlayer) return [];

        let moves = [];

        switch (piece.type) {
            case 'pawn':
                moves = this.getPawnMoves(row, col, piece);
                break;
            case 'rook':
                moves = this.getRookMoves(row, col, piece);
                break;
            case 'knight':
                moves = this.getKnightMoves(row, col, piece);
                break;
            case 'bishop':
                moves = this.getBishopMoves(row, col, piece);
                break;
            case 'queen':
                moves = this.getQueenMoves(row, col, piece);
                break;
            case 'king':
                moves = this.getKingMoves(row, col, piece);
                break;
        }

        // Filtrar movimentos que deixariam o rei em xeque
        return moves.filter(move => !this.wouldBeInCheck(row, col, move.row, move.col));
    }

    // Movimentos do peão
    getPawnMoves(row, col, piece) {
        const moves = [];
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;

        // Movimento para frente
        const nextRow = row + direction;
        if (this.isEmpty(nextRow, col)) {
            moves.push({ row: nextRow, col });

            // Movimento inicial de duas casas
            if (row === startRow && this.isEmpty(nextRow + direction, col)) {
                moves.push({ row: nextRow + direction, col, enPassant: true });
            }
        }

        // Captura diagonal
        for (let dcol of [-1, 1]) {
            const captureCol = col + dcol;
            const captureRow = nextRow;
            if (this.isEnemy(captureRow, captureCol, piece.color)) {
                moves.push({ row: captureRow, col: captureCol });
            }
            // En passant
            if (this.enPassantTarget && this.enPassantTarget.row === captureRow && this.enPassantTarget.col === captureCol) {
                moves.push({ row: captureRow, col: captureCol, enPassant: true });
            }
        }

        return moves;
    }

    // Movimentos da torre
    getRookMoves(row, col, piece) {
        const moves = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [drow, dcol] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = row + drow * i;
                const newCol = col + dcol * i;
                
                if (newRow < 0 || newRow > 7 || newCol < 0 || newCol > 7) break;
                
                if (this.isEmpty(newRow, newCol)) {
                    moves.push({ row: newRow, col: newCol });
                } else if (this.isEnemy(newRow, newCol, piece.color)) {
                    moves.push({ row: newRow, col: newCol });
                    break;
                } else {
                    break;
                }
            }
        }
        
        return moves;
    }

    // Movimentos do cavalo
    getKnightMoves(row, col, piece) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        for (const [drow, dcol] of knightMoves) {
            const newRow = row + drow;
            const newCol = col + dcol;
            
            if (newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) {
                if (this.isEmpty(newRow, newCol) || this.isEnemy(newRow, newCol, piece.color)) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        
        return moves;
    }

    // Movimentos do bispo
    getBishopMoves(row, col, piece) {
        const moves = [];
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        
        for (const [drow, dcol] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = row + drow * i;
                const newCol = col + dcol * i;
                
                if (newRow < 0 || newRow > 7 || newCol < 0 || newCol > 7) break;
                
                if (this.isEmpty(newRow, newCol)) {
                    moves.push({ row: newRow, col: newCol });
                } else if (this.isEnemy(newRow, newCol, piece.color)) {
                    moves.push({ row: newRow, col: newCol });
                    break;
                } else {
                    break;
                }
            }
        }
        
        return moves;
    }

    // Movimentos da rainha
    getQueenMoves(row, col, piece) {
        return [...this.getRookMoves(row, col, piece), ...this.getBishopMoves(row, col, piece)];
    }

    // Movimentos do rei
    getKingMoves(row, col, piece) {
        const moves = [];
        const kingMoves = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        
        for (const [drow, dcol] of kingMoves) {
            const newRow = row + drow;
            const newCol = col + dcol;
            
            if (newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) {
                if (this.isEmpty(newRow, newCol) || this.isEnemy(newRow, newCol, piece.color)) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        // Roque
        if (!piece.moved && !this.isCheck) {
            // Roque no flanco do rei
            if (this.castlingRights[piece.color].kingside) {
                const rook = this.getPiece(row, 7);
                if (rook && rook.type === 'rook' && !rook.moved &&
                    this.isEmpty(row, 5) && this.isEmpty(row, 6)) {
                    moves.push({ row, col: 6, castling: 'kingside' });
                }
            }
            // Roque no flanco da rainha
            if (this.castlingRights[piece.color].queenside) {
                const rook = this.getPiece(row, 0);
                if (rook && rook.type === 'rook' && !rook.moved &&
                    this.isEmpty(row, 1) && this.isEmpty(row, 2) && this.isEmpty(row, 3)) {
                    moves.push({ row, col: 2, castling: 'queenside' });
                }
            }
        }
        
        return moves;
    }

    // Verificar se o movimento deixaria o rei em xeque
    wouldBeInCheck(fromRow, fromCol, toRow, toCol) {
        const originalPiece = this.board[toRow][toCol];
        const movingPiece = this.board[fromRow][fromCol];

        // Fazer o movimento temporariamente
        this.board[toRow][toCol] = movingPiece;
        this.board[fromRow][fromCol] = null;

        // Encontrar o rei
        let kingRow, kingCol;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.type === 'king' && piece.color === this.currentPlayer) {
                    kingRow = r;
                    kingCol = c;
                }
            }
        }

        // Verificar se o rei está em xeque
        const inCheck = this.isSquareUnderAttack(kingRow, kingCol, this.currentPlayer);

        // Desfazer o movimento
        this.board[fromRow][fromCol] = movingPiece;
        this.board[toRow][toCol] = originalPiece;

        return inCheck;
    }

    // Verificar se uma casa está sob ataque
    isSquareUnderAttack(row, col, byColor) {
        const enemyColor = byColor === 'white' ? 'black' : 'white';
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.getPiece(r, c);
                if (piece && piece.color === enemyColor) {
                    if (this.canPieceAttack(r, c, row, col, piece)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Verificar se uma peça pode atacar uma casa
    canPieceAttack(fromRow, fromCol, toRow, toCol, piece) {
        switch (piece.type) {
            case 'pawn': {
                const direction = piece.color === 'white' ? -1 : 1;
                return fromRow + direction === toRow && Math.abs(fromCol - toCol) === 1;
            }
            case 'knight': {
                const drow = Math.abs(fromRow - toRow);
                const dcol = Math.abs(fromCol - toCol);
                return (drow === 2 && dcol === 1) || (drow === 1 && dcol === 2);
            }
            case 'bishop':
                return this.canMoveDiagonally(fromRow, fromCol, toRow, toCol);
            case 'rook':
                return this.canMoveStraight(fromRow, fromCol, toRow, toCol);
            case 'queen':
                return this.canMoveStraight(fromRow, fromCol, toRow, toCol) || 
                       this.canMoveDiagonally(fromRow, fromCol, toRow, toCol);
            case 'king':
                return Math.abs(fromRow - toRow) <= 1 && Math.abs(fromCol - toCol) <= 1;
        }
        return false;
    }

    // Verificar movimento reto
    canMoveStraight(fromRow, fromCol, toRow, toCol) {
        if (fromRow !== toRow && fromCol !== toCol) return false;
        
        const drow = fromRow === toRow ? 0 : (toRow > fromRow ? 1 : -1);
        const dcol = fromCol === toCol ? 0 : (toCol > fromCol ? 1 : -1);
        
        let r = fromRow + drow;
        let c = fromCol + dcol;
        
        while (r !== toRow || c !== toCol) {
            if (!this.isEmpty(r, c)) return false;
            r += drow;
            c += dcol;
        }
        return true;
    }

    // Verificar movimento diagonal
    canMoveDiagonally(fromRow, fromCol, toRow, toCol) {
        if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol)) return false;
        
        const drow = toRow > fromRow ? 1 : -1;
        const dcol = toCol > fromCol ? 1 : -1;
        
        let r = fromRow + drow;
        let c = fromCol + dcol;
        
        while (r !== toRow || c !== toCol) {
            if (!this.isEmpty(r, c)) return false;
            r += drow;
            c += dcol;
        }
        return true;
    }

    // Fazer um movimento
    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPiece(fromRow, fromCol);
        if (!piece) return false;

        const moves = this.getValidMoves(fromRow, fromCol);
        const moveExists = moves.some(m => m.row === toRow && m.col === toCol);
        
        if (!moveExists) return false;

        // Capturar peça
        const capturedPiece = this.getPiece(toRow, toCol);
        if (capturedPiece) {
            this.capturedPieces[this.currentPlayer].push(capturedPiece);
        }

        // Mover peça
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        piece.moved = true;

        // Promoção do peão
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            piece.type = 'queen';
        }

        // Atualizar direitos de roque
        if (piece.type === 'king') {
            this.castlingRights[piece.color].kingside = false;
            this.castlingRights[piece.color].queenside = false;
        }
        if (piece.type === 'rook') {
            if (fromCol === 0) this.castlingRights[piece.color].queenside = false;
            if (fromCol === 7) this.castlingRights[piece.color].kingside = false;
        }

        // Registrar movimento
        this.moveHistory.push({ from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } });

        // Mudar jogador
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';

        // Verificar estado do jogo
        this.updateGameState();

        return true;
    }

    // Atualizar estado do jogo (xeque, xeque-mate, etc)
    updateGameState() {
        const opponent = this.currentPlayer;
        
        // Verificar xeque
        let kingRow, kingCol;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.getPiece(r, c);
                if (piece && piece.type === 'king' && piece.color === opponent) {
                    kingRow = r;
                    kingCol = c;
                }
            }
        }

        this.isCheck = this.isSquareUnderAttack(kingRow, kingCol, opponent);

        // Verificar xeque-mate ou empate
        let hasValidMove = false;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.getPiece(r, c);
                if (piece && piece.color === opponent) {
                    if (this.getValidMoves(r, c).length > 0) {
                        hasValidMove = true;
                    }
                }
            }
        }

        if (!hasValidMove) {
            if (this.isCheck) {
                this.isCheckmate = true;
            } else {
                this.isStalemate = true;
            }
        }
    }

    // Obter notação algébrica de um movimento
    getMoveNotation(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPiece(fromRow, fromCol);
        const target = this.getPiece(toRow, toCol);
        
        const colLetters = 'abcdefgh';
        const from = colLetters[fromCol] + (8 - fromRow);
        const to = colLetters[toCol] + (8 - toRow);
        
        let notation = '';
        
        if (piece.type !== 'pawn') {
            notation += piece.type.charAt(0).toUpperCase();
        }
        
        if (target) {
            if (piece.type === 'pawn') {
                notation += colLetters[fromCol];
            }
            notation += 'x';
        }
        
        notation += to;
        
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            notation += '=Q';
        }
        
        return notation;
    }
}
