//layout script
/**
relevante classes:
#content: de div met columns
.column: alle kollommen
.title: header van de column, nodig mee te kunnen schakelen
.big: main view, is altijd zichtbaar
.small: side view, alleen zichtbaar op grote schermen
.hidden: niet zichtbaar
.o2nd: order van hidden columns
.o3rd: order van hidden columns
*/
$(document).ready(function(){
var columns = $('#content').children('.column');
$('.title').click(function(){

	var width = $('body').width();
	var big = $('#content').children('.big');
	var small = $('#content').children('.small');
	var o2nd = $('#content').children('.o2nd');
	var o3rd = $('#content').children('.o3rd');
	var hidden = $('#content').children('.hidden');
	if($(this).parent().parent().hasClass('big')) {
	//big		
		//move big before small
		big.removeClass('big').addClass('small o1st');
		small.removeClass('small o1st').addClass('big');
		small.after(big);
		big.after(hidden);
	}
	else if($(this).parent().parent().hasClass('small')) {
		//small wordt 3rd, 3rd wordt 2nd, 2nd wordt small	
		if(width >= 767 ) {
		small.removeClass('small o1st').addClass('o3rd hidden');
		o3rd.removeClass('o3rd').addClass('o2nd');	
		o2nd.removeClass('o2nd hidden').addClass('o1st small');	
		small.before(o2nd).before(o3rd);
		//@media (max-width: 767px) {		
		}
		else {
		big.removeClass('big').addClass('small o1st');
		small.removeClass('small o1st').addClass('big');
		small.after(big);
		big.after(hidden);
		}
	}
	else if($(this).parent().parent().hasClass('o2nd')) {
		
		if(width >= 767 ) {
		small.removeClass('small o1st').addClass('o2nd hidden');
		o2nd.removeClass('o2nd hidden').addClass('small o1st');			
		small.before(o2nd).after(o3rd);
		}
		else {
		big.removeClass('big').addClass('hidden o2nd');
		o2nd.removeClass('hidden o2nd').addClass('big');
		o2nd.after(big).after(small);
		
		}
		
	}
	else if($(this).parent().parent().hasClass('o3rd')) {
		if(width >= 767 ) {
		small.removeClass('small o1st').addClass('o3rd hidden');
		o3rd.removeClass('o3rd hidden').addClass('small o1st');	
		small.before(o3rd).before(o2nd);
		}
		else {
		big.removeClass('big').addClass('hidden o3rd');
		o3rd.removeClass('hidden o3rd').addClass('big');
		o3rd.after(big).after(o2nd).after(small);
		}
	}
	core.trigger('layoutChanged');
});
});

