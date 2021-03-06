/*
 * grunt-angular-templates
 * https://github.com/ericclemmons/grunt-angular-templates
 *
 * Copyright (c) 2013 Eric Clemmons
 * Licensed under the MIT license.
 */

'use strict';

var Compiler  = require('./lib/compiler');
var Appender  = require('./lib/appender');
var fs        = require('fs');

module.exports = function(grunt) {

  var bootstrapper = function(module, script, options) {
    return options.angular+".module('"+module+"'"+(options.standalone ? ', []' : '')+").run(['$templateCache', function($templateCache) {\n"+script+"\n}]);\n";
  };

  var ngtemplatesTask = function() {
    var options = this.options({
      angular:    'angular',
      bootstrap:  bootstrapper,
      concat:     null,
      htmlmin:    {},
      module:     this.target,
      prefix:     '',
      source:     function(source) { return source; },
      standalone: false,
      url:        function(path) { return path; },
      usemin:     null,
      append:     false,
      quotes:     'double',
      merge:      true
    });

    grunt.verbose.writeflags(options, 'Options');

    this.files.forEach(function(file) {
      if (!file.src.length) {
        grunt.log.warn('No templates found');
      }

      var expanded = file.orig.expand;
      var cwd = file.orig.expand ? file.orig.cwd : file.cwd;

      var compiler  = new Compiler(grunt, options, cwd, expanded);
      var appender  = new Appender(grunt);
      var modules   = compiler.modules(file.src);
      var compiled  = [];

      for (var module in modules) {
        if (options.merge) {
          compiled.push(compiler.compile(module, modules[module]));
        } else {
          //Compiling each file to the same module
          for (var j = 0; j < file.src.length; j++) {
            compiled.push(compiler.compile(module, [file.src[j]]));
          }
        }
      }

      if (options.append){
        fs.appendFileSync(file.dest, compiled.join('\n'));
        grunt.log.writeln('File ' + file.dest.cyan + ' updated.');
      }
      else{
        if (options.merge) {
          grunt.file.write(file.dest, compiled.join('\n'));
          // grunt.log.writeln('File ' + file.dest.cyan + ' created.');
        } else {
          //Writing compiled file to the same relative location as source, without merging them together
          for (var i = 0; i < compiled.length; i++) {
            var dest = file.dest + file.src[i];
            //Change extension to js from html/htm
            dest = dest.replace(/(html|htm)$/i, "js");
            grunt.file.write(dest, compiled[i]);
            // grunt.log.writeln('File ' + dest.cyan + ' created.');
          }
        }
      }


      if (options.usemin) {
        if (appender.save('generated', appender.concatUseminFiles(options.usemin, file))) {
          grunt.log.writeln('Added ' + file.dest.cyan + ' to ' + ('<!-- build:js ' + options.usemin + ' -->').yellow);
        }
      }

      if (options.concat) {
        if (appender.save(options.concat, appender.concatFiles(options.concat, file))) {
          grunt.log.writeln('Added ' + file.dest.cyan + ' to ' + ('concat:' + options.concat).yellow);
        }
      }
    });
  };

  grunt.registerMultiTask('ngtemplates', 'Compile AngularJS templates for $templateCache', ngtemplatesTask);

};
