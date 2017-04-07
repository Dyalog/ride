//workspace explorer
'use strict'
D.DBG=function(){
  var dbg=this
  function encodeHTML(i){return $('<div/>').text(i).html()}
      
  dbg.dom=I.debug;dbg.dom.hidden=0
  dbg.sistack=new D.ListView('sistack',{
    item_class:'stackitem',
    click_handler:function(e){
      D.send('SetSIStack',{stack:e.description})
    },
    no_item_message:'&lt;no stack&gt;',
    renderItem:function(item){
      return "<td class=stack_desc>" +encodeHTML(item.description)+"</td>"
    }
  })
  dbg.threads=new D.ListView('threads',{
    item_class:'threaditem',
    click_handler:function(e){D.send('SetThread',{tid:e.tid})},
    sortFn:function(p,n){return p.tid-n.tid},
    renderItem:function(item){
      return "<td class=thread_desc>" +encodeHTML(item.description)+"</td>"
            +"<td class=thread_state>"+encodeHTML(item.state)+"</td>"
            +"<td class=thread_tid>"  +encodeHTML(item.tid)+"</td>"
            +"<td class=thread_flags>"+encodeHTML(item.flags)+"</td>"
    },
    //headerFunction:function(){return '<th>Desc.</th><th>State</th><th>TID</th><th>Flags</th>'},
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
  RM:function(){D.send('Continue'      ,{win:this.threads.selected.tid})},
  MA:function(){D.send('RestartThreads',{win:this.threads.selected.tid})}
}
