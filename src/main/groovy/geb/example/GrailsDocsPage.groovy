package geb.example

import geb.Page

class GrailsDocsPage extends Page{
    static url = "http://grails.org/doc/1.3.7/guide/"
    static at = {
        header.text() == 'The Grails Framework - Reference Documentation'
    }

    static content = {
        header {$('.project h1')}
        logo {$('#logo')}
        toc {$('#table-of-content')}
        tocItems {toc.find('.toc-item')}
        searchToggle {$('#collapseLink a')}
        searchInput {$('#searchKeys')}
    }
}
