var fs = require('fs');
var config_file = JSON.parse(fs.readFileSync('config.config','utf8'));
console.log(config_file.mysqlconfig);
console.log(config_file.httpsconfig);
console.log(config_file.miscellaneous);
