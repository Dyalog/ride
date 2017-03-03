D.ListView=function(e,o){
  //e=containing element for ListView
  //o=options for ListView
  this.dom=I[e];this.dom.hidden=0
  this.item_class=o.item_class||''
  this.no_item_message=o.no_item_message||'No Items!'
  this.dom.className='ctl_listview'
  this.click_handler=o.click_handler||function(e){return}
  this.items=[]
  this.selected={tid:0}
  
  this.dom.onclick=function(event){
      var cn=event.target
      while((cn!==this.dom)&&cn.className.indexOf('ctl_listview_item')==-1) cn=cn.parentNode
      
      if (cn!==this.dom){
        $(this.dom.querySelectorAll('.ctl_listview_item')).removeClass('selected')
        $(cn).addClass('selected')
        this.selected=this.items[+cn.dataset.itemid]
        this.click_handler(this.selected)
      }
  }.bind(this)

  this.render=function(array){
    this.items=o.sortFn?array.sort(o.sortFn):array;
    var rf=o.renderItem||function(x){return x}
    if (array.length>0){
      this.dom.innerHTML=array.map(function(e,i){
        return "<div class=\""+this.item_class+" ctl_listview_item\" data-itemid="+i+">"+rf(e)+"</div>"
      }).join('')
    }
    else{
      this.dom.innerHTML="<div>"+this.no_item_message+"</div>"
    }
  }

  this.render([]);
}