// there are some concurrency issues. probably becuase of the executescript statement
// all of thsi happens in the context of the chrome extension. executeScript allows the context to switch tot he current open tab

var netids = ["ss2468","jtm209","sd912"];
var searchTerms = ["SCHOOL OF ENGINEERING","SCHOOL OF ENGINEERING","SCHOOL OF ENGINEERING"];
var netid;
var searchTerm;
var results = [];

$("#batchUserLookup").click(main);

function main(){
	console.log("main running");

	netid = netids.pop();
	console.log(netid);
	searchTerm = searchTerms.pop();
	//searchTerm = inputs[1]; // TODO make multiple search terms

	chrome.runtime.onMessage.addListener(lookUpAnotherUser);
	chrome.webNavigation.onCommitted.addListener( function(details){
		console.log("page updated!");
		if (details.TransitionType != "auto_subframe"){ //very important
			chrome.tabs.executeScript(null,{file: "currentPage.js"},checkPageAndSearch);
		}
		else{
			console.log("auto subframes here");
		}
	});

	submitForm(netid);
}

function checkPageAndSearch(page){
	page=page[0];
	console.log(page);
	if (page=="Info"){
		chrome.tabs.executeScript(null, {code: 'var searchTerm = ' + JSON.stringify(searchTerm)}, function(){
			chrome.tabs.executeScript(null,{file: "checkPage.js"}, function(){
				if (chrome.runtime.lastError) {
		      		console.log('There as an error injecting script : \n' + chrome.runtime.lastError.message);
		      		return -1;
		  		}						
			});
		});
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
	results.push(result);
	console.log(result);
	var inputs = updateInputAndResults(results);
	if ((inputs[0] != null) && (inputs[1] != null)){
		netid = inputs[0];
		searchTerm = inputs[1];
		console.log(netid);
		submitForm(netid);
	}
	else{
		console.log("EXIT");
		return 0;
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

function updateInputAndResults(results){
	// returns in format [netid, searchTerm];
	//var filename = $('#filename').val();
	//var req = new FileReader();

	//req.open("GET","file://")

	if (netids.length == 0){ // if all netids checked
		res = results.reverse();
		console.log(res);
		return [null,null];
	}
	else{ // else update inputs
		netid = netids.pop();
		searchTerm = searchTerms.pop();
	}
	return [netid, searchTerm];
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