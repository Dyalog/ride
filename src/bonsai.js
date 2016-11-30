function Bonsai(e,o){ //e:dom element, o:options={children:function(id,callback){...}, click:function(path){...}}
  var bt=this //bonsai tree
  bt.nodes={}
  o.children(0,function(children){
    bt.nodes[0]={id:0,text:'',expandable:1,expanded:1,children:children,icon:''}
    children.forEach(function(c){bt.nodes[c.id]=c})
    e.innerHTML=children.map(bt.render).join('')
  })
  e.onmousedown=function(event){
    if(event.target.matches('.bt_node_expand')){toggleNode(event.target)}
    selectNode(event.target,0);
    return!1;
  }
  var toggleNode=function(tgt){
    var a=tgt, node=bt.nodes[a.parentNode.dataset.id];if(!node||!node.expandable)return
    node.expanded=1-!!node.expanded; a.textContent='⊞⊟'[+!!node.expanded]
    node.expanded&&o.children(node.id,function(children){
      node.children=children
      children.forEach(function(c){bt.nodes[c.id]=c})
      var selected=a.nextSibling.classList.contains('selected')
      a.parentNode.outerHTML=bt.render(node,selected)
      if(selected)e.getElementsByClassName('selected')[0].focus()
    })
    a.parentNode.className=node.expanded?'':'bt_collapsed'
  }
  var selectNode=function(tgt,trg){ //tgt=target,trg=trigger=1or0
    if (tgt.matches('.bt_text')){
      var sel=e.getElementsByClassName('selected'); for (var i=0;i<sel.length;i++){sel[i].classList.remove('selected')}
      tgt.classList.add('selected');tgt.focus();
      if(o.click&&trg){
        var path=[],div=tgt.parentNode
        while(div!==e){path.unshift(bt.nodes[div.dataset.id]);div=div.parentNode}
        o.click(path)
      }
    }
  }
  e.ondblclick=function(event){
    selectNode(event.target,1)
    return!1;
  }
  e.onkeydown=function(event){
    switch (event.which){
      case 13://case 37:case 38:case 39:case 40://Enter,Left,Up,Right,Down
        selectNode(event.target,1)
        break;
      case 40:case 38:
        var sp=Array.prototype.slice.call(e.getElementsByTagName('span'),0)
                 .filter(function(x){return!!x.offsetWidth})
        for(var i=0;i<sp.length;i++){
          if (sp[i].classList.contains('selected')){
            selectNode(sp[Math.max(0,Math.min(sp.length-1,i+event.which-39))]);break
          }
        }
        return!1
      case 37:case 39:
        var sel=e.getElementsByClassName('selected')[0], left=event.which===37
        if(!!bt.nodes[sel.dataset.id].expanded===left)toggleNode(sel.previousSibling)
        else if(left){selectNode(sel.parentNode.parentNode.getElementsByClassName('bt_text')[0])}
        return!1
    }
  }
}
Bonsai.prototype={
  render:function(node,selected){
    var bt=this
    return'<div data-id="'+node.id+'">'+
            (node.expandable?'<a class=bt_node_expand>'+'⊞⊟'[+!!node.expanded]+'</a>'
                            :'<a class=bt_node_indent></a>')+
            '<span tabIndex=-1 data-id='+node.id+' class="bt_icon_'+node.icon+' bt_text '+(selected?'selected':'')+'">'+
              node.text+
            '</span>'+
            (node.expanded?node.children.map(function(x){return bt.render(x)}).join(''):'')+
          '</div>'
  }
}
