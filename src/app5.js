'use strict';
const nodemailer = require('nodemailer');

function getDateTime_email() {

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

    
	return    day + "/" + month + "/" + year + " - " + hour + ":" + min + ":" + sec;

}
var email_subject =  getDateTime_email();
var total_number_of_requests = 0;
var statistics = {
    total:100,
    post:50,
    get:10,
    other:2,
    startup:"17/04/2017 - 22:49:15"
}
var email_body =  "Total number of requests: "+ statistics.total +"\nPOSTS: "+ statistics.post+"\nGETS: "+ statistics.get +"\nOTHER: "+ statistics.other +"\nRunning since: "+ statistics.startup;

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'mynodeservermail@gmail.com',
        pass: 'mailpassword' 
    }
});

// setup email data with unicode symbols
let mailOptions = {
    from: '"Server Status" <mynodeservermail@gmail.com>', // sender address
    to: 'joaomarcusbacalhau@hotmail.com', // list of receivers
    subject: email_subject, // Subject line
    text: email_body, // plain text body
};

// send mail with defined transport object
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log(error);
    }
    //console.log('Message %s sent: %s', info.messageId, info.response);
    console.log(info.response);
    console.log(info.accepted);
    console.log(info.rejected);
});

