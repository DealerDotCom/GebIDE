GebIDE
======

Preliminary hack for a browser based Geb IDE.

Note that all of the dependencies are way out of date, since I started with a local build.gradle that I knew works in my environment.

How to run:

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