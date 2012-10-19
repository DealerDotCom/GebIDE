package geb.console

import geb.Browser
import geb.Configuration
import geb.ConfigurationLoader
import geb.navigator.Navigator

/**
 * Context object that the Geb Console executes code within. All console code will be wrapped in a with closure like the following:
 *
 * def ctx = new GebContext()
 * ctx.with{*   // console script code
 *}*
 * Largely cribbed from <code>GebSpec</code>, with the addition of the <code>highlight()</code> method.
 *
 */
class GebContext{

    private String gebConfEnv = null
    private String gebConfScript = null

    private Browser _browser

    Configuration createConf(){
        new ConfigurationLoader(gebConfEnv).getConf(gebConfScript)
    }

    Browser createBrowser(){
        new Browser(createConf())
    }

    Browser getBrowser(){
        if(_browser == null){
            _browser = createBrowser()
        }
        _browser
    }

    void resetBrowser(){
        if(_browser?.config?.autoClearCookies){
            _browser.clearCookiesQuietly()
        }
        _browser = null
    }

    def methodMissing(String name, args){
        getBrowser()."$name"(* args)
    }

    def propertyMissing(String name){
        return getBrowser()."$name"
    }

    def propertyMissing(String name, value){
        getBrowser()."$name" = value
    }

    /**
     * TODO: Add this to the navigator metaclass, so you can do something like $('span').highlight()
     * TODO: Enhance the js so that we don't actually modify the style attribute; this can break page styles! Instead, add a css class that is tied to the same
     * style rules that we can inject using another js call. Ideally, we don't want to change the elements at all- some elements won't display. Instead, some
     * fancier js/style magic could let us do something neat like the built in firefox inspector.
     * @param nav Navigator instance
     * @param sleep How long to blink the highlight; defaults to 500 milis
     */
    void highlight(nav, long sleep = 500){
        def elements = nav.allElements()
        js.exec(elements, "background-color: red;", "for(var i=0; i<arguments[0].length; i++){ arguments[0][i].setAttribute('style', arguments[1]);}");
        Thread.sleep(sleep)
        js.exec(elements, "", "for(var i=0; i<arguments[0].length; i++){ arguments[0][i].setAttribute('style', arguments[1]);}");

    }

    void inspect(nav){
        if(nav == null){
            return
        }
        try{
            def elements = nav.allElements()
            if(elements){
                js.exec(elements, "window.showGebResults(arguments[0]);return true;")
            }
        } catch(Exception e){
            e.printStackTrace()
        }

    }
}
