const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    console.log('🔌 Tentando conectar no Mongo...')
    console.log('URI:', process.env.MONGO_URI)

    await mongoose.connect(process.env.MONGO_URI)

    console.log('🟢 MongoDB conectado com sucesso!')
  } catch (error) {
    console.error('🔥 ERRO COMPLETO MONGO:', error)
    // ❌ NÃO mata o servidor
  }
}

module.exports = connectDB
