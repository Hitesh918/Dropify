// const express = require("express")
// const mongoose = require("mongoose")

// const app = express()

// app.set("view engine", "ejs")
// app.use(express.static(__dirname + '/public'))
// // app.use(express.json())
// app.use(express.urlencoded({extended: false}))

// mongoose.connect("mongodb+srv://hrenukunta66:hitesh66@cluster0.pfx1ved.mongodb.net/courierDB")
// .catch((err) => {
//     console.log(err)
// })

// const stopSchema=new mongoose.Schema({
//     pincode:Number , 
//     name:String,
//     isJunction:Boolean
// })

// const Stop=mongoose.model("stops" , stopSchema)

// const routeSchema=new mongoose.Schema({
//     id:Number,
//     routeName:String ,
//     stops:[{
//     pincode : Number , 
//     idealTime:String,
//     idealReturnTime : String,
//     timeFromPrev:Number,
//     }],
//     returnAfter:Number,
//     onEvery:String
// })

// const Route=mongoose.model("routes" , routeSchema)

// const counterSchema=new mongoose.Schema({
//     orderCount:Number ,
//     routeCount:Number , 
//     stopCount:Number
// })

// const Counter=new mongoose.model("counters" , counterSchema)

// const linkSchema = new mongoose.Schema({
//     id:Number ,
//     links:[{
//         outId:Number , 
//         pincode:Number
//     }]
// })


// const Link =new mongoose.model("links" , linkSchema)


// Link.aggregate([{$match : {}}  , {$unwind:"$links"} , {
//     $group: {
//       _id: "$id",
//       id: { $first: "$id" },
//       links: { $push: "$links.outId" }
//     }
//   } , 
//  {$project:{_id:0}}]).then(arr=>{
//     console.log(arr)
// })

// let src=500010
// let dest = 500003


// Route.find({stops : {$elemMatch : {pincode : src}}}).then(sources =>{
//     sources.forEach(s=>{
//         // console.log(s.id)
//         Route.find({stops : {$elemMatch : {pincode : dest}}}).then(destinations=>{
//             destinations.forEach(d=>{

//             })
//         })
//     })
// })



