const service = require('../services/rankingService')

// POST
const create = async (req, res) => {
  try {
    const result = await service.createRanking(req.body)

    if (result.exists) {
      return res.status(409).json(result)
    }

    res.status(201).json(result)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'Esse nome já está em uso no ranking. Escolha outro nome.'
      })
    }

    res.status(500).json({ error: err.message })
  }
}

// GET
const getAll = async (req, res) => {
  try {
    const data = await service.getRanking()
    res.json(data)
  } catch (err) {
    console.error('ERRO REAL:', err) // 👈 ADICIONA ISSO
    res.status(500).json({ error: err.message })
  }
}

// CHECK NAME
const checkName = async (req, res) => {
  try {
    const { name } = req.query

    if (!name) {
      return res.status(400).json({ message: 'Nome é obrigatório' })
    }

    const exists = await service.checkNameExists(name)

    res.json({ exists })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// DELETE (admin)
const clear = async (req, res) => {
  try {
    const user = req.headers['user']
    await service.clearRanking(user)
    res.json({ message: 'Ranking apagado ✅' })
  } catch (err) {
    res.status(403).json({ error: err.message })
  }
}

const deleteOne = async (req, res) => {
  try {
    const user = req.headers['user']
    console.log('USER RECEBIDO:', user) // 👈 adiciona isso

    const { id } = req.params

    await service.deleteOne(id, user)

    res.json({ message: 'Usuário removido do ranking 🗑️' })
  } catch (err) {
    res.status(403).json({ error: err.message })
  }
}



module.exports = {
  create,
  getAll,
  clear,
  checkName,
  deleteOne 
}
