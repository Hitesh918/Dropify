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
    routeName:String ,
    stops:[{
    pincode : Number , 
    idealTime:String,
    timeFromPrev:Number,
    }],
    returnAfter:Number
})

const Route=mongoose.model("routes" , routeSchema)

const counterSchema=new mongoose.Schema({
    orderCount:Number ,
    routeCount:Number , 
    stopCount:Number
})

const Counter=new mongoose.model("counters" , counterSchema)


Route.aggregate([{$match : {id : 2}} , 
    {$unwind : "$stops"} , 
    {$replaceRoot: { newRoot: "$stops" }} , 
    {$lookup : {from : "stops" , localField : "pincode" , foreignField : "pincode" , as : "placeName" }}  
    // {$unwind : "$placeName"} 
    // , {$addFields : {"name":"$placeName.name"}} ,
    // {$project: {name:1 ,_id:0}}
]) 
    .then(arr =>{
    console.log(arr)
    })
    .catch(err =>{
        console.log(err)
    })

// Route.aggregate([{
//     $project: {
//       id:1,
//       routeName:1,
//       firstElement: { $arrayElemAt: ["$stops", 0] },
//       lastElement: { $arrayElemAt: ["$stops", -1] }
//     }
//   } ,
//     {
//         $addFields:{
//             source:"$firstElement.pincode",
//             destination:"$lastElement.pincode"
//         }
//     } ,
// {
//     $project:{
//         firstElement:0 ,
//         lastElement:0 ,
//         _id:0
//     }
// } ,
// {
//     $lookup : {
//         from:"stops" , 
//         localField:"source",
//         foreignField:"pincode",
//         as:"src"
//     }
  
// } , 
// {
//     $lookup : {
//         from:"stops" , 
//         localField:"destination",
//         foreignField:"pincode",
//         as:"dest"
//     }
// }
// , {
//     $unwind:"$src"
// } , 
// {
//     $unwind : "$dest"
// } ,
// {
//     $project:{
//         routeName:1,
//         id:1,
//         src : "$src.name",
//         dest : "$dest.name"
//     }

// }
// ]) .then(arr =>{
//     console.log(arr)
// })
// .catch(err =>{
//     console.log(err)
// })

