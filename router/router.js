const express = require('express')
const router =  new express.Router()
const BasicAuth = require('../middleware/basicAuth')
const { requireAuth } = require('../middleware/requireAuth')


const playersController = require('../controller/playersController')

router.post('/create', BasicAuth, playersController.insertData)

router.get('/list', requireAuth,playersController.readData)

router.put('/update/:playerid', requireAuth, playersController.updateData)

router.delete('/delete/:playerid', requireAuth, playersController.deleteData)

router.get('/getplayer', requireAuth, playersController.getPlayer)

router.post('/schedulematch', requireAuth, playersController.scheduleMatch)

router.put('/score',  requireAuth,playersController.updateScore)

router.get('/history',  requireAuth,playersController.matchHistory)

router.get('/matchdata', requireAuth, playersController.matchData)

router.get('/getschedule', requireAuth, playersController.getschedule)

module.exports = router