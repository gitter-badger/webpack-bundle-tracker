var path = require('path');
var fs = require('fs');
var stripAnsi = require('strip-ansi');

var assets = {};
var DEFAULT_OUTPUT_FILENAME = 'webpack-stats.json';


function Plugin(options) {
  this.options = options || {};
}

Plugin.prototype.apply = function(compiler) {
    var self = this;

    compiler.plugin('compilation', function(compilation, callback) {
      compilation.plugin('failed-module', function(fail){
        self.writeOutput(compiler, {
          status: 'error',
          file: fail.error.module.userRequest,
          error: fail.error.name,
          message: stripAnsi(fail.error.error.codeFrame)
        });
      });
    });

    compiler.plugin('compile', function(compiler, callback) {
      self.writeOutput(compiler, {status: 'compiling'});
    });

    compiler.plugin('emit', function(compiler, callback) {
      var chunks = {};
      var stats = compiler.getStats().toJson();

      compiler.chunks.map(function(chunk){
        var files = chunk.files.map(function(file){
          var F = {name: file};
          if (compiler.options.output.publicPath) {
            F.publicPath= compiler.options.output.publicPath + file;
          }
          if (compiler.options.output.path) {
            F.path = path.join(compiler.options.output.path, file);
          }
          return F;
        });
        chunks[chunk.name] = files;
      });
      self.writeOutput(compiler, {status: 'done', chunks: chunks});
      callback();
    });
};


Plugin.prototype.writeOutput = function(compiler, contents) {
  var outputDir = this.options.path || '.';
  var outputFilename = path.join(outputDir, this.options.filename || DEFAULT_OUTPUT_FILENAME);

  var json = JSON.stringify(contents);
  fs.writeFile(outputFilename, json, function(err) {
  if (err) {
    compiler.errors.push(new Error('Plugin: Unable to save to ' + outputFull));
    }
  });
};

module.exports = Plugin;
