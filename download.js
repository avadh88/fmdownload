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
var cookieText = 'wordpress_logged_in_323a64690667409e18476e5932ed231e=viralsolani%7C1499495262%7C1LcgyzEmsVulTQOdDyryAFbMUpVVKVKPTS5OpgQHFw3%7C6f60c50d06d4eb4db08179b90f0a22fccdf4fffadf162f7334ffc5f2fd3180ca';




var boot = function(courseUrl) {

var options = {
  url: API_BASE + url.parse(courseUrl).pathname,
  headers: {
   'User-Agent': 'request',
   'host': '.frontendmasters.com',
   'cookie': cookieText //this is where you set custom cookies
  }
};
	courseUrl = API_BASE + url.parse(courseUrl).pathname;
	request(options, function(error, response, body) {
		if(error) {
			console.log(error);
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
	//resorce download and write on the txt file.
        if (body.resources) {
		var resorce_file_name = directory + '/' + body.slug + '.txt';
		var logger = fs.createWriteStream(resorce_file_name, {
		    flags: 'a' // 'a' means appending (old data will be preserved)
		})
		body.resources.map(function(obj, index) {
		    logger.write('==========================================================' + '\r\n')
		    logger.write(index + ')  ' + obj.label + '\r\n') // append string to your file
		    logger.write(obj.url + '\r\n');
		    logger.write('==========================================================' + '\r\n')
		});
		logger.end();
    	}
	// Grab Lesson Data
	if(body.lessonData) {

		videos = body.lessonData.map(function(obj, index){
			var seq 		= index + 1,
				url 		= API_BASE + '/video/' + obj.statsId + '?r=720&f=webm',
				destination = directory + '/' + seq + ' - ' + obj.slug + '.webm',
				title 		= obj.slug;

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
	if(fs.existsSync(video.destination)) {TOTAL_COMPLETED++; startDownloading(VIDEO_URLS[TOTAL_COMPLETED]);   return false;}
	
	var video_download = {
  		url: video.url,
		headers: {
		   'User-Agent': 'request',
		   'host': '.frontendmasters.com',
		   'cookie': cookieText //this is where you set custom cookies
		  }
	};
	request(video_download)
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
