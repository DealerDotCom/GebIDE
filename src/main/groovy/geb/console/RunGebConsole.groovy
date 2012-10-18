package geb.console

import java.util.concurrent.atomic.AtomicInteger
import geb.Browser
import java.util.concurrent.atomic.AtomicBoolean

final String DEFAULT_SCRIPT_NAME_START = "GebConsoleScript"
def counter = new AtomicInteger()

GebContext ctx = new GebContext()
Browser browser = ctx.getBrowser()

def running = new AtomicBoolean(true)

synchronized out(message){
    println(message)
}

/**
 * Preliminary javascript bridge; setting the window.GEB variable in the browser will be polled by this thread
 * and then executed in a contextual groovy shell
 */
def jsBridge = Thread.start {
    while(running.get()){
        sleep 30
        try{
            def gebText = browser.js.exec("return window.GEB;")
            if(gebText){
                out gebText.toString()
                Binding b = new Binding()
                b.setVariable(ContextualGroovyShell.CONTEXT_VARIABLE, ctx)
                b.setVariable(ContextualGroovyShell.IMPORTS_VARIABLE, ['geb.example.*'])
                def shell = new ContextualGroovyShell(b)
                shell.run(gebText.toString(), DEFAULT_SCRIPT_NAME_START+counter.incrementAndGet(), [])
                browser.js.exec("delete window.GEB; return true;")
            }
        } catch(Exception e){
            e.printStackTrace()
            browser.js.exec("delete window.GEB; return true;")
        }
    }
}

def runConsole = {
    GebConsole console = new GebConsole()
    console.setVariable(ContextualGroovyShell.CONTEXT_VARIABLE, ctx)
    console.setVariable(ContextualGroovyShell.IMPORTS_VARIABLE, ['geb.example.*'])
    console.run()
//    running.set(false)
//    jsBridge.join()
//    ctx.resetBrowser()
}

runConsole()


