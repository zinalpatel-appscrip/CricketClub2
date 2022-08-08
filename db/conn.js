const { MongoClient } = require('mongodb')
require('dotenv').config();

const url = process.env.CONNECTION_URL
const client = new MongoClient(url)

async function dbConnect(tableName){
    let result = await client.connect()
    let db = result.db('cricketData2')
    // console.log(tableName)
    return db.collection(tableName)
}

module.exports = dbConnect