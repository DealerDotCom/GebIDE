/*
    This is the Geb configuration file.

    See: http://www.gebish.org/manual/current/configuration.html
*/

import org.openqa.selenium.firefox.FirefoxDriver
import org.openqa.selenium.chrome.ChromeDriver
import org.openqa.selenium.firefox.FirefoxProfile

def defaultFirebugVersion = '1.9.2'
def firebugXpiPath = System.getProperty('gebIde.firebugXpi.path', "firefoxExtensions/firebug-${firebugVersion}.xpi")
def gebIdeXpiPath = System.getProperty('gebIde.ideXpi.path', "firefoxExtensions/gebIDE.xpi")


def firefoxProfile = {
    File firebugXpi = new File(firebugXpiPath)
    File gebIdeXpi = new File(gebIdeXpiPath)
    println "firebug xpi exists? ${firebugXpi.exists()}"
    println "gebIDE xpi exists? ${gebIdeXpi.exists()}"
    FirefoxProfile firefoxProfile = new FirefoxProfile();
    firefoxProfile.addExtension(firebugXpi);
    firefoxProfile.addExtension(gebIdeXpi);
    firefoxProfile.setPreference("extensions.firebug.currentVersion", defaultFirebugVersion)
    firefoxProfile.setPreference("extensions.firebug.defaultPanelName", 'firefinder')
    firefoxProfile.setPreference("extensions.firebug.addonBarOpened", true)
    firefoxProfile.setPreference("extensions.firebug.toolbarCustomizationDone", true)
    firefoxProfile.setPreference("extensions.firebug.allPagesActivation", 'on')

    return firefoxProfile
}


waiting {
    timeout = 7
}

environments {

    // run via “./gradlew chromeTest”
    // See: http://code.google.com/p/selenium/wiki/ChromeDriver
    chrome {
        System.setProperty('webdriver.chrome.driver', '/Developer/bin/chromedriver')
        driver = { new ChromeDriver() }
    }

    // run via “./gradlew firefoxTest”
    // See: http://code.google.com/p/selenium/wiki/FirefoxDriver
    firefox {
        driver = { new FirefoxDriver(firefoxProfile()) }
    }

}

driver = { new FirefoxDriver(firefoxProfile()) }

reportsDir = '/tmp/gebReports'//TODO: Change me!

