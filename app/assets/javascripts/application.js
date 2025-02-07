//= require jquery
//= require jquery_ujs
//= require bootstrap
//= require socket.io
//= require hovertitle
//= require GameEditor
//= require table-linked
//= require jquery.calendrical
//= require raphael-min
//= require st_config
//= require models/live_presentation
//= require views/live_presentation_view

// Close pop-up menus on page background click
$(function() {
  $('body').mousedown(closePopup);
});

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-2168949-11']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
