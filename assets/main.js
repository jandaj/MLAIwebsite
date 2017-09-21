/*Title that will be animated*/
var title = "IEEE ML/AI FACIAL DETECTION DEMO";
/*Populates an array with all the characters in the title variable*/
var titleArray = title.split("");
/*Holds the file path for the file uploaded*/
var filePath;

/*Creates an image element in Javascript---not initially visible on the page*/
var image = new Image();

/*Displays whatever is called into the function in the status bar*/
function status(str) {
    $("#status")[0].innerHTML = "Status : " + str;
}

/*Animates the Title in variable Title*/
function animateTitle() {
    /*Speed at which title will be animated*/
    var speed=50;
    if(titleArray.length>0){
        /*Trims off "|"*/
        $("#title")[0].innerHTML = $("#title")[0].innerHTML.substring(0,$("#title")[0].innerHTML.length-1);
        /*Concatenates the next character in the title array to the title and deletes it
        from the array.  Also adds the "|" character mimicing text insertion.*/
        $("#title")[0].innerHTML+=titleArray.shift()+"|";
    }else{
    /*Run if title has been printed*/
        speed=500;
        var lastChar= $("#title")[0].innerHTML.substring($("#title")[0].innerHTML.length-1);
        if(lastChar=="|"){
        /*Trims off "|" if its there*/
        $("#title")[0].innerHTML = $("#title")[0].innerHTML.substring(0,$("#title")[0].innerHTML.length-1);
        }/*If "|" isn't there insert it to the end*/
        else{$("#title")[0].innerHTML+="|";}
    }
    setTimeout(animateTitle,speed);
}

function fileExtensionCheck(file) {
	switch(file.type) {
		case "image/jpeg":
			return true;
		case "image/gif":
			return true;
		case "image/png":
			return true;
		default:
			return false;
	}
}

function uploadPicture() {
	var file = $(".browser")[0].files[0];
	status("Uploading...");
	$("#uploadButton").fadeTo("slow",0).animate({height:'0'});
	$("#uploadButton").css("display","none");
	$(".summary").fadeTo("slow",0).animate({height:'0'});
	$(".summary").css("display","none");
	$(".progress").fadeTo("slow",1);
	$(".progress").css("display","block");
	if(fileExtensionCheck(file)) {
		var imageForm = new FormData();
		imageForm.append("image",file,file.name);
		var req = $.ajax({
			url: '/upload',
			type: 'POST',
			data: imageForm,
			processData: false,
			contentType: false,
			success: function(data){
				//SUCCESS
			},
			xhr: function() {
			var xhr = new XMLHttpRequest();
			xhr.upload.addEventListener('progress', function(e) {
			if (e.lengthComputable) {
            var percent = e.loaded / e.total;
            percent = parseInt(percent * 100);
            $('.progress-bar').text(percent + '%');
            $('.progress-bar').width(percent + '%');
            if (percent === 100) {
              $('.progress').fadeTo("slow",0).animate({height:'0'});
			  $(".progress").css("display","none");
			  $("#loading-img").fadeTo("slow",1);
			  $(".progress-status").css("display","block");
			  $("#loading-img").css("display","block");
            }

			}

        }, false);

        return xhr;
		}
		});
		req.fail(function() {
			status("Upload Failed.");
			$('.progress-bar').text('Failed.');
		});
	}else{
		$(".progress")[0].style.visibility = "hidden";
	$("#uploadButton")[0].style.visibility = "visible";
	status("Try Again.  Image type not supported.  Only jpg, png, gif.");
	}
}

//Holds WebSocket for bi-directional communication
var socket;

/*Function gets called when page finishes loading*/
window.onload = function() {
    status("Waiting for Image.");
    animateTitle();
    /*Makes the summary, uploader, and status visible after 2000ms elapses*/
    setTimeout(function(){
        $("p")[0].style.visibility="visible";
        $("#status")[0].style.visibility="visible";
        $(".uploader")[0].style.visibility="visible";},2000);
    /*When the website is fed a file the function sets variable filePath to what was fed 
    and imageReader reads the filepath*/
    $(".browser")[0].onchange=function() {
        uploadPicture();
    }
	socket = io('http://192.168.1.136');
	console.log("Socket Established.");
	
	socket.on("image",function(data) {
	data = "data:image/png;base64," + data;
	$('body').append(
		$('<img/>')
		.attr("src", data).attr("id","faceImage")
	);
	$("#faceImage").css("display","none");
	$("#faceImage").fadeTo("slow",1);
	});
	
	socket.on("status",function(data) {
	console.log("status");
	status(data);
	});
	
	socket.on("end",function(){
		status("Done.");
		$(".progress-status").fadeOut("slow",0).animate({height:'0'},{queue:false});
	});
}