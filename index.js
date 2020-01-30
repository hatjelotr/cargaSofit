const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer();
const request = require('request');

const myId = '5e331908b519d10014bc3863';
const moment = require('moment');
moment.locale('pt-br');
let avarage = 11;

let spents, prices, supplies;
let balance = 0;
let promisses = [];
promisses.push(new Promise((resolve, reject) => {
    request.get(`https://challenge-for-adventurers.herokuapp.com/data/${myId}/prices`, {
        json: true
    }, (err, resp, body) => {
        if (!err) {
            prices = body;
            resolve('success');
        } else {
            reject(err);
        }
    });
}));
promisses.push(new Promise((resolve, reject) => {
    request.get(`https://challenge-for-adventurers.herokuapp.com/data/${myId}/supplies`, {
        json: true
    }, (err, resp, body) => {
        if (!err) {
            supplies = body;
            resolve('success');
        } else {
            reject(err);
        }
    });
}));
promisses.push(new Promise((resolve, reject) => {
    request.get(`https://challenge-for-adventurers.herokuapp.com/data/${myId}/spents`, {
        json: true
    }, (err, resp, body) => {
        if (!err) {
            spents = body;
            resolve('success');
        } else {
            reject(err);
        }
    });
}));
Promise.all(promisses).then((succes) => {
    if (prices && spents && supplies) {
        let firstDay = spents[0].date > supplies[0].date ? spents[0].date : supplies[0].date;
        let lastDay = spents[spents.length - 1].date > supplies[supplies.length - 1].date ? spents[spents.length - 1].date : supplies[supplies.length - 1].date;
        firstDay = firstDay.split('/');
        lastDay = lastDay.split('/');
        firstDay = new Date(firstDay[2], firstDay[1] - 1, firstDay[0]);
        lastDay = new Date(lastDay[2], lastDay[1] - 1, lastDay[0]);
        let qtdOfDays = moment(lastDay).diff(moment(firstDay), 'days');
        let response = [];
        for (let i = 0; i <= qtdOfDays; i++) {
            let today = moment(firstDay).add(i, 'days');
            let lastPrice;
            for (let i = 0; i < prices.length; i++) {
                let data = prices[i].date.split('/');
                data = new Date(data[2], data[1] - 1, data[0])
                if (moment(moment(data)).isAfter(today, 'days')) {
                    lastPrice = prices[i - 1].value
                    break;
                }
            }
            let gas = 0;
            for (let i = 0; i < supplies.length; i++) {
                if (supplies[i].date === today.format('L')) {
                    gas = supplies[i].value / lastPrice;
                    balance += Math.round(gas * 100) / 100;
                    break;
                }
            }
            let cost = 0;
            for (let i = 0; i < spents.length; i++) {
                if (spents[i].date === today.format('L')) {
                    cost = Math.round(spents[i].value / avarage * 100) / 100;
                    break;
                }
            }
            balance -= cost;
            response.push({ date: today.format('L'), value: Math.round(balance * 100) / 100 });
        }
        request(
            {
                method: 'post',
                uri: `https://challenge-for-adventurers.herokuapp.com/check?id=${myId}`,
                body:response,
                json: true,
            }, function (error, resp, body) {
                if(error){
                    throw new Error(error);
                }

                console.log(body);
            });



    }
}, (reject) => {
    throw new Error(reject);
});
