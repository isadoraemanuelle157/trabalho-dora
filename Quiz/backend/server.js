require('dotenv').config()

const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')

const app = express()

app.use(cors())
app.use(express.json())

// rota teste
app.get('/', (req, res) => {
  res.send('API do Quiz rodando 🚀')
})

// 🔥 IMPORTANTE: esperar o banco conectar
const startServer = async () => {
  await connectDB()

  app.use('/ranking', require('./routes/rankingRoutes'))

  const PORT = process.env.PORT || 3002
  app.listen(PORT, () => {
    console.log(`🔥 Servidor rodando na porta ${PORT}`)
  })
}

startServer()
