/*
* @Author: seobo
* @Date:   2018-04-11 11:38:18
* @Last Modified by:   seobo
* @Last Modified time: 2019-04-01 23:24:22
*/

var RESULT_FILENAME = "results.csv";
var ERROR_FILENAME = "netidErrors.csv";
var SUBMIT_WAIT_TIME_INTERVAL = 50;
var RANDOM_INTERVAL = false;
var USER_LOOKUP_LINK = "sakai.rutgers.edu/addpart-lookup.jsp";
//var GOOGLE_APPS_LINK = "https://script.google.com/a/scarletmail.rutgers.edu/macros/s/AKfycbwZ7B1P6tXk4ixcqiMN7kemTkcZs0zxa-jPvW8hFeTbF8tsr4GQ/exec"
var GOOGLE_APPS_LINK = "https://script.google.com/a/scarletmail.rutgers.edu/macros/s/AKfycbxUPnRcMWJNYmFYknuOTsnXognyzTkDa1jQxcZLNUKD/dev"

var netids = [], netidErrors = [], results = [];
var resultRow = 0, netIDCount = 0;
var data; // static, read from the file
var postData; // boolean, whether we want to post the data to google script or not
var netid, searchTerm, result; // global changing variables

document.getElementById('fileInput').addEventListener('change',readFile);
//var version = document.createTextNode(chrome.runtime.getManifest().version);
//document.getElementById('version').appendChild(version);

function PostObject(res){
	this.netIDAndSearchResults = res;
}

/***
Only reads xls, csv, or txt files.
stores contents in data
*/
function readFile(e){
	/***
	Checks if user is on user lookup page
	*/
	chrome.tabs.query({active:true, currentWindow: true}, function(tabs){
		var tab = tabs[0];
		var url = tab.url;
		if (!url.includes(USER_LOOKUP_LINK)){
			var content = document.createElement('b');
			content.innerHTML = "Please navigate to Sakai's NetID User Lookup Page, (" + USER_LOOKUP_LINK + ")";
			error(content);
			document.getElementById('container').removeChild(document.getElementById('fileForm'));
		}
	});
	postData = $("#postEnable").prop("checked");

	var file = fileInput.files[0];
	var excel_type = "application/vnd.ms-excel";

	if (file.type.match(excel_type) || file.type.match(/text.*/)){
		var reader = new FileReader();
		reader.onload = function(){
			data = $.csv.toArrays(reader.result);
			searchMain();
		};
		reader.readAsText(file);
	} 
	else{
		error("Not valid file type: " + file.type);
	}
}

function searchMain(){
	netid = data[netIDCount][0];
	netids.push(netid);
	getSearchTerms();

	chrome.runtime.onMessage.addListener(lookUpAnotherUser);
	chrome.webNavigation.onCommitted.addListener(onSiteLoaded); 
	// this is how the program flow transitions after a page is loaded

	submitForm(netid);
}

function getSearchTerms(){
	if (data[netIDCount].length == 2){
		searchTerm = data[netIDCount][1];
	}
	else{
		searchTerm = [];
		for (var i = 1; i < data[netIDCount].length; ++i){
			searchTerm.push(data[netIDCount][i]);
		}
	}

}

function submitForm(netid){
	if (RANDOM_INTERVAL){
		var waitInterval = Math.floor(Math.random()*SUBMIT_WAIT_TIME_INTERVAL);
	}
	else{
		var waitInterval = SUBMIT_WAIT_TIME_INTERVAL;
	}
  	setTimeout(function(){
		chrome.tabs.executeScript(null, {code: 'var netid = ' + JSON.stringify(netid)}, function(){
			if (chrome.runtime.lastError) {
			  	throw 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
		  	}
			chrome.tabs.executeScript(null,{ file: "submitForm.js" }, function(){
				if (chrome.runtime.lastError) {
			      throw 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
			  	}
			});
		});
	} , waitInterval);
}

/***
When the site is finished loading after a submitted form
*/
function onSiteLoaded(details){
	if (details.TransitionType != "auto_subframe"){ //very important for disregarding iframes, probably fires multiple times in some cases
		chrome.tabs.executeScript(null,{file: "currentPage.js"},checkStudentInfoPageAndSearch);
	}
	else{
		console.log("Auto subframes loading detected");
	}
}

/*
console.log statements here seems to break things
*/
function checkStudentInfoPageAndSearch(page){
	if (typeof page != 'undefined'){
		page=page[0];
		switch(page){
			case "Info":
				chrome.tabs.executeScript(null, {code: 'var searchTerm = ' + JSON.stringify(searchTerm)}, function(){
					chrome.tabs.executeScript(null,{file: "checkInfoPageForSearchTerms.js"}, function(){
						if (chrome.runtime.lastError) {
				      		console.log('There as an error injecting script : \n' + chrome.runtime.lastError.message);
				      		return -1;
				  		}
					});
				});
				break;
			case "InfoNotFound":
				netidErrors.push(netid); // invalid netid or search term
				lookUpAnotherUser(false); // invalid netid will result in a false
				break;
			case "BlankSearch":
				error("Blank search found. Check your input file for empty rows");
				break;
			case "Lookup":
				storeResult(result);
				break;
			default:
				error("Unexpected value returned from currentPage.js script");
		}
	}
	else{
		error("Undefined page");
	}
}


function lookUpAnotherUser(res){
	result = res;
	chrome.tabs.executeScript(null,{file: "lookUpAnotherUser.js"},function(){
		if (chrome.runtime.lastError) {
		  console.log('There was an error injecting script : \n' + chrome.runtime.lastError.message);
	  	}
	});
}

/***
If netids not all searched, gets search terms and submits form again
Attempts to store result if all netids searched.
*/
function storeResult(res){
	results[resultRow]=res;
	++resultRow;

	if (netIDCount < data.length-1){
			++netIDCount;
		netid = data[netIDCount][0];
		netids.push(netid);
		getSearchTerms();
		submitForm(netid);
	}
	else if (netIDCount == data.length-1){ // if all netids checked
		console.log("netidErrors:");
		console.log(netidErrors);
		console.log("results:");
		console.log(results);
		console.log("EXIT");
		var numTrue = 0;
		let csvContent = "";
		var netIDsAndResult = [];
		for (var i = 0; i <results.length; i++){
			netIDsAndResult[i] = [];
			let row;
			netIDsAndResult[i].push(netids[i]);
			// set # of netids found true, and populating postdata
			if (results[i] instanceof Array){
				for (var j = 0; j < results[i].length; j++){
					netIDsAndResult[i].push(results[i][j]);
				}
				if (results[i][0]){ // if first searchterm matches, it works
					numTrue++;
				}
			}
			else{
				netIDsAndResult[i].push(results[i]);
				if (results[i])
					numTrue++;
			}
			if(netIDsAndResult[i] instanceof Array)
		   		row = netIDsAndResult[i].join(",");
			else
				row = netIDsAndResult[i];
		    csvContent += row + "\r\n";
		}
		var numError = 0;
		for (var i = 0; i <netidErrors.length; i++){
			if (netidErrors[i])
				numError++;
		}

		var element;
		element = document.createElement('p');
		element.appendChild(document.createTextNode("# of searched NetIDs: " + results.length));
		document.body.appendChild(element);
		element = document.createElement('p');
		element.appendChild(document.createTextNode("Queries Found: " + numTrue));
		document.body.appendChild(element);
		element = document.createElement('p');
		element.appendChild(document.createTextNode("# of invalid NetIDs: " + numError));
		document.body.appendChild(element);
		createDownloadButton(RESULT_FILENAME,csvContent);
		createDownloadButton(ERROR_FILENAME,netidErrors);
		if (postData){
			var obj = new PostObject(netIDsAndResult);
			console.log(obj);
			$.post(GOOGLE_APPS_LINK,JSON.stringify(obj),function(data, status){
				$('#error').html(data);
				resetAll();
				return 0;		
			});
			//make sure post is buffered, bc results is reset 
		}
		resetAll();
		return 0;
	}
}

function createDownloadButton(filename, text) {
  var element = document.createElement('a');
  var uri = encodeURIComponent(text);
  element.setAttribute('href', "data:text/csv;charset=utf-8," + uri);
  element.setAttribute('download', filename);
  element.setAttribute('id',filename);

  element.appendChild(document.createTextNode(filename));
  document.body.appendChild(element);
}

/***
Resets listener, counts, global variables.
Call when finished with search query.
*/
function resetAll(){
	chrome.runtime.onMessage.removeListener(lookUpAnotherUser);
	chrome.webNavigation.onCommitted.removeListener(onSiteLoaded);
	netidErrors = [];
	results = [];
	resultRow = 0;
	netIDCount = 0;
	document.getElementById("fileInput").value="";
}

/***
Report error on extension screen,
*/
function error(e){
	document.getElementById('error').appendChild(document.createTextNode("Error: "));
	document.getElementById('error').appendChild(document.createTextNode(e));
}