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
            const db = await dbConnect('playerDetails')
            let data = await db.findOne({_id: new mongodb.ObjectId(req.params.playerid)})
            if(data)
            {
                let result = await db.updateOne({_id: new mongodb.ObjectId(req.params.playerid)} , {$set: req.body})
                res.send(result)
            }
            else
                res.send("This player does not exist")
        }
        catch(e){
            console.log(e)
        }
    },
    deleteData : async (req, res) => {
        const db = await dbConnect('playerDetails')
        
        let data = await db.findOne({_id: new mongodb.ObjectId(req.params.playerid)})
        if(data)
        {
            let result = await db.deleteOne({_id: new mongodb.ObjectId(req.params.playerid)})
            if(result.acknowledged)
                res.send(result)
        }
        else
            res.send("Data not found")
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

            if(data.length != 2)
                res.end("This team does not exist")
            
            
            //check if match is already scheduled
            const matchSchedule = await dbConnect('matchSchedule')
            const isScheduled = await matchSchedule.aggregate([
                {
                    $addFields : {
                        'dateString' : {$dateToString: {format:"%d/%m/%Y", date:"$date"}}
                    }
                },
                {
                    $match: {
                        $or: [{firstTeamId: req.body.firstTeamId},{firstTeamId: req.body.secondTeamId},{secondTeamId: req.body.secondTeamId},{secondTeamId: req.body.firstTeamId}],
                            dateString: {$eq: req.body.date}
                    }
                }
               
            ]).toArray()

            
            // req.body.date = new Date(req.body.date)

            let datestr = req.body.date
            darr = datestr.split("/")   
            req.body.date = new Date(parseInt(darr[2]),parseInt(darr[1])-1,parseInt(darr[0])+1)

            if(data.length === 2 && !(isScheduled.length))
            {
                const subDB = await dbConnect('matchSchedule')
                // const db = await dbConnect('teamDetails')
                const result = await subDB.insertMany([req.body])

                // console.log(result)
        
                // if(result.acknowledged)
                // {
                //     let result = await db.updateOne({_id: new mongodb.ObjectId(req.body.firstTeamId)})
                //     let result2 = await db.updateOne({_id: new mongodb.ObjectId(req.body.secondTeamId)})
                    
                    res.send("Scheduled")
                // }
            }
            else
                res.send("Already Scheduled")
        }catch(e){
            console.log(e)
        }
    },
    updateScore : async (req, res) => {
        const db = await dbConnect('playerDetails')
        let data = await db.findOne({_id: new mongodb.ObjectId(req.body.playerID)})

        if(data)
        {
            const subDB = await dbConnect('matchSchedule')
            const firstTeam = await subDB.aggregate([
                {
                    $match: {'firstTeamPlayers.playerID': req.body.playerID,
                    _id: new mongodb.ObjectId(req.body.matchID)}
                }
            ]).toArray()

            const secondTeam = await subDB.aggregate([
                {
                    $match: {'secondTeamPlayers.playerID': req.body.playerID,
                    _id: new mongodb.ObjectId(req.body.matchID)}
                }
            ]).toArray()

            // console.log(firstTeam)
            // console.log(secondTeam)
            let match = await subDB.findOne({_id: new mongodb.ObjectId(req.body.matchID)})

            if(firstTeam.length)
            {
                // console.log("firstTeam")
                let result = await subDB.updateOne({_id: new mongodb.ObjectId(req.body.matchID), 'firstTeamPlayers.playerID': req.body.playerID} , 
                                                    {   $set: {firstTeamScore: match.firstTeamScore + req.body.playerScore},
                                                        $inc: {'firstTeamPlayers.$.score' : req.body.playerScore}
                                                  })
                res.send(result)                                  
            }
            else if(secondTeam.length)
            {
                // console.log("secondTeam")
                let result = await subDB.updateOne({_id: new mongodb.ObjectId(req.body.matchID), 'secondTeamPlayers.playerID': req.body.playerID} , 
                                                    {   $set: {secondTeamScore: match.secondTeamScore + req.body.playerScore},
                                                        $inc: {'secondTeamPlayers.$.score' : req.body.playerScore}
                                                  })
                res.send(result)  
            }
        }
        else
            res.send("This player does not exist")
    },
    matchHistory : async (req, res) => {
        const db = await dbConnect('playerDetails')
        let player = await db.findOne({_id: new mongodb.ObjectId(req.body.playerID)})
        
        if(player)
        {
            const db = await dbConnect('matchSchedule')
         
            let matchData =await db.aggregate([
                {
                    $match: {
                        // _id: new mongodb.ObjectId(req.body.matchID),
                        $or : [ {'firstTeamPlayers.playerID' : {$eq : req.body.playerID}}, {'secondTeamPlayers.playerID' : {$eq : req.body.playerID}} ]
                    }
                },
                {
                    $project: {
                        firstTeamId:1, secondTeamId:1,venue:1,date:1,type:1,firstTeamScore:1,secondTeamScore:1,manofthematch:1,
                        playerInfo : {
                            $concatArrays: [ "$firstTeamPlayers", "$secondTeamPlayers" ]
                        }
                    }
                },
                {$unwind: '$playerInfo'},
                {
                    $match:{
                        'playerInfo.playerID': req.body.playerID
                    }
                }         
            ]).toArray()

            if(matchData.length)
                res.send(matchData)
            else
                res.send("This player was not part of this match")
        }
        else
            res.send("This player does not exist")
    },
    matchData : async (req, res) => {
        let currentDate = new Date()
        const db = await dbConnect('matchSchedule')
        if(req.body.time === 'live')
        {
            let liveMatchData =await db.aggregate([
                {
                    $match: {
                        $expr : {
                            $eq : [currentDate.toISOString().substr(0,10), {$dateToString: {format:"%Y-%m-%d", date:"$date"}}]
                        },
                        type: req.body.type,
                        country: req.body.country
                    
                    },
                    
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
                        },
                        type: req.body.type,
                        country: req.body.country
                        
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
                            },
                        ],
                        type: req.body.type,
                        country: req.body.country
                            
                    }
                }
            ]).toArray()
            res.send(recentMatchData)
        }
    }
}