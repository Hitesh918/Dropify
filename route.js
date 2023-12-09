const express = require("express")
const mongoose = require("mongoose")

const app = express()

app.set("view engine", "ejs")
app.use(express.static(__dirname + '/public'))
// app.use(express.json())
app.use(express.urlencoded({extended: false}))

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
    idealReturnTime : String,
    timeFromPrev:Number,
    }],
    returnAfter:Number,
    onEvery:String
})

const Route=mongoose.model("routes" , routeSchema)

const counterSchema=new mongoose.Schema({
    orderCount:Number ,
    routeCount:Number , 
    stopCount:Number
})

const Counter=new mongoose.model("counters" , counterSchema)

const linkSchema = new mongoose.Schema({
    id:Number ,
    links:[{
        outId:Number , 
        pincode:Number
    }]
})


const Link =new mongoose.model("links" , linkSchema)


let src=500007
let dest = 500000
// array size more than 2 only


let possiblities=[]
  
// Function to find all possible routes between source and destination
async function findAllRoutes(graph, sourceId, destinationId, visited = new Set(), currentPath = []) {
  visited.add(sourceId);
  currentPath.push(sourceId);

  if (sourceId === destinationId) {
    // Found a route
    // console.log(currentPath);
    possiblities.push(currentPath)
    console.log(currentPath)
  } else {
    const currentRoute = graph.find(route => route.id === sourceId);
    if (currentRoute) {
      for (const neighbor of currentRoute.links) {
        if (!visited.has(neighbor)) {
           findAllRoutes(graph, neighbor, destinationId, new Set(visited), [...currentPath]);
        }
      }
    }
  }
}



function minutesUntilDesiredTime(desiredTime, dayNumber ,startTime) {
    // const currentDateTime = new Date();
    const currentDateTime = new Date(startTime);
    // const currentDateTime = new Date(2023 , 11 , 7 , 12 , 0);
    const currentDay = currentDateTime.getDay();
    const currentTime = currentDateTime.getTime();

    const [desiredHours, desiredMinutes] = desiredTime.split(':').map(Number);

    let daysUntilDesiredDay = dayNumber - currentDay;
    if (daysUntilDesiredDay < 0) {
        daysUntilDesiredDay += 7;
    }

    const desiredDateTime = new Date(currentDateTime);

    desiredDateTime.setUTCDate(currentDateTime.getUTCDate() + daysUntilDesiredDay);
    desiredDateTime.setUTCHours(desiredHours, desiredMinutes, 0, 0);

    if (desiredDateTime <= currentDateTime) {
        desiredDateTime.setDate(desiredDateTime.getDate() + 7);
    }

    const timeDifference = desiredDateTime - currentTime;
    const minutesUntilDesiredTime = Math.floor(timeDifference / (1000 * 60));

    return minutesUntilDesiredTime;
}


async function idk(srcCode , destCode , arr){
    let ans = new Date(Date.UTC(2023, 11, 7, 12, 0));
    for(let i=0 ; i<arr.length - 1 ; i++){
        let presentRoute=await Route.findOne({id:arr[i]})
        let obj=await Link.findOne({id  :arr[i]})

        let tempSrc=srcCode
        let tempGoal=obj.links.find((ob) => {
            return ob.outId == arr[i+1]
        }).pincode
        let courierIndex = presentRoute.stops.findIndex((ob)=>{
            return ob.pincode == tempSrc
        })
        let junctionIndex = presentRoute.stops.findIndex((ob)=>{
            return ob.pincode == tempGoal
        })
        if(courierIndex < junctionIndex){
            ans.setUTCMinutes(ans.getUTCMinutes() + minutesUntilDesiredTime(presentRoute.stops[courierIndex].idealTime , presentRoute.onEvery , ans))
            for(let i=courierIndex+1 ; i<=junctionIndex ; i++){
                // time += presentRoute.stops[i].timeFromPrev
                ans.setUTCMinutes(ans.getUTCMinutes() + presentRoute.stops[i].timeFromPrev)
            }
        }
        else if(courierIndex > junctionIndex){
            ans.setUTCMinutes(ans.getUTCMinutes() + minutesUntilDesiredTime(presentRoute.stops[courierIndex].idealReturnTime , presentRoute.onEvery , ans))
            for(let i=courierIndex ; i>=junctionIndex+1 ; i--){
                ans.setUTCMinutes(ans.getUTCMinutes() + presentRoute.stops[i].timeFromPrev)
            }
        }
        srcCode = tempGoal
   }
   let presentRoute=await Route.findOne({id:arr[arr.length -1 ]})
   let srcIndex=presentRoute.stops.findIndex((ob)=>{
        return ob.pincode == srcCode
   })
   let destIndex=presentRoute.stops.findIndex((ob)=>{
        return ob.pincode == destCode
   })

   if(srcIndex < destIndex){
    ans.setUTCMinutes(ans.getUTCMinutes() + minutesUntilDesiredTime(presentRoute.stops[srcIndex].idealTime , presentRoute.onEvery , ans))
    for(let i=srcIndex+1 ; i<=destIndex ; i++){
        ans.setUTCMinutes(ans.getUTCMinutes() + presentRoute.stops[i].timeFromPrev)
    }
   }
   else if(srcIndex > destIndex){
    ans.setUTCMinutes(ans.getUTCMinutes() + minutesUntilDesiredTime(presentRoute.stops[srcIndex].idealReturnTime , presentRoute.onEvery , ans))
    for(let i=srcIndex ; i>=destIndex+1 ; i--){
        ans.setUTCMinutes(ans.getUTCMinutes() + presentRoute.stops[i].timeFromPrev)
    }
   }
   console.log(ans , "after everythingggg")

}



    Link.aggregate([{$match : {}}  , {$unwind:"$links"} , {
        $group: {
          _id: "$id",
          id: { $first: "$id" },
          links: { $push: "$links.outId" }
        }
      } , 
     {$project:{_id:0}}
    ]).then(routes =>{
        Route.find({stops : {$elemMatch : {pincode : src}}}).then(async(sources) =>{
            await sources.forEach(async (s)=>{
                Route.find({stops : {$elemMatch : {pincode : dest}}}).then(async (destinations)=>{
                    destinations.forEach(async(d)=>{
                        await findAllRoutes(routes, s.id,d.id);
                        possiblities.forEach(async (arr)=>{
                            await idk(src,dest,arr)
                        })
                    })
                })

            })

        })

     })
