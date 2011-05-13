(function(){
  
  var _G,
  
  _base = {
      noop : function() {},
      
      /**
       * simple OOP-line inheritance
       * https://developer.mozilla.org/en/JavaScript/Guide/Inheritance_Revisited#Alternative_extend()s
       */
      extend : function(child, parent) {            
        child.prototype.__proto__ = parent.prototype;
        child.prototype.__super = parent;                
      },   
      
      /**
       * Add a plugin to the framework
       * 
       * Plugins must be either named functions or provide an id
       */
      plugin : function(context, id) {  
        if(!context.name && !id) throw 'Plugin must be named scope or have an id'
        
        var m = id || context.name;
        _G[m] = context;
        
        //log('[Framework]','loaded module:', m);
      },
      
      log : log,
      
      keys : {
        //Num keys
        N1 : 49,
        N2 : 50,
        N3 : 51,
        N4 : 52,
        N5 : 53,
        N6 : 54,
        N7 : 55,
        N8 : 56,
        //Letter keys
        T : 84
      }
  };
  
  //window._G exposes the internal scope
  //only keep for debugging and tests
  _G = window._G = { Base : _base };
 
  //Make require public
  window.require = require;
  
  //Module sink for shared modules
  window.module = { exports : {} };
 
  /**
   * Safe logging 
   */
  function log(){
    if (typeof window.console !== 'undefined') {
      console.log([].slice.call(arguments).join('\t'));
    }
  }
  
  /**
   * Browser version of require to allow sharing
   * of CommonJS server modules
   * 
   * This will strip the filename of a path and 
   * uppercase the first character
   * 
   * e.g. ../public/lib/vector becomes Vector.
   * 
   * @param {String} path path of required file.
   * @returns {Object} Whatever module matches the require.
   */
  function require(path) {
    var p = path.lastIndexOf('/'),
    f = path.substr(p+1,1),
    r = path.substr(p+2),
    t = f.toUpperCase() + r;
    
    if(!_G[t]) throw 'No such module' + t;
    
    return _G[t];
  };
  
  
})();
