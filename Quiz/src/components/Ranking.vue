<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="ranking-overlay" @click.self="closeModal">
        <div class="ranking-modal" :class="{ 'gabarito-active': showAdminGabarito }">
          
          <!-- Header -->
          <div class="ranking-header">
            <div class="ranking-title-section">
              <Trophy class="ranking-icon" size="48" />
              <div>
                <h2 class="ranking-title">Top Jogadores</h2>
                <p class="ranking-subtitle">Quem está dominando o jogo agora</p>
              </div>
            </div>
            <button class="btn-close-ranking" @click="closeModal">
              <X size="24" />
            </button>
          </div>

          <!-- Tabs -->
          <div class="ranking-tabs">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              :class="['tab-btn', { active: activeTab === tab.id }]"
              @click="activeTab = tab.id"
            >
              <component :is="tab.icon" class="tab-icon" size="20" />
              <span class="tab-text">{{ tab.name }}</span>
            </button>
          </div>

          <!-- Content -->
          <div class="ranking-content">
            <!-- Lista de Ranking -->
            <div v-if="filteredRanking.length > 0" class="ranking-list">
              <div 
                v-for="(player, index) in filteredRanking" 
                :key="player._id"
                :class="['ranking-item', { 
                  'top-1': index === 0, 
                  'top-2': index === 1, 
                  'top-3': index === 2,
                  'is-current': player.name === props.currentPlayer && player.date === filteredRanking.find(p => p.name === props.currentPlayer)?.date
                }]"
              >
                <div class="rank-position">
                  <Medal 
                    v-if="index === 0" 
                    class="position-medal gold" 
                    size="40"
                  />
                  <Award 
                    v-else-if="index === 1" 
                    class="position-medal silver" 
                    size="36"
                  />
                  <Award 
                    v-else-if="index === 2" 
                    class="position-medal bronze" 
                    size="36"
                  />
                  <span v-else class="position-number">{{ index + 1 }}</span>
                </div>
                
                <div class="rank-info">
                  <div class="rank-name-section">
                    <span class="rank-name">{{ player.name }}</span>
                    <span v-if="player.name === props.currentPlayer" class="current-badge">Você</span>
                  </div>
                  <div class="rank-meta">
                    <span class="rank-difficulty" :class="player.difficulty">
                      <component :is="getDifficultyIcon(player.difficulty)" size="14" />
                      {{ getDifficultyName(player.difficulty) }}
                    </span>
                    <span class="rank-date">{{ formatDate(player.createdAt) }}</span>
                  </div>
                </div>

                <div class="rank-stats">
                  <div class="stat-score">
                    <span class="score-value">{{ player.score }}</span>
                    <span class="score-label">pts</span>
                  </div>
                  <div class="stat-details">
                    <span class="stat-correct"><Check size="14" /> {{ player.correct }}</span>
                    <span class="stat-wrong"><X size="14" /> {{ player.wrong }}</span>
                    <button 
                      v-if="props.currentPlayer === ADMIN"
                      @click="deletePlayer(player._id)"
                      class="btn-delete-player"
                    >
                      <Trash2 size="16" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="ranking-empty">
              <BarChart3 class="empty-icon" size="64" />
              <h3>Sem jogadores ainda</h3>
              <p>Seja o primeiro a entrar na classificação!</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="ranking-footer">
            <div class="ranking-stats-summary">
              <div class="summary-box">
                <span class="summary-value">{{ totalPlayers }}</span>
                <span class="summary-label">Total</span>
              </div>
              <div class="summary-box">
                <span class="summary-value">{{ averageScore }}</span>
                <span class="summary-label">Média geral</span>
              </div>
              <div class="summary-box">
                <span class="summary-value">{{ bestScore }}</span>
                <span class="summary-label">Melhor pontuação</span>
              </div>
            </div>
            
            <div v-if="rankingData.length > 0 && props.currentPlayer === ADMIN" class="admin-actions">
              <button 
                class="btn-gabarito-admin"
                @click="showAdminGabarito = true"
              >
                <Check size="16" />
                Respostas
              </button>

              <button 
                class="btn-clear-ranking"
                @click="confirmClear = true"
              >
                <Trash2 size="16" />
                Resetar classificação
              </button>
            </div>
          </div>

          <!-- Gabarito Modal Interno -->
          <Transition name="gabarito-slide">
            <div v-if="showAdminGabarito" class="gabarito-panel">
              <div class="gabarito-header">
                <div class="gabarito-title-section">
                  <div class="gabarito-icon-wrapper">
                    <Check size="32" />
                  </div>
                  <div>
                    <h3 class="gabarito-title">Respostas Oficiais</h3>
                    <p class="gabarito-subtitle">Respostas corretas do desafio</p>
                  </div>
                </div>
                <button class="btn-close-gabarito" @click="showAdminGabarito = false">
                  <X size="24" />
                </button>
              </div>

              <div class="gabarito-content">
                <div class="gabarito-list">
                  <div 
                    v-for="item in adminGabarito" 
                    :key="item.n"
                    class="gabarito-item"
                    :class="{ 'highlight': item.n <= 4 }"
                  >
                    <div class="gabarito-number">
                      <span class="question-num">{{ item.n }}</span>
                    </div>
                    <div class="gabarito-details">
                      <div class="gabarito-answer">
                        <span class="answer-letter">{{ item.correct }}</span>
                        <span class="answer-text">{{ item.text }}</span>
                      </div>
                      <div class="gabarito-type">
                        {{ item.n <= 4 ? 'Progressão Aritmética' : 'Função Afim' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="gabarito-footer">
                <button class="btn-back-to-ranking" @click="showAdminGabarito = false">
                  <ArrowLeft size="18" />
                  Voltar
                </button>
              </div>
            </div>
          </Transition>

        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Modal de Confirmação para Limpar -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="confirmClear" class="confirm-overlay" @click.self="confirmClear = false">
        <div class="confirm-modal">
          <AlertTriangle class="confirm-icon" size="56" />
          <h3>Resetar classificação?</h3>
          <p>Todos os resultados serão apagados.</p>
          <div class="confirm-buttons">
            <button class="btn-cancel" @click="confirmClear = false">Voltar</button>
            <button class="btn-confirm-delete" @click="clearRanking">Resetar tudo</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import { 
  Trophy, 
  X, 
  Globe, 
  Sprout, 
  Zap, 
  Flame, 
  Medal, 
  Award, 
  BarChart3, 
  Check, 
  Trash2, 
  AlertTriangle,
  ArrowLeft
} from 'lucide-vue-next'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  currentPlayer: {
    type: String,
    default: ''
  }
})

const ADMIN = 'isamanu15'

const emit = defineEmits(['close'])

const activeTab = ref('all')
const rankingData = ref([])
const confirmClear = ref(false)
const showAdminGabarito = ref(false)

const tabs = [
  { id: 'all', name: 'Geral', icon: Globe },
  { id: 'easy', name: 'Iniciante', icon: Sprout },
  { id: 'medium', name: 'Intermediário', icon: Zap },
  { id: 'hard', name: 'Avançado', icon: Flame }
]

const filteredRanking = computed(() => {
  let data = rankingData.value
  if (activeTab.value !== 'all') {
    data = data.filter(p => p.difficulty === activeTab.value)
  }
  return data.slice(0, 20) // Top 20
})

const totalPlayers = computed(() => rankingData.value.length)
const averageScore = computed(() => {
  if (rankingData.value.length === 0) return 0
  const avg = rankingData.value.reduce((acc, p) => acc + p.score, 0) / rankingData.value.length
  return avg.toFixed(1)
})
const bestScore = computed(() => {
  if (rankingData.value.length === 0) return 0
  return Math.max(...rankingData.value.map(p => p.score))
})

const loadRanking = async () => {
  try {
    const res = await fetch('https://quiz-backend-4c5y.onrender.com/ranking')
    const data = await res.json()
    rankingData.value = data
  } catch (err) {
    console.error('Erro ao carregar ranking:', err)
  }
}

const adminGabarito = [
  { n: 1, correct: "A", text: "20 músicas" },
  { n: 2, correct: "B", text: "f(x) = 2x + 5" },
  { n: 3, correct: "C", text: "38 cm" },
  { n: 4, correct: "D", text: "13" },
  { n: 5, correct: "D", text: "R$ 20" },
  { n: 6, correct: "A", text: "R$ 30" },
  { n: 7, correct: "D", text: "40" },
  { n: 8, correct: "B", text: "R$ 20" }
]

const deletePlayer = async (id) => {
  const result = await Swal.fire({
    title: 'Remover jogador?',
    text: 'Esta ação não tem volta.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#f56565',
    cancelButtonColor: '#ddd',
    confirmButtonText: 'Remover',
    cancelButtonText: 'Cancelar',
    target: document.querySelector('.ranking-modal'), 
    backdrop: false
  })

  if (result.isConfirmed) {
    try {
      const res = await fetch(`https://quiz-backend-4c5y.onrender.com/ranking/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'user': props.currentPlayer
        }
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('Erro backend:', data)
        alert(data.error || 'Erro ao deletar')
        return
      }

      Swal.fire({
        icon: 'success',
        title: 'Removido!',
        text: 'O jogador excluído da classificação!',
        confirmButtonColor: '#48bb78',
        confirmButtonText: 'Ok',
        background: '#1a1a2e',
        color: '#fff',
        target: document.querySelector('.ranking-modal'),
        backdrop: false
      })

      loadRanking()
    } catch (err) {
      console.error('Erro ao deletar:', err)
    }
  }
}

const getDifficultyIcon = (diff) => {
  const icons = { easy: Sprout, medium: Zap, hard: Flame }
  return icons[diff] || Globe
}

const getDifficultyName = (diff) => {
  const names = { easy: 'Iniciante', medium: 'Intermediário', hard: 'Avançado' }
  return names[diff] || diff
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    console.log('Data inválida recebida:', dateString)
    return 'Erro'
  }
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const closeModal = () => {
  showAdminGabarito.value = false
  emit('close')
}

const clearRanking = async () => {
  try {
    await fetch('https://quiz-backend-4c5y.onrender.com/ranking', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'user': props.currentPlayer
      }
    })

    rankingData.value = []
    confirmClear.value = false

  } catch (err) {
    console.error('Erro ao limpar ranking:', err)
  }
}

onMounted(() => {
  loadRanking()
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    loadRanking()
    showAdminGabarito.value = false
  }
})
</script>

<style scoped>
.admin-actions {
  display: flex;
  gap: 10px;
}

.btn-gabarito-admin {
 background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-gabarito-admin:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
  transform: translateY(-2px);
}

.ranking-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.ranking-modal {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  position: relative;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(50px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.btn-delete-player {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff4d4f;
  border: none;
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
  color: white;
  opacity: 0;
  transition: 0.3s;
}

.ranking-item {
  position: relative;
}

.ranking-item:hover .btn-delete-player {
  opacity: 1;
}

/* Header */
.ranking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px;
 background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: white;
}

.ranking-title-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.ranking-icon {
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
  color: white;
}

.ranking-title {
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0;
  margin-bottom: 5px;
}

.ranking-subtitle {
  margin: 0;
  opacity: 0.9;
  font-size: 0.95rem;
}

.btn-close-ranking {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close-ranking:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

/* Tabs */
.ranking-tabs {
  display: flex;
  padding: 0 30px;
  border-bottom: 2px solid #f0f0f0;
  background: #fafafa;
  gap: 5px;
}

.tab-btn {
  flex: 1;
  padding: 18px 10px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #718096;
  transition: all 0.3s;
  margin-bottom: -2px;
}

.tab-btn:hover {
  color: #4a5568;
  background: #f0f0f0;
}

.tab-btn.active {
  color: #8b5cf6;
  border-bottom-color: #8b5cf6;
  background: white;
}

.tab-icon {
  stroke-width: 2;
}

/* Content */
.ranking-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 30px;
  background: #f8f9fa;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 18px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: all 0.3s;
  border: 2px solid transparent;
}

.ranking-item:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.ranking-item.top-1 {
  background: linear-gradient(135deg, #fff9e6 0%, #fff5d6 100%);
  border-color: #ffd700;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
}

.ranking-item.top-2 {
  background: linear-gradient(135deg, #f8f9fa 0%, #e2e8f0 100%);
  border-color: #c0c0c0;
}

.ranking-item.top-3 {
  background: linear-gradient(135deg, #fff5f0 0%, #ffe4d6 100%);
  border-color: #cd7f32;
}

.ranking-item.is-current {
   border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}

.rank-position {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.position-medal {
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
  animation: bounce 2s infinite;
}

.position-medal.gold {
  color: #ffd700;
  stroke-width: 1.5;
}

.position-medal.silver {
  color: #a0aec0;
  stroke-width: 1.5;
}

.position-medal.bronze {
  color: #cd7f32;
  stroke-width: 1.5;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.position-number {
  width: 40px;
  height: 40px;
  background: #e2e8f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #4a5568;
  font-size: 1rem;
}

.rank-info {
  flex: 1;
  min-width: 0;
}

.rank-name-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.rank-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.current-badge {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 3px 8px;
   background: #8b5cf6;
  color: white;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rank-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
}

.rank-difficulty {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.8rem;
}

.rank-difficulty.easy { background: #f0fff4; color: #38a169; }
.rank-difficulty.medium { background: #fffaf0; color: #dd6b20; }
.rank-difficulty.hard { background: #fff5f5; color: #e53e3e; }

.rank-date {
  color: #a0aec0;
}

.rank-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.stat-score {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.score-value {
  font-size: 1.8rem;
  font-weight: 800;
   color: #8b5cf6;
  line-height: 1;
}

.score-label {
  font-size: 0.85rem;
  color: #a0aec0;
  font-weight: 600;
}

.stat-details {
  display: flex;
  gap: 10px;
  font-size: 0.85rem;
  font-weight: 600;
}

.stat-correct {
  color: #48bb78;
  display: flex;
  align-items: center;
  gap: 3px;
}

.stat-wrong {
  color: #f56565;
  display: flex;
  align-items: center;
  gap: 3px;
}

/* Empty State */
.ranking-empty {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  margin-bottom: 20px;
  opacity: 0.5;
  color: #718096;
}

.ranking-empty h3 {
  color: #2d3748;
  margin-bottom: 10px;
  font-size: 1.3rem;
}

.ranking-empty p {
  color: #718096;
}

/* Footer */
.ranking-footer {
  padding: 20px 30px;
  background: white;
  border-top: 2px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.ranking-stats-summary {
  display: flex;
  gap: 30px;
}

.summary-box {
  text-align: center;
}

.summary-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
  color: #8b5cf6;
  line-height: 1;
}

.summary-label {
  font-size: 0.75rem;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-clear-ranking {
  padding: 10px 20px;
  background: #fff5f5;
  color: #e53e3e;
  border: 1px solid #feb2b2;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-clear-ranking:hover {
  background: #f56565;
  color: white;
}

/* Gabarito Panel - Modal Interno */
.gabarito-panel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 100;
  display: flex;
  flex-direction: column;
  border-radius: 24px;
}

.gabarito-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px;
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: white;
}

.gabarito-title-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.gabarito-icon-wrapper {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.gabarito-title {
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0;
  margin-bottom: 5px;
}

.gabarito-subtitle {
  margin: 0;
  opacity: 0.9;
  font-size: 0.95rem;
}

.btn-close-gabarito {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close-gabarito:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.gabarito-content {
  flex: 1;
  overflow-y: auto;
  padding: 25px 30px;
  background: #f8f9fa;
}

.gabarito-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.gabarito-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 2px solid transparent;
  transition: all 0.3s;
}

.gabarito-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

.gabarito-item.highlight {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #f5f3ff 0%, #ffffff 100%);
}

.gabarito-number {
  flex-shrink: 0;
}

.question-num {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3);
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
}

.gabarito-details {
  flex: 1;
  min-width: 0;
}

.gabarito-answer {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.answer-letter {
  width: 32px;
  height: 32px;
  background: #48bb78;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1rem;
  flex-shrink: 0;
}

.answer-text {
  font-weight: 700;
  color: #1a1a2e;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gabarito-type {
  font-size: 0.75rem;
  color: #718096;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-left: 42px;
}

.gabarito-footer {
  padding: 20px 30px;
  background: white;
  border-top: 2px solid #f0f0f0;
  display: flex;
  justify-content: center;
}

.btn-back-to-ranking {
  padding: 14px 28px;
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-back-to-ranking:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

/* Gabarito Slide Animation */
.gabarito-slide-enter-active,
.gabarito-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.gabarito-slide-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.gabarito-slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Confirm Modal */
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
  backdrop-filter: blur(5px);
  padding: 20px;
}

.confirm-modal {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 400px;
  width: 100%;
  animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.confirm-icon {
  margin-bottom: 15px;
  color: #f56565;
}

.confirm-modal h3 {
  color: #1a1a2e;
  margin-bottom: 10px;
  font-size: 1.4rem;
}

.confirm-modal p {
  color: #718096;
  margin-bottom: 25px;
}

.confirm-buttons {
  display: flex;
  gap: 15px;
}

.btn-cancel, .btn-confirm-delete {
  flex: 1;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
}

.btn-cancel {
  background: #f7fafc;
  color: #4a5568;
}

.btn-cancel:hover {
  background: #edf2f7;
}

.btn-confirm-delete {
  background: #f56565;
  color: white;
}

.btn-confirm-delete:hover {
  background: #e53e3e;
  transform: translateY(-2px);
}

/* Transitions */
.modal-enter-active, .modal-leave-active {
  transition: all 0.3s;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

/* Scrollbar */
.ranking-content::-webkit-scrollbar,
.gabarito-content::-webkit-scrollbar {
  width: 8px;
}

.ranking-content::-webkit-scrollbar-track,
.gabarito-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.ranking-content::-webkit-scrollbar-thumb,
.gabarito-content::-webkit-scrollbar-thumb {
  background: #c4b5fd;
  border-radius: 4px;
}

.ranking-content::-webkit-scrollbar-thumb:hover,
.gabarito-content::-webkit-scrollbar-thumb:hover {
   background: #8b5cf6;
}

/* Responsive */
@media (max-width: 670px) {
  .ranking-overlay {
    box-sizing: border-box;
    padding: 5px 0px;
    justify-content: flex-start;
  }

  .ranking-modal {
    margin: 0;
    width: 100%;
    max-width: 100%;
  }
  
  .confirm-overlay {
    box-sizing: border-box;
    padding: 10px 0px;
    justify-content: center;
    align-items: center;
  }

  .confirm-modal {
    width: 100%;
    max-width: 95%;
    margin: 0 auto;
    padding: 25px 20px;
  }
  
  .ranking-header,
  .gabarito-header {
    padding: 20px;
  }
  
  .ranking-icon {
    width: 40px;
    height: 40px;
  }
  
  .ranking-title,
  .gabarito-title {
    font-size: 1.4rem;
  }
  
  .ranking-tabs {
    padding: 0 15px;
  }
  
  .tab-btn {
    padding: 15px 5px;
    font-size: 0.85rem;
  }
  
  .tab-icon {
    width: 18px;
    height: 18px;
  }
  
  .tab-text {
    display: none;
  }
  
  .ranking-content,
  .gabarito-content {
    padding: 15px;
  }
  
  .gabarito-list {
    grid-template-columns: 1fr;
  }
  
  .ranking-item {
    padding: 15px;
    gap: 12px;
  }
  
  .rank-position {
    width: 40px;
    height: 40px;
  }
  
  .position-medal {
    width: 32px;
    height: 32px;
  }
  
  .position-number {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }
  
  .rank-name {
    font-size: 1rem;
  }
  
  .rank-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .score-value {
    font-size: 1.5rem;
  }
  
  .ranking-footer,
  .gabarito-footer {
    flex-direction: column;
    padding: 20px;
    gap: 15px;
  }
  
  .ranking-stats-summary {
    width: 100%;
    justify-content: space-around;
  }
  
  .admin-actions {
    width: 100%;
    justify-content: center;
  }
  
  .gabarito-icon-wrapper {
    width: 48px;
    height: 48px;
  }
}
</style>