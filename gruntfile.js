const path     = require('path'),
      electron = require('electron-connect').server.create(),
      less_glob= require('less-plugin-glob');

module.exports=function(grunt){
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('start','Start-Up electron server',function(){
    electron.start(['.','DEV_STYLE']);
  });

  grunt.registerTask('reload','Reload the running electron client',function(){
    electron.reload();
  });

  grunt.initConfig({
    pkg:grunt.file.readJSON('package.json'),
    less:{
      development:{
        options:{
          paths:[path.join(__dirname,'style','less')],
          plugins:[less_glob]
        },
        files:{
          './style/new-style.css':'./style/new-style.less'
        }
      }
    },
    watch:{
      scripts:{
        files:['style/less/**/*.less','style/new-style.less'],
        tasks:['less','reload'],
        options:{spawn:false}
      }
    }
  });

  grunt.registerTask('default',['start','less','watch'])
}