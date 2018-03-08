/*
Author: Seobo Shim
Date Revised: 3/8/2018
*/

var errors = [];
var results = [];
var resR = 0;
var dataCnt = 0;
var RESULT_FILENAME = "results.txt";
var ERROR_FILENAME = "errors.txt";
var SUBMIT_WAIT_TIME_INTERVAL = 250;
var netid, data, searchTerm;

/*
Setting local scope for variables
*/
document.getElementById('fileInput').addEventListener('change',readFile);


function readFile(e){
	//only reads xls, csv, or txt files
	//console.log("readingfile");
	var file = fileInput.files[0];
	var excel = "application/vnd.ms-excel";

	if (file.type.match(excel) || file.type.match(/text.*/)){
		var reader = new FileReader();
		reader.onload = function(){
			data = $.csv.toArrays(reader.result);
			console.log(data);
			searchMain(data);	
		};

		reader.readAsText(file);
	} 
	else{
		throw "Not valid. File type: " + file.type;
	}
}


function searchMain(data){

	dataCnt = dataCnt + 1;
	netid = data[dataCnt][0];
	if (data[dataCnt].length == 2){
		searchTerm = data[dataCnt][1];
	}
	else{// TODO make multiple search terms
		searchTerm = [];
		for (var i = 1; i < data[dataCnt].length; ++i){
			searchTerm.push(data[dataCnt][i]);
		}
	}

	chrome.runtime.onMessage.addListener(lookUpAnotherUser);
	chrome.webNavigation.onCommitted.addListener(onCommit);

	submitForm(netid);
}

function onCommit(details){
		if (details.TransitionType != "auto_subframe"){ //very important for disregarding iframes
			//probably fires multiple times in some cases
			chrome.tabs.executeScript(null,{file: "currentPage.js"},checkPageAndSearch);
		}
		else{
			console.log("Auto subframes loading detected");
		}
}

/*
console.log statements here seems to break things
*/
function checkPageAndSearch(page){
	
	page=page[0];
	//console.log(page);
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
	//console.log(netid);	
	//console.log(searchTerm);
}


function lookUpAnotherUser(result){
	chrome.tabs.executeScript(null,{file: "lookUpAnotherUser.js"},function(){
		if (chrome.runtime.lastError) {
		  console.log('There was an error injecting script : \n' + chrome.runtime.lastError.message);
	  	}
		storeResult(result)
	});
}

function storeResult(result){
	//console.log(result);
	results[resR]=result;
	++resR;
	if (data.length-1 == dataCnt){ // if all netids checked
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
					if (!results[i][j]){ // if even one false exists
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
	else{ // else update inputs
		++dataCnt;
		//netid = netids.pop();
		netid = data[dataCnt][0];
		//searchTerm = searchTerms.pop();
		if (data[dataCnt].length == 2){
			searchTerm = data[dataCnt][1];
		}
		else{
			searchTerm = [];
			for (var i = 1; i < data[dataCnt].length; ++i){
				searchTerm.push(data[dataCnt][i]);
			}
		}
		submitForm(netid);
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

function submitForm(netid){
  	setTimeout(function(){
		chrome.tabs.executeScript(null, {code: 'var netid = ' + JSON.stringify(netid)}, function(){
			if (chrome.runtime.lastError) {
			  console.log('There was an error injecting script : \n' + chrome.runtime.lastError.message);
		  	}
			chrome.tabs.executeScript(null,{ file: "submitForm.js" }, function(){ // script must first be executed on page
				if (chrome.runtime.lastError) {
			      console.log('There was an error injecting script : \n' + chrome.runtime.lastError.message);
			  	}
			});
		} );
	} , Math.floor(Math.random()*SUBMIT_WAIT_TIME_INTERVAL));
}

function sendMessageToPageScript(message){
	if (message == null){
		throw "Message sent is null";
	}
	// sends the search term to get it's page checked
	chrome.tabs.query({active:true, currentWindow: true}, function(tab){
		chrome.tabs.sendMessage(tab[0].id, message);
	// assumption here that first tab queried is valid. Should be because it's active and current!
	});
}


function resetAll(){
	chrome.runtime.onMessage.removeListener(lookUpAnotherUser);
	chrome.webNavigation.onCommitted.removeListener(onCommit);
	errors = [];
	results = [];
	resR = 0;
	dataCnt = 0;
	document.getElementById("fileInput").value="";
}