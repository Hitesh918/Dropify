const express = require("express")
const mongoose = require("mongoose")
const { Stop, Route, Counter, Link, Order ,Info } = require("./schema"); // Adjust the path accordingly

const app = express()

app.set("view engine", "ejs")
app.use(express.static(__dirname + '/public'))
app.use(express.urlencoded({ extended: false }))

mongoose.connect("mongodb+srv://hrenukunta66:hitesh66@cluster0.pfx1ved.mongodb.net/courierDB")
    .catch((err) => {
        console.log(err)
    })

let possiblities = []
let details = []
// let detailsStart = []
let tempDetails = []
// let tempDetailsStart = []

// Function to find all possible routes between source and destination
async function findAllRoutes(graph, sourceId, destinationId, visited = new Set(), currentPath = []) {
    visited.add(sourceId);
    currentPath.push(sourceId);

    if (sourceId === destinationId) {
        possiblities.push(currentPath)
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



function minutesUntilDesiredTime(desiredTime, dayNumber, startTime) {
    const currentDateTime = new Date(startTime);
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

async function calcTimeTaken(srcCode, destCode, arr) {
    let currentDate = new Date();
    let currentTime = currentDate.getTime();
    let timeZoneOffset = 5.5 * 60 * 60 * 1000;
    let newTime = currentTime + timeZoneOffset;
    newTime = Math.floor(newTime / 1000) * 1000;
    let ans = new Date(newTime);
    ans.setSeconds(0)
    // let ans = new Date(Date.UTC(2023, 11, 7, 12, 0));

    for (let i = 0; i < arr.length - 1; i++) {
        let presentRoute = await Route.findOne({ id: arr[i] });
        let obj = await Link.findOne({ id: arr[i] });

        let tempSrc = srcCode;
        let tempGoal = obj.links.find((ob) => ob.outId == arr[i + 1]).pincode;
        let courierIndex = presentRoute.stops.findIndex((ob) => ob.pincode == tempSrc);
        let junctionIndex = presentRoute.stops.findIndex((ob) => ob.pincode == tempGoal);

        if (courierIndex < junctionIndex) {
            ans.setUTCMinutes(ans.getUTCMinutes() + minutesUntilDesiredTime(presentRoute.stops[courierIndex].idealTime, presentRoute.stops[courierIndex].onDay, ans));
            tempDetails.push({ "pincode": presentRoute.stops[courierIndex].pincode, "time": new Date(ans) , "waiting":true });

            for (let j = courierIndex + 1; j <= junctionIndex; j++) {
                ans.setUTCMinutes(ans.getUTCMinutes() + presentRoute.stops[j].timeFromPrev);
                tempDetails.push({ "pincode": presentRoute.stops[j].pincode, "time": new Date(ans) , "waiting":false });
            }
        } else if (courierIndex > junctionIndex) {
            ans.setUTCMinutes(ans.getUTCMinutes() + minutesUntilDesiredTime(presentRoute.stops[courierIndex].idealReturnTime, presentRoute.stops[courierIndex].returnDay, ans));
            tempDetails.push({ "pincode": presentRoute.stops[courierIndex].pincode, "time": new Date(ans) ,"waiting":true});

            for (let j = courierIndex; j >= junctionIndex + 1; j--) {
                ans.setUTCMinutes(ans.getUTCMinutes() + presentRoute.stops[j].timeFromPrev);
                tempDetails.push({ "pincode": presentRoute.stops[j].pincode, "time": new Date(ans) , "waiting":false});
            }
        }
        srcCode = tempGoal;
    }

    let presentRoute = await Route.findOne({ id: arr[arr.length - 1] });
    let srcIndex = presentRoute.stops.findIndex((ob) => ob.pincode == srcCode);
    let destIndex = presentRoute.stops.findIndex((ob) => ob.pincode == destCode);

    if (srcIndex < destIndex) {
        ans.setUTCMinutes(ans.getUTCMinutes() + minutesUntilDesiredTime(presentRoute.stops[srcIndex].idealTime, presentRoute.stops[srcIndex].onDay, ans));
        tempDetails.push({ "pincode": presentRoute.stops[srcIndex].pincode, "time": new Date(ans) ,"waiting":true });

        for (let i = srcIndex + 1; i <= destIndex; i++) {
            ans.setUTCMinutes(ans.getUTCMinutes() + presentRoute.stops[i].timeFromPrev);
            tempDetails.push({ "pincode": presentRoute.stops[i].pincode, "time": new Date(ans) ,"waiting":false});

        }
    } else if (srcIndex > destIndex) {
        ans.setUTCMinutes(ans.getUTCMinutes() + minutesUntilDesiredTime(presentRoute.stops[srcIndex].idealReturnTime, presentRoute.stops[srcIndex].returnDay, ans));
        tempDetails.push({ "pincode": presentRoute.stops[srcIndex].pincode, "time": new Date(ans) ,"waiting":true });

        for (let i = srcIndex; i >= destIndex + 1; i--) {
            ans.setUTCMinutes(ans.getUTCMinutes() + presentRoute.stops[i].timeFromPrev);
            tempDetails.push({ "pincode": presentRoute.stops[i].pincode, "time": new Date(ans) ,"waiting":false});
        }
    }
    return ans;
}

async function exec(src, dest) {
    const routes = await Link.aggregate([
        { $match: {} },
        { $unwind: "$links" },
        {
            $group: {
                _id: "$id",
                id: { $first: "$id" },
                links: { $push: "$links.outId" },
            },
        },
        { $project: { _id: 0 } },
    ]);

    const sources = await Route.find({ stops: { $elemMatch: { pincode: src } } });

    for (const s of sources) {
        const destinations = await Route.find({ stops: { $elemMatch: { pincode: dest } } });

        for (const d of destinations) {
            await findAllRoutes(routes, s.id, d.id);
        }
    }

}

let minTime = new Date(2050, 11, 7, 12, 0)

let final = async (src, dest , id) => {
    try {
        await exec(src, dest);
    } catch (error) {
        console.error("Error in final:", error);
    }
    for (path of possiblities) {
        let x = await calcTimeTaken(src, dest, path)
        if (minTime > x) {
            minTime = x
            details = tempDetails
            // detailsStart=tempDetailsStart
        }
        tempDetails = []
        // tempDetailsStart=[]
    }
    console.log(minTime)
    // console.log(detailsStart)
    console.log(details)
    let x = new Info({
        courierId : id , 
        path : details
    })
    await x.save()

}


module.exports = final