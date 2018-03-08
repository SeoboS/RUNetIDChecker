//identifies current page by number of forms

if (document.forms.length > 1){
	var notfound = 0;
	var paras = document.getElementsByTagName("p");
	for (var i = 0; i < paras.length; ++i){
		if (paras[i].innerText.indexOf("No one matched the criteria you specified.") != -1){
			notfound = 1;
		}
	}
	if (notfound != 1){
	"Info";	
	}
	else{
		"InfoNotFound";
	}
}
else{
	"Lookup";
}