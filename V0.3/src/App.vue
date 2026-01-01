<template>
  <div class="app-container">
    <div v-if="!started" class="setup-panel">
      <h1>Chess Game</h1>
      <div class="form-group">
        <label>Mode:</label>
        <select v-model="mode">
          <option value="PvC">Player vs Computer</option>
          <option value="PvP">Player vs Player</option>
        </select>
      </div>
      <div class="form-group" v-if="mode === 'PvC'">
        <label>Difficulty (1-5):</label>
        <input type="range" min="1" max="5" v-model.number="diff" />
        <span>{{ diff }}</span>
      </div>
      <div class="form-group" v-if="mode === 'PvC'">
        <label>Side: </label>
        <select v-model="sideOption">
          <option value="Random">Random</option>
          <option value="White">White</option>
          <option value="Black">Black</option>
        </select>
      </div>
      <div class="form-group time-controller" v-if="mode === 'PvP'">
        <label>Time: </label>
        <select v-model="timeOption">
          <option value="1">1 Minute</option>
          <option value="5">5 Minutes</option>
          <option value="10">10 Minutes</option>
          <option value="15">30 Minutes</option>
        </select>
      </div>
      <button @click="startGame" class="start-btn">Start Game</button>
    </div>
    <div v-else class="game-container">
      <div class="sidebar left">
        <div class="status-panel">
          <h2>Turn: <span :class="['turn-indicator', state.turn]">{{ state.turn }}</span></h2>
          <div v-if="state.isGameOver" class="game-over">Game Over</div>
          <button @click="restartGame" class="restart-btn" :disabled="isRestarting">Restart</button>
          <button @click="started = false" class="back-btn">Back to Menu</button>
        </div>
      </div>

      <div class="board-area">
        <ChessBoard 
          :board="state.board" 
          :selectedSquare="selectedSquare"
          :possibleMoves="possibleMoves"
          :inCheck="state.inCheck"
          :playerSide="actualPlayerSide"
          @square-click="onSquareClick"
        />
      </div>

      <div class="sidebar right">
        <div v-if="mode === 'PvP'" class = "time-count">
          <h3>Time Left</h3>
          <div>White: {{whiteTime}}</div>
          <div>Black: {{blackTime}}</div>
        </div>
        <div class="history-panel">
          <h3>History</h3>
          <ul class="history-list" ref="historyList">
            <li v-for="(move, index) in state.history" :key="index">{{ move }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Promotion Modal -->
    <div v-if="state.promotionPending" class="modal-overlay">
      <div class="modal-content">
        <h3>Choose Promotion</h3>
        <div class="promotion-options">
          <button @click="promote('q')">Queen</button>
          <button @click="promote('r')">Rook</button>
          <button @click="promote('b')">Bishop</button>
          <button @click="promote('n')">Knight</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, onUnmounted } from 'vue';
import ChessBoard from './components/ChessBoard.vue';
import { gameCore, type GameState, type GameMode, type TurnType } from './game-core';
import { startTimer, stopTimer, switchTurn, returnTime_White, returnTime_Black, getRemainingTime_White, getRemainingTime_Black } from './utils/timer.ts';

const mode = ref<GameMode>('PvC');
const diff = ref(3);
const sideOption = ref<TurnType | 'Random'>('Random');
const actualPlayerSide = ref<TurnType>('White');
const started = ref(false);
const timeOption = ref(10);
let whiteTime = ref('10:00');
let blackTime = ref('10:00');

// Clock poll management
let clockPollId: number | null = null;
const POLL_MS = 200;
function updateClockOnce() {
  try {
    whiteTime.value = returnTime_White();
    blackTime.value = returnTime_Black();
    // detect timeout (ms <= 0) and notify gameCore
    try {
      const wMs = getRemainingTime_White();
      const bMs = getRemainingTime_Black();
      if (mode.value === 'PvP' && !state.value.isGameOver) {
        if (wMs != null && wMs <= 0) {
          stopClockPoll();
          try { stopTimer(); } catch {}
          gameCore.handleTimeout('White');
        } else if (bMs != null && bMs <= 0) {
          stopClockPoll();
          try { stopTimer(); } catch {}
          gameCore.handleTimeout('Black');
        }
      }
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // ignore if timer API unavailable
  }
}

function startClockPoll() {
  stopClockPoll();
  updateClockOnce();
  clockPollId = window.setInterval(updateClockOnce, POLL_MS);
}

function stopClockPoll() {
  if (clockPollId != null) {
    clearInterval(clockPollId);
    clockPollId = null;
  }
}

const state = ref<GameState>({
  board: [],
  turn: 'White',
  history: [],
  isGameOver: false,
  inCheck: { White: false, Black: false },
  promotionPending: null
});

const selectedSquare = ref<{ row: number, col: number } | null>(null);
const possibleMoves = ref<any[]>([]);
const historyList = ref<HTMLElement | null>(null);
const isRestarting = ref(false);

onMounted(() => {
  gameCore.onUpdate((newState) => {
    state.value = newState;
    // Auto scroll history
    nextTick(() => {
      if (historyList.value) {
        historyList.value.scrollTop = historyList.value.scrollHeight;
      }
    });
  });
});

function startGame() {
  started.value = true;
  selectedSquare.value = null;
  possibleMoves.value = [];
  whiteTime.value = timeOption.value + ':00';
  blackTime.value = timeOption.value + ':00';
  
  let side: TurnType | 'Random' = 'Random';
  if (sideOption.value === 'Random') {
    side = (crypto.getRandomValues(new Uint32Array(1))[0]! / 4294967296) < 0.5 ? 'White' : 'Black';
  } else {
    side = sideOption.value as TurnType;
  }
  actualPlayerSide.value = side;

  gameCore.start({ mode: mode.value, diff: diff.value, playerSide: side });
  if (mode.value === 'PvP') {
    startTimer(timeOption.value, side);
    startClockPoll();
  }
}

function restartGame() {
  if (isRestarting.value) return;
  isRestarting.value = true;

  selectedSquare.value = null;
  possibleMoves.value = [];

  let side: TurnType = 'White';
  if (sideOption.value === 'Random') {
    side = (crypto.getRandomValues(new Uint32Array(1))[0]! / 4294967296) < 0.5 ? 'White' : 'Black';
  } else {
    side = sideOption.value as TurnType;
  }
  actualPlayerSide.value = side;

  gameCore.start({ mode: mode.value, diff: diff.value, playerSide: side });

  // Short debounce to avoid double clicks; session token in gameCore also prevents stale AI runs
  setTimeout(() => { isRestarting.value = false; }, 800);
}

// Watchers to manage clock lifecycle and turn switching
watch(started, (val) => {
  if (!val) {
    stopClockPoll();
    try { stopTimer(); } catch {}
  }
});

// When history length increases, assume a move was made -> switch timer turn
watch(() => state.value.history.length, (n, o) => {
  if (n > o) {
    try { switchTurn(); } catch {}
    updateClockOnce();
  }
});

// Stop clocks when game ends
watch(() => state.value.isGameOver, (v) => {
  if (v) {
    stopClockPoll();
    try { stopTimer(); } catch {}
  }
});

onUnmounted(() => {
  stopClockPoll();
  try { stopTimer(); } catch {}
});

async function onSquareClick(row: number, col: number) {
  if (state.value.isGameOver || state.value.promotionPending) return;

  const newSelection = await gameCore.handleSquareClick(row, col, selectedSquare.value);
  selectedSquare.value = newSelection;
  
  if (newSelection) {
    possibleMoves.value = gameCore.getValidMovesForSquare(newSelection.row, newSelection.col);
  } else {
    possibleMoves.value = [];
  }
}

function promote(piece: string) {
  gameCore.resolvePromotion(piece);
}
</script>

<style>
body {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #2c3e50;
  color: white;
}

.app-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.setup-panel {
  background: #34495e;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.start-btn, .restart-btn, .back-btn {
  background-color: #27ae60;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
}

.restart-btn { background-color: #e67e22; }
.back-btn { background-color: #7f8c8d; margin-left: 0.5rem; }

.game-container {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.sidebar {
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-panel {
  background: #34495e;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.history-panel {
  background: #3f5d7b;
  padding: 0.7rem 1rem;
  border-radius: 4px;
  margin-top: 2px;
  height: 360px;
  display: flex;
  flex-direction: column;
}

.time-count {
  background-color: #7f8c8d;
  padding: 0.5rem 0.9rem;
  border-radius: 4px;
  margin-bottom: 4px;
  margin-top: 4px;
  text-align: left;
}
.time-count h3{ margin: 2px 0 6px 4px; font-size: 0.95rem; }

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
  text-align: left;
  font-family: monospace;
}
.history-list h3{ margin-top: 0;}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background: #ecf0f1;
  color: #2c3e50;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
}

.promotion-options {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.promotion-options button {
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.turn-indicator.White { color: #ffffff; }
.turn-indicator.Black { color: #ffffff; }
</style>
