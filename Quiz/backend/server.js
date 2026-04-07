require('dotenv').config()

const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')

const app = express()

// conectar banco
connectDB()

// middlewares
app.use(cors())
app.use(express.json())

// rota principal teste
app.get('/', (req, res) => {
  res.send('API do Quiz rodando 🚀')
})

// rotas
app.use('/ranking', require('./routes/rankingRoutes'))

// porta
const PORT = process.env.PORT || 3002

app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando na porta ${PORT}`)
})