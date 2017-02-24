/*Title that will be animated*/
var title = "IEEE ML/AI FACIAL RECOGNITION DEMO";
/*Populates an array with all the characters in the title variable*/
var titleArray = title.split("");
/*Holds the file path for the file uploaded*/
var filePath;
/*File Reader that reads the image uploaded*/
var imageReader = new FileReader();
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

/*Function gets called when image finishes loading*/
imageReader.onloadend = function() {
        status("Image Loaded...Working...");
        image.src=imageReader.result;
        faceRec();
}

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
        filePath = $(".browser")[0].files[0];
        imageReader.readAsDataURL(filePath);
    }
}