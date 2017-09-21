const express = require('express');
const path = require('path');
const app = express();
const server = app.listen(80,function() {
	console.log('Server now on.  Listening to port 80.');
});
const io = require('socket.io')(server);
const fs = require('fs');
const formidable = require('formidable');
const faceRec = require('./faceRec.js');


var socket;

app.disable('etag');
app.use('/assets',express.static('assets'));

app.get('/',function(req,res) {
	res.status(200);
	res.sendFile(path.join(__dirname + '\\index.html'));
});

app.get('/:extraStuff',function(req,res) {
	res.status(200);
	res.sendFile(path.join(__dirname + '\\index.html'));
});

app.post('/upload',function(req,res,next) {
  var form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname, '/images');
  form.on('file', function(field, file) {
  	var uploadedImage = path.join(form.uploadDir, file.name);
    fs.rename(file.path, uploadedImage);
    req.image = uploadedImage;
    req.socket = socket;
    next();
  });
  form.parse(req);
});

app.use('/upload',faceRec.faceRec);

io.on('connection', function (sock) {
	console.log("HELLO FROM SOCKET.IO");
  socket = sock;
});