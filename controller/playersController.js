const dbConnect = require('../db/conn')
const mongodb = require('mongodb')

module.exports = {
    readData :  async (req,res) => {
        const subDB = await dbConnect('playerDetails')
        const teamid = req.headers.teamid
        const playerid = req.headers.playerid

        if(playerid)
        {
            let data = await subDB.findOne({_id: new mongodb.ObjectId(playerid)})
            if(data)
            {
                // let playersData  = await subDB.find().toArray()
                res.send(data)
            }
            else
                res.send("This player does not exist")
        }
        else if(teamid)
        {
            let data = await subDB.find({teamID: teamid}).toArray()
            if(data)
                res.send(data) 
            else
                res.send("This team does not exist")
        }
        
    },
    insertData : async (req, res) => {
        try{
            const db = await dbConnect('teamDetails')
            let data = await db.findOne({_id: new mongodb.ObjectId(req.body.teamID)})
            
            if(data)
            {
                const subDB = await dbConnect('playerDetails')
    
                const result = await subDB.insertMany([req.body])
        
                if(result.acknowledged)
                {
                    res.send(result)
                }
            }
            else
                res.send("This team does not exist")
        }catch(e){
            console.log(e)
        }
    },
    updateData : async (req, res) => {
        try{
            const db = await dbConnect('teamDetails')
            let data = await db.findOne({_id: new mongodb.ObjectId(req.body.teamID)})
            if(data)
            {
                const subDB = await dbConnect('team'+data.name)
                delete req.body.teamID

                let result = await subDB.updateOne({_id: new mongodb.ObjectId(req.params.id)} , {$set: req.body})
                res.send(result)
            }
            else
            {
                res.send("This team does not exist")
            }
        }
        catch(e){
            console.log(e)
        }
    },
    deleteData : async (req, res) => {
        const db = await dbConnect('teamDetails')
        
        let data = await db.findOne({_id: new mongodb.ObjectId(req.headers.teamid)})
        if(data)
        {
            const subDB = await dbConnect('team'+data.name)

            let result = await subDB.deleteOne({_id: new mongodb.ObjectId(req.params.id)})
            if(result.acknowledged){
                res.send(result)
            }
        }
        else
        {
            res.send("Data not found")
        }
    },
    getPlayer : async (req, res) => {
        const db = await dbConnect('playerDetails')
        // let data = await db.findOne({_id: new mongodb.ObjectId(req.headers.playerid)})
        // if(data)
        // {
            //age grater than 20 & less than or eq 40 & playerrole is roleOne or roleThree & contry name starts with i - case insensitive
            let result = await db.find({
                $and : [{age: {$gt: 20}}, {age: {$lte: 40}}],
                $or : [{playerrole : 'role Two'},{playerrole : 'role Three'}],
                country : /^c/i
            
            }).toArray()
            // let result = await subDB.aggregate([
            //     {
            //         $match : {
            //             $and : [{age: {$gt: 20}}, {age: {$lte: 40}}],
            //             $or : [{playerrole : 'role One'},{playerrole : 'role Three'}],
            //             country : /^i/i
            //         }
            //     }
                
            // ]).toArray()
            res.send(result)
        // }
        // else
        //     res.send("This player does not exist")
    },
    scheduleMatch : async (req, res) => {
        try{
            const db = await dbConnect('teamDetails')
            let data = await db.find({$or : [ {_id: new mongodb.ObjectId(req.body.firstTeamId)} , {_id: new mongodb.ObjectId(req.body.secondTeamId)} ]}).toArray()

            req.body.date = new Date(req.body.date)

            if(data.length != 2)
            {
                res.send("This team does not exist")
                return
            }

            if(data.length === 2 && (!(data[0].isSchedule || data[1].isSchedule)))
            {
                const subDB = await dbConnect('matchDetails')
                const result = await subDB.insertMany([req.body])

                // console.log(result)
        
                if(result.acknowledged)
                {
                    let result = await db.updateOne({_id: new mongodb.ObjectId(req.body.firstTeamId)},{$set: {isSchedule:1,matchCount: data[0].matchCount + 1 }})
                    let result2 = await db.updateOne({_id: new mongodb.ObjectId(req.body.secondTeamId)},{$set: {isSchedule:1,matchCount: data[1].matchCount + 1 }})
                    
                    // console.log(req.body.players)
                    // for(let i=0; i<req.body.players.length; i++)
                    // {
                    //     let data = await db.findOne({_id: new mongodb.ObjectId(req.body.players[i].teamID)})
                    //     const subDB = await dbConnect('team' + data.name)
                    //     const data2 = await subDB.findOne({_id: new mongodb.ObjectId(req.body.players[i].playerID)})
                    //     console.log(data2.matchIDs)
                    //     const result  = subDB.updateOne({_id: new mongodb.ObjectId(req.body.players[i].playerID)},{$set: {matchIDs : data2.matchIDs.push('2')}})
                    //     console.log(result)
                    // }
                    
                    res.send("Scheduled")

                }
            }
            else
            {
                res.send("Already Scheduled")
            }
        }catch(e){
            console.log(e)
        }
    },
    updateScore : async (req, res) => {
        const db = await dbConnect('teamDetails')
        let data = await db.findOne({_id: new mongodb.ObjectId(req.body.teamID)})

        if(data)
        {
            const subDB = await dbConnect('team'+data.name)
            let playerData = await subDB.findOne({_id: new mongodb.ObjectId(req.body.playerID)})
            let result = await subDB.updateOne({_id: new mongodb.ObjectId(req.body.playerID)} , {$set: {score: playerData.score + req.body.playerScore}})
            let result2 = await db.updateOne({_id: new mongodb.ObjectId(req.body.teamID)} , {$set: {score: data.score + req.body.playerScore}})
            res.send(result2)
        }
        else
            res.send("This team does not exist")
    },
    matchHistory : async (req, res) => {
        const db = await dbConnect('teamDetails')
        let teamData = await db.findOne({_id: new mongodb.ObjectId(req.body.teamID)})
        
        if(teamData)
        {
            const db = await dbConnect('matchDetails')
            // const playerObjectID = req.body.playerID
            // console.log(typeof req.body.playerID)
            let data =await db.aggregate([
                {
                    $lookup : {
                        from: 'team' + teamData.name,
                        localField: 'players.playerID',
                        foreignField: '_id',
                        as: 'matchHistory'
                    },
                },
                {
                    $match : {
                        'players.playerID': new mongodb.ObjectId(req.body.playerID),
                    }   
                },
                {$unwind: '$matchHistory'},
                {
                    $match: {'matchHistory._id': new mongodb.ObjectId(req.body.playerID)}
                },
                {
                    $project: {
                        firstTeamId:1,
                        secondTeamId:1,
                        venue:1,
                        date:1,
                        type:1,
                        players:1,
                        score: '$matchHistory.score'
                    }
                }                
            ]).toArray()
            res.send(data)
        }
        else
            res.send("This team does not exist")
    },
    matchData : async (req, res) => {
        let currentDate = new Date()
        const db = await dbConnect('matchDetails')
        if(req.body.time === 'live')
        {
            let liveMatchData =await db.aggregate([
                {
                    $match: {
                        $expr : {
                            $eq : [currentDate.toISOString().substr(0,10), {$dateToString: {format:"%Y-%m-%d", date:"$date"}}]
                        }
                    }
                }
            ]).toArray()
            res.send(liveMatchData)
        }
        else if(req.body.time === 'past')
        {
            let pastMatchData =await db.aggregate([
                {
                    $match: {
                        $expr : {
                            $lt : [{$dateToString: {format:"%Y-%m-%d", date:"$date"}},currentDate.toISOString().substr(0,10)]
                        }
                    }
                }
            ]).toArray()
            res.send(pastMatchData)
        }
        else if(req.body.time === 'recent')
        {
            currentDate.setDate(currentDate.getDate() - 7)
            let recentMatchData =await db.aggregate([
                {
                    $addFields : {
                        'dateString' : {$dateToString: {format:"%Y-%m-%d", date:"$date"}}
                    }
                },
                {
                    $match: {
                        $and : [
                            {
                                dateString: {$lt : new Date().toISOString().substr(0,10)}
                            },
                            {
                                dateString : {$gt: currentDate.toISOString().substr(0,10)}
                            }
                        ]
                            
                    }
                }
            ]).toArray()
            res.send(recentMatchData)
        }
    }
}