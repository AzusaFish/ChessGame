<template>
  <div class="chessboard" :class="{ 'flipped': playerSide === 'Black' }">
    <div v-for="(row, rIndex) in board" :key="rIndex" class="row">
      <div 
        v-for="(piece, cIndex) in row" 
        :key="cIndex" 
        class="square" 
        :class="getSquareClass(rIndex, cIndex)"
        @click="$emit('square-click', rIndex, cIndex)"
      >
        <div v-if="piece" class="piece" :style="{ backgroundImage: `url(${getImage(piece)})` }"></div>
        <div v-if="isPossibleMove(rIndex, cIndex)" class="possible-move-marker"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// defineProps is a compiler macro and does not need to be imported

const props = defineProps<{
  board: (string | null)[][];
  selectedSquare: { row: number, col: number } | null;
  possibleMoves: any[];
  inCheck: { White: boolean, Black: boolean };
  playerSide: 'White' | 'Black';
}>();

defineEmits(['square-click']);

function getImage(piece: string) {
  const color = piece === piece.toUpperCase() ? 'w' : 'b';
  // Use Vite base URL so paths work in dev and when packaged
  const base = (import.meta as any).env?.BASE_URL || './';
  return `${base}img/${color}${piece.toUpperCase()}.svg`;
}

function getSquareClass(row: number, col: number) {
  const isWhite = (row + col) % 2 === 0;
  const classes = [isWhite ? 'white' : 'black'];
  
  if (props.selectedSquare && props.selectedSquare.row === row && props.selectedSquare.col === col) {
    classes.push('selected');
  }
  
  // Highlight king in check: if this square contains a king and its color is currently inCheck
  const piece = props.board?.[row]?.[col];
  if (piece && piece.toUpperCase() === 'K') {
    const isKingWhite = piece === piece.toUpperCase();
    if ((isKingWhite && props.inCheck?.White) || (!isKingWhite && props.inCheck?.Black)) {
      classes.push('in-check');
    }
  }
  
  return classes.join(' ');
}

function isPossibleMove(row: number, col: number) {
  return props.possibleMoves.some(m => m[0] === row && m[1] === col);
}
</script>

<style scoped>
.chessboard {
  display: flex;
  flex-direction: column;
  width: 480px;
  height: 480px;
  border: 5px solid #5c4033;
}

.row {
  display: flex;
  flex: 1;
}

.square {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  cursor: pointer;
}

.square.white {
  background-color: #f0d9b5;
}

.square.black {
  background-color: #b58863;
}

.square.selected {
  background-color: #f6f669;
}

.square.in-check {
  box-shadow: 0 0 0 4px rgba(255, 0, 0, 0.25) inset, 0 0 18px 6px rgba(255, 0, 0, 0.35);
  animation: check-pulse 1s ease-in-out infinite;
}

@keyframes check-pulse {
  0% { box-shadow: 0 0 0 2px rgba(238, 23, 23, 0.12) inset, 0 0 8px 2px rgba(239, 28, 28, 0.12); }
  50% { box-shadow: 0 0 0 6px rgba(255,0,0,0.22) inset, 0 0 20px 8px rgba(255,0,0,0.32); }
  100% { box-shadow: 0 0 0 2px rgba(255,0,0,0.12) inset, 0 0 8px 2px rgba(255,0,0,0.12); }
}

.piece {
  width: 100%;
  height: 100%;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.possible-move-marker {
  position: absolute;
  width: 15px;
  height: 15px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 50%;
}

.square:hover {
    filter: brightness(1.1);
}

.chessboard.flipped {
  flex-direction: column-reverse;
}

.chessboard.flipped .row {
  flex-direction: row-reverse;
}
</style>
