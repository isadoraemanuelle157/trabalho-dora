<template>
  <div class="quiz-view">
    <!-- Header -->
    <div class="quiz-top-bar">
      <div class="player-info">
        <span class="player-avatar">👤</span>
        <span class="player-name">{{ playerName }}</span>
      </div>
      <button class="btn-exit" @click="confirmExit">✕</button>
    </div>

    <!-- Quiz Card -->
    <div class="quiz-card"  v-if="currentQuestion">
      <div class="progress-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>
        <span class="progress-text">
          {{ currentQuestionIndex + 1 }} / {{ questions.length }}
        </span>
      </div>

      <div class="question-box">
        <span class="question-label">Questão {{ currentQuestionIndex + 1 }}</span>
        <p class="question-text" v-html="currentQuestion.question"></p>
      </div>

      <div class="options-grid">
        <button
          v-for="(option, key) in currentQuestion.options"
          :key="key"
          :class="[
            'option-btn',
            `option-${key}`,
            {
              'selected': selectedOption === key,
              'correct': showFeedback && key === currentQuestion.correct,
              'wrong': showFeedback && selectedOption === key && key !== currentQuestion.correct,
              'disabled': showFeedback
            }
          ]"
          @click="selectOption(key)"
          :disabled="showFeedback"
        >
          <span class="option-letter">{{ key.toUpperCase() }}</span>
          <span class="option-text">{{ option }}</span>
        </button>
      </div>

      <!-- Feedback com Justificativa -->
      <transition name="slide-up">
        <div v-if="showFeedback" class="feedback-section">
          <div :class="['feedback-header', isCorrect ? 'success' : 'error']">
            <span class="feedback-icon">{{ isCorrect ? '✓' : '✗' }}</span>
            <span class="feedback-title">{{ isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta' }}</span>
          </div>
          
          <div class="feedback-content">
            <div class="correct-answer-box">
              <span class="answer-label">Resposta correta:</span>
              <div class="answer-display">
                <span class="answer-letter">{{ currentQuestion.correct.toUpperCase() }}</span>
                <span class="answer-text">{{ currentQuestion.options[currentQuestion.correct] }}</span>
              </div>
            </div>
            
          </div>
        </div>
      </transition>
      <button 
        class="btn-primary"
        @click="nextQuestion"
        :disabled="!showFeedback"
      >
        {{ isLastQuestion ? 'Finalizar' : 'Próxima Questão →' }}
      </button>
    </div>

    <!-- Modal de Confirmação de Saída -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showExitConfirm" class="modal-overlay" @click.self="showExitConfirm = false">
          <div class="modal-content confirm-modal">
            <div class="modal-icon">⚠️</div>
            <h3 class="modal-title">Sair do Quiz?</h3>
            <p class="modal-text">Seu progresso será perdido. Deseja realmente sair?</p>
            <div class="confirm-buttons">
              <button class="btn-cancel" @click="showExitConfirm = false">Continuar</button>
              <button class="btn-confirm" @click="exitQuiz">Sair</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

const props = defineProps({
  playerName: String,
  difficulty: String,
  difficultyConfig: Object,
  shuffle: Boolean // 👈 NOVO
})

const emit = defineEmits(['finish', 'exit'])

const ADMIN = 'isamanu15'

// Estado
const currentQuestionIndex = ref(0)
const selectedOption = ref(null)
const showFeedback = ref(false)
const isCorrect = ref(false)
const score = ref(0)
const correctAnswers = ref(0)
const wrongAnswers = ref(0)
const showExitConfirm = ref(false)
const userAnswers = ref([])
const quizHistory = ref([])

const questions = ref([])

// Questões com justificativas
const originalQuestions = [ 
  {
    question: "Em uma fábrica de roupas, após a aquisição de novas máquinas tecnológicas e a contratação de mais funcionárias, a produção diária de calças de alfaiateria passou a crescer de forma constante. No primeiro dia de operação com as novas máquinas, foram produzidas <span class='math-expr'>550 peças</span>. A cada dia, devido às melhorias tecnológicas aplicadas, a produção aumenta em <span class='math-expr'>333</span> peças. Qual será a produção total ao longo de <span class='math-expr'>30 dias</span>?",
    options: { a: "161.355 peças", b: "10.757 peças", c: "171.990 peças", d: "16.135 peças" },
    correct: "a"
  },
  {
    question: "Durante uma gincana de matemática, os participantes encontraram uma escada numerada. Eles perceberam que os números dos degraus seguiam uma progressão aritmética (PA). Os cinco primeiros degraus eram: <span class='math-expr'>2, 5, 8, 11, 14, ...</span>Seguindo esse padrão, qual número estará no <span class='math-expr'>8º degrau</span>?",
    options: { a: "20", b: "23", c: "26", d: "29" },
    correct: "b",
  },
  {
    question: "Em uma biblioteca escolar, no primeiro dia foram organizados <span class='math-expr'>5 livros</span> em uma estante. A cada dia seguinte, os alunos organizaram <span class='math-expr'>3 livros</span> a mais que no dia anterior. Quantos livros foram organizados no <span class='math-expr'>8º dia</span>?",
    options: { a: "23", b: "24", c: "26", d: "29" },
    correct: "c"
  },
  {
    question: "Uma sequência numérica é uma progressão aritmética em que o primeiro termo é <span class='math-expr'>5</span> e a razão é <span class='math-expr'>3</span>. Sabendo disso, qual é o <span class='math-expr'>15º termo</span> dessa progressão?",
    options: { a: "42", b: "47", c: "50", d: "48" },
    correct: "b"
  },
  {
    question: "Durante uma promoção em uma loja de tênis, os preços de um modelo seguem uma progressão aritmética (P.A). No primeiro dia, o tênis custa <span class='math-expr'>R$79,90</span>, e a cada dia o preço aumenta <span class='math-expr'>R$15 em relação ao dia anterior</span>. Se uma pessoa acompanhar o preço durante <span class='math-expr'>7 dias</span> e somar todos os valores praticados nesse período, qual será o total?",
    options: { a: "R$874,30", b: "R$909,30", c: "R$944,30", d: "R$979,30" },
    correct: "a"
  },
  {
    question: "Em uma progressão aritmética, o <span class='math-expr'>5º termo</span>é igual a <span class='math-expr'>53.</span>. Sabendo disso, qual é a soma dos<span class='math-expr'>20</span> primeiros termos dessa P.A?",
    options: { a: "910", b: "980", c: "1.020", d: "1.100" },
    correct: "a"
  },
]
// Computed
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])
const isLastQuestion = computed(() => 
  currentQuestionIndex.value === questions.value.length - 1
)

const progressPercentage = computed(() => 
  ((currentQuestionIndex.value + 1) / questions.value.length) * 100
)

onMounted(() => {
  generateQuestions()
})

const generateQuestions = () => {
  let finalQuestions = [...originalQuestions]

  // embaralha somente se marcado e não for fácil
 if (props.shuffle) {
    finalQuestions = shuffleArray(finalQuestions)
  }

  questions.value = finalQuestions
}

const shuffleArray = (array) => {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
// Quiz Logic
const selectOption = (option) => {
if (showFeedback.value) return
  
  selectedOption.value = option
  userAnswers.value[currentQuestionIndex.value] = option
  checkAnswer(option)
}

const checkAnswer = (option) => {
  const questionSnapshot = { ...currentQuestion.value } // 👈 congela a questão
  const userAnswerSnapshot = option // 👈 salva direto

  showFeedback.value = true
  isCorrect.value = option === questionSnapshot.correct

  if (isCorrect.value) {
    score.value++
    correctAnswers.value++
  } else {
    wrongAnswers.value++
  }

  console.log("Resposta do usuário:", userAnswerSnapshot)

quizHistory.value.push({
  question: questionSnapshot.question,
  correctAnswer: questionSnapshot.correct,
  correctText: questionSnapshot.options[questionSnapshot.correct],
  userAnswer: userAnswerSnapshot
})
}

const nextQuestion = () => {
  if (isLastQuestion.value) {
    finishQuiz()
  } else {
    currentQuestionIndex.value++
    resetQuestion()
  }
}

const resetQuestion = () => {
  selectedOption.value = null
  showFeedback.value = false
  isCorrect.value = false
}

const finishQuiz = async () => {

 const result = {
  name: props.playerName,
  score: score.value,
  correct: correctAnswers.value,
  wrong: wrongAnswers.value,
  difficulty: 'easy',
  history: quizHistory.value // 👈 ESSENCIAL
}

  try {
  const res = await fetch('https://trabalho-dora.onrender.com/ranking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    })

    const data = await res.json()

    if (!res.ok) {
      await Swal.fire({
        icon: 'error',
        title: 'Ops!',
        text: data.message || 'Erro ao salvar ranking.',
        confirmButtonColor: '#f56565',
        confirmButtonText: 'OK',
        background: '#1a1a2e',
        color: '#fff'
      })
      return
    }

    await Swal.fire({
      icon: 'success',
      title: 'Sucesso!',
      text: data.message || 'Pontuação salva com sucesso!',
      confirmButtonColor: '#48bb78',
      confirmButtonText: 'Ótimo!',
      background: '#1a1a2e',
      color: '#fff',
      timer: 3000,
      timerProgressBar: true
    })
    
    emit('finish', result)

  } catch (err) {
    console.error('Erro ao salvar ranking:', err)
    await Swal.fire({
      icon: 'error',
      title: 'Erro de Conexão',
      text: 'Erro ao conectar com o servidor.',
      confirmButtonColor: '#f56565',
      confirmButtonText: 'Entendi',
      background: '#1a1a2e',
      color: '#fff'
    })
  }
}


const confirmExit = () => {
  showExitConfirm.value = true
}

const exitQuiz = () => {
  showExitConfirm.value = false
  emit('exit')
}
</script>

<style scoped>
/* Adicionar estilo para o ícone na badge */
.difficulty-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.difficulty-badge svg {
  stroke-width: 2.5;
}

.badge-easy { 
  background: #48bb78; 
  color: white; 
}

.badge-easy svg { color: white; }

.badge-medium { 
  background: #ed8936; 
  color: white; 
}

.badge-medium svg { color: white; }

.badge-hard { 
  background: #f56565; 
  color: white; 
}

.badge-hard svg { color: white; }

.quiz-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
 background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.quiz-top-bar {
  width: 100%;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.player-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
}

.player-avatar {
  font-size: 1.5rem;
}

.player-name {
  font-weight: 600;
  font-size: 1.1rem;
}

.difficulty-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.badge-easy { background: #48bb78; color: white; }
.badge-medium { background: #ed8936; color: white; }
.badge-hard { background: #f56565; color: white; }

.btn-exit {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-exit:hover {
  background: #f56565;
  transform: rotate(90deg);
}

/* Timer */
.timer-bar-container {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  position: relative;
}

.timer-bar {
  height: 100%;
  background: linear-gradient(90deg, #48bb78 0%, #48bb78 100%);
  transition: width 1s linear, background 0.3s;
}

.timer-bar.warning { background: linear-gradient(90deg, #ed8936 0%, #ed8936 100%); }
.timer-bar.danger { background: linear-gradient(90deg, #f56565 0%, #f56565 100%); }

.timer-text {
  position: absolute;
  right: 20px;
  top: 15px;
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 12px;
  border-radius: 20px;
}

.timer-text.pulse {
  animation: pulse-text 0.5s infinite;
}

@keyframes pulse-text {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Quiz Card */
.quiz-card {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  padding: 30px;
  width: 100%;
  max-width: 800px;
  margin: 20px auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
 background: linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%);
  border-radius: 10px;
  transition: width 0.5s ease;
}

.progress-text {
  color: #7c3aed;
  font-weight: 700;
  font-size: 0.9rem;
  min-width: 50px;
  text-align: right;
}

/* Question Box */
.question-box {
background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
  padding: 35px;
  border-radius: 16px;
  margin-bottom: 25px;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.question-box::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
}

.question-label {
  display: inline-block;
  background: rgba(255,255,255,0.2);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 15px;
}

.question-text {
  font-size: 1.4rem;
  color: white;
  line-height: 1.6;
  font-weight: 600;
  position: relative;
  z-index: 1;
}

:deep(.math-expr) {
  display: inline-block;
  background: rgba(255,255,255,0.25);
  color: white;
  padding: 4px 12px;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  margin: 0 4px;
  border: 1px solid rgba(255,255,255,0.3);
}

/* Options Grid 2x2 */
.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 25px 20px;
  background: white;
  border: 3px solid #e2e8f0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  position: relative;
  overflow: hidden;
}

.option-btn::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 5px;
  background: transparent;
  transition: all 0.3s;
}

.option-btn:hover:not(.disabled) {
  transform: translateY(-3px);
 border-color: #7c3aed;
box-shadow: 0 10px 25px rgba(124, 58, 237, 0.25);

}

.option-btn.selected {
background: #ede9fe;
border-color: #7c3aed;
}

.option-btn.selected::before {
  background: #667eea;
}

.option-btn.correct {
  border-color: #48bb78;
  background: #f0fff4;
  animation: pulse 0.5s;
}

.option-btn.correct::before {
  background: #48bb78;
}

.option-btn.wrong {
  border-color: #f56565;
  background: #fff5f5;
  animation: shake 0.5s;
}

.option-btn.wrong::before {
  background: #f56565;
}

.option-btn.disabled {
  cursor: not-allowed;
  opacity: 0.9;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.option-letter {
  width: 45px;
  height: 45px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.2rem;
  flex-shrink: 0;
  transition: all 0.3s;
  background: #f7fafc;
  color: #4a5568;
}

.option-a .option-letter,
.option-b .option-letter,
.option-c .option-letter,
.option-d .option-letter {
  background: #ede9fe;
  color: #5b21b6;
}

.option-btn.selected .option-letter {
  background: #7c3aed !important;
  color: white !important;
  transform: scale(1.1);
}

.option-btn.correct .option-letter {
  background: #48bb78 !important;
  color: white !important;
}

.option-btn.wrong .option-letter {
  background: #f56565 !important;
  color: white !important;
}

.option-text {
  font-size: 1.15rem;
  color: #2d3748;
  font-weight: 600;
}

/* Feedback Section com Justificativa */
.feedback-section {
  margin-bottom: 25px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.4s ease;
}

.feedback-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  font-weight: 700;
  font-size: 1.1rem;
}

.feedback-header.success {
  background: #48bb78;
  color: white;
}

.feedback-header.error {
  background: #f56565;
  color: white;
}

.feedback-icon {
  font-size: 1.5rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
}

.feedback-content {
  background: #f7fafc;
  padding: 20px;
}

.correct-answer-box {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.answer-label {
  font-size: 0.9rem;
  color: #718096;
  font-weight: 600;
}

.answer-display {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  padding: 8px 16px;
  border-radius: 10px;
  border: 2px solid #48bb78;
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
}

.answer-text {
  font-weight: 700;
  color: #22543d;
  font-size: 1.05rem;
}

.justification-box {
  background: white;
  padding: 16px;
  border-radius: 12px;
 border-left: 4px solid #7c3aed;
}

.justification-label {
  display: block;
  font-size: 0.9rem;
  color: #667eea;
  font-weight: 700;
  margin-bottom: 8px;
}

.justification-text {
  color: #4a5568;
  line-height: 1.6;
  font-size: 1rem;
  margin: 0;
}

.time-expired-msg {
  text-align: center;
  padding: 15px;
  background: #fff5f5;
  color: #f56565;
  border-radius: 12px;
  margin-bottom: 20px;
  font-weight: 700;
  font-size: 1.1rem;
  border: 2px solid #f56565;
  animation: pulse 1s infinite;
}

.btn-primary {
  width: 100%;
  padding: 18px;
 background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal de Confirmação */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 35px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: modalUp 0.3s ease;
}

@keyframes modalUp {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.confirm-modal {
  text-align: center;
}

.modal-icon {
  font-size: 4rem;
  margin-bottom: 15px;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a2e;
  margin-bottom: 10px;
}

.modal-text {
  color: #718096;
  margin-bottom: 25px;
  font-size: 1.05rem;
}

.confirm-buttons {
  display: flex;
  gap: 15px;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  padding: 14px 24px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.btn-cancel {
  background: #f7fafc;
  color: #4a5568;
}

.btn-cancel:hover {
  background: #edf2f7;
}

.btn-confirm {
  background: #f56565;
  color: white;
}

.btn-confirm:hover {
  background: #e53e3e;
  transform: translateY(-2px);
}

/* Transitions */
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.4s ease;
}

.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.modal-enter-active, .modal-leave-active {
  transition: all 0.3s;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .options-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .option-btn {
    padding: 18px 15px;
  }
  
  .question-box {
    padding: 25px;
  }
  
  .question-text {
    font-size: 1.2rem;
  }
  
  .feedback-content {
    padding: 15px;
  }
  
  .correct-answer-box {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .quiz-top-bar {
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .player-name {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
    .modal-content {
    transform: translateX(-6px);
    margin: 0;              /* remove centralização problemática */
    width: 100%;
    max-width: 100%;
    padding: 20px 12px;    /* menos espaço lateral */
    border-radius: 12px;
    box-sizing: border-box;
  }

  .modal-overlay {
  box-sizing: border-box;
    margin: 6px 0 5px 2px; /* tira o auto e joga pra esquerda */
    max-width: 95%; 
  }
   .quiz-card {
      box-sizing: border-box;
    margin: 3px 0 2px 10px; /* tira o auto e joga pra esquerda */
    max-width: 95%; /* evita estourar a tela */
  }

  .quiz-view {
    align-items: flex-start; /* garante alinhamento à esquerda */
  }
  .feedback-header {
    padding: 12px 16px;
    font-size: 1rem;
  }
}
</style>