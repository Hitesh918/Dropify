function returnDayCalc( timeString , startDay ,  minutesToAdd){
    let arr=timeString.split(":")
    let dt = new Date(Date.UTC(2018, 3, startDay +1, arr[0], arr[1]));
    dt.setUTCMinutes(dt.getUTCMinutes() + minutesToAdd)
    return dt.getUTCDay()
}


console.log(returnDay("20:00" , 4 , 5760))