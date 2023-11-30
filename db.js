const mongoose = require("mongoose")

mongoose.connect("mongodb+srv://hrenukunta66:hitesh66@cluster0.pfx1ved.mongodb.net/courierDB")
.catch((err) => {
    console.log(err)
})

const stopSchema=new mongoose.Schema({
    pincode:Number , 
    name:String,
    isJunction:Boolean
})

const Stop=mongoose.model("stops" , stopSchema)

const routeSchema=new mongoose.Schema({
    id:Number,
    stops:[{
    pincode : Number , 
    idealTime:String,
    timeFromPrev:Number,
    }],
    returnAfter:Number
})

const Route=mongoose.model("routes" , routeSchema)


Route.aggregate([{$match : {id : 1}} , {$unwind : "$stops"} , {$replaceRoot: { newRoot: "$stops" }} , {$lookup : {from : "stops" , localField : "pincode" , foreignField : "pincode" , as : "placeName" }} , {$unwind : "$placeName"} , {$addFields : {"name":"$placeName.name"}} , {$project: {placeName : 0 , _id:0}}]) .then(arr =>{
    console.log(arr)
})
.catch(err =>{
    console.log(err)
})