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
