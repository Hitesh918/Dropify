const mongoose = require('mongoose');

const stopSchema=new mongoose.Schema({
    pincode:{
        type:Number,
        unique: true, 
        required: true        
    }, 
    name:String,
    isJunction:Boolean
})

const Stop=mongoose.model("stops" , stopSchema)

const routeSchema=new mongoose.Schema({
    id:{
        type:Number,
        unique: true, 
        required: true        
    },
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


const linkSchema = new mongoose.Schema({
    id:Number ,
    links:[{
        outId:Number , 
        pincode:Number
    }]
})

const Link =new mongoose.model("links" , linkSchema)

const orderSchema = new mongoose.Schema({
    courierId  :{
        type:Number,
        unique: true, 
        required: true        
    }, 
    source : Number , 
    destination : Number , 
    pickedUpAt: Date
})

const Order = new mongoose.model("orders" , orderSchema)

const pathSchema = new mongoose.Schema({
    courierId  :{
        type:Number,
        unique: true, 
        required: true        
    },
    path : [
        {
            pincode : Number,
            time : {
                type: Date,
                expires: '1m', 
                default: Date.now
              },
            waiting : Boolean
        }
    ]
})

const Info = new mongoose.model("details" , pathSchema )


module.exports = {
    Stop,
    Route,
    Link,
    Order,
    Info
};