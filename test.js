// let currentDate = new Date();
// let currentTime = currentDate.getTime();
// let timeZoneOffset = 5.5 * 60 * 60 * 1000;
// let newTime = currentTime + timeZoneOffset;
// newTime = Math.floor(newTime / 1000) * 1000;
// let ans = new Date(newTime);
// ans.setSeconds(0)
// // let ans = new Date(Date.UTC(2023, 11, 14 , 16, 0));
// console.log(ans)
// console.log(ans.getUTCDay())

// function minutesUntilDesiredTime(desiredTime, dayNumber, startTime) {
//     // let ans = new Date(Date.UTC(2023, 11, 7, 12, 0));
//     // const currentDateTime = new Date(Date.UTC(2023, 11, 14, 19, 0));
//     const currentDateTime = new Date(startTime);
//     console.log("inside function" , currentDateTime)
//     console.log("inside function" , currentDateTime.getDay())
//     const currentDay = currentDateTime.getUTCDay();
//     const currentTime = currentDateTime.getTime();

//     const [desiredHours, desiredMinutes] = desiredTime.split(':').map(Number);

//     let daysUntilDesiredDay = dayNumber - currentDay;
//     if (daysUntilDesiredDay < 0) {
//         daysUntilDesiredDay += 7;
//     }
//     console.log(currentDate.getUTCHours())

//     const desiredDateTime = new Date(currentDateTime);

//     desiredDateTime.setUTCDate(currentDateTime.getUTCDate() + daysUntilDesiredDay);
//     desiredDateTime.setUTCHours(desiredHours, desiredMinutes, 0, 0);

//     if (desiredDateTime <= currentDateTime) {
//         desiredDateTime.setUTCDate(desiredDateTime.getUTCDate() + 7);
//     }

//     const timeDifference = desiredDateTime - currentTime;
//     const minutesUntilDesiredTime = Math.floor(timeDifference / (1000 * 60));

//     return minutesUntilDesiredTime;
// }
// console.log("ans is" , ans)
// // // console.log(ans.getDay())
// console.log(minutesUntilDesiredTime("14:00" , 4 , ans))
// ans.setMinutes(ans.getMinutes() + minutesUntilDesiredTime("14:00" , 4 , ans))


let ans = new Date(Date.UTC(2024, 0, 4 , 11, 0));

console.log(ans)
