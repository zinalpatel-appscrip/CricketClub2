const auth = require('basic-auth')
const jwt = require('jsonwebtoken')


const maxAge = 2*21*60*60


const generateToken = (id) => {
    return jwt.sign({ id }, process.env.SECRET_KEY,{
        expiresIn: maxAge
    })
}

const BasicAuth = async (req,res,next) => {
    console.log("usingbasicauth")
    const user = await auth(req)

    const username = process.env.API_USERNAME
    const password = process.env.API_PASSWORD

    if (user && user.name.toLowerCase() === username.toLowerCase() && user.pass === password) {
        console.log('Basic Auth: success')
        const token = generateToken(user.name)
        res.header('jwt-token',token)
        next()
    } else {
        console.log('Basic Auth: failure')
        res.statusCode = 401
        res.end('Access denied')
    }
    
}

module.exports = BasicAuth