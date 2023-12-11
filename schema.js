const mongoose = require('mongoose');

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
    onDay:Number , 
    returnDay:Number,
    timeFromPrev:Number,
    }],
    returnAfter:Number,
    onEvery:Number
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

const orderSchema = new mongoose.Schema({
    courierId  :Number , 
    source : Number , 
    destination : Number , 
    pickedUpAt: Date
})

const Order = new mongoose.model("orders" , orderSchema)


module.exports = {
    Stop,
    Route,
    Counter,
    Link,
    Order,
};