package geb.console

import org.codehaus.groovy.control.CompilerConfiguration

/**
 * GroovyShell extension which wraps script text in a <code>with<code> closure using
 * a context object specified in the binding, with imports also specified in the binding.
 */
class ContextualGroovyShell extends GroovyShell{

    public static final String IMPORTS_VARIABLE = '_contextual_shell_imports'
    public static final String CONTEXT_VARIABLE = '_ctx'

    ContextualGroovyShell(){
        super()    
    }

    ContextualGroovyShell(Binding binding){
        super(binding)    
    }

    ContextualGroovyShell(Binding binding, CompilerConfiguration config){
        super(binding, config)    
    }

    ContextualGroovyShell(CompilerConfiguration config){
        super(config)    
    }

    ContextualGroovyShell(ClassLoader parent){
        super(parent)    
    }

    ContextualGroovyShell(ClassLoader parent, Binding binding){
        super(parent, binding)    
    }

    ContextualGroovyShell(ClassLoader parent, Binding binding, CompilerConfiguration config){
        super(parent, binding, config)    
    }

    ContextualGroovyShell(GroovyShell shell){
        super(shell)    
    }

    

    @Override
    Object run(String scriptText, String fileName, String[] args){
        return super.run(wrapScriptTextInContext(scriptText), fileName, args)
    }

    String wrapScriptTextInContext(String scriptText){
        List<String> imports = (List<String>) getContext().getVariable(IMPORTS_VARIABLE)
        StringBuilder sb = new StringBuilder()
        if(imports){
            sb << imports.collect {"import $it"}.join('\n')
            sb << '\n\n'
        }
        sb << CONTEXT_VARIABLE+'.with{\n'
        sb << scriptText
        sb << '\n'
        sb << '}'
        return sb.toString()
    }
}
