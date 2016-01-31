var fs = require('fs'),
	parse = require('csv-parse'),
	async = require('async'),
	winston = require('winston');

var stream = fs.createReadStream('data/kontroly.csv'),
    parser = parse({
        delimiter: ';',
        columns: true
    });

var Ares = require('./ares.js'),
	ares = new Ares();

var logger = new winston.Logger({
	level: 'info',
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({
			name: 'app',
			filename: 'app.log',
			json: false
		}),
		new winston.transports.File({
			name: 'error',
			filename: 'error.log',
			level: 'warn',
			json: false
		})
	]
});

var queue = async.queue(function(row, callback) {
	var id = row['Id kontroly'],
		date = row['Datum kontroly'],
		ico = row['IC subjektu'],
		city = row['Obec'];
	ares.identify(ico).then(function(response) {
		var record = response['are:Ares_odpovedi']['are:Odpoved'][0]['are:Zaznam'];
		return record && record[0]['are:Obchodni_firma'][0];
	}).then(function(subject) {
		subject && logger.info(id, date, ico, subject);
		callback();
	}).catch(function(err) {
		logger.warn(ico, err);
		callback(err);
	});
}, 8);

stream.pipe(parser).on('data', function(row) {
	var ico = row['IC subjektu'];
	if (ico) {
		async.retry({times: 3, interval: 3000}, queue.push.bind(queue, row), function(err) {
			if (err) {
				winston.error(ico, err);	
			}
		});
	}
});