const express = require('express')
// const BasicAuth = require('./middleware/basicAuth')
const playersRouter = require('./router/router') 
require('dotenv').config()

const app = express()

app.use(express.json())

// app.use(BasicAuth)
app.use(playersRouter)

app.listen(process.env.PORT, () => {
    console.log(`Connection is at ${process.env.PORT}`)
})