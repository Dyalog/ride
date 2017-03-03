//workspace explorer
'use strict'
D.DBG=function(){
  var dbg=this
  dbg.dom=I.debug;dbg.dom.hidden=0
  dbg.sistack=new D.ListView('sistack',{
    item_class:'stackitem',
    click_handler:function(e){
      D.send('SetSIStack',{stack:e.target.innerHTML})
    },
    no_item_message:'&lt;no stack&gt;',
    render:function(array){
      var encodeHTML=function(i){return $('<div/>').text(i).html()}
      if (array.length>0){
        this.dom.innerHTML=array.sort(function(p,n){return p.tid-n.tid}).map((function(i){
          return "<div class=\""+this.item_class+" ctl_listview_item\">"
              +"<span class=stack_desc>" +encodeHTML(i.description)+"</span>"
            +"</div>"
        }).bind(this)).join('')
      }else{
        this.dom.innerHTML="<div>"+this.no_item_message+"</div>"
      }
    }
  })
  dbg.threads=new D.ListView('threads',{
    item_class:'threaditem',
    click_handler:function(e){D.send('SetThread',{stack:e.target.innerHTML})},
    render:function(array){
      var encodeHTML=function(i){return $('<div/>').text(i).html()}
      if (array.length>0){
        this.dom.innerHTML=array.sort(function(p,n){return p.tid-n.tid}).map((function(i){
          return "<div class=\""+this.item_class+" ctl_listview_item\">"
              +"<span class=thread_desc>" +encodeHTML(i.description)+"</span>"
              +"<span class=thread_state>"+encodeHTML(i.state)+"</span>"
              +"<span class=thread_tid>"  +encodeHTML(i.tid)+"</span>"
              +"<span class=thread_flags>"+encodeHTML(i.flags)+"</span>"
            +"</div>"
        }).bind(this)).join('')
      }
      else{
        this.dom.innerHTML="<div>"+this.no_item_message+"</div>"
      }
    },
    no_item_message:'&lt;no threads&gt;'
  })
  dbg.tb=dbg.dom.querySelector('.toolbar')
  dbg.tb.onmousedown=function(x){if(x.target.matches('.tb_btn')){x.target.className+=' armed';x.preventDefault()}}
  dbg.tb.onmouseup=dbg.tb.onmouseout=function(x){if(x.target.matches('.tb_btn')){x.target.classList.remove('armed')
                                                                               x.preventDefault()}}
  dbg.tb.onclick=function(x){var t=x.target
    if(t.matches('.tb_hid,.tb_case')){t.classList.toggle('pressed');ed.hls();return!1}
    if(t.matches('.tb_btn')){var c=t.className.replace(/^.*\btb_([A-Z]{2,3})\b.*$/,'$1')
                             dbg[c]?dbg[c]():0;return!1}
  }
}
D.DBG.prototype={
  TR:function(){D.send('GetThreads',{})},
  RM:function(){D.send('Continue'      ,{win:this.threads.selected.id})},
  MA:function(){D.send('RestartThreads',{win:this.threads.selected.id})}
}
