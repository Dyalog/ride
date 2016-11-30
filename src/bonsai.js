function Bonsai(e,o){ //e:dom element, o:options={children:function(id,callback){...}, click:function(path){...}}
  var bt=this //bonsai tree
  bt.nodes={}
  o.children(0,function(children){
    bt.nodes[0]={id:0,text:'',expandable:1,expanded:1,children:children,icon:''}
    children.forEach(function(c){bt.nodes[c.id]=c})
    e.innerHTML=children.map(bt.render).join('')
  })
  e.onmousedown=function(event){
    if(event.target.matches('.bt_node_expand')){
      var a=event.target, node=bt.nodes[a.parentNode.dataset.id];if(!node||!node.expandable)return
      node.expanded=1-!!node.expanded; a.textContent='⊞⊟'[+!!node.expanded]
      node.expanded&&o.children(node.id,function(children){
        node.children=children
        children.forEach(function(c){bt.nodes[c.id]=c})
        a.parentNode.outerHTML=bt.render(node)
      })
      a.parentNode.className=node.expanded?'':'bt_collapsed'
      return!1
    }else if(o.click&&event.target.matches('.bt_text')){
      var path=[], div=event.target.parentNode
      while(div!==e){path.unshift(bt.nodes[div.dataset.id]);div=div.parentNode}
      o.click(path);return!1
    }
  }
}
Bonsai.prototype={
  render:function(node){
    return'<div data-id="'+node.id+'">'+
            (node.expandable?'<a class=bt_node_expand>'+'⊞⊟'[+!!node.expanded]+'</a>'
                            :'<a class=bt_node_indent></a>')+
            '<span data-id='+node.id+' class="bt_icon_'+node.icon+' bt_text">'+node.text+'</span>'+
            (node.expanded?node.children.map(this.render).join(''):'')+
          '</div>'
  }
}
