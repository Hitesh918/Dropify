const express = require("express")
const mongoose = require("mongoose")
const { Stop, Route, Link, Order, Info } = require("./schema"); // Adjust the path accordingly
const final = require(__dirname + "/route.js")

const app = express()
const UUID = require('uuid-int');

// number  0 <= id <=511
const id = 0;

const generator = UUID(id);

app.set("view engine", "ejs")
app.use(express.static(__dirname + '/public'))
app.use(express.urlencoded({ extended: false }))

mongoose.connect("mongodb+srv://hrenukunta66:hitesh66@cluster0.pfx1ved.mongodb.net/courierDB")
    .catch((err) => {
        console.log(err)
    })

function addMinutes(time, minsToAdd) {
    function D(J) { return (J < 10 ? '0' : '') + J; };
    var piece = time.split(':');
    var mins = piece[0] * 60 + +piece[1] + +minsToAdd;
    return D(mins % (24 * 60) / 60 | 0) + ':' + D(mins % 60);
}
function dayCalc(timeString, startDay, minutesToAdd) {
    let arr = timeString.split(":")
    let dt = new Date(Date.UTC(2018, 3, startDay + 1, arr[0], arr[1]));
    dt.setUTCMinutes(dt.getUTCMinutes() + minutesToAdd)
    return dt.getUTCDay()
}

async function junctionFinder(stopCode, lhs) {
    let flag = true
    await Route.find({}).then(async (arr) => {
        arr.forEach(async (route) => {
            route.stops.forEach(async (stop) => {
                if (stop.pincode == stopCode) {
                    if (flag) {
                        await Stop.findOneAndUpdate({ pincode: stopCode }, { isJunction: true })
                        flag = false
                    }
                    await Link.findOneAndUpdate({ id: lhs }, {
                        $addToSet: {
                            links: {
                                outId: route.id,
                                pincode: stop.pincode
                            }
                        }
                    })
                    await Link.findOneAndUpdate({ id: route.id }, {
                        $addToSet: {
                            links: {
                                outId: lhs,
                                pincode: stop.pincode
                            }
                        }
                    })
                }
            })
        })
    })
}

async function junctionUpdater(stopCode, routeId) {
    let flag = true
    arr = await Link.find({ id: { $ne: routeId } })
    for (x in arr) {
        for (obj in arr[x].links) {
            if (arr[x].links[obj].pincode == stopCode) {

                flag = false
                break
                return
            }
        }
    }
    if (flag) {
        await Stop.updateOne({ "pincode": stopCode }, { isJunction: false })
    }
}

app.get("/", (req, res) => {
    res.render("index")
})
app.get("/track", (req, res) => {
    res.render("track" , {
        result : false , 
        present : -1 , 
        next : -1
    })
})
app.get("/scan", (req, res) => {
    res.render("scan" , {
        arr:[],
        result : false
    })
})
app.get("/admin", (req, res) => {
    res.render("admin")
})
app.get("/newStop", (req, res) => {
    res.render("newStop")
})

app.get("/newCourier", async (req, res) => {
    let arr = await Stop.find()
    res.render("newCourier", {
        stops: arr
    })

})

app.get("/allRoutes", async (req, res) => {
    let arr = await Route.aggregate([{
        $project: {
            routeName: 1,
            firstElement: { $arrayElemAt: ["$stops", 0] },
            lastElement: { $arrayElemAt: ["$stops", -1] }
        }
    },
    {
        $addFields: {
            source: "$firstElement.pincode",
            destination: "$lastElement.pincode"
        }
    },
    {
        $project: {
            firstElement: 0,
            lastElement: 0,
            _id: 0
        }
    },
    {
        $lookup: {
            from: "stops",
            localField: "source",
            foreignField: "pincode",
            as: "src"
        }

    },
    {
        $lookup: {
            from: "stops",
            localField: "destination",
            foreignField: "pincode",
            as: "dest"
        }
    }, {
        $unwind: "$src"
    },
    {
        $unwind: "$dest"
    },
    {
        $project: {
            routeName: 1,
            src: "$src.name",
            dest: "$dest.name"
        }

    }
    ])
    res.render("allRoutes", {
        arr: arr
    })
})

app.get("/viewRoute/:routeName", async (req, res) => {
    let routeName = req.params.routeName
    let arr = await Route.aggregate([{ $match: { routeName: routeName } }, { $unwind: "$stops" }, { $replaceRoot: { newRoot: "$stops" } }, { $lookup: { from: "stops", localField: "pincode", foreignField: "pincode", as: "placeName" } }, { $unwind: "$placeName" }, { $addFields: { "name": "$placeName.name" } }, { $project: { placeName: 0, _id: 0 } }])
    let arr2 = await Stop.find()
    res.render("viewRoute", {
        stops: arr,
        places: arr2,
        routeName: routeName
    })
})

app.get('/newRoute', (req, res) => {
    Stop.find().then((arr) => {
        res.render("newRoute", {
            places: arr
        })
    })
        .catch(err => {
            console.log(err)
        })
})

app.get("/allStops", async (req, res) => {
    let arr = await Stop.find({})
    res.render("allStops", {
        stops: arr
    })
})

app.post("/newCourier", async (req, res) => {
    let currentDate = new Date();
    let currentTime = currentDate.getTime();
    let timeZoneOffset = 5.5 * 60 * 60 * 1000;
    let newTime = currentTime + timeZoneOffset;
    newTime = Math.floor(newTime / 1000) * 1000;
    let ans = new Date(newTime);
    ans.setSeconds(0)
    let cnt=generator.uuid();
    console.log(req.body)
    let x = new Order({
        courierId: cnt,
        source: parseInt(req.body.source),
        destination: parseInt(req.body.destination),
        pickedUpAt: ans
    })

    await x.save()
    await final(parseInt(req.body.source), parseInt(req.body.destination), cnt)
    res.redirect("/admin")
})



app.post("/newStop", async (req, res) => {
    console.log(req.body)
    if (!req.body.pincode || !req.body.name) {
        res.send(`<script> alert("missing details") </script>`)
    }
    else {
        let arr = await Stop.find({ pincode: req.body.pincode })
        let arr2 = await Stop.find({ name: req.body.name })
        if (arr.length != 0 || arr2.length != 0) {
            res.send(`<script> alert("stop with same name or pincode already exists") </script>`)
        }
        else {
            let x = new Stop({
                pincode: req.body.pincode,
                name: req.body.name,
                isJunction: false
            })
            x.save()
            // await Counter.updateOne({}, { $inc: { stopCount: 1 } })
            res.redirect("/admin")
        }
    }

})

app.post('/newRoute', async (req, res) => {
    console.log(req.body)
    if (req.body.start == "Select" || req.body.end == "Select" || !req.body.time || !req.body.routeName || req.body.onEvery == "Select") {
        res.send(`<script> alert("missing details") </script>`)
    }
    else if (req.body.start == req.body.end) {
        res.send(`<script> alert("starting and ending point cannot be same") </script>`)
    }
    else {
        JLhrs = parseInt(req.body.JLhrs)
        JLmin = parseInt(req.body.JLmin)
        RAdays = parseInt(req.body.RAdays)
        RAhrs = parseInt(req.body.RAhrs)

        JLTmin = JLhrs * 60 + JLmin
        RAThrs = RAdays * 24 + RAhrs
        if (JLTmin <= 0) {
            res.send(`<script> alert("invalid journey length") </script>`)
        }

        let routeNames = await Route.find({ routeName: req.body.routeName.replace(" ", "-") })
        console.log(routeNames.length)
        if (routeNames.length != 0) {
            res.send(`<script> alert("route with given name already exists") </script>`)
        }
        else {
            let starting = parseInt(req.body.start)
            let ending = parseInt(req.body.end)
            let count = generator.uuid()


            let j = new Link({
                id: count,
                links: []
            })
            await j.save()

            await junctionFinder(starting, count)
            await junctionFinder(ending, count)


            let x = new Route({
                id: count,
                routeName: req.body.routeName.replace(" ", "-"),
                stops: [{
                    pincode: starting,
                    idealTime: req.body.time,
                    idealReturnTime: addMinutes(req.body.time, (2 * JLTmin) + (RAThrs * 60)),
                    onDay: parseInt(req.body.onEvery),
                    returnDay: dayCalc(req.body.time, parseInt(req.body.onEvery), (2 * JLTmin) + (RAThrs * 60)),
                    timeFromPrev: null,

                }, {
                    pincode: ending,
                    idealTime: addMinutes(req.body.time, JLTmin),
                    idealReturnTime: addMinutes(req.body.time, JLTmin + (RAThrs * 60)),
                    onDay: dayCalc(req.body.time, parseInt(req.body.onEvery), JLTmin),
                    returnDay: dayCalc(req.body.time, parseInt(req.body.onEvery), JLTmin + (RAThrs * 60)),
                    timeFromPrev: JLTmin,
                }],
                returnAfter: RAThrs,
                onEvery: parseInt(req.body.onEvery)
            })
            await x.save()
            // await Counter.updateOne({}, { $inc: { routeCount: 1 } })

            res.redirect("/admin")
        }

    }
})


app.post("/addStop", async (req, res) => {
    console.log(req.body)
    let Tmin = (parseInt(req.body.hrs)) * 60 + parseInt(req.body.min)
    if (Tmin == 0 || req.body.stop == "Select") {
        res.send(`<script> alert("missing details") </script>`)
    }
    let result = await Route.aggregate([{ $match: { routeName: req.body.routeName } }, { $unwind: "$stops" },
    { $replaceRoot: { newRoot: "$stops" } },
    { $match: { pincode: parseInt(req.body.stop) } }
    ])
    console.log(result)
    let timeObj = await Route.findOne({ routeName: req.body.routeName })
    if (result.length != 0) {
        res.send(`<script> alert("selected stop already exists in the route") </script>`)
    }
    else {

        let incTime = timeObj.stops[parseInt(req.body.index) + 1].timeFromPrev
        if (Tmin >= incTime) {
            console.log(incTime, Tmin)
            res.send(`<script> alert("invalid timings") </script>`)
        }
        else {
            let nameObj = parseInt(req.body.stop)

            await junctionFinder(nameObj, timeObj.id)

            let nextTime = timeObj.stops[parseInt(req.body.index) + 1].idealReturnTime
            let nextOnDay = timeObj.stops[parseInt(req.body.index) + 1].returnDay

            await Route.updateOne({ routeName: req.body.routeName }, {
                $push: {
                    stops: {
                        $each: [{
                            pincode: nameObj,
                            idealTime: addMinutes(req.body.prevTime, Tmin),
                            idealReturnTime: addMinutes(nextTime, (incTime) - (Tmin)),
                            onDay: dayCalc(req.body.prevTime, parseInt(req.body.prevOnDay), Tmin),
                            returnDay: dayCalc(nextTime, nextOnDay, (incTime) - (Tmin)),
                            timeFromPrev: Tmin,
                        }],
                        $position: parseInt(req.body.index) + 1
                    }
                }
            })
            await Route.updateOne({ routeName: req.body.routeName }, {
                $inc: {
                    [`stops.${parseInt(req.body.index) + 2}.timeFromPrev`]: -1 * Tmin,
                }
            })

            res.redirect(`/viewRoute/${req.body.routeName}`)
        }

    }
})

app.post("/track", async (req, res) => {
    console.log(req.body)
    let plan = await Info.findOne({ courierId: parseInt(req.body.id) })

    let currentDate = new Date();
    let currentTime = currentDate.getTime();
    let timeZoneOffset = 5.5 * 60 * 60 * 1000;
    let newTime = currentTime + timeZoneOffset;
    newTime = Math.floor(newTime / 1000) * 1000;
    let targetTime = new Date(newTime);
    targetTime.setSeconds(0)

    // let targetTime=new Date(Date.UTC(2024, 0, 27 , 12, 30));
    // console.log(targetTime)

    if(!plan){
        res.send(`<script> alert("Courier not found") </script>`)
    }
    else if(new Date(targetTime) > plan.path[plan.path.length -1].time){
        res.send(`<script> alert("Courier has been delivered successfully") </script>`)
    }
    else{
        let a=0
        let b=1
        for(let i= 0 ; i<plan.path.length-1 ; i++){
            const currentEntry = plan.path[i];
            const nextEntry = plan.path[i + 1];     
            if (new Date(targetTime) >= new Date(currentEntry.time) && new Date(targetTime) < new Date(nextEntry.time)) {
                a=i;
                b=i+1;
                if(plan.path[i+1]){
                    b++
                }
            }
        }
        let x = await Stop.findOne({pincode  :plan.path[a].pincode})
        let y = await Stop.findOne({pincode  :plan.path[b].pincode})
        res.render("track" , {
            result : true , 
            present : x.name , 
            next : y.name
        })
    }

})
app.post("/scan", async (req, res) => {
    console.log(req.body)
    let plan = await Info.findOne({ courierId: parseInt(req.body.id) })

    let currentDate = new Date();
    let currentTime = currentDate.getTime();
    let timeZoneOffset = 5.5 * 60 * 60 * 1000;
    let newTime = currentTime + timeZoneOffset;
    newTime = Math.floor(newTime / 1000) * 1000;
    let targetTime = new Date(newTime);
    targetTime.setSeconds(0)

    // let targetTime=new Date(Date.UTC(2024, 0, 26 , 11, 30));
    // console.log(targetTime)

    if(!plan){
        res.send(`<script> alert("Courier not found") </script>`)
    }
    else if(new Date(targetTime) > plan.path[plan.path.length -1].time){
        res.send(`<script> alert("Courier has been delivered successfully") </script>`)
    }
    else{
        const filteredArray = plan.path.filter(obj => obj.time > targetTime);
        res.render("scan" , {
            result  :true , 
            arr : filteredArray
        })
    }

})

async function removeStop(name, pincode) {
    let route = await Route.findOne({ routeName: name })
    let courierIndex = route.stops.findIndex((ob) => ob.pincode == pincode);
    let toBeAdded = route.stops[courierIndex].timeFromPrev
    await Route.updateOne({ routeName: name }, {
        $inc: {
            [`stops.${courierIndex + 1}.timeFromPrev`]: toBeAdded,
        }
    })
    await Route.updateOne({ routeName: name }, {
        $pull: {
            stops: {
                "pincode": pincode
            }
        }
    })

    let toBeBroken = await Link.findOne({ id: route.id })
    toBeBroken.links.forEach(async (obj) => {
        if (obj.pincode == pincode) {
            await Link.updateOne({ id: obj.outId }, {
                $pull: {
                    links: {
                        "pincode": pincode,
                        "outId": route.id
                    }
                }
            })
        }
    })

    await Link.updateOne({ id: route.id }, {
        $pull: {
            links: {
                "pincode": pincode
            }
        }
    })

}

async function deleteRoute(name) {
    let route = await Route.findOne({ routeName: name })
    console.log(route)
    let toBeBroken = await Link.findOne({ id: route.id })
    console.log("tobebroken")
    console.log(toBeBroken)
    toBeBroken.links.forEach(async (obj) => {
        await Link.updateOne({ id: obj.outId }, {
            $pull: {
                links: {
                    "pincode": obj.pincode,
                    "outId": route.id
                }
            }
        })
        junctionUpdater(obj.pincode, route.id)
    })
    await Link.deleteOne({ id: route.id })
    await Route.deleteOne({ routeName: name })
}

app.post("/removeStop", async (req, res) => {
    let route = await Route.findOne({ routeName: req.body.routeName })
    await removeStop(req.body.routeName, parseInt(req.body.pincode))
    await junctionUpdater(parseInt(req.body.pincode), route.id)
    res.redirect(`/viewRoute/${req.body.routeName}`)
})

app.post("/deleteStop", async (req, res) => {
    console.log(req.body)
    let pincode = parseInt(req.body.pincode)
    let routes = await Route.find()
    routes.forEach(async (route) => {
        let index = route.stops.findIndex((ob) => ob.pincode == pincode);
        if (index > 0) {
            if (index == 0 || index == route.stops.length - 1) {
                await deleteRoute(route.routeName)
            }
            else {
                // console.log("Sending")
                // console.log(route.routeName , pincode)
                await removeStop(route.routeName, pincode)
            }
        }
    })
    await Stop.deleteOne({ "pincode": pincode })
    res.redirect("/allStops")
})

app.post("/deleteRoute", async (req, res) => {
    await deleteRoute(req.body.routeName)
    res.redirect("/admin")
})

app.listen(3000);