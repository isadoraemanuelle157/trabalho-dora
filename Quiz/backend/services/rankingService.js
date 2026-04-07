const Ranking = require('../models/Ranking')

// criar pontuação
const createRanking = async (data) => {
  const cleanName = data.name.trim()

  const existing = await Ranking.findOne({ name: cleanName })

  if (existing) {
    return {
      exists: true,
      message: 'Esse nome já está em uso no ranking. Escolha outro nome.'
    }
  }

  const created = await Ranking.create({
    ...data,
    name: cleanName
  })

  return {
    created: true,
    message: 'Ranking criado com sucesso!',
    data: created
  }
}

const checkNameExists = async (name) => {
  const cleanName = name.trim()

  const existing = await Ranking.findOne({ name: cleanName })

  return !!existing
}


// buscar ranking (top 20)
const getRanking = async () => {
  return await Ranking.find()
    .sort({ score: -1 })
    .limit(20)
}

// limpar ranking (admin)
const clearRanking = async (user) => {
  const ADMIN = process.env.ADMIN_USER

  if (user !== ADMIN) {
    throw new Error('Sem permissão')
  }

  return await Ranking.deleteMany()
}

const deleteOne = async (id, user) => {
  const ADMIN = process.env.ADMIN_USER

  if (user?.trim().toLowerCase() !== ADMIN.trim().toLowerCase()) {
    throw new Error('Sem permissão')
  }

  return await Ranking.findByIdAndDelete(id)
}

module.exports = {
  createRanking,
  getRanking,
  clearRanking,
  checkNameExists,
  deleteOne
}
