const jwt = require('jsonwebtoken')
require('dotenv').config();

const requireAuth = (req, res, next) => {
    const token = req.headers.token

    if(token)
    {
        jwt.verify(token,process.env.SECRET_KEY,(err,decodedToken) => {
            if(err){
                console.log(err.message)
                res.send('Invalid token')
            }else{
                next()
            }
        })
    }
    else
        res.send('Unauthorized')
}

module.exports = { requireAuth }