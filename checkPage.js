function checkForSearchTerm(searchTerm){
	//assuming only one result
	//TODO: if no result or multple results 
	var fields = document.getElementsByTagName('td');
	if (fields[4].textContent.indexOf(searchTerm) != -1){
		console.log("SOE STUDENT");
		sendMessageToExtension(true);
	}
	else{
		sendMessageToExtension(false);
	}
}

function sendMessageToExtension(message){
	chrome.runtime.sendMessage(message)
}

checkForSearchTerm(searchTerm);