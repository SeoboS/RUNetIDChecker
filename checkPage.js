/*
Author: Seobo Shim
Date Revised: 3/8/2018
*/

//assuming only one result
//TODO: if no result or multple results 
var arrLen;
if (searchTerm instanceof Array) {
	arrLen = searchTerm.length;
}
else{
	searchTerm = [searchTerm];
	arrLen = 1;
}
var fields = document.getElementsByTagName('td');
var results = [];
for (var i =0; i < arrLen; ++i){
	if (fields[4].textContent.indexOf(searchTerm[i]) != -1){
		results.push(true);
	}
	else{
		results.push(false);
	}
}
sendMessageToExtension(results);

function sendMessageToExtension(message){
	chrome.runtime.sendMessage(message)
}