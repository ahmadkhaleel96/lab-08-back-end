'use strict';

const express = require('express');
const superagent = require('superagent');
const server = express();

const cors = require('cors');
server.use(cors());

require('dotenv').config();

const PORT = process.env.PORT || 5500;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const DARKSKY_API_KEY = process.env.DARKSKY_API_KEY;
const EVENTFUL_API_KEY = process.env.EVENTFUL_API_KEY;

// to check if the server is listening
server.listen(PORT, () => console.log('Listening to PORT 5500'));

server.get('/', (request, response) => {
	response.status(200).send('Welcome, i love that you love that i love that you love, my empty page hahaha.');
});

server.get('/location', locationHandler);

function Location(city, locationData) {
	this.formatted_query = locationData[0].display_name;
	this.latitude = locationData[0].lat;
	this.longitude = locationData[0].lon;
	this.search_query = city;
}

function locationHandler(request, response) {
	let city = request.query['city'];
    getLocationData(city)
        .then((data) => {
		response.status(200).send(data);
	});
}
function getLocationData(city) {
	const url = `https://eu1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${city}&format=json&limit=1`;

    return superagent.get(url)
       .then((data) => {
		let location = new Location(city, data.body);
		return location;
	});
}

server.get('/weather', weatherHandler);

function Weather(day) {
	this.time = new Date(day.time * 1000).toDateString();
	this.forecast = day.summery;
}

function weatherHandler(request, response) {
	let lat = request.query['latitude'];
    let lng = request.query['longitude'];
    console.log('lat' ,lat , 'lng', lng);
    getWeatherData(lat, lng)
         .then((data) => {
		response.status(200).send(data);
	});
}

function getWeatherData(lat, lng) {
	const url = `https://api.darksky.net/forecast/${DARKSKY_API_KEY}/${lat},${lng}`;
    return superagent.get(url)
        .then((weatherData) => {
		//console.log(weatherData.body.daily.data);
		let weather = weatherData.body.daily.data.map((day) => new Weather(day));
		return weather;
	});
}


server.get('/events', eventfulHandler);
// constructor function 
function Eventful(event){
    this.link = event.url;
    this.name = event.title;
    this.event_date = event.start_time;
    this.summery =  event.discreption;
}


//handler
function eventfulHandler(request, response){
    let city = request.query.formatted_query;
    console.log('location', city);
    getEventfulData(city)
        .then((data) =>{
            response.status(200).send(data);
        });
}


function getEventfulData(formatted_query) {
	const url = `http://api.eventful.com/json/events/search?app_key=${EVENTFUL_API_KEY}&location=${formatted_query}`;
	console.log('url',url);
    return superagent.get(url)
        .then((eventData) => {
			 let info = JSON.parse(eventData.text);
			// console.log('info',info.events.event)
			 if (info.events){
				 console.log("hi",info.events)
				 let event = info.events.event.map((day) => new Eventful(day));
				 return  event;
			}
				 
	});
}

server.use('*', (request, response) => {
	response.status(404).send('sorry, page is not found');
});

server.use((error, request, response) => {
	response.send(500).send(error);
});
