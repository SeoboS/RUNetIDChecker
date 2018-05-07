/*
* @Author: seobo
* @Date:   2018-04-11 11:38:18
* @Last Modified by:   seobo
* @Last Modified time: 2018-05-03 11:08:44
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
// if (results.includes(false)){
// 	sendMessageToExtension(false);
// }
// else{
// 	sendMessageToExtension(true);
// }
sendMessageToExtension(results);


function sendMessageToExtension(message){
	chrome.runtime.sendMessage(message)
}