/*
 * Converts olcsx.js @type annotations into properties of the previous @typedef.
 * Changes @enum annotations into @typedef.
 */

var lastOlcsxTypedef = null;
var olcsxTypes = {};

function addSubparams(params) {
  for (var j = 0, jj = params.length; j < jj; ++j) {
    var param = params[j];
    var types = param.type.names;
    for (var k = 0, kk = types.length; k < kk; ++k) {
      var name = types[k];
      if (name in olcsxTypes) {
        param.subparams = olcsxTypes[name];
        // TODO addSubparams(param.subparams);
        // TODO Do we need to support multiple object literal types per
        // param?
        break;
      }
    }
  }
}

exports.handlers = {

  newDoclet: function(e) {
    var doclet = e.doclet;
    if (doclet.meta.filename == 'olcsx.js') {
      // do nothing if not marked @api
      if (!doclet.stability) {
        return;
      }
      if (doclet.kind == 'typedef') {
        lastOlcsxTypedef = doclet;
        olcsxTypes[doclet.longname] = [];
        doclet.properties = [];
      } else if (lastOlcsxTypedef && doclet.memberof == lastOlcsxTypedef.longname) {
        lastOlcsxTypedef.properties.push(doclet);
        olcsxTypes[lastOlcsxTypedef.longname].push(doclet);
      } else {
        lastOlcsxTypedef = null;
      }
    } else if (doclet.isEnum) {
      // We never export enums, so we document them like typedefs
      doclet.kind = 'typedef';
      delete doclet.isEnum;
    }
  },

  parseComplete: function(e) {
    var doclets = e.doclets;
    for (var i = doclets.length - 1; i >= 0; --i) {
      var doclet = doclets[i];
      var params = doclet.params;
      if (params) {
        addSubparams(params);
      }
    }
  }

};
