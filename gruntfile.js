const path     = require('path'),
      electron = require('electron-connect').server.create(),
      less_glob= require('less-plugin-glob');

module.exports=function(grunt){
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-env');

  grunt.registerTask('start','Start-Up electron server',function(){
    electron.start(['.','DEV_STYLE']);
  });

  grunt.registerTask('reload','Reload the running electron client',function(){
    electron.reload();
  });

  grunt.registerTask('restart','Restart RIDE and go into a session.',function(){
    electron.broadcast('reboot',{message:'Shutdown then restart.'});
  });

  grunt.initConfig({
    pkg:grunt.file.readJSON('package.json'),
    env:{
      spawn:{
        RIDE_SPAWN:'dyalog'
      }
    },
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
      reload:{
        files:['style/less/**/*.less','style/new-style.less'],
        tasks:['less','reload'],
        options:{spawn:false}
      },
      restart:{
        files:['style/less/**/*.less','style/new-style.less'],
        tasks:['less','env','restart'],
        options:{spawn:false}
      }
    }
  });

  grunt.registerTask('default',['start','less','watch:reload'])
  grunt.registerTask('spawn-reload',['env','start','less','watch:restart'])
}