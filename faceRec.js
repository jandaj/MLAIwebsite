const getPixels = require("get-pixels"),
	savePixels = require("save-pixels"),
	ndarray = require("ndarray"),
	libxmljs = require("libxmljs"),
	path = require('path'),
//const parse = require("xml-parser");
//const xmlQuery = require("xml-query");
	XmlReader = require("xml-reader"),
	fs = require("fs"),
	obj = require("./haarCascadeObjects"),
	images = require("images"),
	preprocess = require("./preprocessing.js");

function sendStatus(message,socket) {
	socket.emit("status",message);
}

function merge(faces) {
	if(faces.length==1) {
		return faces;
	}else{
	var face = [];
	var clusterNumber = 1;

	console.log("faces.length : " + faces.length);
	for(var i = 1; i < faces.length; i++) {
 		for(var j = 0; j < i; j++) {
 			var face1 = faces[i];
 			var face2 = faces[j];
 			if((face1.cluster==0) || (face2.cluster==0)) {
 			if(((face1.center[0]>=face2.x && face1.center[0]<=face2.x + face2.length) && (face1.center[1]>=face2.y && face1.center[1]<=face2.y + face2.height)) || ((face2.center[0]>=face1.x && face2.center[0]<=face1.x + face1.length) && (face2.center[1]>=face1.y && face2.center[1]<=face1.y + face1.height))) {
 				
 				if((face1.cluster==0) && (face2.cluster==0)) {
 					face1.cluster = clusterNumber;
 					face2.cluster = clusterNumber;
 					clusterNumber++;
 				}else if(face1.cluster!=0) {
 					face2.cluster = face1.cluster;
 				}else{
 					face1.cluster = face2.cluster;
 				}
 			}
 		}
 		}
 	}
 	for(var i = 1; i < clusterNumber; i++) {
 		var cluster = [];
 		for(var j = 0; j < faces.length; j++) {
 			if(faces[j].cluster == 0) {
 				face.push(faces[j]);
 			}else if(faces[j].cluster == i) {
 				cluster.push(faces[j]);
 			}
 		}
 		var x = 0;
 		var y = 0;
 		var length = 0;
 		var height = 0;
 		for(var k = 0; k < cluster.length; k++) {
 			x+=cluster[k].x;
 			y+=cluster[k].y;
 			length+=cluster[k].length;
 			height+=cluster[k].height;
 		}
 		face.push(new obj.faceRect(Math.floor(x / cluster.length),Math.floor(y / cluster.length),Math.floor(length / cluster.length),Math.floor(height / cluster.length)));
 		}
 		return face;
 	}
}

exports.faceRec = function(req,res,next) {
	res.end();
	images(req.image).resize(450).save(req.image);
	var photo = getPixels(req.image, function(err, pixels) {
  	if(err) {
  		sendStatus("Something went wrong.  Perhaps the photo uploaded was corrupted. Please reload.",req.socket);
    	console.log("faceRec.js Error");
  	}else{
  	console.log("PreProcessing");
  	sendStatus("Preprocessing...",req.socket);
  	req.pixels = pixels;
  	req.grayscale = preprocess.grayscalePhoto(req);
 	req.integral = preprocess.integralPhoto(req);
 	req.squaredIntegral = preprocess.squaredIntegralPhoto(req);
 	req.edges = preprocess.getEdges(req);
 	req.xml = preprocess.populateStages("face_haar.xml");
 	req.faces = [];
 	var maxWindowScale = Math.min(req.pixels.shape[0] / req.xml.size.x,req.pixels.shape[1] / req.xml.size.y);
 	var progress = Math.ceil((Math.log(maxWindowScale))/(Math.log(1.05)));
 	var currProgress = 0;
 	for(var windowScanScale = 1; windowScanScale <= maxWindowScale; windowScanScale *= 1.05) {
 		currProgress++;
 		for (var x = 0; x < req.pixels.shape[0] - windowScanScale * req.xml.size.x; x += Math.floor(windowScanScale * req.xml.size.x * 0.1)) {
 			for(var y = 0;  y < req.pixels.shape[1] - windowScanScale * req.xml.size.x; y += Math.floor(windowScanScale * req.xml.size.x * 0.1)) {
 				var edgy = false;
 				var edginess = req.edges.get(x + Math.floor(windowScanScale * req.xml.size.x), y + Math.floor(windowScanScale * req.xml.size.x)) + req.edges.get(x,y) - req.edges.get(x,y + Math.floor(windowScanScale * req.xml.size.x)) - req.edges.get(x + Math.floor(windowScanScale * req.xml.size.x),y);
 				edginess = edginess / (windowScanScale * req.xml.size.x);
 				edginess = edginess / (windowScanScale * req.xml.size.x);
 				if(edginess>150) {
 					edgy = true;
 				}
 				try {
 					if(edgy) {
 				req.xml.stage.forEach(function(s) {
 					if(!s.check(req,x,y,windowScanScale,req.integral, req.squaredIntegral)) {
 						throw BreakException;
 					}
 				});
 				req.faces.push(new obj.faceRect(x,y,windowScanScale * req.xml.size.x,windowScanScale * req.xml.size.y));
 			}
 			}catch(e) {}
 			}
 		}
 		sendStatus("Searching for Faces...(" + currProgress + "/" + progress + ")",req.socket);
 	}
 	sendStatus("Merging Faces...",req.socket);
 	console.log(req.faces.length);
 	req.faces = merge(req.faces);
 	console.log(req.faces.length);
 	req.faces = merge(req.faces);
 	sendStatus("Finalizing & Loading...",req.socket);
 	console.log(req.faces.length);
	req.faceCropped = [];
 	req.faces.forEach(function(face) {
 		var pic = savePixels(face.crop(req.pixels),"png",100);
 		req.faceCropped.push(pic);
 		var chunks = [];
        pic.on('data', function(chunk) {
            chunks.push(chunk);
            });
        pic.on('end', function() {
               var result = Buffer.concat(chunks);
               		req.socket.emit('image', result.toString('base64'));
            });
 	});
 	req.socket.emit("end");
 	console.log("DONE.");
 }
});

}