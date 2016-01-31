const Datastore = require('nedb');
const db = new Datastore({filename: 'data.db', autoload: true});

db.find({
	$where: function() {
		return Boolean(this.tin);
	}
}, function (err, docs) {
	const async = require('async'),
		request = require('request'),
		cheerio = require('cheerio'),
		q = require('q');
	const queue = async.queue(function (doc, callback) {
		const url = `http://wwwinfo.mfcr.cz/cgi-bin/ares/darv_std.cgi?ico=${doc.tin}`,
			deferred = q.defer();
		request(url, function (error, response, body) {
			if (error) {
				deferred.reject(error);
			} else {
				deferred.resolve(body);
			}
		});
		deferred.promise.then(function (body) {
			const $ = cheerio.load(body, {xmlMode: true}),
				node = $('are\\:Odpoved are\\:Zaznam are\\:Obchodni_firma'),
				subject = node.text();
			return subject || q.reject('Ares error');
		}).then(function () {
			console.log('retrieved subject', subject);
			doc.subject = subject;
			return q.ninvoke(db, 'update', {_id: doc._id}, {$set: {subject: subject}});
		}).then(function () {
			callback();
		}).catch(function (err) {
			console.error(err);
		});
	}, 1);
	queue.push(docs);
});



/*

var stream = input.pipe(parser);
stream.on('data', function(doc) {
	db.insert(doc, function (err) {
		err && console.error(err);
	});
});


var fs = require('fs');
var parse = require('csv-parse');
var transform = require('stream-transform');

var output = [];
var parser = parse({delimiter: ';'})
var input = fs.createReadStream('data/kontroly.csv');
var transformer = transform(function(record, callback) {



	const request = require('request'),
		ic = record[2];
	if (ic) {
		const url = `http://wwwinfo.mfcr.cz/cgi-bin/ares/darv_std.cgi?ico=${ic}`;
		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				const cheerio = require('cheerio'),
					$ = cheerio.load(body, {xmlMode: true}),
					node = $('are\\:Odpoved are\\:Zaznam are\\:Obchodni_firma'),
					subject = node.text();
				console.log(node.text());
				callback(null, `${node}\n`);
			}
		})
	} else {
		callback(null, `${ic}\n`);
	}
	//callback(null, record.join(' ')+'\n');
}, {parallel: 10});
input.pipe(parser).pipe(transformer).pipe(process.stdout);

	*/