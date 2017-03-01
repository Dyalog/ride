'use strict'
D.Threads=function(){
    this.dom=I.threads;this.dom.hidden=0;
    this.updateThreads({threads:[]});
}

D.Threads.prototype={
    updateThreads:function(updated_threads){
        if (updated_threads.threads.length<1){
            this.dom.innerHTML="<div>&lt;No threads&gt;</div>"
        }
        else{
            this.dom.innerHTML=updated_threads.threads.map(function(thread){
                return "<div class=threaditem>"+thread+"</div>"
            }).join('')
        }
    }
}