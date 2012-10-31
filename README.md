GebIDE
======

This is a preliminary hack for a browser based [Geb](http://www.gebish.org/) IDE.

Note that all of the dependencies are way out of date, since I started with a local build.gradle that I knew works in my environment.

How to run:
-------

```
./gradlew gebIde
```

(note: this has proven to be somewhat Firefox version dependent- I'm running FF 11.0, and we've had luck with other versions after that, but it may fail depending on what version of Firefox you're running. It has been suggested we look into a Firefox Portable integration to ensure that the right version is bundled with the tool)

Once Firefox loads, the Geb IDE panel should be open. Some fun commands to try:

```
to GrailsDocsPage
# after you're there:

header
logo
$('span')
searchToggle
searchToggle.click()
toc
tocItems
tocItems[0..3]
tocItems[0].find('a')
tocItems[0].find('a').click()
```

What is it?
-------
[Geb](http://www.gebish.org/) is a powerful tool for writing browser based functional tests. This power comes at a cost, however- the development effort for writing and maintaining functional tests can be enormous. The most salient culprit in this regard is the delay between writing Geb code and seeing the results of executing that code in the browser. Adding to that issue is the inability to easily identify problems in the Geb code as they crop up; something as simple as a typo in a selector can result in large amounts of wasted time trying to track down what has broken. The standard functional test development/debugging process looks something like this:

1. Write your Page class
2. Write your test code
3. Compile your project
4. Run your test
5. Wait for the test to spin up
6. Wait for the browser to open
7. Wait for the your page(s) to load
8. Wait for the test to execute
9. See an error in your selector/test/application code
10. Fix your page object/test code/application code
11. Go to 3 

Depending on the nature of your project and tests, there may be additional steps as well; restarting your application, for instance. This whole process can mean that, at best, you've got a 10-15 second delay every time you want to test something as simple as whether or not you've got the right selector for a given piece of content. At worst, it could be minutes of turn around time!

The Geb IDE is an attempt to fix that. It allows you to spin up a browser with an IDE that lets you drive your Geb code (which then drives the browser :P) without any delays. You can check the value of your page content immediately, and play around with selectors and what have you without needing to wait on anything. The goal is to make it very easy to develop Page objects and evaluate Geb expressions as you write your code, with as little turn around time as possible.

The IDE in its current form is pretty rudimentary; it executes Geb expressions and highlights any DOM elements they return in the page, with the option to inspect each in Firebug. This is cool, but there is the potential to go a lot deeper with this tool. There is a lot of potential to improve this; not just to make it easy to test selectors, but to actually make it easier and faster to understand and iterate on your code. From a UI perspective, we're already used to having this power during development: that's exactly what things like Firebug and Chrome developer tools are for! You don't have to recompile your code and launch a new browser to just to test out a new CSS rule; you can just tweak it in Firebug until you're happy with it. Writing Geb tests shouldn't be any different.

With these goals in mind, here is a possible feature roadmap that has come about from discussions I have had with Geb developers of various levels of experience, both at Dealer.com and SpringOne.

Possible Feature Roadmap
-------

* Expanded inspector for expressions that do not return page content (ie, regular groovy objects, exceptions, etc)
* View project Page and Module classes in GebIDE, with UI interactivity. Examples:
	* Double click a Page to execute "to MyPage"
	* Double click on a content definition to highlight it in current page
	* Visual indicator whether the "at" closure returns true 
	* Syntax Highlighting
	* Page content 'tree'* perhaps with counts/tags indicating how many matching elements are present
* Page object "Legend" 
	* Select each piece of Page content on the current page with color coding to visually identify all parts of the page object
	* Provide insight into what a given page object actually maps to, so that developers who did not write the Page class can better understand what is being mapped where
* Classpath scanning for all Page/Module classes in the project, expose to IDE to avoid the need to import
	* Need a strategy to handle name collisions
* Hot reloading of Page/Modules
	* Modify source in GebIDE and recompile immediately?	
* Load and run unit tests from within the GebIDE, and/or expose hooks to an external debugger
	* Even just running tests externally that can use the existing browser/WebDriver from the GebIDE would speed things up tremendously, especially with the ability to pause the test and use the IDE to debug any issues
* Save 'Geb blocks' on the fly (re-runnable series of commands; basically components that might make up a test)
	* Example: (block that fills out a form)
			<pre>showFormButton.click()
waitFor{myForm.content.displayed}
myForm.content << 'some text'
myForm.submitButton.click()
</pre>
	* Develop these blocks as you develop the functionality they model; faster to re-run a block than test it manually
		* If writing Geb code to test new features is faster than doing it manually, dev cost of writing functional tests plummets
	* Copy/paste blocks into test code when you're ready to test it
* "Click to select" an element on the page, and the shortest css selector that can uniquely identify that element will be put into the GebIDE
	* Even better would be if we could have the selector be relative to an existing piece of page content; nesting modules can make choosing the right selectors difficult
	* Luke mentioned a library exists that may provide the 'shortest selector' logic for us
* Button to reset state of browser (clear cookies, etc) without needing to close/relaunch it
	* Being able to work within an existing browser session is important for development speed, but the ability to clear everything out without restarting the browser would be very useful
* Integrated Geb/WebDriver API documentation
	* "What the heck does 'withWindow' do again?"
	* Help with the learning curve inherent to adopting a new tool, and provide reminders to seasoned developers without needing to hunt through the manual
* Page content/Geb DSL tab completion
	* Make it easier to traverse nested modules by exposing tree for auto complete
* Css selector tab completion
	* Scan in all css classnames/data element names/input names in the dom, expose to auto-complete library 
	* Include counts of elements matching each suggestion (that include the preceding selectors)
		* Arrow through suggestions, see them highlighted in browser
* Css selector debugger
	* Break selector into path with counts at each node, so you can see where you went wrong  (ie, '.body .list .expandable a' => [".body"=>1, ".body .list"=3, ".body .list .expandable"=>0])
* Expose current Geb config settings in IDE, allow some of them to be changed on the fly (base url comes to mind)
* "Selenium IDE 'Record' Mode" 
	* Everyone I've ever spoken to about Geb who is familiar with Selenium requests this feature. It is definitely not a trivial thing to implement, but there is work that could be done
* Geb Report Inspector
	* Load a page dump from a geb test into IDE to investigate failures using IDE tools
	* View Geb-generated screen shots side by side/overlaid on page
		* Existing firefox extensions can do this; might just need to bridge them into IDE
* Connect IDE input to remote WebDriver instances running on different browsers/servers
	* How to bridge output, such as highlighting?
	* Testing out how Geb commands work in other browsers/environments would be hand


