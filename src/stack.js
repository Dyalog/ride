'use strict'
D.SIStack=function(){
    this.dom=I.sistack;this.dom.hidden=0;
    this.dom.onclick=function(event){
        if (event.target.className.indexOf('stackitem')>-1){
            //safe to assume you clicked on a stack item
            $('#sistack div').removeClass('selected')
            $(event.target).addClass('selected')
            D.send('SetSIStack',{stack:event.target.innerHTML})
        }
    }
    this.updateStack({stack:[],tid:0});
}

D.SIStack.prototype={
    updateStack:function(updated_stack){
        if (updated_stack.stack.length<1){
            this.dom.innerHTML="<div>No stack :(</div>"
        }
        else{
            this.dom.innerHTML=updated_stack.stack.map(function(stack_item){
                return "<div class=stackitem>"+stack_item+"</div>"
            }).join('')
        }
    }
}