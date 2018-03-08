// there are some concurrency issues. probably becuase of the executescript statement
// all of thsi happens in the context of the chrome extension. executeScript allows the context to switch tot he current open tab

var errors = [];
var results = [];
var data;
var dataCnt = 0;
var resultFileName = "results.txt";
var errorFileName = "errors.txt";

function main(){
	var netid;
	var searchTerm;
	document.getElementById('fileInput').addEventListener('change',readFile);
}

function readFile(e){
	//only reads xls, csv, or txt files
	console.log("readingfile");
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
		for (var i = data[dataCnt].length-1; i > 0; --i){
			searchTerm.push(data[dataCnt][i]);
		}
	}

	chrome.runtime.onMessage.addListener(lookUpAnotherUser);
	chrome.webNavigation.onCommitted.addListener( function(details){
		if (details.TransitionType != "auto_subframe"){ //very important for disregarding iframes
			chrome.tabs.executeScript(null,{file: "currentPage.js"},checkPageAndSearch);
		}
		else{
			console.log("Auto subframes loading detected");
		}
	});

	submitForm(netid);
}

function checkPageAndSearch(page){
	//console.log(searchTerm);
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
		lookUpAnotherUser(false,results); // invalid netid will result in a false
	}
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
	results.push(result); // allow for multiple results
	//results.push(result);
	if (data.length == dataCnt+1){ // if all netids checked
		res = results.reverse();
		err = errors.reverse();
		console.log("errors:");
		console.log(err);
		console.log("results:");
		console.log(res);
		console.log("EXIT");
		var numTrue = 0;
		for (var i = 0; i <results.length; i++){
			if (results[i])
				numTrue++;
		}
		var numError = 0;
		for (var i = 0; i <errors.length; i++){
			if (results[i])
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
		createDownloadButton(resultFileName,res);
		createDownloadButton(errorFileName,err);
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
			for (var i = data[dataCnt].length-1; i > 0; --i){
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


main();
