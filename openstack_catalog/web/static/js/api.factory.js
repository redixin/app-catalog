(function() {
  'use strict';
  var knownTypes = ['images', 'tosca_templates', 'heat_templates', 'murano_packages'];
  var getSchemasPromise = null;
  angular
    .module('AppCatalog')
    .factory('Api', Api);
  Api.$inject = ['$http'];
  function Api($http) {
    return {
      CreateArtifact: CreateArtifact,
      GetSchemas: GetSchemas,
      GetFieldType: GetFieldType
    };
    function CreateArtifact(type, artifact) {
      return $http.post('/api/v2/db/artifacts/' + type, artifact);
    }
    function GetSchemas() {
      if (getSchemasPromise === null) {
        getSchemasPromise = $http.get('/api/v2/db/schemas').then(function(response) {
          return response.data.schemas;
        });
      }
      return getSchemasPromise;
    }
    function GetFieldType(typeName, fieldName, schemas) {
      return getFieldType(schemas[typeName].properties[fieldName]);
    }
    function getFieldType(field) {
      var fieldType = {readOnly: field.readOnly === true};
      if (field.type.constructor === Array) {
        var type = field.type[0];
        fieldType.nullable = true;
      } else {
        var type = field.type;
        fieldType.nullable = false;
      }
      if (type === 'object') {
        var t = field.properties || null;
        if (t !== null && t.checksum && t.content_type && t.size) {
          fieldType.type = 'blob';
        } else {
          fieldType.type = 'dict';
          if ('properties' in field) {
            var _field = field.properties[Object.getOwnPropertyNames(field.properties)[0]];
            fieldType.elementType = getFieldType(_field);
          } else {
            fieldType.elementType = getFieldType(field.additionalProperties);
          }
        }
      } else {
        fieldType.type = type;
      }
      return fieldType;
    }
  }
})();
