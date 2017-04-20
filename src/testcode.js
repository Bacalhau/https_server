var schedule = require('node-schedule');
 
 
function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    
	return  hour + ":" + min + ":" + sec + " - " + day + "/" + month + "/" + year;

}

var j = schedule.scheduleJob('*/1 * * * *', function(){
  console.log('LOG: '+ getDateTime());
});