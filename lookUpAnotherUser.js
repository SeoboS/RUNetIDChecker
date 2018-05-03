/*
* @Author: seobo
* @Date:   2018-04-11 11:38:18
* @Last Modified by:   seobo
* @Last Modified time: 2018-05-03 09:38:35
*/

// used to access "look up another user button"
var num_forms = document.forms.length;
if (num_forms != 1){
	var form = document.forms[num_forms-1];
	form.submit();
}