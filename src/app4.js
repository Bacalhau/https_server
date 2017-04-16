//openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout privatekey.key -out certificate.crt
const https = require('https');
const fs = require('fs');
var mysql = require("mysql");
var colors = require('colors/safe');
var program = require('commander');


//READ EXECUTION OPTIONS AND SET VARIABLES
var enable_console = false;
var server_port = 8000;

const mysqlOption = {

			host: "localhost",
			port:"3306",
			user: "node",
			password: "nodeaccess",
			database:"project"
};

const options = {
  key: fs.readFileSync('privatekey.key'),
  cert: fs.readFileSync('certificate.crt')
  
};

program
  .version('0.0.1')
  .option('-l, --log', 'Activate the log of actions on console.')
  .option('-p, --port [type]', 'Select port of HTTPS server [8000].', '8000')
  .option('-ma, --mysqladress [type]', 'Adress of the MySQL server [localhost].', 'localhost')
  .option('-mp, --mysqlport [type]', 'Port of the MySQL server [3306].', '3306')
  .option('-mu, --mysqluser [type]', 'User of the MySQL server [node].', 'node')
  .option('-mk, --mysqlpassword [type]', 'Password of the MySQL server [nodeaccess].', 'nodeaccess')
  .option('-md, --mysqldatabase [type]', 'Database of the MySQL server [project].', 'project')
  .parse(process.argv);
 

console.log(colors.bgYellow("--------HTTPS SERVER-----------"));
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

https.createServer(options, (request, response) => {
	
	var headers = request.headers;	
	var method = request.method;
	var url = request.url;
	var body = [];

	consoleNewConnection(enable_console,headers.host,method);

 	response.writeHead(200,{"Content-Type":"text\plain"});

    if(request.method == "GET") {

            response.end("Received GET request.")

    }
    else if(request.method == "POST") {
			
			request.on('error', function(err) {

			consoleLogError("HTTP",err);
			console.error(err);

			}).on('data', function(chunk) {

			body.push(chunk);

			}).on('end', function() {

			body = Buffer.concat(body).toString();

			var parsed = JSON.parse(body);
			console.log(parsed);	

			
			var con = mysql.createConnection(mysqlOption);// First you need to create a connection to the db

			con.connect(function(err) {
			  if (err) {
			    console.error('error connecting: ' + err.stack);
			    return;
			  }

			  console.log('connected as id ' + con.threadId);
			});

			 

			  //var post  = {description: "Envio app Node", init_date: "2017-12-04",end_date: "2017-12-04",status:1};

			  //var query = con.query("INSERT INTO tasks SET ?", post, function (error, results, fields) {
			  //if (error) throw error;
			  // Neat!
			  //});
			  var query = con.query("INSERT INTO tasks SET description = ? , init_date = ? , end_date = ? , status = ? ", [parsed.description, parsed.init_date, parsed.end_date,parsed.status], function (error, results, fields) {
			  if (error) throw error;
			  // Neat!
			  });

			  con.end(function(err) {
			  // The connection is terminated gracefully
			  // Ensures all previously enqueued queries are still
			  // before sending a COM_QUIT packet to the MySQL server.
			  });
			
			});

			response.end("Received POST request.");

        }
    else 
	{
			consoleLogError(enable_console,"HTTP","Undefined request.");
            response.end("Undefined request");
    }

}).listen(server_port);
