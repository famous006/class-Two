const express = require('express')
const { getSignup, getDashboard, postRegister, postSignin, getLogin } = require('../controllers/user.controller')
const router = express.Router()


router.get('/signup', getSignup)

router.get("/dashboard", getDashboard)

router.post('/register', postRegister)

// router.get('/signup', postSignup)

router.get('/login', getLogin)

router.post('/signin', postSignin)

module.exports = router