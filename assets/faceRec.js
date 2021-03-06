/*------There is a lot of work to be done with displaying the divs, and images.  After receiving relevent information such as the number of faces found, the edge coordinates to crop the image, and other misc. information such as age and gender, the website will display the images and information seperately in each div.  Currently if tested, the website just generates a random number of divs and puts the image uploaded in them.  The image and div still need to be correctly formatted so the divs and images won't display correctly.------*/
var amtOfFaces = 0;
//Information such as age and gender would be stored in this array.
var information = [];


function displayFaces(image,numberOfFaces,info) {
    $(".uploader")[0].style.visibility = "hidden";
    //Creates the same number of divs as generated by the algorithm
    for(i=0;i<numberOfFaces;i++) {
        //Creates a div object
        var tempDiv = $("<div class='headDivs'>Fetching Facial Information</div>");
        //Appends the Div to the body of the page.
        $("body").append(tempDiv);
        //Appends a canvas to each div.
        $("<canvas></canvas>").appendTo($(".headDivs")[i]);
        //Appends image to canvas.
       $(".headDivs canvas")[i].getContext("2d").drawImage(image,0,0);
    }}
function faceRec() {
    //Push Coordinates for "rectangles"
    information.push("");
    //Amount of Faces returned by the script --- Just stored a random number here for demonstration.
    amtOfFaces = Math.floor((Math.random()*10)+1);
    displayFaces(image,amtOfFaces,information);
}