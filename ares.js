var Ares = function() {

	var LRU = require('lru-cache'),
		sizeof = require('object-sizeof'),
		cache = LRU({
			max: 104857600,
			length: function(n, key) {
				return sizeof(n) + sizeof(key);
			}
		});
	
	var get = function(ico) {
		return new Promise(function(resolve, reject) {
			var request = require('request'),
				Agent = require('socks5-http-client/lib/Agent');
			var params = {
				url: 'http://wwwinfo.mfcr.cz/cgi-bin/ares/darv_std.cgi?ico=' + ico,
				agentClass: Agent,
				agentOptions: {
					socksPort: 9050
				}
			};
			request(params, function(err, res, body) {
				if (err) {
					reject(err);
				} else {
					resolve(body);
				}
			});
		})
	};

	var parse = function(body) {
		return new Promise(function(resolve, reject) {
			var xml2js = require('xml2js'),
				parser = new xml2js.Parser();
			parser.parseString(body, function (err, result) {
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
		});
	};

	this.identify = function(ico) {
		var object = cache.get(ico);
		if (object) {
			return Promise.resolve(object);
		}
		return get(ico).then(parse).then(function(object) {
			cache.set(ico, object);
			return object;
		});
	};
};

module.exports = Ares;

/*
var ares = new Ares();
ares.identify(24289400).then(function(body) {
	var sizeof = require('object-sizeof'),
		subject = body['are:Ares_odpovedi']['are:Odpoved'][0]['are:Zaznam'][0]['are:Obchodni_firma'][0];
	console.log(subject, sizeof(body));
}).then(function() {
	return ares.identify(49824961);
}).then(function(body) {
	var subject = body['are:Ares_odpovedi']['are:Odpoved'][0]['are:Zaznam'][0]['are:Obchodni_firma'][0];
	console.log(subject);
}).catch(function(err) {
	console.error(err);
});
*/