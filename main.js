// there are some concurrency issues. probably becuase of the executescript statement
// all of thsi happens in the context of the chrome extension. executeScript allows the context to switch tot he current open tab


var errors = [];
var results = [];
var data;
var dataCnt = 0;

function main(){
	var netid;
	var searchTerm;

	//var netids = ["ss2468","jtm209","sd912"];
	//var searchTerms = ["SCHOOL OF ENGINEERING","SCHOOL OF ENGINEERING","SCHOOL OF ENGINEERING"];
	document.getElementById('fileInput').addEventListener('change',readFile);
	//$("#batchUserLookup").click(main);
}

function readFile(e){
	//var req = new FileReader();
	var file = fileInput.files[0];
	var textType = /text.*/;

	if (file.type.match(textType)){
		var reader = new FileReader();
		reader.onload = function(){
			data = $.csv.toArrays(reader.result);
			console.log(data);
			searchMain(data);	
		};

		reader.readAsText(file);
	} 
}


function searchMain(data){

	dataCnt = dataCnt + 1;
	console.log("main running");
	netid = data[dataCnt][0];
	//netid = netids.pop();
	console.log(netid);
	if (data[dataCnt].length == 2){
		searchTerm = data[dataCnt][1];
	}
	else{
		searchTerm = [];
		for (var i = data[dataCnt].length-1; i > 0; --i){
			searchTerm.push(data[dataCnt][i]);
		}
	}
	//searchTerm = searchTerms.pop();
	//searchTerm = inputs[1]; // TODO make multiple search terms

	chrome.runtime.onMessage.addListener(lookUpAnotherUser);
	chrome.webNavigation.onCommitted.addListener( function(details){
		if (details.TransitionType != "auto_subframe"){ //very important for disregarding iframes
			chrome.tabs.executeScript(null,{file: "currentPage.js"},checkPageAndSearch);
		}
		else{
			console.log("auto subframes here");
		}
	});

	submitForm(netid);
}

function checkPageAndSearch(page){
	console.log(searchTerm);
	page=page[0];
	console.log(page);
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
	console.log(results);
	results.push(result); // allow for multiple results
	//results.push(result);
	console.log(result);
	if (data.length == dataCnt+1){ // if all netids checked
		res = results.reverse();
		err = errors.reverse();
		console.log("errors:");
		console.log(err);
		console.log("results:");
		console.log(res);
		console.log("EXIT");
		return 0;
	}
	else{ // else update inputs
		++dataCnt;
		//netid = netids.pop();
		netid = data[dataCnt][0];
		console.log(netid);
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

function submitForm(netid){
	console.log("submitting form");
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
		console.log("message sent is null");
	}
	// sends the search term to get it's page checked
	chrome.tabs.query({active:true, currentWindow: true}, function(tab){
		chrome.tabs.sendMessage(tab[0].id, message);
	// assumption here that first tab queried is valid. Should be because it's active and current!
	});
}


main();
