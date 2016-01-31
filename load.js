const Datastore = require('nedb');
const db = new Datastore({filename: 'data.db', autoload: true});

const fs = require('fs');
const parse = require('csv-parse');
const transform = require('stream-transform');

const parser = parse({
	delimiter: ';',
	columns: [
		'id',
		'date',
		'tin',
		'nuts3',
		'region',
		'nuts4',
		'district',
		'nuts5',
		'city',
		'street',
		'descriptiveNumber',
		'registrationNumber',
		'zipCode'
	]
});
const input = fs.createReadStream('data/kontroly.csv');

var stream = input.pipe(parser);
stream.on('data', function(doc) {
	db.insert(doc, function (err) {
		err && console.error(err);
	});
});