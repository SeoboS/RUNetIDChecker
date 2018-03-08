var num_forms = document.forms.length;
if (num_forms != 1){
	var form = document.forms[num_forms-1];
	form.submit();
}