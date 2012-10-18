/*
    This is the Geb configuration file.

    See: http://www.gebish.org/manual/current/configuration.html
*/

import org.openqa.selenium.firefox.FirefoxDriver
import org.openqa.selenium.chrome.ChromeDriver
import org.openqa.selenium.firefox.FirefoxProfile


def firebugVersion = '1.9.0'
def firefoxProfile = {
    File file = new File("/Users/ddcelleryc/Projects/crm/common/functional-tests/src/test/resources/firebug-${firebugVersion}.xpi"); //TODO: change to your own
    println "firebug xpi exists? ${file.exists()}"
    FirefoxProfile firefoxProfile = new FirefoxProfile();
    firefoxProfile.addExtension(file);
    firefoxProfile.setPreference("extensions.firebug.currentVersion", firebugVersion);
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

