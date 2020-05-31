// variables globais comeco
var admin = require('firebase-admin');
var functions = require('firebase-functions');
var express = require('express');
var cors = require('cors');
var app = express();
app.use(cors({ origin: true }));
// variables globais fim
// config
var serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://my-cloud-analytics.firebaseio.com"
});
var db = admin.firestore();
var storage = admin.storage();
// config fim
// config apis
function getdata() {
  let d = new Date();
  let n = d.getTime();
  return n;
}
app.get('/v1/auctions', (req, res) => {
    var arr = [];
	let auctionsRef = db.collection('auctions');
	let query = auctionsRef.orderBy("update", "desc").get()
	.then(snapshot => {
		snapshot.forEach((doc) => {
	    	let dados = doc.data();
	        dados["id"] = doc.id;
	        arr.push(dados);
	    });
	    if (arr.length === 0) {
	        res.sendStatus(404); // equivalent to res.status(404).send('Not Found')
	    }else{
	        res.status(200).send(arr);
	    }
	return;
	})
	.catch(err => {
	    console.log('Error getting auctions', err);
		res.sendStatus(500); // equivalent to res.status(500).send('Internal Server Error')
	});
});

// indexar os lotes de leilões em sites feito pela artisticweb
app.post('/v1/getlotesveiculos', (req, res) => {
    const rp = require('request-promise');
	const $ = require('cheerio');
	
	rp("https://www.clovisleiloeiro.com.br/leilao/lotes/veiculos")
	.then(function(html){
		let auctions = $('#lista_lotes a', html).length;
		
		for (let i = 0; i < auctions; i++) {
			let auctionurl = $('#lista_lotes a', html)[i].attribs.href;
			let fullurl = "https://www.clovisleiloeiro.com.br" + auctionurl;
			db.collection("auctions_urls_veiculos").add({
				"url": fullurl
			})
			.catch(function(error) {
				console.error("erro ao adicinar url veiculo: ", error);
			});
		}
	})
	.catch(function(err){
		console.log('Error getting auctions', err);
		res.sendStatus(500); // equivalent to res.status(500).send('Internal Server Error')
	});
	
	rp("https://www.santamarialeiloes.com.br/leilao/lotes/veiculos")
	.then(function(html){
		let auctions = $('#lista_lotes a', html).length;
		
		for (let i = 0; i < auctions; i++) {
			let auctionurl = $('#lista_lotes a', html)[i].attribs.href;
			let fullurl = "https://www.santamarialeiloes.com.br" + auctionurl;
			db.collection("auctions_urls_veiculos").add({
				"url": fullurl
			})
			.catch(function(error) {
				console.error("erro ao adicinar url veiculo: ", error);
			});
		}
		
	})
	.catch(function(err){
		console.log('Error getting auctions', err);
		res.sendStatus(500); // equivalent to res.status(500).send('Internal Server Error')
	});
	
	res.end();
});
// fim das apis de indexamento de sites feito pela artisticweb
exports.api = functions.https.onRequest(app);