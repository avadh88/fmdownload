var url 			= require('url');
var request 		= require('request');
var fs 				= require('fs');
var path 			= require('path');
var progress  		= require('request-progress');
var ProgressBar  	= require('progress');
var API_BASE 		= require('./config').API_BASE_URL;
var VIDEO_URLS 		= [];
var TOTAL_COMPLETED = 0;
var TOTAL_VIDEOS;

var boot = function(courseUrl) {
	courseUrl = API_BASE + url.parse(courseUrl).pathname;
	request(courseUrl, function(error, response, body) {
		if(error) {

		} else {
			processCourseInfo(body);
		}
	});
}

var processCourseInfo = function(body)
{
	var videos, directory;

	try {
		body = JSON.parse(body);
	} catch(Exception) {
		body = body;
	}

	directory = __dirname + '/videos/' + body.title;

	// Create a video directory if not exists
	directory.split('/').forEach((dir, index, splits) => {
		const parent 	= splits.slice(0, index).join('/');
	  	const dirPath 	= path.resolve(parent, dir);
	  	if (!fs.existsSync(dirPath)) {
	    	fs.mkdirSync(dirPath);
	  	}
	});

	// Grab Lesson Data
	if(body.lessonData) {

		videos = body.lessonData.map(function(obj, index){
			var seq 		= index + 1,
				url 		= API_BASE + '/video/' + obj.statsId + '?r=720&f=webm',
				destination = directory + '/' + seq + ' - ' + obj.title + '.webm',
				title 		= obj.title;

			return {
				url 		: url,
				destination : destination,
				title 		: title
			};
		});
	}

	VIDEO_URLS = videos;

	// Start with the first video and download all them synchronuously
	startDownloading(VIDEO_URLS[0]);
}

var startDownloading = function(video) {
	request(video.url)
	.on('response', function handleResponse(res) {

		var total 		= Number(res.headers['content-length']) || null;
		var progressBar = new ProgressBar('Downloading ' + video.title + '[:bar] :rate/bps :percent :etas', {
			complete 	: '=',
		    incomplete 	: ' ',
		    width 		: 20,
		    total 		: total
		});

		res.on('data', function (chunk) {
    		progressBar.tick(chunk.length);
  		});
    })
    .on('end', function() {
    	TOTAL_COMPLETED ++;
    	startDownloading(VIDEO_URLS[TOTAL_COMPLETED]);
    })
	.pipe(fs.createWriteStream(video.destination));
}

module.exports.boot = boot;