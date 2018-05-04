/*
* @Author: seobo
* @Date:   2018-04-11 11:38:18
* @Last Modified by:   seobo
* @Last Modified time: 2018-05-03 10:51:30
*/
//identifies current page by number of forms

if (document.forms.length > 1){
	var notfound = 0;
	var blanksearch = 0;
	var paras = document.getElementsByTagName("p");
	for (var i = 0; i < paras.length; ++i){
		if (paras[i].innerText.indexOf("No one matched the criteria you specified.") != -1){
			notfound = 1;
		}
		if (paras[i].innerText.indexOf("Error in search") !=-1){
			blanksearch = 1;
		}
	}
	if (notfound == 1){
		"InfoNotFound";
	}
	else if (blanksearch == 1){
		"BlankSearch";
	}
	else{
		"Info";	
	}
}
else{
	"Lookup";
}