D.ListView=function(e,o){
  //e=containing element for ListView
  //o=options for ListView
  this.dom=I[e];this.dom.hidden=0
  this.item_class=o.item_class||''
  this.no_item_message=o.no_item_message||'No Items!'
  this.dom.className='ctl_listview'
  this.click_handler=o.click_handler||function(e){return}
  
  this.dom.onclick=function(event){
      if (event.target.className.indexOf('ctl_listview_item')>-1){
          this.click_handler(event)
      }
  }.bind(this)

  this.render=o.render||function(array){
      if (array.length>0){
          this.dom.innerHTML=array.map(function(i){
              return "<div class=\""+this.item_class+" ctl_listview_item\">"+i+"</div>"
          }).join('')
      }
      else{
          this.dom.innerHTML="<div>"+this.no_item_message+"</div>"
      }
  }

  this.render([]);
}