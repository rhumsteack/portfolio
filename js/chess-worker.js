importScripts('https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js');

var VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
var PST = {
    p:  [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
    n:  [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
    b:  [-20,-10,-10,-10,-10,-10,-10,-20, -10,5,0,0,0,0,5,-10, -10,10,10,10,10,10,10,-10, -10,0,10,10,10,10,0,-10, -10,5,5,10,10,5,5,-10, -10,0,5,10,10,5,0,-10, -10,0,0,0,0,0,0,-10, -20,-10,-10,-10,-10,-10,-10,-20],
    r:  [0,0,0,5,5,0,0,0, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 5,10,10,10,10,10,10,5, 0,0,0,0,0,0,0,0],
    q:  [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,5,0,0,0,0,-10, -10,5,5,5,5,5,0,-10, 0,0,5,5,5,5,0,-5, -5,0,5,5,5,5,0,-5, -10,0,5,5,5,5,0,-10, -10,0,0,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
    k:  [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20]
};

function evaluate(g) {
    if (g.in_checkmate()) return g.turn() === 'w' ? -99999 : 99999;
    if (g.in_draw() || g.in_stalemate() || g.in_threefold_repetition()) return 0;
    var score = 0;
    var rows = g.board();
    for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
            var p = rows[r][c];
            if (!p) continue;
            var idx = r * 8 + c;
            var pst = PST[p.type] || [];
            var pstVal = p.color === 'w' ? (pst[idx] || 0) : (pst[63 - idx] || 0);
            score += (p.color === 'w' ? 1 : -1) * ((VAL[p.type] || 0) + pstVal);
        }
    }
    return score;
}

function minimax(g, depth, alpha, beta, isMax) {
    if (depth === 0 || g.game_over()) return evaluate(g);
    var moves = g.moves();
    var best, i, score;
    if (isMax) {
        best = -Infinity;
        for (i = 0; i < moves.length; i++) {
            g.move(moves[i]);
            score = minimax(g, depth - 1, alpha, beta, false);
            g.undo();
            if (score > best) best = score;
            if (best > alpha) alpha = best;
            if (beta <= alpha) break;
        }
        return best;
    } else {
        best = Infinity;
        for (i = 0; i < moves.length; i++) {
            g.move(moves[i]);
            score = minimax(g, depth - 1, alpha, beta, true);
            g.undo();
            if (score < best) best = score;
            if (best < beta) beta = best;
            if (beta <= alpha) break;
        }
        return best;
    }
}

self.onmessage = function (e) {
    var fen = e.data.fen;
    var botIsWhite = e.data.botIsWhite;
    var g = new Chess(fen);
    var moves = g.moves();
    if (!moves.length) { self.postMessage(null); return; }
    var bestMove = moves[0];
    var bestScore = botIsWhite ? -Infinity : Infinity;
    for (var i = 0; i < moves.length; i++) {
        g.move(moves[i]);
        var score = minimax(g, 2, -Infinity, Infinity, !botIsWhite);
        g.undo();
        if (botIsWhite ? score > bestScore : score < bestScore) {
            bestScore = score;
            bestMove = moves[i];
        }
    }
    self.postMessage(bestMove);
};
