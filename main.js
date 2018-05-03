/*
* @Author: seobo
* @Date:   2018-04-11 11:38:18
* @Last Modified by:   seobo
* @Last Modified time: 2018-05-03 10:29:05
*/

var errors = [];
var results = [];
var resultRow = 0;
var netIDCount = 0;
var RESULT_FILENAME = "results.txt";
var ERROR_FILENAME = "errors.txt";
var SUBMIT_WAIT_TIME_INTERVAL = 1250;
var USER_LOOKUP_LINK = "sakai.rutgers.edu/addpart-lookup.jsp";
var netid, data, searchTerm;

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

document.getElementById('fileInput').addEventListener('change',readFile);

/***
Only reads xls, csv, or txt files
*/
function readFile(e){
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
	getSearchTerms();

	chrome.runtime.onMessage.addListener(lookUpAnotherUser);
	chrome.webNavigation.onCommitted.addListener(onCommit);

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
	} , Math.floor(Math.random()*SUBMIT_WAIT_TIME_INTERVAL));
}


function onCommit(details){
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
	page=page[0];
	if (page=="Info"){ // TODO adjust to handle multiple search terms
		chrome.tabs.executeScript(null, {code: 'var searchTerm = ' + JSON.stringify(searchTerm)}, function(){
			chrome.tabs.executeScript(null,{file: "checkPage.js"}, function(){
				if (chrome.runtime.lastError) {
		      		console.log('There as an error injecting script : \n' + chrome.runtime.lastError.message);
		      		return -1;
		  		}
			});
		});
	}
	else if (page=="InfoNotFound"){ // invalid netid or search term
		errors.push(netid)
		lookUpAnotherUser(false); // invalid netid will result in a false
	}
	else if (page=="BlankSearch"){ //redo's search
		chrome.tabs.executeScript(null,{file: "lookUpAnotherUser.js"},function(){
			if (chrome.runtime.lastError) {
			  throw 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
		  	}
			submitForm(netid);
		});
	}
	else{
		console.log("random case, shouldn't happen often");
	}
}


function lookUpAnotherUser(result){
	chrome.tabs.executeScript(null,{file: "lookUpAnotherUser.js"},function(){
		if (chrome.runtime.lastError) {
		  console.log('There was an error injecting script : \n' + chrome.runtime.lastError.message);
	  	}
		storeResult(result);
	});
}

function storeResult(result){
	results[resultRow]=result;
	++resultRow;
	console.log(netIDCount);
	if (netIDCount < data.length-1){
		++netIDCount;
		netid = data[netIDCount][0];
		getSearchTerms();
		submitForm(netid);
	}
	else if (data.length-1 == netIDCount){ // if all netids checked
		console.log("errors:");
		console.log(errors);
		console.log("results:");
		console.log(results);
		console.log("EXIT");
		var numTrue = 0;
		for (var i = 0; i <results.length; i++){
			if (results[i] instanceof Array){
				var falseResultExist = false;
				for (var j = 0; j < results[i].length; j++){
					if (!results[i][j]){ // if even one false exists, true. so output is simply false or true
						falseResultExist = true;
						break;
					}
				}
				if (!falseResultExist){
					numTrue++;
				}
			}
			else if (results[i]){
				numTrue++;
			}
		}
		var numError = 0;
		for (var i = 0; i <errors.length; i++){
			if (errors[i])
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
		createDownloadButton(RESULT_FILENAME,results);
		createDownloadButton(ERROR_FILENAME,errors);
		resetAll();
		return 0;
	}
}

function createDownloadButton(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
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
	chrome.webNavigation.onCommitted.removeListener(onCommit);
	errors = [];
	results = [];
	resultRow = 0;
	netIDCount = 0;
	document.getElementById("fileInput").value="";
}

/***
Report error on extension screen,
*/
function error(e){
	document.getElementById('error').appendChild(e);
}