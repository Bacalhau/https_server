//openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout privatekey.key -out certificate.crt
'use strict';
var https = require('https');
var fs = require('fs');
var mysql = require("mysql");
var colors = require('colors/safe');
var program = require('commander');
const nodemailer = require('nodemailer');
const os = require('os');
var schedule = require('node-schedule');
var cpu_data = os.cpus();

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

var config_file = JSON.parse(fs.readFileSync('config.cfg','utf8'));

//READ EXECUTION OPTIONS AND SET VARIABLES
var enable_console = config_file.miscellaneous.enable_console;
var server_port = config_file.httpsconfig.port;

var mysqlOption = {

			host: config_file.mysqlconfig.host,
			port: config_file.mysqlconfig.port,
			user: config_file.mysqlconfig.user,
			password: config_file.mysqlconfig.password,
			database: config_file.mysqlconfig.database
};

const options = {

  key: fs.readFileSync(config_file.httpsconfig.priv_key),
  cert: fs.readFileSync(config_file.httpsconfig.certificate)
  
};

program
  .version('0.0.1')
  .option('-l, --log', 'Activate the log of actions on console.')
  .option('-p, --port [type]', 'Select port of HTTPS server [' + config_file.httpsconfig.port +'].', config_file.httpsconfig.port)
  .option('-a, --mysqladress [type]', 'Adress of the MySQL server ['+ config_file.mysqlconfig.host + '].', config_file.mysqlconfig.host)
  .option('-t, --mysqlport [type]', 'Port of the MySQL server ['+ config_file.mysqlconfig.port +'].', config_file.mysqlconfig.port)
  .option('-u, --mysqluser [type]', 'User of the MySQL server ['+ config_file.mysqlconfig.user +'].', config_file.mysqlconfig.user)
  .option('-k, --mysqlpassword [type]', 'Password of the MySQL server ['+ config_file.mysqlconfig.password +'].', config_file.mysqlconfig.password)
  .option('-d, --mysqldatabase [type]', 'Database of the MySQL server ['+ config_file.mysqlconfig.database +'].', config_file.mysqlconfig.database)
  .parse(process.argv);
 
var statistics = {
    total:0,
    post:0,
    get:0,
    other:0,
    startup:"17/04/2017 - 22:49:15"
}
statistics.startup = getDateTime();

console.log(colors.bgYellow("--------HTTPS SERVER-----------"));
console.log(" ");
console.log(colors.cyan("STARTUP: ") + statistics.startup);
console.log(" ");
console.log(colors.cyan("CPU: " + cpu_data[0].model + " CLOCK: " + cpu_data[0].speed + "(MHz) NUMBER OF CORES: "+ (cpu_data.length)));
console.log(colors.cyan("FREE RAM: " + (os.freemem()/(1024*1024*1024)).toFixed(2) + " GB"));
console.log(colors.cyan("TOTAL RAM: " + (os.totalmem()/(1024*1024*1024)).toFixed(2) +" GB"));
console.log(colors.cyan("HOST NAME: " + os.hostname()));
console.log(colors.cyan("PLATFORM: " + os.platform() + " OS: " + os.type() + " RELEASE: " + os.release()));
console.log(" ");
console.log(colors.cyan("Parameters: "));
console.log(" ");

if (program.log){

	console.log(colors.cyan(" - Server log active"));
	enable_console=program.log;
} 

if (program.port){

	server_port = parseInt(program.port,10);
	console.log(colors.cyan(" - HTTPS server port: ") + server_port);
}

if (program.mysqladress){

	mysqlOption.host = program.mysqladress;
	console.log(colors.cyan(" - MySQL server adress: ") + mysqlOption.host);
}

if (program.mysqlport){

	mysqlOption.port = program.mysqlport;
	console.log(colors.cyan(" - MySQL server port: ") + mysqlOption.port);
}


if (program.mysqluser){

	mysqlOption.user = program.mysqluser;
	console.log(colors.cyan(" - MySQL server user: ") + mysqlOption.user);
}


if (program.mysqlpassword){

	mysqlOption.password = program.mysqlpassword;
	console.log(colors.cyan(" - MySQL server password: ") + mysqlOption.password);
}

if (program.mysqldatabase){

	mysqlOption.database = program.mysqldatabase;
	console.log(colors.cyan(" - MySQL server database: ") + mysqlOption.database);
}

console.log(" ");
console.log(colors.bgYellow("-------------------------------"));


function consoleLogError(enable,part,description) {
	if(enable)
	{
		console.log(colors.red("->ERROR(") + colors.yellow(part) + colors.red("): ")+ colors.magenta(description));
	}	
	return;
}

function consoleNewConnection(enable,host,method) {
	if(enable)
	{
		console.log(colors.green("CONNECTION - ") + "HOST: " + host + " METHOD: " + method);
	}	
	return;
}

function consoleMailSent(enable) {
	if(enable)
	{
		console.log(colors.green("E-MAIL SENT!"));
	}	
	return;
}

//-------------------END-----------------//

var email_subject =  getDateTime_email();
var total_number_of_requests = 0;


// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'mynodeservermail@gmail.com',
        pass: 'mailpassword'
    }
});


https.createServer(options, (request, response) => {
	
	var headers = request.headers;	
	var method = request.method;
	var url = request.url;
	var body = [];

	consoleNewConnection(enable_console,headers.host,method);

 	response.writeHead(200,{"Content-Type":"text\plain"});

    if(request.method == "GET") {


            statistics.get = statistics.get+ 1;
            statistics.total = statistics.post + statistics.other + statistics.get;
            email_subject =  getDateTime_email();
            let email_body =  "Total number of requests: "+ statistics.total +"\nPOSTS: "+ statistics.post+"\nGETS: "+ statistics.get +"\nOTHER: "+ statistics.other +"\nRunning since: "+ statistics.startup;
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
                    consoleLogError(enable_console,"SMTP"," Sendmail Error");
                }
                if((info.rejected.length==0)&&(info.response.slice(0,3)==250)){
                    consoleMailSent(enable_console);
                    //parseInt(info.response, 10)==250                   
                }                    
            });
            response.end("Received GET request.")

    }
    else if(request.method == "POST") {
			statistics.post = statistics.post+ 1;
			request.on('error', function(err) {

				consoleLogError("HTTP",err);
				console.error(err);

			}).on('data', function(chunk) {

				body.push(chunk);

			}).on('end', function() {

				body = Buffer.concat(body).toString();
				var parsed = JSON.parse(body);
				var con = mysql.createConnection(mysqlOption);// First you need to create a connection to the db
                console.log(colors.red("PASSOU"));
				con.connect(function(err) {
			  		if (err) {
			   			consoleLogError(enable_console,"MYSQL","Can't connect to Database.");
                        console.error('error connecting: ' + err.stack);                        
			    		return;
			  		}
                      
                    var query = con.query("INSERT INTO tasks SET description = ? , init_date = ? , end_date = ? , status = ? ", [parsed.description, parsed.init_date, parsed.end_date,parsed.status], function (error, results, fields) {
                    if (error){

                        consoleLogError(enable_console,"MYSQL","Can't handle the query.");
                    }
                    });
                    
                    con.end(function(error) {
                        if (error){

                        consoleLogError(enable_console,"MYSQL","Can't end connection.");
                        }                        
                    });
				});
			});

			response.end("Received POST request.");

        }
    else if(request.method == "OPTIONS") {
        response.end("OPTIONS");
    }
    else if(request.method == "LOCK") {
        response.end("LOCK");
    }
    else if(request.method == "UNLOCK") {
        response.end("UNLOCK");
    }
    else if(request.method == "VIEW") {

        response.end("Received VIEW request.");
    }
    else 
	{
            statistics.other = statistics.other+ 1;
			consoleLogError(enable_console,"HTTP","Undefined request.");
            response.end("Undefined request");
    }

}).listen(server_port);



//---------------SCHEDULE---------------//

var rule_9 = new schedule.RecurrenceRule();
rule_9.hour = 9;

var rule_21 = new schedule.RecurrenceRule();
rule_21.hour = 21;

var schedule_9 = schedule.scheduleJob(rule_9, function(){

            consoleMailSent(enable_console);
            statistics.get = statistics.get+ 1;
            statistics.total = statistics.post + statistics.other + statistics.get;
            email_subject =  getDateTime_email();
            let email_body =  "Total number of requests: "+ statistics.total +"\nPOSTS: "+ statistics.post+"\nGETS: "+ statistics.get +"\nOTHER: "+ statistics.other +"\nRunning since: "+ statistics.startup;
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
                    consoleLogError(enable_console,"SMTP"," Sendmail Error");
                }
                if((info.rejected.length==0)&&(info.response.slice(0,3)==250)){
                    consoleMailSent(enable_console);                                       
                }                    
            });
  
});

var schedule_21 = schedule.scheduleJob(rule_21, function(){

            consoleMailSent(enable_console);
            statistics.get = statistics.get+ 1;
            statistics.total = statistics.post + statistics.other + statistics.get;
            email_subject =  getDateTime_email();
            let email_body =  "Total number of requests: "+ statistics.total +"\nPOSTS: "+ statistics.post+"\nGETS: "+ statistics.get +"\nOTHER: "+ statistics.other +"\nRunning since: "+ statistics.startup;
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
                    consoleLogError(enable_console,"SMTP"," Sendmail Error");
                }
                if((info.rejected.length==0)&&(info.response.slice(0,3)==250)){
                    consoleMailSent(enable_console);                                       
                }                    
            });
  
});
