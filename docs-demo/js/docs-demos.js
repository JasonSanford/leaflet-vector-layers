$(document).ready(function() {
    prettyPrint();
    
    /*$.getJSON("https://api.github.com/repos/JasonSanford/google-vector-layers/issues?state=open&callback=?", function(issues) {
        if (issues && issues.data && issues.data.length) {
            var issuesHTML = '<h5>Current Issues</h5><ul>';
            $.each(issues.data, function(i, o) {
                var li = '<li><a href="' + o.html_url + '" title="' + o.body + '">' + o.title + '</a></li>';
                issuesHTML += li;
            });
            issuesHTML += '</ul>';
            $("div.sidebar > div.well").append(issuesHTML);
        }
    });*/
});